const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const userModel = require("../models/userModel");

const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: Boolean(user.is_email_verified),
  isActive: Boolean(user.is_active),
  createdAt: user.created_at,
});

/**
 * @desc    Get current user's profile
 * @route   GET /api/users/profile
 * @access  Private — all authenticated roles
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);
  return sendSuccess(res, { user: safeUser(user) });
});

/**
 * @desc    Update current user's profile (name only)
 * @route   PUT /api/users/profile
 * @access  Private — all authenticated roles
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name || String(name).trim().length < 2) {
    throw new AppError("Name must be at least 2 characters", 422);
  }

  const updated = await userModel.updateUser(req.user.id, {
    name: String(name).trim(),
  });

  return sendSuccess(res, { user: safeUser(updated) }, "Profile updated successfully");
});

module.exports = { getProfile, updateProfile };
