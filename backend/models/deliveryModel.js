const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");
const AppError = require("../utils/AppError");

const DELIVERY_COLS = `
  d.id, d.customer_id, cu.name AS customer_name,
  d.warehouse_id, w.name AS warehouse_name,
  d.status, d.notes, d.created_by, d.created_at`;

const findAll = async ({ warehouseId, status } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT ${DELIVERY_COLS}
    FROM deliveries d
    LEFT JOIN customers cu ON d.customer_id = cu.id
    JOIN warehouses w ON d.warehouse_id = w.id
    WHERE 1=1`;
  const params = [];
  if (warehouseId) { sql += " AND d.warehouse_id = ?"; params.push(warehouseId); }
  if (status)      { sql += " AND d.status = ?";       params.push(status); }
  sql += " ORDER BY d.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [[delivery]] = await pool.execute(
    `SELECT ${DELIVERY_COLS}
     FROM deliveries d
     LEFT JOIN customers cu ON d.customer_id = cu.id
     JOIN warehouses w ON d.warehouse_id = w.id
     WHERE d.id = ? LIMIT 1`,
    [id]
  );
  if (!delivery) return null;

  const [items] = await pool.execute(
    `SELECT di.*, p.name AS product_name, p.sku
     FROM delivery_items di JOIN products p ON di.product_id = p.id
     WHERE di.delivery_id = ?`,
    [id]
  );
  return { ...delivery, items };
};

const create = async ({ customer_id = null, warehouse_id, notes = null, created_by, items }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO deliveries (customer_id, warehouse_id, notes, created_by) VALUES (?, ?, ?, ?)`,
      [customer_id, warehouse_id, notes, created_by]
    );
    const deliveryId = res.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [deliveryId, item.product_id, item.quantity, item.unit_price ?? 0]
      );
    }

    await conn.commit();
    return findById(deliveryId);
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

    const delivery = await findById(id);
    if (!delivery) throw new AppError("Delivery not found", 404);

    if (status === "done") {
      // Pre-check sufficient stock for all items
      for (const item of delivery.items) {
        const stock = await stockModel.getStock(item.product_id, delivery.warehouse_id);
        if (!stock || stock.quantity < item.quantity) {
          throw new AppError(
            `Insufficient stock for product ID ${item.product_id}. Available: ${stock?.quantity ?? 0}, Required: ${item.quantity}`,
            422
          );
        }
      }
    }

    await conn.execute(`UPDATE deliveries SET status = ? WHERE id = ?`, [status, id]);

    if (status === "done") {
      for (const item of delivery.items) {
        await stockModel.adjustStock(item.product_id, delivery.warehouse_id, -item.quantity);

        await conn.execute(
          `INSERT INTO stock_ledger
             (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
           VALUES (?, ?, 'delivery', ?, ?, 'delivery', ?)`,
          [item.product_id, delivery.warehouse_id, -item.quantity, id, userId]
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
