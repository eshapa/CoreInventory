const router = require("express").Router();
const ctrl = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

const BOTH = ["inventory_manager", "warehouse_staff"];

// Stock levels
router.get("/",                    protect, authorize(...BOTH), ctrl.getForWarehouse);       // ?warehouseId=
router.get("/product/:productId",  protect, authorize(...BOTH), ctrl.getForProduct);

// Move History (Stock Ledger)
router.get("/ledger",              protect, authorize(...BOTH), ctrl.getLedger);              // ?productId=&warehouseId=&operationType=&startDate=&endDate=&search=&limit=
router.get("/ledger/summary",      protect, authorize(...BOTH), ctrl.getLedgerSummary);       // ?warehouseId=&startDate=&endDate=

module.exports = router;
