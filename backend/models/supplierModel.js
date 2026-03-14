const { getPool } = require("../config/db");

const findAll = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, contact_person, phone, email, address FROM suppliers ORDER BY name`
  );
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, contact_person, phone, email, address FROM suppliers WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ name, contact_person = null, phone = null, email = null, address = null }) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO suppliers (name, contact_person, phone, email, address) VALUES (?, ?, ?, ?, ?)`,
    [name, contact_person, phone, email, address]
  );
  return findById(result.insertId);
};

const update = async (id, fields) => {
  const pool = getPool();
  const allowed = ["name", "contact_person", "phone", "email", "address"];
  const updates = [], values = [];
  for (const key of allowed) {
    if (fields[key] !== undefined) { updates.push(`${key} = ?`); values.push(fields[key]); }
  }
  if (!updates.length) throw new Error("No fields to update");
  values.push(id);
  await pool.execute(`UPDATE suppliers SET ${updates.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const remove = async (id) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM suppliers WHERE id = ?`, [id]);
};

module.exports = { findAll, findById, create, update, remove };
