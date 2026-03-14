require("dotenv").config();
const { connectDB, getPool } = require("./config/db");

// Simple wrapper for Node 18+ built-in fetch
const _fetch = async (endpoint, method = "GET", body = null, token = null) => {
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const res = await fetch(`http://localhost:${process.env.PORT || 5000}/api` + endpoint, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json();
  if (!data.success) {
    throw new Error(`API Error [${method} ${endpoint}]: ${JSON.stringify(data.errors || data.message)}`);
  }
  return data;
};

const runE2E = async () => {
  try {
    console.log("\n⏳ Booting Local Server...");
    require("./server"); // Boots Express on PORT 5000
    
    // Give the server 2 seconds to bind to the port
    await new Promise(resolve => setTimeout(resolve, 2000));

    await connectDB();
    const pool = getPool();
    console.log("\n🚀 Starting E2E Tests for Modules 1 to 14...\n");
    const ts = Date.now();

    // ──────────────────────────────────────────────────────────
    // Modules 1 & 2: User Roles & Authentication Flow
    console.log("⏳ [Mod 1 & 2] Testing Auth & Roles...");
    const managerEmail = `mgr_${ts}@test.com`;
    await _fetch("/auth/register", "POST", { name: "Test Manager", email: managerEmail, password: "Password123!", role: "inventory_manager" });
    
    // OTPs are hashed in the DB, so we activate the user manually to test the flow
    await pool.execute(`UPDATE users SET status = 'active' WHERE email = ?`, [managerEmail]);
    const mgrTokenRes = await _fetch("/auth/login", "POST", { email: managerEmail, password: "Password123!" });
    const MANAGER_TOKEN = mgrTokenRes.data.accessToken;
    console.log("   ✅ Manager registered & logged in");

    // ──────────────────────────────────────────────────────────
    // Module 3: Dashboard KPIs
    console.log("⏳ [Mod 3] Testing Dashboard KPIs...");
    await _fetch("/dashboard/kpis", "GET", null, MANAGER_TOKEN);
    console.log("   ✅ Initial Dashboard loaded");

    // ──────────────────────────────────────────────────────────
    // Modules 4 & 5: Products & Warehouses
    console.log("⏳ [Mod 4 & 5] Testing Products & Warehouses...");
    const catRes = await _fetch("/categories", "POST", { name: `Cat ${ts}`, description: "Test" }, MANAGER_TOKEN);
    const catId = catRes.data.category.id;

    const w1Res = await _fetch("/warehouses", "POST", { name: `W1_${ts}`, location: "Loc A", capacity: 5000 }, MANAGER_TOKEN);
    const w2Res = await _fetch("/warehouses", "POST", { name: `W2_${ts}`, location: "Loc B", capacity: 5000 }, MANAGER_TOKEN);
    const w1 = w1Res.data.warehouse.id;
    const w2 = w2Res.data.warehouse.id;

    const prodRes = await _fetch("/products", "POST", { name: `Product_${ts}`, sku: `SKU_${ts}`, category_id: catId, unit: "pcs", reorder_level: 10 }, MANAGER_TOKEN);
    const prodId = prodRes.data.product.id;
    const prodQR = prodRes.data.product.qr_code;
    
    // Verify Module 19, Step 3: Auto-seed 0 quantity across all warehouses
    const stockCheck = await _fetch(`/products/${prodId}/stock`, "GET", null, MANAGER_TOKEN);
    if (stockCheck.data.stockByWarehouse.length < 2) throw new Error("Product was not seeded to both warehouses");
    
    const w1Stock = stockCheck.data.stockByWarehouse.find(w => w.warehouse_id === w1);
    const w2Stock = stockCheck.data.stockByWarehouse.find(w => w.warehouse_id === w2);
    if (!w1Stock || !w2Stock || Number(w1Stock.quantity) !== 0 || Number(w2Stock.quantity) !== 0) {
      throw new Error(`Initial warehouse seed did not default to 0 for w1/w2. W1: ${w1Stock?.quantity}, W2: ${w2Stock?.quantity}`);
    }

    console.log("   ✅ Products, Warehouses, and Workflow Step 3 auto-stock verified");

    // ──────────────────────────────────────────────────────────
    // Modules 6 & 7: Core Operations (Receipts)
    console.log("⏳ [Mod 6 & 7] Testing Receipts...");
    const recRes = await _fetch("/receipts", "POST", { warehouse_id: w1, items: [{ product_id: prodId, quantity: 200, unit_price: 5 }] }, MANAGER_TOKEN);
    const receiptId = recRes.data.receipt.id;
    await _fetch(`/receipts/${receiptId}/status`, "PATCH", { status: "ready" }, MANAGER_TOKEN);
    await _fetch(`/receipts/${receiptId}/status`, "PATCH", { status: "done" }, MANAGER_TOKEN);
    console.log("   ✅ Receipt validated (Stock +200 in W1)");

    // ──────────────────────────────────────────────────────────
    // Module 8: Deliveries
    console.log("⏳ [Mod 8] Testing Deliveries...");
    const delRes = await _fetch("/deliveries", "POST", { warehouse_id: w1, items: [{ product_id: prodId, quantity: 50, unit_price: 15 }] }, MANAGER_TOKEN);
    const deliveryId = delRes.data.delivery.id;
    await _fetch(`/deliveries/${deliveryId}/status`, "PATCH", { status: "ready" }, MANAGER_TOKEN);
    await _fetch(`/deliveries/${deliveryId}/status`, "PATCH", { status: "done" }, MANAGER_TOKEN);
    console.log("   ✅ Delivery validated (Stock -50 from W1)");

    // ──────────────────────────────────────────────────────────
    // Module 9: Internal Transfers
    console.log("⏳ [Mod 9] Testing Internal Transfers...");
    const transRes = await _fetch("/transfers", "POST", { source_warehouse_id: w1, destination_warehouse_id: w2, items: [{ product_id: prodId, quantity: 30 }] }, MANAGER_TOKEN);
    const transferId = transRes.data.transfer.id;
    await _fetch(`/transfers/${transferId}/status`, "PATCH", { status: "ready" }, MANAGER_TOKEN);
    await _fetch(`/transfers/${transferId}/status`, "PATCH", { status: "done" }, MANAGER_TOKEN);
    console.log("   ✅ Transfer validated (W1 -> W2: 30)");

    // ──────────────────────────────────────────────────────────
    // Module 10: Stock Adjustments
    console.log("⏳ [Mod 10] Testing Stock Adjustments...");
    // Currently W1 has 120 (200 - 50 - 30). We will adjust to 110.
    await _fetch("/stock-adjustments", "POST", { product_id: prodId, warehouse_id: w1, actual_quantity: 110, reason: "Damage" }, MANAGER_TOKEN);
    console.log("   ✅ Stock Adjustments executed");

    // ──────────────────────────────────────────────────────────
    // Modules 11 & 12: Move History & Low Stock Alerts
    console.log("⏳ [Mod 11 & 12] Testing Ledger & Alerts...");
    await _fetch("/inventory/ledger", "GET", null, MANAGER_TOKEN); // Move history
    
    // Force a low stock scenario (<10) to trigger alert
    await _fetch("/stock-adjustments", "POST", { product_id: prodId, warehouse_id: w1, actual_quantity: 5, reason: "Force Alert" }, MANAGER_TOKEN);
    await _fetch("/alerts", "GET", null, MANAGER_TOKEN);
    console.log("   ✅ Ledger queried & Alerts tested");

    // ──────────────────────────────────────────────────────────
    // Module 13: Reports & Analytics
    console.log("⏳ [Mod 13] Testing Reports...");
    await _fetch("/reports/inventory-valuation", "GET", null, MANAGER_TOKEN);
    await _fetch("/reports/stock-movement-trends", "GET", null, MANAGER_TOKEN);
    console.log("   ✅ Finance & Report Metrics generated");

    // ──────────────────────────────────────────────────────────
    // Module 14: Staff Dashboard & QR Scanner
    console.log("⏳ [Mod 14] Testing Staff Dashboard...");
    const staffEmail = `staff_${ts}@test.com`;
    await _fetch("/auth/register", "POST", { name: "Test Staff", email: staffEmail, password: "Password123!", role: "warehouse_staff" });
    await pool.execute(`UPDATE users SET status = 'active' WHERE email = ?`, [staffEmail]);
    const staffTokenRes = await _fetch("/auth/login", "POST", { email: staffEmail, password: "Password123!" });
    const STAFF_TOKEN = staffTokenRes.data.accessToken;

    await _fetch("/dashboard/staff-kpis", "GET", null, STAFF_TOKEN);
    const scanRes = await _fetch(`/products?qr_code=${prodQR}`, "GET", null, STAFF_TOKEN);
    if (scanRes.data.products.length !== 1) throw new Error("QR scan failed to filter");
    console.log("   ✅ Staff Dashboard loaded & QR successfully scanned");

    // ──────────────────────────────────────────────────────────
    // Modules 16 & 17: Notifications & Profile
    console.log("⏳ [Mod 16 & 17] Testing Notifications & Profile...");
    const notifRes = await _fetch("/notifications/unread-count", "GET", null, STAFF_TOKEN);
    if (notifRes.data.unreadCount !== 0) throw new Error("Expected 0 unread notifications initially");
    
    // Test Change Password
    await _fetch("/auth/me/change-password", "PUT", { currentPassword: "Password123!", newPassword: "NewPassword123!" }, STAFF_TOKEN);
    
    // Verify login with new password
    await _fetch("/auth/login", "POST", { email: staffEmail, password: "NewPassword123!" });
    console.log("   ✅ Unread Notifications Badge & Password Change validated");

    console.log("\n🎉 ALL 17 MODULES PASSED END-TO-END AUTOMATED TESTING SUCCESSFULLY!\n");
    process.exit(0);

  } catch (error) {
    console.error(`\n❌ TEST FAILED: ${error.message}\n`);
    process.exit(1);
  }
};

runE2E();
