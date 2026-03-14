const { getPool } = require("../config/db");

/**
 * Get stock level for a specific product in a specific warehouse.
 */
const getStock = async (productId, warehouseId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT * FROM inventory_stock WHERE product_id = ? AND warehouse_id = ? LIMIT 1`,
    [productId, warehouseId]
  );
  return rows[0] || null;
};

/**
 * Get all stock entries for a warehouse, joined with product + category info.
 */
const getAllForWarehouse = async (warehouseId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       s.id, s.product_id, s.warehouse_id, s.quantity, s.updated_at,
       p.name AS product_name, p.sku, p.unit, p.reorder_level,
       c.name AS category_name
     FROM inventory_stock s
     JOIN products p ON s.product_id = p.id
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE s.warehouse_id = ?
     ORDER BY p.name`,
    [warehouseId]
  );
  return rows;
};

/**
 * Get stock across all warehouses for a specific product.
 */
const getAllForProduct = async (productId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT s.*, w.name AS warehouse_name
     FROM inventory_stock s
     JOIN warehouses w ON s.warehouse_id = w.id
     WHERE s.product_id = ?`,
    [productId]
  );
  return rows;
};

/**
 * Atomically increment or decrement stock.
 * Creates the row if it doesn't exist (upsert).
 * @param {number} productId
 * @param {number} warehouseId
 * @param {number} delta  Positive = add, negative = subtract
 */
const adjustStock = async (productId, warehouseId, delta) => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO inventory_stock (product_id, warehouse_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
    [productId, warehouseId, delta, delta]
  );
};

/**
 * Set stock to a specific absolute quantity (used by stock adjustments).
 */
const setStock = async (productId, warehouseId, quantity) => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO inventory_stock (product_id, warehouse_id, quantity)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE quantity = ?`,
    [productId, warehouseId, quantity, quantity]
  );
};

module.exports = { getStock, getAllForWarehouse, getAllForProduct, adjustStock, setStock };
