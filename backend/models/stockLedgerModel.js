const { getPool } = require("../config/db");

const getHistory = async ({ productId, warehouseId, limit = 100 } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT sl.*, p.name AS product_name, p.sku,
           w.name AS warehouse_name, u.name AS created_by_name
    FROM stock_ledger sl
    JOIN products p ON sl.product_id = p.id
    JOIN warehouses w ON sl.warehouse_id = w.id
    LEFT JOIN users u ON sl.created_by = u.id
    WHERE 1=1`;
  const params = [];
  if (productId)   { sql += " AND sl.product_id = ?";   params.push(productId); }
  if (warehouseId) { sql += " AND sl.warehouse_id = ?"; params.push(warehouseId); }
  sql += ` ORDER BY sl.created_at DESC LIMIT ?`;
  params.push(Number(limit));
  const [rows] = await pool.execute(sql, params);
  return rows;
};

module.exports = { getHistory };
