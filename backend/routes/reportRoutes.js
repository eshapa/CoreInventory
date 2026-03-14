const router = require("express").Router();
const ctrl = require("../controllers/reportController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";

// ─── Reports (Manager only) ─────────────────────────
router.get("/inventory-valuation",           protect, authorize(MANAGER), ctrl.getInventoryValuation);
router.get("/stock-movement-trends",         protect, authorize(MANAGER), ctrl.getStockMovementTrends);
router.get("/top-products",                  protect, authorize(MANAGER), ctrl.getTopUsedProducts);
router.get("/warehouse-utilisation",         protect, authorize(MANAGER), ctrl.getWarehouseUtilisation);

// ─── Charts (Manager only) ──────────────────────────
router.get("/charts/monthly-stock-flow",     protect, authorize(MANAGER), ctrl.getMonthlyStockFlow);
router.get("/charts/category-distribution",  protect, authorize(MANAGER), ctrl.getCategoryDistribution);
router.get("/charts/warehouse-usage",        protect, authorize(MANAGER), ctrl.getWarehouseUsage);

module.exports = router;
