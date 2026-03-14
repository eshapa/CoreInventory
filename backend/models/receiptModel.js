const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");

const RECEIPT_COLS = `
  r.id, r.supplier_id, s.name AS supplier_name,
  r.warehouse_id, w.name AS warehouse_name,
  r.status, r.notes, r.created_by, r.created_at`;

const findAll = async ({ warehouseId, status } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT ${RECEIPT_COLS}
    FROM receipts r
    LEFT JOIN suppliers s ON r.supplier_id = s.id
    JOIN warehouses w ON r.warehouse_id = w.id
    WHERE 1=1`;
  const params = [];
  if (warehouseId) { sql += " AND r.warehouse_id = ?"; params.push(warehouseId); }
  if (status)      { sql += " AND r.status = ?";       params.push(status); }
  sql += " ORDER BY r.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [[receipt]] = await pool.execute(
    `SELECT ${RECEIPT_COLS}
     FROM receipts r
     LEFT JOIN suppliers s ON r.supplier_id = s.id
     JOIN warehouses w ON r.warehouse_id = w.id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  if (!receipt) return null;

  const [items] = await pool.execute(
    `SELECT ri.*, p.name AS product_name, p.sku
     FROM receipt_items ri JOIN products p ON ri.product_id = p.id
     WHERE ri.receipt_id = ?`,
    [id]
  );
  return { ...receipt, items };
};

/**
 * Create a receipt with its line items (status defaults to 'draft').
 * @param {{ supplier_id?, warehouse_id, notes?, created_by, items: [{product_id, quantity, unit_price}] }} data
 */
const create = async ({ supplier_id = null, warehouse_id, notes = null, created_by, items }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO receipts (supplier_id, warehouse_id, notes, created_by) VALUES (?, ?, ?, ?)`,
      [supplier_id, warehouse_id, notes, created_by]
    );
    const receiptId = res.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [receiptId, item.product_id, item.quantity, item.unit_price ?? 0]
      );
    }

    await conn.commit();
    return findById(receiptId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Update status. When status → 'done', stock is updated and ledger entries are written.
 */
const updateStatus = async (id, status, userId) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const receipt = await findById(id);
    if (!receipt) throw new Error("Receipt not found");

    await conn.execute(`UPDATE receipts SET status = ? WHERE id = ?`, [status, id]);

    if (status === "done") {
      for (const item of receipt.items) {
        await stockModel.adjustStock(item.product_id, receipt.warehouse_id, item.quantity);

        await conn.execute(
          `INSERT INTO stock_ledger
             (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
           VALUES (?, ?, 'receipt', ?, ?, 'receipt', ?)`,
          [item.product_id, receipt.warehouse_id, item.quantity, id, userId]
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
