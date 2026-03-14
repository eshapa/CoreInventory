const asyncHandler = require("express-async-handler");
const Joi = require("joi");
const AppError = require("../utils/AppError");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { generateAccessToken, generatePurposeToken, verifyAccessToken } = require("../utils/jwtUtils");
const { generateOTP, getOTPExpiry } = require("../utils/otpUtils");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailUtils");
const userModel = require("../models/userModel");
const roleModel = require("../models/roleModel");
const otpModel  = require("../models/otpModel");

/* ═══════════════════════════════════════════════
   VALIDATION SCHEMAS
   ═══════════════════════════════════════════════ */

const ROLE_NAMES = ["inventory_manager", "warehouse_staff"];

const schemas = {
  register: Joi.object({
    name:     Joi.string().trim().min(2).max(100).required(),
    email:    Joi.string().email().lowercase().trim().required(),
    phone:    Joi.string().trim().max(20).optional().allow("", null),
    password: Joi.string()
      .min(8).max(72)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({ "string.pattern.base": "Password must contain uppercase, lowercase, number and special character." }),
    role: Joi.string().valid(...ROLE_NAMES).required(),
  }),

  login: Joi.object({
    email:    Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),

  verifyEmail: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp:   Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  resendOTP: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    type:  Joi.string().valid("EMAIL_VERIFY", "PASSWORD_RESET").required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
  }),

  verifyResetOTP: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp:   Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  resetPassword: Joi.object({
    resetToken:  Joi.string().required(),
    newPassword: Joi.string()
      .min(8).max(72)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({ "string.pattern.base": "Password must contain uppercase, lowercase, number and special character." }),
  }),

  updateProfile: Joi.object({
    name:  Joi.string().trim().min(2).max(100).optional(),
    phone: Joi.string().trim().max(20).optional().allow("", null),
  }).min(1),
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

const validateBody = (schema, body) => {
  const { error, value } = schema.validate(body, {
    abortEarly: false,
    stripUnknown: true,
    convert: true,
  });
  if (error) {
    const errors = error.details.reduce((acc, d) => {
      acc[d.path.join(".")] = d.message.replace(/"/g, "");
      return acc;
    }, {});
    throw Object.assign(new AppError("Validation failed", 422), { errors });
  }
  return value;
};

/** Safe public user object — never exposes password_hash */
const safeUser = (user) => ({
  id:        user.id,
  name:      user.name,
  email:     user.email,
  phone:     user.phone   || null,
  role_id:   user.role_id,
  role:      user.role_name,           // resolved via JOIN
  status:    user.status,
  createdAt: user.created_at,
});

/* ═══════════════════════════════════════════════
   CONTROLLERS
   ═══════════════════════════════════════════════ */

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = validateBody(schemas.register, req.body);

  // Check duplicate e-mail
  const existing = await userModel.findByEmail(email);
  if (existing) throw new AppError("An account with this email already exists", 409);

  // Resolve role name → role_id
  const roleRecord = await roleModel.findByName(role);
  if (!roleRecord) throw new AppError(`Role '${role}' not found`, 400);

  // Create user (status = 'inactive' until email verified)
  const user = await userModel.createUser({ name, email, phone, password, role_id: roleRecord.id });

  // Send verification OTP
  const otp = generateOTP();
  await otpModel.createOtp(user.id, otp, "EMAIL_VERIFY", getOTPExpiry(10));
  
  // LOG OTP FOR EASY POSTMAN TESTING
  console.log(`\n\n🎯 OTP for ${email}: ${otp}\n\n`);
  
  await sendVerificationEmail(email, otp, name);

  return sendSuccess(
    res,
    { user: safeUser(user) },
    "Account created. Please check your email for the verification code.",
    201
  );
});

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email
 * @access  Public
 */
const verifyEmail = asyncHandler(async (req, res) => {
  const { email, otp } = validateBody(schemas.verifyEmail, req.body);

  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("No account found with this email", 404);

  if (user.status === "active") {
    return sendSuccess(res, null, "Email is already verified. Please log in.");
  }

  const verified = await otpModel.validateAndConsumeOtp(user.id, otp, "EMAIL_VERIFY");
  if (!verified) throw new AppError("Invalid or expired OTP", 400);

  await userModel.activateUser(user.id);

  const accessToken = generateAccessToken({ id: user.id, role_id: user.role_id, role: user.role_name });

  return sendSuccess(
    res,
    { user: { ...safeUser(user), status: "active" }, accessToken },
    "Email verified successfully. You are now logged in."
  );
});

