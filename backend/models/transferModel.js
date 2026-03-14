const { getPool } = require("../config/db");
const AppError = require("../utils/AppError");

/**
 * Get all transfers with joined details
 */
const getAllTransfers = async () => {
  const pool = getPool();
  
  const [rows] = await pool.execute(`
    SELECT t.id, t.source_warehouse_id, t.destination_warehouse_id, 
           t.status, t.notes, t.created_by, t.created_at,
           w1.name AS source_warehouse_name,
           w2.name AS destination_warehouse_name,
           u.name AS created_by_name
    FROM transfers t
    JOIN warehouses w1 ON w1.id = t.source_warehouse_id
    JOIN warehouses w2 ON w2.id = t.destination_warehouse_id
    JOIN users u ON u.id = t.created_by
    ORDER BY t.created_at DESC
  `);
  
  return rows;
};

/**
 * Get transfer header and its line items by ID
 */
const getTransferById = async (id) => {
  const pool = getPool();

  const [headerRows] = await pool.execute(`
    SELECT t.*, 
           w1.name AS source_warehouse_name,
           w2.name AS destination_warehouse_name,
           u.name AS created_by_name
    FROM transfers t
    JOIN warehouses w1 ON w1.id = t.source_warehouse_id
    JOIN warehouses w2 ON w2.id = t.destination_warehouse_id
    JOIN users u ON u.id = t.created_by
    WHERE t.id = ?
  `, [id]);

  if (headerRows.length === 0) return null;

  const [items] = await pool.execute(`
    SELECT ti.*, p.name AS product_name, p.sku
    FROM transfer_items ti
    JOIN products p ON p.id = ti.product_id
    WHERE ti.transfer_id = ?
  `, [id]);

  return { ...headerRows[0], items };
};

/**
 * Create a new transfer header and line items
 */
const createTransfer = async (data, items, user_id) => {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Insert header
    const [headerResult] = await conn.execute(`
      INSERT INTO transfers (source_warehouse_id, destination_warehouse_id, status, notes, created_by)
      VALUES (?, ?, 'draft', ?, ?)
    `, [data.source_warehouse_id, data.destination_warehouse_id, data.notes || '', user_id]);
    
    const transferId = headerResult.insertId;

    // 2. Insert items
    for (const item of items) {
      await conn.execute(`
        INSERT INTO transfer_items (transfer_id, product_id, quantity)
        VALUES (?, ?, ?)
      `, [transferId, item.product_id, item.quantity]);
    }

    await conn.commit();
    return await getTransferById(transferId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Complete a transfer, mutating stock and recording ledger entries
 */
const completeTransfer = async (transferId, userId) => {
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Get transfer
    const [transfers] = await conn.execute('SELECT * FROM transfers WHERE id = ? FOR UPDATE', [transferId]);
    if (transfers.length === 0) throw new AppError('Transfer not found', 404);
    
    const transfer = transfers[0];
    if (transfer.status !== 'draft') throw new AppError(`Cannot complete transfer in status: ${transfer.status}`, 400);

    const sourceId = transfer.source_warehouse_id;
    const destId = transfer.destination_warehouse_id;

    // 2. Get line items
    const [items] = await conn.execute('SELECT * FROM transfer_items WHERE transfer_id = ?', [transferId]);
    if (items.length === 0) throw new AppError('Transfer has no items', 400);

    // 3. Loop through items to update stock
    for (const item of items) {
      const pid = item.product_id;
      const qty = item.quantity;

      // Ensure source has enough quantity (guard check)
      const [sourceStock] = await conn.execute(`
        SELECT quantity FROM inventory_stock 
        WHERE product_id = ? AND warehouse_id = ?
        FOR UPDATE
      `, [pid, sourceId]);

      if (sourceStock.length === 0 || sourceStock[0].quantity < qty) {
        throw new AppError(`Insufficient stock for Product ID ${pid} at source warehouse`, 400);
      }

      // Decrease source
      await conn.execute(`
        UPDATE inventory_stock
        SET quantity = quantity - ?
        WHERE product_id = ? AND warehouse_id = ?
      `, [qty, pid, sourceId]);

      // Increase destination
      await conn.execute(`
        INSERT INTO inventory_stock (product_id, warehouse_id, quantity)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE quantity = quantity + ?
      `, [pid, destId, qty, qty]);

      // Ledger entry 1: transfer_out
      await conn.execute(`
        INSERT INTO stock_ledger
          (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
        VALUES (?, ?, 'transfer_out', ?, ?, 'transfer', ?)
      `, [pid, sourceId, -qty, transferId, userId]);

      // Ledger entry 2: transfer_in
      await conn.execute(`
        INSERT INTO stock_ledger
          (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
        VALUES (?, ?, 'transfer_in', ?, ?, 'transfer', ?)
      `, [pid, destId, qty, transferId, userId]);
    }

    // 4. Update status
    await conn.execute(`UPDATE transfers SET status = 'done' WHERE id = ?`, [transferId]);

    await conn.commit();
    return true; // We can return true, and controller calls alertCheck separately (or here)
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllTransfers,
  getTransferById,
  createTransfer,
  completeTransfer,
};
