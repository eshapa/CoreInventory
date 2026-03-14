const { getPool } = require("../config/db");

const COLS = `
  p.id, p.name, p.sku, p.category_id, c.name AS category_name,
  p.description, p.unit, p.reorder_level, p.qr_code, p.created_at`;

const findAll = async ({ categoryId } = {}) => {
  const pool = getPool();
  let sql = `SELECT ${COLS} FROM products p LEFT JOIN categories c ON p.category_id = c.id`;
  const params = [];
  if (categoryId) { sql += " WHERE p.category_id = ?"; params.push(categoryId); }
  sql += " ORDER BY p.name";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${COLS} FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const findBySku = async (sku) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${COLS} FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.sku = ? LIMIT 1`,
    [sku]
  );
  return rows[0] || null;
};

const create = async ({ name, sku, category_id = null, description = null, unit = null, reorder_level = 0, qr_code = null }) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO products (name, sku, category_id, description, unit, reorder_level, qr_code)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [name, sku, category_id, description, unit, reorder_level, qr_code]
  );
  return findById(result.insertId);
};

const update = async (id, fields) => {
  const pool = getPool();
  const allowed = ["name", "sku", "category_id", "description", "unit", "reorder_level", "qr_code"];
  const updates = [], values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
  }
  if (!updates.length) throw new Error("No fields to update");
  values.push(id);
  await pool.execute(`UPDATE products SET ${updates.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const remove = async (id) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
};

module.exports = { findAll, findById, findBySku, create, update, remove };
