const { getPool } = require("../config/db");

const findAll = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, description FROM categories ORDER BY name`
  );
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, description FROM categories WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ name, description = null }) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO categories (name, description) VALUES (?, ?)`,
    [name, description]
  );
  return findById(result.insertId);
};

const update = async (id, { name, description }) => {
  const pool = getPool();
  const fields = [], values = [];
  if (name        !== undefined) { fields.push("name = ?");        values.push(name); }
  if (description !== undefined) { fields.push("description = ?"); values.push(description); }
  if (!fields.length) throw new Error("No fields to update");
  values.push(id);
  await pool.execute(`UPDATE categories SET ${fields.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const remove = async (id) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM categories WHERE id = ?`, [id]);
};

module.exports = { findAll, findById, create, update, remove };
