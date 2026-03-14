const { getPool } = require("../config/db");

const COLS = `
  p.id, p.name, p.sku, p.category_id, c.name AS category_name,
  p.description, p.unit, p.reorder_level, p.qr_code, p.created_at`;

/**
 * List all products with optional filters.
 * @param {{ categoryId?, search? }} filters
 */
const findAll = async ({ categoryId, search, qr_code } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT p.id, p.name, p.sku, p.category_id, c.name AS category_name,
           p.description, p.unit, p.reorder_level, p.qr_code, p.created_at,
           COALESCE(SUM(s.quantity), 0) AS total_stock
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    LEFT JOIN inventory_stock s ON s.product_id = p.id
    WHERE 1=1
  `;
  const params = [];

  if (categoryId) {
    sql += ` AND p.category_id = ?`;
    params.push(categoryId);
  }
  if (qr_code) {
    sql += ` AND p.qr_code = ?`;
    params.push(qr_code);
  }
  if (search) {
    sql += ` AND (p.name LIKE ? OR p.sku LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }
  sql += " GROUP BY p.id, p.name, p.sku, p.category_id, c.name, p.description, p.unit, p.reorder_level, p.qr_code, p.created_at ORDER BY p.name";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

/**
 * Get a product by ID with stock availability across all warehouses.
 */
const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${COLS} FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.id = ? LIMIT 1`, [id]
  );
  return rows[0] || null;
};

const findBySku = async (sku) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${COLS} FROM products p LEFT JOIN categories c ON p.category_id = c.id
     WHERE p.sku = ? LIMIT 1`, [sku]
  );
  return rows[0] || null;
};

/**
 * Get stock availability for a product across all warehouses.
 */
const getStockAvailability = async (productId) => {
  const pool = getPool();
  const [rows] = await pool.execute(`
    SELECT w.id AS warehouse_id, w.name AS warehouse_name, w.location,
           COALESCE(i.quantity, 0) AS quantity
    FROM warehouses w
    LEFT JOIN inventory_stock i ON i.warehouse_id = w.id AND i.product_id = ?
    ORDER BY w.name
  `, [productId]);
  return rows;
};

/**
 * Create a product with optional initial stock.
 * If initial_stock and warehouse_id are provided, also creates inventory_stock
 * and a stock_ledger entry — all inside a single transaction.
 */
const create = async ({ name, sku, category_id = null, description = null, unit = null,
                        reorder_level = 0, qr_code = null, initial_stock = null,
                        warehouse_id = null, created_by = null }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Insert the product
    const [result] = await conn.execute(
      `INSERT INTO products (name, sku, category_id, description, unit, reorder_level, qr_code)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, sku, category_id, description, unit, reorder_level, qr_code]
    );
    const productId = result.insertId;

    // 2. If initial stock is provided, seed inventory + ledger
    if (initial_stock && initial_stock > 0 && warehouse_id) {
      await conn.execute(
        `INSERT INTO inventory_stock (product_id, warehouse_id, quantity)
         VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE quantity = quantity + ?`,
        [productId, warehouse_id, initial_stock, initial_stock]
      );

      await conn.execute(
        `INSERT INTO stock_ledger
           (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
         VALUES (?, ?, 'adjustment', ?, ?, 'adjustment', ?)`,
        [productId, warehouse_id, initial_stock, productId, created_by]
      );
    }

    await conn.commit();
    return findById(productId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
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

/**
 * Check if any foreign key references exist before deleting.
 * Checks: inventory_stock, receipt_items, delivery_items, transfer_items, stock_ledger, alerts, stock_adjustments
 */
const checkDependencies = async (productId) => {
  const pool = getPool();
  const tables = [
    { table: "inventory_stock",   col: "product_id", label: "inventory records" },
    { table: "receipt_items",     col: "product_id", label: "receipt items" },
    { table: "delivery_items",    col: "product_id", label: "delivery items" },
    { table: "transfer_items",    col: "product_id", label: "transfer items" },
    { table: "stock_ledger",      col: "product_id", label: "ledger entries" },
    { table: "stock_adjustments", col: "product_id", label: "stock adjustments" },
    { table: "alerts",            col: "product_id", label: "alerts" },
  ];

  const deps = [];
  for (const t of tables) {
    const [[row]] = await pool.execute(
      `SELECT COUNT(*) AS cnt FROM ${t.table} WHERE ${t.col} = ?`, [productId]
    );
    if (Number(row.cnt) > 0) {
      deps.push({ table: t.label, count: Number(row.cnt) });
    }
  }
  return deps;
};

const remove = async (id) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM products WHERE id = ?`, [id]);
};

/**
 * Generate a QR code value from the SKU and save it.
 */
const setQrCode = async (id, qrValue) => {
  const pool = getPool();
  await pool.execute(`UPDATE products SET qr_code = ? WHERE id = ?`, [qrValue, id]);
  return findById(id);
};

module.exports = { findAll, findById, findBySku, getStockAvailability, create, update, checkDependencies, remove, setQrCode };
