const router = require("express").Router();
const ctrl = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/authMiddleware");

const BOTH = ["inventory_manager", "warehouse_staff"];

// KPI Cards
router.get("/kpis",       protect, authorize(...BOTH), ctrl.getKPIs);
router.get("/staff-kpis", protect, authorize(...BOTH), ctrl.getStaffKPIs);
router.get("/low-stock",  protect, authorize(...BOTH), ctrl.getLowStock);

// Charts
router.get("/charts/stock-movement",           protect, authorize(...BOTH), ctrl.getStockMovement);
router.get("/charts/category-distribution",    protect, authorize(...BOTH), ctrl.getCategoryDistribution);
router.get("/charts/warehouse-distribution",   protect, authorize(...BOTH), ctrl.getWarehouseDistribution);

// Documents (filtered view & counts)
router.get("/documents/counts", protect, authorize(...BOTH), ctrl.getDocumentCounts);
router.get("/documents",        protect, authorize(...BOTH), ctrl.getFilteredDocuments);

module.exports = router;
