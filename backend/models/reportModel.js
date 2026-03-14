const { getPool } = require("../config/db");

/**
 * Inventory Valuation — current stock value based on latest receipt unit_price.
 * Uses the most recent receipt_items.unit_price for each product as valuation basis.
 */
const getInventoryValuation = async ({ warehouseId, categoryId } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT p.id AS product_id, p.name AS product_name, p.sku, p.unit,
           c.name AS category_name,
           w.id AS warehouse_id, w.name AS warehouse_name,
           i.quantity,
           COALESCE(latest_price.unit_price, 0) AS unit_price,
           ROUND(i.quantity * COALESCE(latest_price.unit_price, 0), 2) AS total_value
    FROM inventory_stock i
    JOIN products p   ON p.id = i.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    JOIN warehouses w ON w.id = i.warehouse_id
    LEFT JOIN (
      SELECT ri.product_id, ri.unit_price
      FROM receipt_items ri
      INNER JOIN (
        SELECT product_id, MAX(id) AS max_id
        FROM receipt_items
        GROUP BY product_id
      ) latest ON ri.id = latest.max_id
    ) latest_price ON latest_price.product_id = p.id
    WHERE i.quantity > 0`;
  const params = [];
  if (warehouseId) { sql += " AND i.warehouse_id = ?"; params.push(warehouseId); }
  if (categoryId)  { sql += " AND p.category_id = ?";  params.push(categoryId); }
  sql += " ORDER BY total_value DESC";

  const [rows] = await pool.execute(sql, params);

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total_value), 0);

  return { items: rows, grandTotal: Math.round(grandTotal * 100) / 100 };
};

/**
 * Stock Movement Trends — daily stock changes grouped by operation type.
 */
const getStockMovementTrends = async ({ days = 30, warehouseId } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT DATE(created_at) AS date,
           operation_type,
           SUM(quantity_change) AS net_change,
           COUNT(*) AS transaction_count
    FROM stock_ledger
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
  const params = [Number(days)];
  if (warehouseId) { sql += " AND warehouse_id = ?"; params.push(warehouseId); }
  sql += " GROUP BY DATE(created_at), operation_type ORDER BY DATE(created_at)";

  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Top Used Products — most moved products by delivery volume (outgoing).
 */
const getTopUsedProducts = async ({ limit = 10, days = 30, warehouseId } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT p.id AS product_id, p.name AS product_name, p.sku, p.unit,
           c.name AS category_name,
           SUM(ABS(sl.quantity_change)) AS total_moved,
           COUNT(*) AS delivery_count
    FROM stock_ledger sl
    JOIN products p ON p.id = sl.product_id
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE sl.operation_type = 'delivery'
      AND sl.created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`;
  const params = [Number(days)];
  if (warehouseId) { sql += " AND sl.warehouse_id = ?"; params.push(warehouseId); }
  sql += ` GROUP BY p.id, p.name, p.sku, p.unit, c.name
           ORDER BY total_moved DESC
           LIMIT ?`;
  params.push(Number(limit));

  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Warehouse Utilisation — stock used vs capacity per warehouse.
 */
const getWarehouseUtilisation = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT w.id AS warehouse_id, w.name AS warehouse_name, w.location,
           w.capacity,
           COALESCE(SUM(i.quantity), 0) AS used,
           GREATEST(w.capacity - COALESCE(SUM(i.quantity), 0), 0) AS free,
           CASE
             WHEN w.capacity > 0 THEN ROUND(COALESCE(SUM(i.quantity), 0) / w.capacity * 100, 1)
             ELSE 0
           END AS utilisation_percent
    FROM warehouses w
    LEFT JOIN inventory_stock i ON i.warehouse_id = w.id
    GROUP BY w.id, w.name, w.location, w.capacity
    ORDER BY utilisation_percent DESC
  `);
  return rows;
};

/**
 * Monthly Stock Flow — aggregated by month for charts.
 */
const getMonthlyStockFlow = async ({ months = 6, warehouseId } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT DATE_FORMAT(created_at, '%Y-%m') AS month,
           SUM(CASE WHEN quantity_change > 0 THEN quantity_change ELSE 0 END) AS total_in,
           SUM(CASE WHEN quantity_change < 0 THEN ABS(quantity_change) ELSE 0 END) AS total_out,
           SUM(quantity_change) AS net_change
    FROM stock_ledger
    WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? MONTH)`;
  const params = [Number(months)];
  if (warehouseId) { sql += " AND warehouse_id = ?"; params.push(warehouseId); }
  sql += " GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month";

  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Category Distribution — total stock quantity per category.
 */
const getCategoryDistribution = async ({ warehouseId } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT c.id AS category_id, c.name AS category_name,
           COUNT(DISTINCT p.id) AS product_count,
           COALESCE(SUM(i.quantity), 0) AS total_quantity
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    LEFT JOIN inventory_stock i ON i.product_id = p.id`;
  const params = [];
  if (warehouseId) { sql += " AND i.warehouse_id = ?"; params.push(warehouseId); }
  sql += " GROUP BY c.id, c.name ORDER BY total_quantity DESC";

  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Warehouse Usage — stock breakdown per warehouse (for graphs).
 */
const getWarehouseUsage = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT w.id AS warehouse_id, w.name AS warehouse_name,
           COUNT(DISTINCT i.product_id) AS product_count,
           COALESCE(SUM(i.quantity), 0) AS total_quantity,
           w.capacity,
           CASE
             WHEN w.capacity > 0 THEN ROUND(COALESCE(SUM(i.quantity), 0) / w.capacity * 100, 1)
             ELSE 0
           END AS utilisation_percent
    FROM warehouses w
    LEFT JOIN inventory_stock i ON i.warehouse_id = w.id
    GROUP BY w.id, w.name, w.capacity
    ORDER BY total_quantity DESC
  `);
  return rows;
};

module.exports = {
  getInventoryValuation,
  getStockMovementTrends,
  getTopUsedProducts,
  getWarehouseUtilisation,
  getMonthlyStockFlow,
  getCategoryDistribution,
  getWarehouseUsage,
};
