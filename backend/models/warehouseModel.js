const { getPool } = require("../config/db");

const findAll = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, location, capacity, created_at FROM warehouses ORDER BY id`
  );
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, location, capacity, created_at FROM warehouses WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

const create = async ({ name, location = null, capacity = null }) => {
  const pool = getPool();
  const [result] = await pool.execute(
    `INSERT INTO warehouses (name, location, capacity) VALUES (?, ?, ?)`,
    [name, location, capacity]
  );
  return findById(result.insertId);
};

const update = async (id, { name, location, capacity }) => {
  const pool = getPool();
  const fields = [], values = [];
  if (name      !== undefined) { fields.push("name = ?");     values.push(name); }
  if (location  !== undefined) { fields.push("location = ?"); values.push(location); }
  if (capacity  !== undefined) { fields.push("capacity = ?"); values.push(capacity); }
  if (!fields.length) throw new Error("No fields to update");
  values.push(id);
  await pool.execute(`UPDATE warehouses SET ${fields.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const remove = async (id) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM warehouses WHERE id = ?`, [id]);
};

module.exports = { findAll, findById, create, update, remove };
