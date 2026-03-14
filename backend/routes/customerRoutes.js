const router = require("express").Router();
const ctrl = require("../controllers/customerController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";

router.get   ("/",    protect, authorize(MANAGER), ctrl.getAll);
router.get   ("/:id", protect, authorize(MANAGER), ctrl.getOne);
router.post  ("/",    protect, authorize(MANAGER), ctrl.create);
router.put   ("/:id", protect, authorize(MANAGER), ctrl.update);
router.delete("/:id", protect, authorize(MANAGER), ctrl.remove);

module.exports = router;
