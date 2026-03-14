const { getPool } = require("../config/db");

const PRODUCT_COLS = `
  p.id, p.name, p.sku, p.category_id, c.name AS category_name,
  p.description, p.unit, p.reorder_level, p.qr_code, p.created_at`;

/**
 * Find a product by its QR code value.
 * @param {string} qrCode
 */
const findByQrCode = async (qrCode) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${PRODUCT_COLS}
     FROM products p
     LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.qr_code = ?
     LIMIT 1`,
    [qrCode]
  );
  return rows[0] || null;
};

/**
 * Get stock quantities for a product across all warehouses.
 * Includes every warehouse regardless of whether stock exists.
 * @param {number} productId
 */
const getStockByWarehouse = async (productId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT
       w.id   AS warehouse_id,
       w.name AS warehouse_name,
       w.location,
       COALESCE(i.quantity, 0) AS quantity
     FROM warehouses w
     LEFT JOIN inventory_stock i
       ON i.warehouse_id = w.id AND i.product_id = ?
     ORDER BY w.name`,
    [productId]
  );
  return rows;
};

module.exports = { findByQrCode, getStockByWarehouse };
