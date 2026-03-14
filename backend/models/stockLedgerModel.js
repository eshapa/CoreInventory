const { getPool } = require("../config/db");

/**
 * Move History — full stock ledger with rich filters.
 * @param {{ productId?, warehouseId?, operationType?, startDate?, endDate?, search?, limit? }} filters
 */
const getHistory = async ({ productId, warehouseId, operationType, categoryId, startDate, endDate, search, limit = 100 } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT sl.id, sl.product_id, sl.warehouse_id, sl.operation_type,
           sl.quantity_change, sl.reference_id, sl.reference_type,
           sl.created_by, sl.created_at,
           p.name AS product_name, p.sku, p.unit,
           c.name AS category_name,
           w.name AS warehouse_name,
           u.name AS created_by_name
    FROM stock_ledger sl
    JOIN products p ON sl.product_id = p.id
    LEFT JOIN categories c ON p.category_id = c.id
    JOIN warehouses w ON sl.warehouse_id = w.id
    LEFT JOIN users u ON sl.created_by = u.id
    WHERE 1=1`;
  const params = [];

  if (productId)     { sql += " AND sl.product_id = ?";      params.push(productId); }
  if (warehouseId)   { sql += " AND sl.warehouse_id = ?";    params.push(warehouseId); }
  if (operationType) { sql += " AND sl.operation_type = ?";   params.push(operationType); }
  if (categoryId)    { sql += " AND p.category_id = ?";      params.push(categoryId); }
  if (startDate)     { sql += " AND sl.created_at >= ?";      params.push(startDate); }
  if (endDate)       { sql += " AND sl.created_at <= ?";      params.push(endDate); }
  if (search)        { sql += " AND (p.name LIKE ? OR p.sku LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }

  sql += ` ORDER BY sl.created_at DESC LIMIT ${Number(limit) || 100}`;
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Summary: net movement per operation_type for a time window.
 */
const getSummary = async ({ warehouseId, startDate, endDate } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT operation_type,
           COUNT(*) AS total_entries,
           SUM(quantity_change) AS net_change,
           SUM(ABS(quantity_change)) AS total_volume
    FROM stock_ledger
    WHERE 1=1`;
  const params = [];
  if (warehouseId) { sql += " AND warehouse_id = ?"; params.push(warehouseId); }
  if (startDate)   { sql += " AND created_at >= ?";  params.push(startDate); }
  if (endDate)     { sql += " AND created_at <= ?";  params.push(endDate); }
  sql += " GROUP BY operation_type";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = { getHistory, getSummary };
