const { getPool } = require("../config/db");

/**
 * Alert Detection Service
 *
 * Runs after every stock-changing operation.
 * Checks if any updated product+warehouse combo has dropped to or below reorder_level.
 * Creates alerts and notifies all managers.
 */

/**
 * Check a single product+warehouse and create an alert + notifications if needed.
 * @param {number} productId
 * @param {number} warehouseId
 */
const checkAndAlert = async (productId, warehouseId) => {
  const pool = getPool();

  // 1. Get current stock and reorder level
  const [[row]] = await pool.execute(`
    SELECT i.quantity, p.reorder_level, p.name AS product_name, p.sku,
           w.name AS warehouse_name
    FROM inventory_stock i
    JOIN products p   ON p.id = i.product_id
    JOIN warehouses w ON w.id = i.warehouse_id
    WHERE i.product_id = ? AND i.warehouse_id = ?
    LIMIT 1
  `, [productId, warehouseId]);

  if (!row) return; // No stock record yet

  const { quantity, reorder_level, product_name, sku, warehouse_name } = row;

  // 2. If stock is above reorder level, no alert needed
  if (quantity > reorder_level) return;

  // 3. Determine alert type
  const alertType = quantity <= 0 ? "out_of_stock" : "low_stock";

  // 4. Check if an unresolved alert already exists for this product+warehouse+type
  const [[existing]] = await pool.execute(`
    SELECT id FROM alerts
    WHERE product_id = ? AND warehouse_id = ? AND alert_type = ? AND is_resolved = 0
    LIMIT 1
  `, [productId, warehouseId, alertType]);

  if (existing) return; // Alert already exists, don't duplicate

  // 5. Create the alert
  const message = alertType === "out_of_stock"
    ? `${product_name} (${sku}) is OUT OF STOCK in ${warehouse_name}`
    : `${product_name} (${sku}) is LOW in ${warehouse_name} — ${quantity} remaining (reorder level: ${reorder_level})`;

  const [alertResult] = await pool.execute(
    `INSERT INTO alerts (product_id, warehouse_id, alert_type, message) VALUES (?, ?, ?, ?)`,
    [productId, warehouseId, alertType, message]
  );
  const alertId = alertResult.insertId;

  // 6. Notify all inventory managers
  const [managers] = await pool.execute(`
    SELECT u.id FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE r.name = 'inventory_manager' AND u.status = 'active'
  `);

  const title = alertType === "out_of_stock" ? "🔴 Out of Stock" : "🟡 Low Stock Alert";

  for (const mgr of managers) {
    await pool.execute(
      `INSERT INTO notifications (user_id, alert_id, title, message) VALUES (?, ?, ?, ?)`,
      [mgr.id, alertId, title, message]
    );
  }
};

/**
 * Check multiple products (used after bulk stock changes like receipts/deliveries/transfers).
 * @param {Array<{product_id: number, warehouse_id: number}>} items
 */
const checkMultiple = async (items) => {
  // Deduplicate product+warehouse pairs
  const unique = new Map();
  for (const item of items) {
    const key = `${item.product_id}-${item.warehouse_id}`;
    unique.set(key, { productId: item.product_id, warehouseId: item.warehouse_id });
  }

  for (const { productId, warehouseId } of unique.values()) {
    try {
      await checkAndAlert(productId, warehouseId);
    } catch (err) {
      // Alert failure should never break the main operation
      console.error(`⚠️ Alert check failed for product ${productId}, warehouse ${warehouseId}:`, err.message);
    }
  }
};

module.exports = { checkAndAlert, checkMultiple };
