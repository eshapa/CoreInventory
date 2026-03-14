const { getPool } = require("../config/db");

/* ═══════════════════════════════════════════════
   KPI QUERIES
   ═══════════════════════════════════════════════ */

/** Total distinct products that have stock > 0 across all warehouses */
const getTotalProductsInStock = async () => {
  const pool = getPool();
  const [[row]] = await pool.execute(
    `SELECT COUNT(DISTINCT product_id) AS total FROM inventory_stock WHERE quantity > 0`
  );
  return row.total;
};

/** Products at or below reorder_level (low stock) or at 0 (out of stock) */
const getLowAndOutOfStock = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT p.id, p.name, p.sku, p.reorder_level, p.unit,
           s.warehouse_id, w.name AS warehouse_name, s.quantity
    FROM inventory_stock s
    JOIN products p   ON s.product_id   = p.id
    JOIN warehouses w ON s.warehouse_id = w.id
    WHERE s.quantity <= p.reorder_level
    ORDER BY s.quantity ASC
  `);

  const lowStock    = rows.filter(r => r.quantity > 0);
  const outOfStock  = rows.filter(r => r.quantity <= 0);

  return {
    lowStockCount:   lowStock.length,
    outOfStockCount: outOfStock.length,
    items: rows,
  };
};

/** Count of receipts/deliveries/transfers grouped by status */
const getDocumentCounts = async () => {
  const pool = getPool();

  const [[receipts]]    = await pool.execute(`SELECT status, COUNT(*) AS count FROM receipts   GROUP BY status`);
  const [[deliveries]]  = await pool.execute(`SELECT status, COUNT(*) AS count FROM deliveries GROUP BY status`);
  const [[transfers]]   = await pool.execute(`SELECT status, COUNT(*) AS count FROM transfers  GROUP BY status`);

  // Re-query to get proper arrays
  const [receiptRows]   = await pool.execute(`SELECT status, COUNT(*) AS count FROM receipts   GROUP BY status`);
  const [deliveryRows]  = await pool.execute(`SELECT status, COUNT(*) AS count FROM deliveries GROUP BY status`);
  const [transferRows]  = await pool.execute(`SELECT status, COUNT(*) AS count FROM transfers  GROUP BY status`);

  const toMap = (rows) => rows.reduce((acc, r) => { acc[r.status] = Number(r.count); return acc; }, {});

  return {
    receipts:   toMap(receiptRows),
    deliveries: toMap(deliveryRows),
    transfers:  toMap(transferRows),
  };
};

/** Single pending-counts summary for KPI cards */
const getPendingCounts = async () => {
  const pool = getPool();

  const [[r]] = await pool.execute(`SELECT COUNT(*) AS count FROM receipts   WHERE status IN ('draft','ready')`);
  const [[d]] = await pool.execute(`SELECT COUNT(*) AS count FROM deliveries WHERE status IN ('draft','ready')`);
  const [[t]] = await pool.execute(`SELECT COUNT(*) AS count FROM transfers  WHERE status IN ('draft','ready')`);

  return {
    pendingReceipts:   Number(r.count),
    pendingDeliveries: Number(d.count),
    pendingTransfers:  Number(t.count),
  };
};

/** Staff-specific pending counts and completed document summary */
const getStaffKPIs = async (userId) => {
  const pool = getPool();

  const [
    [[receiptsToday]],
    [[deliveriesToday]],
    [[pendingTransfers]],
    [[lowStockAlerts]]
  ] = await Promise.all([
    pool.execute(`SELECT COUNT(*) AS count FROM receipts WHERE DATE(created_at) = CURDATE() AND created_by = ?`, [userId]),
    pool.execute(`SELECT COUNT(*) AS count FROM deliveries WHERE DATE(created_at) = CURDATE() AND created_by = ?`, [userId]),
    pool.execute(`SELECT COUNT(*) AS count FROM transfers WHERE status IN ('draft', 'ready') AND created_by = ?`, [userId]),
    pool.execute(`SELECT COUNT(*) AS count FROM alerts WHERE is_resolved = FALSE`)
  ]);

  return {
    todaysReceipts: Number(receiptsToday.count),
    todaysDeliveries: Number(deliveriesToday.count),
    pendingTransfers: Number(pendingTransfers.count),
    lowStockAlerts: Number(lowStockAlerts.count)
  };
};

/* ═══════════════════════════════════════════════
   CHART DATA QUERIES
   ═══════════════════════════════════════════════ */

/**
 * Stock movement over time — aggregates ledger quantity_change per day.
 * @param {number} [days=30] How many days back
 */
const getStockMovementGraph = async (days = 30) => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT DATE(created_at) AS date,
           operation_type,
           SUM(quantity_change) AS total_change
    FROM stock_ledger
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
    GROUP BY DATE(created_at), operation_type
    ORDER BY date
  `, [days]);
  return rows;
};

