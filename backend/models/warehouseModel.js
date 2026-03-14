const { getPool } = require("../config/db");

const COLS = `
  w.id, w.name, w.location, w.capacity, w.created_at,
  (w.capacity - COALESCE(SUM(i.quantity), 0)) AS available_space
`;

const findAll = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${COLS} FROM warehouses w LEFT JOIN inventory_stock i ON w.id = i.warehouse_id GROUP BY w.id ORDER BY w.id`
  );
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${COLS} FROM warehouses w LEFT JOIN inventory_stock i ON w.id = i.warehouse_id WHERE w.id = ? GROUP BY w.id LIMIT 1`,
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
  // Check if warehouse has stock before deleting
  const [stock] = await pool.execute(
    `SELECT COUNT(*) as count FROM inventory_stock WHERE warehouse_id = ? AND quantity > 0`,
    [id]
  );
  if (stock[0].count > 0) {
    const error = new Error("Cannot delete warehouse because it still contains stock.");
    error.status = 409;
    throw error;
  }
  
  await pool.execute(`DELETE FROM warehouses WHERE id = ?`, [id]);
};

const findInventoryByWarehouse = async (warehouseId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT p.name, p.sku, i.quantity 
     FROM inventory_stock i 
     JOIN products p ON p.id = i.product_id 
     WHERE i.warehouse_id = ? AND i.quantity > 0
     ORDER BY p.name`,
    [warehouseId]
  );
  return rows;
};

module.exports = { findAll, findById, create, update, remove, findInventoryByWarehouse };
