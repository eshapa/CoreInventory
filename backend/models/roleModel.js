const { getPool } = require("../config/db");

/**
 * Find a role by its name.
 * @param {string} name  e.g. 'inventory_manager' | 'warehouse_staff'
 * @returns {Promise<{id: number, name: string} | null>}
 */
const findByName = async (name) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name FROM roles WHERE name = ? LIMIT 1`,
    [name]
  );
  return rows[0] || null;
};

/**
 * Return all roles.
 * @returns {Promise<Array<{id: number, name: string, description: string}>>}
 */
const findAll = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, description FROM roles ORDER BY id`
  );
  return rows;
};

module.exports = { findByName, findAll };
