const express = require("express");
const router = express.Router();

const { getProfile, updateProfile } = require("../controllers/userController");
const { protect, authorize } = require("../middleware/authMiddleware");

/* ──────────────────────────────────────────────
   All routes below require authentication
────────────────────────────────────────────── */

// Profile — accessible by both roles
router.get("/profile",  protect, getProfile);
router.put("/profile",  protect, updateProfile);

/* ──────────────────────────────────────────────
   ROLE-SPECIFIC EXAMPLE STUBS
   (wire real controllers as the system grows)
────────────────────────────────────────────── */

// Inventory Manager only
router.get(
  "/dashboard",
  protect,
  authorize("inventory_manager"),
  (req, res) =>
    res.json({
      success: true,
      message: "Dashboard — Inventory Manager only",
      user: { id: req.user.id, role: req.user.role },
    })
);

// Warehouse Staff — operational routes
router.get(
  "/operations",
  protect,
  authorize("warehouse_staff"),
  (req, res) =>
    res.json({
      success: true,
      message: "Operations — Warehouse Staff only",
      user: { id: req.user.id, role: req.user.role },
    })
);

// Both roles can access this
router.get(
  "/shared",
  protect,
  authorize("inventory_manager", "warehouse_staff"),
  (req, res) =>
    res.json({
      success: true,
      message: "Shared route — both roles allowed",
      user: { id: req.user.id, role: req.user.role },
    })
);

module.exports = router;
