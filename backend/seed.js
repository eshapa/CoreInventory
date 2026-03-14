require("dotenv").config();
const { connectDB, getPool } = require("./config/db");

const seedData = async () => {
  try {
    await connectDB();
    const pool = getPool();

    console.log("Seeding test data...");

    // 1. Create a Category
    const [cat] = await pool.execute(
      `INSERT INTO categories (name, description) VALUES ('Electronics', 'Electronic devices and parts')`
    );
    const catId = cat.insertId;

    // 2. Create Warehouses
    const [w1] = await pool.execute(`INSERT INTO warehouses (name, location, capacity) VALUES ('Main Hub', 'City Center', 10000)`);
    const [w2] = await pool.execute(`INSERT INTO warehouses (name, location, capacity) VALUES ('Overflow Site', 'Industrial Park', 5000)`);
    const [w3] = await pool.execute(`INSERT INTO warehouses (name, location, capacity) VALUES ('Empty Demo', 'Outskirts', 2000)`);
    
    // 3. Create a Product
    const [prod] = await pool.execute(
      `INSERT INTO products (name, sku, category_id, description, unit, reorder_level, qr_code)
       VALUES ('Laptop Pro 14', 'PRD-LPT01', ?, '14 inch premium laptop', 'units', 10, 'CINV-PRD-LPT01')`,
      [catId]
    );

    // 4. Put 50 Laptops strictly into 'Main Hub' (Warehouse 1)
    await pool.execute(
      `INSERT INTO inventory_stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)`,
      [prod.insertId, w1.insertId, 50]
    );

    console.log("✅ Seeding Complete!");
    console.log(`- Warehouses created: IDs ${w1.insertId}, ${w2.insertId}, ${w3.insertId}`);
    console.log(`- Note: Warehouse ${w1.insertId} currently holds 50 Laptops.`);
    console.log(`- Note: Warehouse ${w3.insertId} is completely empty.`);
    
    process.exit(0);
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  }
};

seedData();
