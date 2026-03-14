const { getPool } = require("../config/db");
const { hashOTP, verifyOTP } = require("../utils/otpUtils");

/**
 * Persist a new OTP record. Any previous OTPs of the same type
 * for the same user are invalidated first.
 *
 * @param {number} userId
 * @param {string} plainOTP   Generated OTP (will be hashed here)
 * @param {"EMAIL_VERIFY"|"PASSWORD_RESET"} type
 * @param {Date}   expiresAt
 */
const createOtp = async (userId, plainOTP, type, expiresAt) => {
  const pool = getPool();

  // Invalidate all previous un-used OTPs of the same type for this user
  await pool.execute(
    `UPDATE otps SET used = 1
      WHERE user_id = ? AND type = ? AND used = 0`,
    [userId, type]
  );

  const otp_hash = await hashOTP(plainOTP);

  // Format Date → MySQL DATETIME string (UTC)
  const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace("T", " ");

  await pool.execute(
    `INSERT INTO otps (user_id, otp_hash, type, expires_at)
     VALUES (?, ?, ?, ?)`,
    [userId, otp_hash, type, expiresAtStr]
  );
};

/**
 * Find the latest valid (unused, non-expired) OTP for a user.
 *
 * @param {number} userId
 * @param {"EMAIL_VERIFY"|"PASSWORD_RESET"} type
 * @returns {Promise<{ id: number, otp_hash: string } | null>}
 */
const findValidOtp = async (userId, type) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, otp_hash FROM otps
      WHERE user_id   = ?
        AND type      = ?
        AND used      = 0
        AND expires_at > NOW()
      ORDER BY created_at DESC
      LIMIT 1`,
    [userId, type]
  );
  return rows[0] || null;
};

/**
 * Mark an OTP record as used.
 * @param {number} otpId
 */
const markOtpUsed = async (otpId) => {
  const pool = getPool();
  await pool.execute(`UPDATE otps SET used = 1 WHERE id = ?`, [otpId]);
};

/**
 * Delete all OTPs for a user (cleanup after successful password reset).
 * @param {number} userId
 * @param {"EMAIL_VERIFY"|"PASSWORD_RESET"} type
 */
const deleteOtpsByUser = async (userId, type) => {
  const pool = getPool();
  await pool.execute(
    `DELETE FROM otps WHERE user_id = ? AND type = ?`,
    [userId, type]
  );
};

/**
 * Convenience: verify a submitted OTP against the latest valid record.
 * Returns the OTP row if valid, null otherwise.
 *
 * @param {number} userId
 * @param {string} submittedOTP  Plain-text OTP from user
 * @param {"EMAIL_VERIFY"|"PASSWORD_RESET"} type
 * @returns {Promise<{ id: number } | null>}
 */
const validateAndConsumeOtp = async (userId, submittedOTP, type) => {
  const record = await findValidOtp(userId, type);
  if (!record) return null;

  const isMatch = await verifyOTP(submittedOTP, record.otp_hash);
  if (!isMatch) return null;

  await markOtpUsed(record.id);
  return record;
};

module.exports = {
  createOtp,
  findValidOtp,
  markOtpUsed,
  deleteOtpsByUser,
  validateAndConsumeOtp,
};
