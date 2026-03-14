const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");
const AppError = require("../utils/AppError");

const TRANSFER_COLS = `
  t.id,
  t.source_warehouse_id,      sw.name AS source_warehouse_name,
  t.destination_warehouse_id, dw.name AS destination_warehouse_name,
  t.status, t.notes, t.created_by, t.created_at`;

const findAll = async ({ status } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT ${TRANSFER_COLS}
    FROM transfers t
    JOIN warehouses sw ON t.source_warehouse_id      = sw.id
    JOIN warehouses dw ON t.destination_warehouse_id = dw.id
    WHERE 1=1`;
  const params = [];
  if (status) { sql += " AND t.status = ?"; params.push(status); }
  sql += " ORDER BY t.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [[transfer]] = await pool.execute(
    `SELECT ${TRANSFER_COLS}
     FROM transfers t
     JOIN warehouses sw ON t.source_warehouse_id      = sw.id
     JOIN warehouses dw ON t.destination_warehouse_id = dw.id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
  if (!transfer) return null;

  const [items] = await pool.execute(
    `SELECT ti.*, p.name AS product_name, p.sku
     FROM transfer_items ti JOIN products p ON ti.product_id = p.id
     WHERE ti.transfer_id = ?`,
    [id]
  );
  return { ...transfer, items };
};

const create = async ({ source_warehouse_id, destination_warehouse_id, notes = null, created_by, items }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO transfers (source_warehouse_id, destination_warehouse_id, notes, created_by)
       VALUES (?, ?, ?, ?)`,
      [source_warehouse_id, destination_warehouse_id, notes, created_by]
    );
    const transferId = res.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`,
        [transferId, item.product_id, item.quantity]
      );
    }

    await conn.commit();
    return findById(transferId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const updateStatus = async (id, status, userId) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const transfer = await findById(id);
    if (!transfer) throw new AppError("Transfer not found", 404);

    if (status === "done") {
      for (const item of transfer.items) {
        const stock = await stockModel.getStock(item.product_id, transfer.source_warehouse_id);
        if (!stock || stock.quantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ID ${item.product_id} in source warehouse. Available: ${stock?.quantity ?? 0}`,
            422
          );
        }
      }
    }

    await conn.execute(`UPDATE transfers SET status = ? WHERE id = ?`, [status, id]);

    if (status === "done") {
      for (const item of transfer.items) {
        await stockModel.adjustStock(item.product_id, transfer.source_warehouse_id, -item.quantity);
        await stockModel.adjustStock(item.product_id, transfer.destination_warehouse_id, item.quantity);

        await conn.execute(
          `INSERT INTO stock_ledger
             (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
           VALUES (?, ?, 'transfer_out', ?, ?, 'transfer', ?),
                  (?, ?, 'transfer_in',  ?, ?, 'transfer', ?)`,
          [
            item.product_id, transfer.source_warehouse_id,      -item.quantity, id, userId,
            item.product_id, transfer.destination_warehouse_id,  item.quantity, id, userId,
          ]
        );
      }
    }

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findAll, findById, create, updateStatus };
