const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");
const AppError = require("../utils/AppError");
const alertService = require("../services/alertService");

const TRANSFER_COLS = `
  t.id,
  t.source_warehouse_id,      sw.name AS source_warehouse_name,
  t.destination_warehouse_id, dw.name AS destination_warehouse_name,
  t.status, t.notes, t.created_by, u.name AS created_by_name, t.created_at`;

const findAll = async ({ status, warehouseId, search } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT ${TRANSFER_COLS}
    FROM transfers t
    JOIN warehouses sw ON t.source_warehouse_id      = sw.id
    JOIN warehouses dw ON t.destination_warehouse_id = dw.id
    LEFT JOIN users u ON t.created_by = u.id
    WHERE 1=1`;
  const params = [];
  if (status)      { sql += " AND t.status = ?"; params.push(status); }
  if (warehouseId) { sql += " AND (t.source_warehouse_id = ? OR t.destination_warehouse_id = ?)"; params.push(warehouseId, warehouseId); }
  if (search)      { sql += " AND (sw.name LIKE ? OR dw.name LIKE ? OR t.notes LIKE ?)"; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  sql += " ORDER BY t.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [[transfer]] = await pool.execute(
    `SELECT ${TRANSFER_COLS}
     FROM transfers t
     JOIN warehouses sw ON t.source_warehouse_id      = sw.id
     JOIN warehouses dw ON t.destination_warehouse_id = dw.id
     LEFT JOIN users u ON t.created_by = u.id
     WHERE t.id = ? LIMIT 1`,
    [id]
  );
  if (!transfer) return null;

  const [items] = await pool.execute(
    `SELECT ti.id, ti.transfer_id, ti.product_id, ti.quantity,
            p.name AS product_name, p.sku, p.unit
     FROM transfer_items ti JOIN products p ON ti.product_id = p.id
     WHERE ti.transfer_id = ?`,
    [id]
  );

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + Number(i.quantity), 0);

  return { ...transfer, items, totalItems, totalQuantity };
};

const create = async ({ source_warehouse_id, destination_warehouse_id, notes = null, created_by, items }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO transfers (source_warehouse_id, destination_warehouse_id, notes, created_by)
       VALUES (?, ?, ?, ?)`,
      [source_warehouse_id, destination_warehouse_id, notes, created_by]
    );
    const transferId = res.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`,
        [transferId, item.product_id, item.quantity]
      );
    }

    await conn.commit();
    return findById(transferId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/** Add items to a draft transfer */
const addItems = async (transferId, items) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of items) {
      await conn.execute(
        `INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, ?, ?)`,
        [transferId, item.product_id, item.quantity]
      );
    }
    await conn.commit();
    return findById(transferId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/** Update a transfer line item */
const updateItem = async (itemId, { quantity }) => {
  const pool = getPool();
  if (quantity !== undefined) {
    await pool.execute(`UPDATE transfer_items SET quantity = ? WHERE id = ?`, [quantity, itemId]);
  }
};

/** Remove a transfer line item */
const removeItem = async (itemId) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM transfer_items WHERE id = ?`, [itemId]);
};

/** Update transfer header while draft */
const updateTransfer = async (id, { source_warehouse_id, destination_warehouse_id, notes }) => {
  const pool = getPool();
  const updates = [], values = [];
  if (source_warehouse_id !== undefined)      { updates.push("source_warehouse_id = ?");      values.push(source_warehouse_id); }
  if (destination_warehouse_id !== undefined)  { updates.push("destination_warehouse_id = ?"); values.push(destination_warehouse_id); }
  if (notes !== undefined)                     { updates.push("notes = ?");                    values.push(notes); }
  if (!updates.length) return findById(id);
  values.push(id);
  await pool.execute(`UPDATE transfers SET ${updates.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const updateStatus = async (id, status, userId) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const transfer = await findById(id);
    if (!transfer) throw new AppError("Transfer not found", 404);

    // Validate transitions
    const transitions = { draft: ["ready", "cancelled"], ready: ["done", "cancelled"], done: [], cancelled: [] };
    if (!transitions[transfer.status]?.includes(status)) {
      throw new AppError(`Cannot transition from '${transfer.status}' to '${status}'`, 422);
    }

    if (status === "done") {
      // Pre-check stock in source warehouse
      const insufficientItems = [];
      for (const item of transfer.items) {
        const stock = await stockModel.getStock(item.product_id, transfer.source_warehouse_id);
        if (!stock || stock.quantity < item.quantity) {
          insufficientItems.push({
            product: item.product_name,
            sku: item.sku,
            available: stock?.quantity ?? 0,
            required: item.quantity,
          });
        }
      }
      if (insufficientItems.length > 0) {
        throw new AppError(
          `Insufficient stock in source warehouse: ${insufficientItems.map(i => `${i.product} (need ${i.required}, have ${i.available})`).join("; ")}`,
          422
        );
      }
    }

    await conn.execute(`UPDATE transfers SET status = ? WHERE id = ?`, [status, id]);

    if (status === "done") {
      for (const item of transfer.items) {
        // Decrement source, increment destination
        await stockModel.adjustStock(item.product_id, transfer.source_warehouse_id, -item.quantity);
        await stockModel.adjustStock(item.product_id, transfer.destination_warehouse_id, item.quantity);

        // Write two ledger entries: transfer_out and transfer_in
        await conn.execute(
          `INSERT INTO stock_ledger
             (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
           VALUES (?, ?, 'transfer_out', ?, ?, 'transfer', ?),
                  (?, ?, 'transfer_in',  ?, ?, 'transfer', ?)`,
          [
            item.product_id, transfer.source_warehouse_id,      -item.quantity, id, userId,
            item.product_id, transfer.destination_warehouse_id,  item.quantity, id, userId,
          ]
        );
      }
    }

    await conn.commit();

    // After commit — check both warehouses for low stock alerts (non-blocking)
    if (status === "done") {
      const alertItems = transfer.items.flatMap(i => [
        { product_id: i.product_id, warehouse_id: transfer.source_warehouse_id },
        { product_id: i.product_id, warehouse_id: transfer.destination_warehouse_id },
      ]);
      alertService.checkMultiple(alertItems);
    }

    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findAll, findById, create, addItems, updateItem, removeItem, updateTransfer, updateStatus };
