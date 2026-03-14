const router = require("express").Router();
const ctrl   = require("../controllers/qrController");
const { protect, authorize } = require("../middleware/authMiddleware");

const BOTH = ["inventory_manager", "warehouse_staff"];

// ─── QR Scanner ───────────────────────────────────────────────────────────────

/**
 * POST /api/qr/scan
 * Scan a QR code and retrieve full product + stock information.
 * Body: { qr_code: "CINV-SKU123" }
 * Access: manager + staff
 */
router.post("/scan", protect, authorize(...BOTH), ctrl.scan);

/**
 * GET /api/qr/generate?sku=ABC123
 * Generate (preview) the canonical QR code value for a given SKU.
 * Access: manager + staff
 */
router.get("/generate", protect, authorize(...BOTH), ctrl.generateQrValue);

module.exports = router;
