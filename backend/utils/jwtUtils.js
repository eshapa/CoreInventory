const jwt = require("jsonwebtoken");
const AppError = require("./AppError");

/**
 * Generate an access token (short-lived).
 * @param {{ id: number, role: string }} payload
 * @returns {string} signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "15m",
  });
};

/**
 * Generate a refresh token (long-lived).
 * Stored on the client (httpOnly cookie in production).
 * @param {{ id: number }} payload
 * @returns {string} signed JWT
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || "7d",
  });
};

/**
 * Generate a short-lived, single-purpose token (e.g. for password reset).
 * @param {{ id: number, purpose: string }} payload
 * @param {string} [expiresIn="15m"]
 * @returns {string}
 */
const generatePurposeToken = (payload, expiresIn = "15m") => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify a JWT signed with JWT_SECRET.
 * Throws AppError(401) on failure.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new AppError("Token has expired", 401);
    }
    throw new AppError("Invalid token", 401);
  }
};

/**
 * Verify a refresh token signed with JWT_REFRESH_SECRET.
 * @param {string} token
 * @returns {object} decoded payload
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch {
    throw new AppError("Invalid or expired refresh token", 401);
  }
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generatePurposeToken,
  verifyAccessToken,
  verifyRefreshToken,
};
