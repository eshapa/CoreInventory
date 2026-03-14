const { verifyAccessToken } = require("../utils/jwtUtils");
const { findById } = require("../models/userModel");
const AppError = require("../utils/AppError");
const asyncHandler = require("express-async-handler");

/**
 * protect — verifies the Bearer JWT and attaches the user to req.user.
 */
const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new AppError("Not authorised — no token provided", 401);
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyAccessToken(token);

  const user = await findById(decoded.id);

  if (!user) {
    throw new AppError("User associated with this token no longer exists", 401);
  }

  if (user.status !== "active") {
    throw new AppError("Your account is not active. Contact support.", 403);
  }

  req.user = user; // includes role_id, role_name from JOIN
  next();
});

/**
 * authorize — role-based guard factory.
 * Must be chained AFTER protect.
 *
 * @param {...string} roles  Allowed role names e.g. 'inventory_manager'
 *
 * @example
 *   router.get('/reports', protect, authorize('inventory_manager'), handler);
 */
const authorize = (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role_name)) {
      throw new AppError(
        `Access denied — requires one of: ${roles.join(", ")}`,
        403
      );
    }
    next();
  };

module.exports = { protect, authorize };
