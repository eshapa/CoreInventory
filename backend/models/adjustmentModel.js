const { getPool } = require("../config/db");
const AppError = require("../utils/AppError");

/**
 * Get all stock adjustments
 */
const getAllAdjustments = async () => {
  const pool = getPool();
  
  const [rows] = await pool.execute(`
    SELECT sa.id, sa.system_quantity, sa.actual_quantity, sa.reason, sa.created_at,
           p.name AS product_name, p.sku,
           w.name AS warehouse_name,
           u.name AS user_name
    FROM stock_adjustments sa
    JOIN products p ON p.id = sa.product_id
    JOIN warehouses w ON w.id = sa.warehouse_id
    JOIN users u ON u.id = sa.user_id
    ORDER BY sa.created_at DESC
  `);
  
  return rows;
};

/**
 * Get current system quantity for a product in a warehouse
 */
const getSystemQuantity = async (productId, warehouseId) => {
  const pool = getPool();
  
  const [rows] = await pool.execute(`
    SELECT quantity AS system_quantity 
    FROM inventory_stock
    WHERE product_id = ? AND warehouse_id = ?
  `, [productId, warehouseId]);

  return rows.length > 0 ? rows[0].system_quantity : 0;
};

/**
 * Create a new stock adjustment transaction
 */
const createAdjustment = async (data, user_id) => {
  const pool = getPool();
  const conn = await pool.getConnection();

  const { product_id, warehouse_id, actual_quantity, reason } = data;

  try {
    await conn.beginTransaction();

    // 1. Get current system_quantity securely inside transaction
    const [sysQtyRows] = await conn.execute(`
      SELECT quantity AS system_quantity 
      FROM inventory_stock
      WHERE product_id = ? AND warehouse_id = ?
      FOR UPDATE
    `, [product_id, warehouse_id]);
    
    const system_quantity = sysQtyRows.length > 0 ? sysQtyRows[0].system_quantity : 0;
    const quantity_change = actual_quantity - system_quantity;

    // 2. Insert adjustment record
    const [insertRes] = await conn.execute(`
      INSERT INTO stock_adjustments
        (product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id]);

    const adjustment_id = insertRes.insertId;

    // 3. Update inventory_stock
    if (sysQtyRows.length > 0) {
      await conn.execute(`
        UPDATE inventory_stock SET quantity = ?
        WHERE product_id = ? AND warehouse_id = ?
      `, [actual_quantity, product_id, warehouse_id]);
    } else {
      await conn.execute(`
        INSERT INTO inventory_stock (product_id, warehouse_id, quantity)
        VALUES (?, ?, ?)
      `, [product_id, warehouse_id, actual_quantity]);
    }

    // 4. Insert stock_ledger
    if (quantity_change !== 0) {
      await conn.execute(`
        INSERT INTO stock_ledger
          (product_id, warehouse_id, operation_type, quantity_change, reference_id, reference_type, created_by)
        VALUES (?, ?, 'adjustment', ?, ?, 'adjustment', ?)
      `, [product_id, warehouse_id, quantity_change, adjustment_id, user_id]);
    }

    await conn.commit();
    return { id: adjustment_id, product_id, warehouse_id, system_quantity, actual_quantity, quantity_change };
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  getAllAdjustments,
  getSystemQuantity,
  createAdjustment,
};
