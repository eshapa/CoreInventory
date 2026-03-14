const asyncHandler = require("express-async-handler");
const Joi = require("joi");
const AppError = require("../utils/AppError");
const { sendSuccess, sendError } = require("../utils/responseUtils");
const { generateAccessToken, generatePurposeToken, verifyAccessToken } = require("../utils/jwtUtils");
const { generateOTP, getOTPExpiry } = require("../utils/otpUtils");
const { sendVerificationEmail, sendPasswordResetEmail } = require("../utils/emailUtils");
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");

/* ═══════════════════════════════════════════════
   VALIDATION SCHEMAS
   ═══════════════════════════════════════════════ */

const ROLES = ["inventory_manager", "warehouse_staff"];

const schemas = {
  register: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string()
      .min(8)
      .max(72)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain uppercase, lowercase, number and special character.",
      }),
    role: Joi.string().valid(...ROLES).required(),
  }),

  login: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    password: Joi.string().required(),
  }),

  verifyEmail: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  resendOTP: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    type: Joi.string().valid("EMAIL_VERIFY", "PASSWORD_RESET").required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
  }),

  verifyResetOTP: Joi.object({
    email: Joi.string().email().lowercase().trim().required(),
    otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  }),

  resetPassword: Joi.object({
    resetToken: Joi.string().required(),
    newPassword: Joi.string()
      .min(8)
      .max(72)
      .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
      .required()
      .messages({
        "string.pattern.base":
          "Password must contain uppercase, lowercase, number and special character.",
      }),
  }),

  updateProfile: Joi.object({
    name: Joi.string().trim().min(2).max(100).required(),
  }),
};

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

/** Validate req.body inline and throw 422 on failure */
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

/** Safe user object — strips internal fields */
const safeUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  isEmailVerified: Boolean(user.is_email_verified),
  isActive: Boolean(user.is_active),
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
  const { name, email, password, role } = validateBody(schemas.register, req.body);

  // Duplicate check
  const existing = await userModel.findByEmail(email);
  if (existing) throw new AppError("An account with this email already exists", 409);

  // Create user
  const user = await userModel.createUser({ name, email, password, role });

  // Send verification OTP
  const otp = generateOTP();
  await otpModel.createOtp(user.id, otp, "EMAIL_VERIFY", getOTPExpiry(10));
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

  if (user.is_email_verified) {
    return sendSuccess(res, null, "Email is already verified. Please log in.");
  }

  const verified = await otpModel.validateAndConsumeOtp(user.id, otp, "EMAIL_VERIFY");
  if (!verified) throw new AppError("Invalid or expired OTP", 400);

  await userModel.setEmailVerified(user.id);

  const accessToken = generateAccessToken({ id: user.id, role: user.role });

  return sendSuccess(
    res,
    { user: { ...safeUser(user), isEmailVerified: true }, accessToken },
    "Email verified successfully. You are now logged in."
  );
});

/**
 * @desc    Resend OTP (verification or password reset)
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email, type } = validateBody(schemas.resendOTP, req.body);

  const user = await userModel.findByEmail(email);
  // Always respond the same way to prevent user enumeration
  if (!user || !user.is_active) {
    return sendSuccess(res, null, "If this account exists, a new OTP has been sent.");
  }

  if (type === "EMAIL_VERIFY" && user.is_email_verified) {
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
 * @desc    Login with email and password
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = validateBody(schemas.login, req.body);

  // Fetch with password_hash
  const user = await userModel.findByEmail(email, true);

  // Generic message to prevent user enumeration
  if (!user || !user.is_active) {
    throw new AppError("Invalid email or password", 401);
  }

  const isMatch = await userModel.verifyPassword(password, user.password_hash);
  if (!isMatch) throw new AppError("Invalid email or password", 401);

  if (!user.is_email_verified) {
    throw new AppError(
      "Please verify your email address before logging in.",
      403
    );
  }

  const accessToken = generateAccessToken({ id: user.id, role: user.role });

  return sendSuccess(
    res,
    { user: safeUser(user), accessToken },
    "Login successful"
  );
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
 * @desc    Update own profile
 * @route   PUT /api/auth/me
 * @access  Private
 */
const updateMe = asyncHandler(async (req, res) => {
  const { name } = validateBody(schemas.updateProfile, req.body);
  const updated = await userModel.updateUser(req.user.id, { name });
  return sendSuccess(res, { user: safeUser(updated) }, "Profile updated successfully");
});

/**
 * @desc    Initiate password reset — send OTP email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = validateBody(schemas.forgotPassword, req.body);

  const user = await userModel.findByEmail(email);

  // Always return same response — prevents user enumeration
  if (user && user.is_active && user.is_email_verified) {
    const otp = generateOTP();
    await otpModel.createOtp(user.id, otp, "PASSWORD_RESET", getOTPExpiry(10));
    await sendPasswordResetEmail(email, otp, user.name);
  }

  return sendSuccess(
    res,
    null,
    "If an account with that email exists, a reset code has been sent."
  );
});

/**
 * @desc    Verify password-reset OTP — returns a short-lived reset token
 * @route   POST /api/auth/verify-reset-otp
 * @access  Public
 */
const verifyResetOTP = asyncHandler(async (req, res) => {
  const { email, otp } = validateBody(schemas.verifyResetOTP, req.body);

  const user = await userModel.findByEmail(email);
  if (!user) throw new AppError("Invalid or expired OTP", 400);

  const verified = await otpModel.validateAndConsumeOtp(user.id, otp, "PASSWORD_RESET");
  if (!verified) throw new AppError("Invalid or expired OTP", 400);

  // Issue short-lived purpose token (15 min) so the reset step is separate
  const resetToken = generatePurposeToken(
    { id: user.id, purpose: "password_reset" },
    "15m"
  );

  return sendSuccess(
    res,
    { resetToken },
    "OTP verified. Use the resetToken to set your new password."
  );
});

/**
 * @desc    Reset password using the purpose token from verifyResetOTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { resetToken, newPassword } = validateBody(schemas.resetPassword, req.body);

  // Decode & verify the purpose token
  let decoded;
  try {
    decoded = verifyAccessToken(resetToken);
  } catch {
    throw new AppError("Invalid or expired reset token", 400);
  }

  if (decoded.purpose !== "password_reset") {
    throw new AppError("Invalid reset token", 400);
  }

  const user = await userModel.findById(decoded.id);
  if (!user || !user.is_active) throw new AppError("User not found", 404);

  await userModel.updatePassword(user.id, newPassword);
  // Clean up any remaining OTPs
  await otpModel.deleteOtpsByUser(user.id, "PASSWORD_RESET");

  return sendSuccess(res, null, "Password reset successful. Please log in with your new password.");
});

/**
 * @desc    Logout (stateless — client discards token; server responds 200)
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  // For stateless JWT, logout is handled client-side.
  // If you add refresh tokens / token blacklist, revoke here.
  return sendSuccess(res, null, "Logged out successfully");
});

module.exports = {
  register,
  verifyEmail,
  resendOTP,
  login,
  getMe,
  updateMe,
  forgotPassword,
  verifyResetOTP,
  resetPassword,
  logout,
};
