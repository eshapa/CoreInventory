const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");
const alertService = require("../services/alertService");

/**
 * Create a stock adjustment record.
 * system_quantity is auto-read from DB if not provided.
 */
const create = async ({ product_id, warehouse_id, system_quantity, actual_quantity, reason = null, user_id }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Auto-fetch system quantity from current inventory if not provided
    if (system_quantity == null) {
      const stock = await stockModel.getStock(product_id, warehouse_id);
      system_quantity = stock?.quantity ?? 0;
    }

    const [res] = await conn.execute(
      `INSERT INTO stock_adjustments (product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id]
    );

    // Set stock to actual
    await stockModel.setStock(product_id, warehouse_id, actual_quantity);

    const delta = actual_quantity - system_quantity;
    await conn.execute(
      `INSERT INTO stock_ledger
         (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
       VALUES (?, ?, 'adjustment', ?, ?, 'adjustment', ?)`,
      [product_id, warehouse_id, delta, res.insertId, user_id]
    );

    await conn.commit();

    // After commit — check for low stock alert (non-blocking)
    alertService.checkAndAlert(product_id, warehouse_id);

    return findById(res.insertId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

const findAll = async ({ productId, warehouseId } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT sa.*, p.name AS product_name, p.sku, p.unit,
           w.name AS warehouse_name,
           u.name AS adjusted_by,
           (sa.actual_quantity - sa.system_quantity) AS delta
    FROM stock_adjustments sa
    JOIN products p ON sa.product_id = p.id
    JOIN warehouses w ON sa.warehouse_id = w.id
    JOIN users u ON sa.user_id = u.id
    WHERE 1=1`;
  const params = [];
  if (productId)   { sql += " AND sa.product_id = ?";   params.push(productId); }
  if (warehouseId) { sql += " AND sa.warehouse_id = ?"; params.push(warehouseId); }
  sql += " ORDER BY sa.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT sa.*, p.name AS product_name, p.sku, p.unit,
            w.name AS warehouse_name, u.name AS adjusted_by,
            (sa.actual_quantity - sa.system_quantity) AS delta
     FROM stock_adjustments sa
     JOIN products p ON sa.product_id = p.id
     JOIN warehouses w ON sa.warehouse_id = w.id
     JOIN users u ON sa.user_id = u.id
     WHERE sa.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Get current system quantity for a product+warehouse (for the frontend to display).
 */
const getSystemQuantity = async (productId, warehouseId) => {
  const stock = await stockModel.getStock(productId, warehouseId);
  return stock?.quantity ?? 0;
};

module.exports = { create, findAll, findById, getSystemQuantity };