/**
 * @desc    Resend OTP
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email, type } = validateBody(schemas.resendOTP, req.body);

  const user = await userModel.findByEmail(email);
  if (!user) {
    return sendSuccess(res, null, "If this account exists, a new OTP has been sent.");
  }

  if (type === "EMAIL_VERIFY" && user.status === "active") {
    throw new AppError("Email is already verified", 400);
  }

  const otp = generateOTP();
  await otpModel.createOtp(user.id, otp, type, getOTPExpiry(10));

  if (type === "EMAIL_VERIFY") {
    await sendVerificationEmail(email, otp, user.name);
  } else {
    await sendPasswordResetEmail(email, otp, user.name);
  }

  return sendSuccess(res, null, "A new OTP has been sent to your email.");
});

/**
 * @desc    Login
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = validateBody(schemas.login, req.body);

  const user = await userModel.findByEmail(email, true);

  if (!user) throw new AppError("Invalid email or password", 401);

  const isMatch = await userModel.verifyPassword(password, user.password_hash);
  if (!isMatch) throw new AppError("Invalid email or password", 401);

  if (user.status !== "active") {
    throw new AppError(
      user.status === "inactive"
        ? "Please verify your email address before logging in."
        : "Your account has been deactivated. Contact support.",
      403
    );
  }

  const accessToken = generateAccessToken({ id: user.id, role_id: user.role_id, role: user.role_name });

  return sendSuccess(res, { user: safeUser(user), accessToken }, "Login successful");
});

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await userModel.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);
  return sendSuccess(res, { user: safeUser(user) });
});

/**
 * @desc    Update own profile (name, phone)
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const fields = validateBody(schemas.updateProfile, req.body);
  const updated = await userModel.updateUser(req.user.id, fields);
  return sendSuccess(res, { user: safeUser(updated) }, "Profile updated successfully");
});

/**
 * @desc    Change password while authenticated
 * @route   PUT /api/auth/me/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    throw new AppError("currentPassword and newPassword are required", 400);
  }

  // Basic complexity check (should match Joi schema regex later if needed)
  if (newPassword.length < 8) {
    throw new AppError("New password must be at least 8 characters long", 422);
  }

  const user = await userModel.findById(req.user.id);
  if (!user) throw new AppError("User not found", 404);

  // The model method findById does not return password_hash for safety. 
  // We need to fetch the raw record with the password.
  const rawUser = await userModel.findByEmail(user.email, true);

  const isMatch = await userModel.verifyPassword(currentPassword, rawUser.password_hash);
  if (!isMatch) throw new AppError("Incorrect current password", 401);

  await userModel.updatePassword(req.user.id, newPassword);
  return sendSuccess(res, null, "Password changed successfully");
});

/**
 * @desc    Initiate password reset
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = validateBody(schemas.forgotPassword, req.body);
  const user = await userModel.findByEmail(email);

  if (user && user.status === "active") {
    const otp = generateOTP();
    await otpModel.createOtp(user.id, otp, "PASSWORD_RESET", getOTPExpiry(10));
    await sendPasswordResetEmail(email, otp, user.name);
  }

  return sendSuccess(res, null, "If an account with that email exists, a reset code has been sent.");
});

/**
 * @desc    Verify password-reset OTP → issue reset token
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = validateBody(schemas.verifyResetOTP, req.body);

  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("Invalid or expired OTP", 400);

  const verified = await otpModel.validateAndConsumeOtp(user.id, otp, "PASSWORD_RESET");
  if (!verified) throw new AppError("Invalid or expired OTP", 400);

  const resetToken = generatePurposeToken({ id: user.id, purpose: "password_reset" }, "15m");

  return sendSuccess(res, { resetToken }, "OTP verified. Use the resetToken to set your new password.");
});

/**
 * @desc    Reset password using purpose token
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = validateBody(schemas.resetPassword, req.body);

  let decoded;
  try {
    decoded = verifyAccessToken(resetToken);
  } catch {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (decoded.purpose !== "password_reset") throw new AppError("Invalid reset token", 400);

  const user = await userModel.findById(decoded.id);
  if (!user || user.status !== "active") throw new AppError("User not found", 404);

  await userModel.updatePassword(user.id, newPassword);
  await otpModel.deleteOtpsByUser(user.id, "PASSWORD_RESET");

  return sendSuccess(res, null, "Password reset successful. Please log in with your new password.");
});

/**
 * @desc    Logout (stateless)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  return sendSuccess(res, null, "Logged out successfully");
});

module.exports = {
  register, verifyEmail, resendOTP, login,
  getMe, updateMe, changePassword,
  forgotPassword, verifyResetOTP, resetPassword,
  logout,
};
