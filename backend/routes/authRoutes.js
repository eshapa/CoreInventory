const express = require("express");
const router = express.Router();

const {
  register,
  verifyEmail,
  resendOTP,
  login,
  getMe,
  updateMe,
  changePassword,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  logout,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { authLimiter, otpLimiter, resetLimiter } = require("../middleware/rateLimiter");

/* ──────────────────────────────────────────────
   PUBLIC ROUTES
────────────────────────────────────────────── */

// Registration & Email Verification
router.post("/register",        authLimiter,  register);
router.post("/verify-email",    otpLimiter,   verifyEmail);
router.post("/resend-otp",      otpLimiter,   resendOTP);

// Login
router.post("/login",           authLimiter,  login);

// Password Reset Flow
router.post("/forgot-password", resetLimiter, forgotPassword);
router.post("/verify-reset-otp",resetLimiter, verifyResetOTP);
router.post("/reset-password",  resetLimiter, resetPassword);

/* ──────────────────────────────────────────────
   PROTECTED ROUTES (require valid JWT)
────────────────────────────────────────────── */

router.get ("/me",                 protect, getMe);
router.put ("/me",                 protect, updateMe);
router.put ("/me/change-password", protect, changePassword);
router.post("/logout",             protect, logout);

module.exports = router;
