const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");
const alertService = require("../services/alertService");

const RECEIPT_COLS = `
  r.id, r.supplier_id, s.name AS supplier_name,
  r.warehouse_id, w.name AS warehouse_name,
  r.status, r.notes, r.created_by, u.name AS created_by_name, r.created_at`;

const findAll = async ({ warehouseId, status, supplierId, search } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT ${RECEIPT_COLS}
    FROM receipts r
    LEFT JOIN suppliers s ON r.supplier_id = s.id
    JOIN warehouses w ON r.warehouse_id = w.id
    LEFT JOIN users u ON r.created_by = u.id
    WHERE 1=1`;
  const params = [];
  if (warehouseId) { sql += " AND r.warehouse_id = ?"; params.push(warehouseId); }
  if (status)      { sql += " AND r.status = ?";       params.push(status); }
  if (supplierId)  { sql += " AND r.supplier_id = ?";  params.push(supplierId); }
  if (search)      { sql += " AND (s.name LIKE ? OR r.notes LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  sql += " ORDER BY r.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [[receipt]] = await pool.execute(
    `SELECT ${RECEIPT_COLS}
     FROM receipts r
     LEFT JOIN suppliers s ON r.supplier_id = s.id
     JOIN warehouses w ON r.warehouse_id = w.id
     LEFT JOIN users u ON r.created_by = u.id
     WHERE r.id = ? LIMIT 1`,
    [id]
  );
  if (!receipt) return null;

  const [items] = await pool.execute(
    `SELECT ri.id, ri.receipt_id, ri.product_id, ri.quantity, ri.unit_price,
            p.name AS product_name, p.sku, p.unit
     FROM receipt_items ri JOIN products p ON ri.product_id = p.id
     WHERE ri.receipt_id = ?`,
    [id]
  );

  // Calculate totals
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const totalValue = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0);

  return { ...receipt, items, totalItems, totalQuantity, totalValue };
};

/**
 * Create a receipt with its line items (status defaults to 'draft').
 */
const create = async ({ supplier_id = null, warehouse_id, notes = null, created_by, items }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO receipts (supplier_id, warehouse_id, notes, created_by) VALUES (?, ?, ?, ?)`,
      [supplier_id, warehouse_id, notes, created_by]
    );
    const receiptId = res.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [receiptId, item.product_id, item.quantity, item.unit_price ?? 0]
      );
    }

    await conn.commit();
    return findById(receiptId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Add items to a draft receipt.
 */
const addItems = async (receiptId, items) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of items) {
      await conn.execute(
        `INSERT INTO receipt_items (receipt_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [receiptId, item.product_id, item.quantity, item.unit_price ?? 0]
      );
    }
    await conn.commit();
    return findById(receiptId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Update a line item in a draft receipt.
 */
const updateItem = async (itemId, { quantity, unit_price }) => {
  const pool = getPool();
  const updates = [], values = [];
  if (quantity !== undefined)   { updates.push("quantity = ?");   values.push(quantity); }
  if (unit_price !== undefined) { updates.push("unit_price = ?"); values.push(unit_price); }
  if (!updates.length) return;
  values.push(itemId);
  await pool.execute(`UPDATE receipt_items SET ${updates.join(", ")} WHERE id = ?`, values);
};

/**
 * Remove a line item from a draft receipt.
 */
const removeItem = async (itemId) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM receipt_items WHERE id = ?`, [itemId]);
};

/**
 * Update receipt header fields (only while draft).
 */
const updateReceipt = async (id, { supplier_id, warehouse_id, notes }) => {
  const pool = getPool();
  const updates = [], values = [];
  if (supplier_id !== undefined)  { updates.push("supplier_id = ?");  values.push(supplier_id); }
  if (warehouse_id !== undefined) { updates.push("warehouse_id = ?"); values.push(warehouse_id); }
  if (notes !== undefined)        { updates.push("notes = ?");        values.push(notes); }
  if (!updates.length) return findById(id);
  values.push(id);
  await pool.execute(`UPDATE receipts SET ${updates.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

/**
 * Update status. When status → 'done', stock is updated and ledger entries are written.
 */
const updateStatus = async (id, status, userId) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const receipt = await findById(id);
    if (!receipt) throw new Error("Receipt not found");

    // Validate status transitions
    const transitions = { draft: ["ready", "cancelled"], ready: ["done", "cancelled"], done: [], cancelled: [] };
    if (!transitions[receipt.status]?.includes(status)) {
      throw new Error(`Cannot transition from '${receipt.status}' to '${status}'`);
    }

    await conn.execute(`UPDATE receipts SET status = ? WHERE id = ?`, [status, id]);

    // When done → increase stock and write ledger
    if (status === "done") {
      for (const item of receipt.items) {
        await stockModel.adjustStock(item.product_id, receipt.warehouse_id, item.quantity);

        await conn.execute(
          `INSERT INTO stock_ledger
             (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
           VALUES (?, ?, 'receipt', ?, ?, 'receipt', ?)`,
          [item.product_id, receipt.warehouse_id, item.quantity, id, userId]
        );
      }
    }

    await conn.commit();

    // After commit — check for low stock alerts (non-blocking)
    if (status === "done") {
      alertService.checkMultiple(receipt.items.map(i => ({ product_id: i.product_id, warehouse_id: receipt.warehouse_id })));
    }

    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findAll, findById, create, addItems, updateItem, removeItem, updateReceipt, updateStatus };
