const router = require("express").Router();
const ctrl = require("../controllers/categoryController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";
const BOTH    = [MANAGER, "warehouse_staff"];

router.get   ("/",    protect, authorize(...BOTH), ctrl.getAll);
router.get   ("/:id", protect, authorize(...BOTH), ctrl.getOne);
router.post  ("/",    protect, authorize(MANAGER), ctrl.create);
router.put   ("/:id", protect, authorize(MANAGER), ctrl.update);
router.delete("/:id", protect, authorize(MANAGER), ctrl.remove);

module.exports = router;
