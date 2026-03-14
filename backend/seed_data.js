require('dotenv').config();
const db=require('./config/db');
db.connectDB().then(async ()=>{
  const c=await db.getPool().getConnection();
  await c.execute('DELETE FROM transfer_items;');
  await c.execute('DELETE FROM transfers;');
  await c.execute('DELETE FROM stock_adjustments;');
  
  await c.execute(
    `INSERT INTO transfers (source_warehouse_id, destination_warehouse_id, status, notes, created_by) VALUES 
    (1, 2, 'done', 'Stock balancing', 1), 
    (3, 1, 'draft', 'Return from overflow', 1), 
    (2, 3, 'done', 'Forward stock', 1);`
  );
  
  const [tres]=await c.execute('SELECT id FROM transfers ORDER BY id ASC LIMIT 3');
  await c.execute('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, 1, 50), (?, 2, 5)', [tres[0].id, tres[0].id]);
  await c.execute('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, 1, 100)', [tres[1].id]);
  await c.execute('INSERT INTO transfer_items (transfer_id, product_id, quantity) VALUES (?, 2, 20)', [tres[2].id]);
  
  await c.execute(
    `INSERT INTO stock_adjustments (product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id) VALUES 
    (1, 1, 500, 498, 'Damage', 1), 
    (2, 2, 50, 52, 'Found in back', 1), 
    (1, 3, 200, 195, 'Miscount', 1);`
  );
  
  c.release();
  console.log('✅ Seeded transfers and adjustments');
  process.exit(0);
}).catch(console.error);
