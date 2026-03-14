const { getPool } = require("./db");

/**
 * Seeds default roles into the roles table.
 * Uses INSERT IGNORE so it is safe on every startup (idempotent).
 */
const initDb = async () => {
  const pool = getPool();

  // Seed the two application roles — no-op if they already exist
  await pool.execute(`
    INSERT IGNORE INTO roles (name, description) VALUES
      ('inventory_manager', 'Full access to inventory, products, receipts, deliveries, transfers and reports'),
      ('warehouse_staff',   'Operational access to view inventory and execute warehouse tasks')
  `);

  console.log("✅ TiDB roles seeded");
};

module.exports = initDb;
