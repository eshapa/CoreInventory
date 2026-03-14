const router = require("express").Router();
const ctrl = require("../controllers/stockAdjustmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";
const BOTH    = [MANAGER, "warehouse_staff"];

router.get ("/system-quantity", protect, authorize(...BOTH), ctrl.getSystemQuantity);   // pre-fill helper
router.get ("/"               , protect, authorize(MANAGER), ctrl.getAll);
router.get ("/:id"            , protect, authorize(MANAGER), ctrl.getOne);
router.post("/"               , protect, authorize(MANAGER), ctrl.create);

module.exports = router;
