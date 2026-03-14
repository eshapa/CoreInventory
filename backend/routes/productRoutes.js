const router = require("express").Router();
const ctrl = require("../controllers/productController");
const { protect, authorize } = require("../middleware/authMiddleware");

const MANAGER = "inventory_manager";
const BOTH    = [MANAGER, "warehouse_staff"];

// ─── Read ────────────────────────────────────────────────
router.get   ("/",              protect, authorize(...BOTH), ctrl.getAll);          // ?categoryId=&search=
router.get   ("/sku/:sku",      protect, authorize(...BOTH), ctrl.getBySku);
router.get   ("/:id",           protect, authorize(...BOTH), ctrl.getOne);
router.get   ("/:id/stock",     protect, authorize(...BOTH), ctrl.getStockAvailability);

// ─── Write (Manager only) ────────────────────────────────
router.post  ("/",              protect, authorize(MANAGER), ctrl.create);
router.put   ("/:id",           protect, authorize(MANAGER), ctrl.update);
router.delete("/:id",           protect, authorize(MANAGER), ctrl.remove);
router.patch ("/:id/qr-code",   protect, authorize(MANAGER), ctrl.generateQrCode);

module.exports = router;