/** Total stock quantity grouped by product category */
const getCategoryDistribution = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT c.name AS category, COALESCE(SUM(s.quantity), 0) AS total_quantity
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id
    LEFT JOIN inventory_stock s ON s.product_id = p.id
    GROUP BY c.id, c.name
    ORDER BY total_quantity DESC
  `);
  return rows;
};

/** Total stock quantity grouped by warehouse */
const getWarehouseDistribution = async () => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT w.id, w.name AS warehouse, COALESCE(SUM(s.quantity), 0) AS total_quantity
    FROM warehouses w
    LEFT JOIN inventory_stock s ON s.warehouse_id = w.id
    GROUP BY w.id, w.name
    ORDER BY total_quantity DESC
  `);
  return rows;
};

/* ═══════════════════════════════════════════════
   FILTERED DOCUMENT LISTING
   ═══════════════════════════════════════════════ */

/**
 * Unified document listing with filters.
 * @param {{ type, status, warehouseId, categoryId }} filters
 */
const getFilteredDocuments = async ({ type, status, warehouseId, categoryId } = {}) => {
  const pool = getPool();
  const results = {};

  const shouldInclude = (t) => !type || type === t;

  if (shouldInclude("receipts")) {
    let sql = `
      SELECT r.id, 'receipt' AS doc_type, r.status, r.created_at,
             r.warehouse_id, w.name AS warehouse_name,
             s.name AS supplier_name, r.notes
      FROM receipts r
      JOIN warehouses w ON r.warehouse_id = w.id
      LEFT JOIN suppliers s ON r.supplier_id = s.id
      WHERE 1=1`;
    const params = [];
    if (status)      { sql += " AND r.status = ?";       params.push(status); }
    if (warehouseId) { sql += " AND r.warehouse_id = ?"; params.push(warehouseId); }
    sql += " ORDER BY r.created_at DESC";
    const [rows] = await pool.execute(sql, params);
    results.receipts = rows;
  }

  if (shouldInclude("deliveries")) {
    let sql = `
      SELECT d.id, 'delivery' AS doc_type, d.status, d.created_at,
             d.warehouse_id, w.name AS warehouse_name,
             c.name AS customer_name, d.notes
      FROM deliveries d
      JOIN warehouses w ON d.warehouse_id = w.id
      LEFT JOIN customers c ON d.customer_id = c.id
      WHERE 1=1`;
    const params = [];
    if (status)      { sql += " AND d.status = ?";       params.push(status); }
    if (warehouseId) { sql += " AND d.warehouse_id = ?"; params.push(warehouseId); }
    sql += " ORDER BY d.created_at DESC";
    const [rows] = await pool.execute(sql, params);
    results.deliveries = rows;
  }

  if (shouldInclude("transfers")) {
    let sql = `
      SELECT t.id, 'transfer' AS doc_type, t.status, t.created_at,
             t.source_warehouse_id, sw.name AS source_warehouse_name,
             t.destination_warehouse_id, dw.name AS destination_warehouse_name,
             t.notes
      FROM transfers t
      JOIN warehouses sw ON t.source_warehouse_id      = sw.id
      JOIN warehouses dw ON t.destination_warehouse_id = dw.id
      WHERE 1=1`;
    const params = [];
    if (status)      { sql += " AND t.status = ?"; params.push(status); }
    if (warehouseId) { sql += " AND (t.source_warehouse_id = ? OR t.destination_warehouse_id = ?)"; params.push(warehouseId, warehouseId); }
    sql += " ORDER BY t.created_at DESC";
    const [rows] = await pool.execute(sql, params);
    results.transfers = rows;
  }

  if (shouldInclude("adjustments")) {
    let sql = `
      SELECT sa.id, 'adjustment' AS doc_type, sa.created_at,
             sa.warehouse_id, w.name AS warehouse_name,
             p.name AS product_name, p.sku,
             sa.system_quantity, sa.actual_quantity, sa.reason
      FROM stock_adjustments sa
      JOIN products p   ON sa.product_id   = p.id
      JOIN warehouses w ON sa.warehouse_id = w.id
      WHERE 1=1`;
    const params = [];
    if (warehouseId) { sql += " AND sa.warehouse_id = ?"; params.push(warehouseId); }
    if (categoryId)  { sql += " AND p.category_id = ?";   params.push(categoryId); }
    sql += " ORDER BY sa.created_at DESC";
    const [rows] = await pool.execute(sql, params);
    results.adjustments = rows;
  }

  return results;
};

module.exports = {
  getTotalProductsInStock,
  getLowAndOutOfStock,
  getPendingCounts,
  getDocumentCounts,
  getStockMovementGraph,
  getCategoryDistribution,
  getWarehouseDistribution,
  getFilteredDocuments,
  getStaffKPIs,
};
