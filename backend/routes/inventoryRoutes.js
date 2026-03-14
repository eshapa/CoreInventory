const router = require("express").Router();
const ctrl = require("../controllers/inventoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

const BOTH = ["inventory_manager", "warehouse_staff"];

// GET /api/inventory?warehouseId=X
router.get("/",                    protect, authorize(...BOTH), ctrl.getForWarehouse);
// GET /api/inventory/ledger?productId=&warehouseId=&limit=
router.get("/ledger",              protect, authorize(...BOTH), ctrl.getLedger);
// GET /api/inventory/product/:productId
router.get("/product/:productId",  protect, authorize(...BOTH), ctrl.getForProduct);

module.exports = router;
