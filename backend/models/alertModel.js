const { getPool } = require("../config/db");

const findAll = async ({ isResolved, alertType } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT a.*, p.name AS product_name, p.sku, w.name AS warehouse_name
    FROM alerts a
    JOIN products p ON a.product_id = p.id
    JOIN warehouses w ON a.warehouse_id = w.id
    WHERE 1=1`;
  const params = [];
  if (isResolved !== undefined) { sql += " AND a.is_resolved = ?"; params.push(isResolved ? 1 : 0); }
  if (alertType)                { sql += " AND a.alert_type = ?";  params.push(alertType); }
  sql += " ORDER BY a.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT a.*, p.name AS product_name, p.sku, w.name AS warehouse_name
     FROM alerts a
     JOIN products p ON a.product_id = p.id
     JOIN warehouses w ON a.warehouse_id = w.id
     WHERE a.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ product_id, warehouse_id, alert_type = "low_stock", message = null }) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO alerts (product_id, warehouse_id, alert_type, message) VALUES (?, ?, ?, ?)`,
    [product_id, warehouse_id, alert_type, message]
  );
  return findById(result.insertId);
};

const resolve = async (id) => {
  const pool = getPool();
  await pool.execute(`UPDATE alerts SET is_resolved = 1 WHERE id = ?`, [id]);
  return findById(id);
};

module.exports = { findAll, findById, create, resolve };
