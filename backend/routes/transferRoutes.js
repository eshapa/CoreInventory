const express = require("express");
const router = express.Router();

const {
  getTransfers,
  getTransferDetails,
  createTransfer,
  updateTransferStatus,
} = require("../controllers/transferController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect); // All transfer routes are protected

router.get("/", getTransfers);
router.get("/:id", getTransferDetails);
router.post("/", createTransfer);
router.put("/:id/status", updateTransferStatus);

module.exports = router;
