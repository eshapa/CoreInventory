const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const OTP_LENGTH = 6;
const BCRYPT_ROUNDS = 10;

/**
 * Generate a cryptographically secure numeric OTP.
 * @returns {string} 6-digit zero-padded string
 */
const generateOTP = () => {
  const max = Math.pow(10, OTP_LENGTH);
  const raw = crypto.randomInt(0, max);
  return String(raw).padStart(OTP_LENGTH, "0");
};

/**
 * Hash an OTP for safe storage using bcrypt.
 * @param {string} otp  Plain-text OTP
 * @returns {Promise<string>} bcrypt hash
 */
const hashOTP = async (otp) => {
  return bcrypt.hash(otp, BCRYPT_ROUNDS);
};

/**
 * Compare a plain-text OTP against a stored bcrypt hash.
 * @param {string} otp       Plain-text OTP
 * @param {string} otpHash   Stored bcrypt hash
 * @returns {Promise<boolean>}
 */
const verifyOTP = async (otp, otpHash) => {
  return bcrypt.compare(otp, otpHash);
};

/**
 * Calculate OTP expiry datetime (UTC).
 * @param {number} [minutes=10]
 * @returns {Date}
 */
const getOTPExpiry = (minutes = 10) => {
  return new Date(Date.now() + minutes * 60 * 1000);
};

module.exports = { generateOTP, hashOTP, verifyOTP, getOTPExpiry };
