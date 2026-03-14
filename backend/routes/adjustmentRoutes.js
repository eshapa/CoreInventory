const express = require("express");
const router = express.Router();

const {
  getAdjustments,
  getSystemQuantity,
  createAdjustment,
} = require("../controllers/adjustmentController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/", getAdjustments);
router.get("/system-quantity", getSystemQuantity);
router.post("/", createAdjustment);

module.exports = router;
