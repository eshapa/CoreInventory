const { getPool } = require("../config/db");
const stockModel = require("./inventoryStockModel");
const AppError = require("../utils/AppError");
const alertService = require("../services/alertService");

const DELIVERY_COLS = `
  d.id, d.customer_id, cu.name AS customer_name,
  d.warehouse_id, w.name AS warehouse_name,
  d.status, d.notes, d.created_by, u.name AS created_by_name, d.created_at`;

const findAll = async ({ warehouseId, status, customerId, search } = {}) => {
  const pool = getPool();
  let sql = `
    SELECT ${DELIVERY_COLS}
    FROM deliveries d
    LEFT JOIN customers cu ON d.customer_id = cu.id
    JOIN warehouses w ON d.warehouse_id = w.id
    LEFT JOIN users u ON d.created_by = u.id
    WHERE 1=1`;
  const params = [];
  if (warehouseId) { sql += " AND d.warehouse_id = ?"; params.push(warehouseId); }
  if (status)      { sql += " AND d.status = ?";       params.push(status); }
  if (customerId)  { sql += " AND d.customer_id = ?";  params.push(customerId); }
  if (search)      { sql += " AND (cu.name LIKE ? OR d.notes LIKE ?)"; params.push(`%${search}%`, `%${search}%`); }
  sql += " ORDER BY d.created_at DESC";
  const [rows] = await pool.execute(sql, params);
  return rows;
};

const findById = async (id) => {
  const pool = getPool();
  const [[delivery]] = await pool.execute(
    `SELECT ${DELIVERY_COLS}
     FROM deliveries d
     LEFT JOIN customers cu ON d.customer_id = cu.id
     JOIN warehouses w ON d.warehouse_id = w.id
     LEFT JOIN users u ON d.created_by = u.id
     WHERE d.id = ? LIMIT 1`,
    [id]
  );
  if (!delivery) return null;

  const [items] = await pool.execute(
    `SELECT di.id, di.delivery_id, di.product_id, di.quantity, di.unit_price,
            p.name AS product_name, p.sku, p.unit
     FROM delivery_items di JOIN products p ON di.product_id = p.id
     WHERE di.delivery_id = ?`,
    [id]
  );

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, i) => sum + Number(i.quantity), 0);
  const totalValue = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unit_price)), 0);

  return { ...delivery, items, totalItems, totalQuantity, totalValue };
};

const create = async ({ customer_id = null, warehouse_id, notes = null, created_by, items }) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [res] = await conn.execute(
      `INSERT INTO deliveries (customer_id, warehouse_id, notes, created_by) VALUES (?, ?, ?, ?)`,
      [customer_id, warehouse_id, notes, created_by]
    );
    const deliveryId = res.insertId;

    for (const item of items) {
      await conn.execute(
        `INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [deliveryId, item.product_id, item.quantity, item.unit_price ?? 0]
      );
    }

    await conn.commit();
    return findById(deliveryId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/** Add items to a draft delivery */
const addItems = async (deliveryId, items) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const item of items) {
      await conn.execute(
        `INSERT INTO delivery_items (delivery_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [deliveryId, item.product_id, item.quantity, item.unit_price ?? 0]
      );
    }
    await conn.commit();
    return findById(deliveryId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/** Update a delivery line item */
const updateItem = async (itemId, { quantity, unit_price }) => {
  const pool = getPool();
  const updates = [], values = [];
  if (quantity !== undefined)   { updates.push("quantity = ?");   values.push(quantity); }
  if (unit_price !== undefined) { updates.push("unit_price = ?"); values.push(unit_price); }
  if (!updates.length) return;
  values.push(itemId);
  await pool.execute(`UPDATE delivery_items SET ${updates.join(", ")} WHERE id = ?`, values);
};

/** Remove a delivery line item */
const removeItem = async (itemId) => {
  const pool = getPool();
  await pool.execute(`DELETE FROM delivery_items WHERE id = ?`, [itemId]);
};

/** Update delivery header while in draft */
const updateDelivery = async (id, { customer_id, warehouse_id, notes }) => {
  const pool = getPool();
  const updates = [], values = [];
  if (customer_id !== undefined)  { updates.push("customer_id = ?");  values.push(customer_id); }
  if (warehouse_id !== undefined) { updates.push("warehouse_id = ?"); values.push(warehouse_id); }
  if (notes !== undefined)        { updates.push("notes = ?");        values.push(notes); }
  if (!updates.length) return findById(id);
  values.push(id);
  await pool.execute(`UPDATE deliveries SET ${updates.join(", ")} WHERE id = ?`, values);
  return findById(id);
};

const updateStatus = async (id, status, userId) => {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const delivery = await findById(id);
    if (!delivery) throw new AppError("Delivery not found", 404);

    // Validate transitions
    const transitions = { draft: ["ready", "cancelled"], ready: ["done", "cancelled"], done: [], cancelled: [] };
    if (!transitions[delivery.status]?.includes(status)) {
      throw new AppError(`Cannot transition from '${delivery.status}' to '${status}'`, 422);
    }

    if (status === "done") {
      // Pre-check sufficient stock for ALL items before any changes
      const insufficientItems = [];
      for (const item of delivery.items) {
        const stock = await stockModel.getStock(item.product_id, delivery.warehouse_id);
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
          `Insufficient stock for: ${insufficientItems.map(i => `${i.product} (need ${i.required}, have ${i.available})`).join("; ")}`,
          422
        );
      }
    }

    await conn.execute(`UPDATE deliveries SET status = ? WHERE id = ?`, [status, id]);

    if (status === "done") {
      for (const item of delivery.items) {
        await stockModel.adjustStock(item.product_id, delivery.warehouse_id, -item.quantity);

        await conn.execute(
          `INSERT INTO stock_ledger
             (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
           VALUES (?, ?, 'delivery', ?, ?, 'delivery', ?)`,
          [item.product_id, delivery.warehouse_id, -item.quantity, id, userId]
        );
      }
    }

    await conn.commit();

    // After commit — check for low stock alerts (non-blocking)
    if (status === "done") {
      alertService.checkMultiple(delivery.items.map(i => ({ product_id: i.product_id, warehouse_id: delivery.warehouse_id })));
    }

    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = { findAll, findById, create, addItems, updateItem, removeItem, updateDelivery, updateStatus };
