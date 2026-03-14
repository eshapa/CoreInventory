const router = require("express").Router();
const ctrl = require("../controllers/stockAdjustmentController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";

router.get ("/"   , protect, authorize(MANAGER), ctrl.getAll);
router.get ("/:id", protect, authorize(MANAGER), ctrl.getOne);
router.post("/"   , protect, authorize(MANAGER), ctrl.create);

module.exports = router;
