const router = require("express").Router();
const ctrl = require("../controllers/alertController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";
const BOTH    = [MANAGER, "warehouse_staff"];

router.get  ("/",            protect, authorize(...BOTH), ctrl.getAll);
router.get  ("/:id",         protect, authorize(...BOTH), ctrl.getOne);
router.patch("/:id/resolve", protect, authorize(MANAGER), ctrl.resolve);

module.exports = router;
