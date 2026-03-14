const { getPool } = require("../config/db");

const findAll = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, phone, email, address, created_at FROM customers ORDER BY name`
  );
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, phone, email, address, created_at FROM customers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ name, phone = null, email = null, address = null }) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)`,
    [name, phone, email, address]
  );
  return findById(result.insertId);
};

const update = async (id, fields) => {
  const pool = getPool();
  const allowed = ["name", "phone", "email", "address"];
  const updates = [], values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
  }
  if (!updates.length) throw new Error("No fields to update");
  values.push(id);
  await pool.execute(`UPDATE customers SET ${updates.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const remove = async (id) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM customers WHERE id = ?`, [id]);
};

module.exports = { findAll, findById, create, update, remove };
