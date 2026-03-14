const rateLimit = require("express-rate-limit");
const { sendError } = require("../utils/responseUtils");

/**
 * Generic limiter factory.
 * @param {number} max           Max requests per window
 * @param {number} windowMs      Window in milliseconds
 * @param {string} message       Error message shown to client
 */
const createLimiter = (max, windowMs, message) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,   // Return RateLimit-* headers (RFC 6585)
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    handler: (req, res) => sendError(res, message, 429),
    keyGenerator: (req) =>
      req.headers["x-forwarded-for"]?.split(",")[0].trim() || req.ip,
  });

/**
 * Auth limiter — applied to login & register.
 * Max 10 attempts per 15 minutes per IP.
 */
const authLimiter = createLimiter(
  10,
  15 * 60 * 1000,
  "Too many attempts. Please try again in 15 minutes."
);

/**
 * OTP limiter — applied to OTP send/resend endpoints.
 * Max 3 OTP requests per 10 minutes per IP.
 */
const otpLimiter = createLimiter(
  3,
  10 * 60 * 1000,
  "Too many OTP requests. Please try again in 10 minutes."
);

/**
 * Password reset limiter — applied to forgot-password endpoint.
 * Max 5 attempts per 30 minutes per IP.
 */
const resetLimiter = createLimiter(
  5,
  30 * 60 * 1000,
  "Too many password reset attempts. Please try again in 30 minutes."
);

module.exports = { authLimiter, otpLimiter, resetLimiter };
