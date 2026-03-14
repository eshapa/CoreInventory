const router = require("express").Router();
const ctrl = require("../controllers/transferController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";
const BOTH    = [MANAGER, "warehouse_staff"];

// ─── List & Detail ───────────────────────────────────
router.get  ("/",                       protect, authorize(...BOTH), ctrl.getAll);
router.get  ("/:id",                    protect, authorize(...BOTH), ctrl.getOne);

// ─── Create & Edit (Manager only) ────────────────────
router.post ("/",                       protect, authorize(MANAGER), ctrl.create);
router.put  ("/:id",                    protect, authorize(MANAGER), ctrl.update);
router.patch("/:id/status",             protect, authorize(MANAGER), ctrl.updateStatus);

// ─── Line Items (Manager, draft only) ────────────────
router.post  ("/:id/items",             protect, authorize(MANAGER), ctrl.addItems);
router.put   ("/:id/items/:itemId",     protect, authorize(MANAGER), ctrl.updateItem);
router.delete("/:id/items/:itemId",     protect, authorize(MANAGER), ctrl.removeItem);

module.exports = router;
