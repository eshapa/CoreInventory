const { getPool } = require("../config/db");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 12;

/* ─── SQL helpers ──────────────────────────────────────────── */

/** Columns returned for every public query (JOIN on roles) */
const PUBLIC_COLS = `
  u.id, u.name, u.email, u.phone,
  u.role_id, r.name AS role_name,
  u.status, u.created_at, u.updated_at`;

const BASE_JOIN = `FROM users u JOIN roles r ON u.role_id = r.id`;

/* ─── Model functions ──────────────────────────────────────── */

/**
 * Create a new user. Password is hashed here.
 * New accounts start as 'inactive' until email is verified.
 *
 * @param {{ name, email, password, role_id, phone? }} data
 * @returns {Promise<object>} Created user (safe shape, no password_hash)
 */
const createUser = async ({ name, email, password, role_id, phone = null }) => {
  const pool = getPool();
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, role_id, phone, status)
     VALUES (?, ?, ?, ?, ?, 'inactive')`,
    [name, email.toLowerCase().trim(), password_hash, role_id, phone]
  );

  return findById(result.insertId);
};

/**
 * Find a user by email, optionally include password_hash.
 * Always JOINs roles table.
 */
const findByEmail = async (email, withPassword = false) => {
  const pool = getPool();
  const extra = withPassword ? ", u.password_hash" : "";

  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLS}${extra} ${BASE_JOIN}
     WHERE u.email = ? LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
};

/**
 * Find a user by primary key.
 */
const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT ${PUBLIC_COLS} ${BASE_JOIN} WHERE u.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Activate a user's account (called after successful OTP verification).
 * Equivalent to the old setEmailVerified — flips status → 'active'.
 */
const activateUser = async (userId) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE users SET status = 'active' WHERE id = ?`,
    [userId]
  );
};

/**
 * Update profile fields.
 * Allowed: name, phone.
 */
const updateUser = async (id, fields) => {
  const pool = getPool();
  const allowed = ["name", "phone"];
  const updates = [];
  const values = [];

  for (const key of allowed) {
    if (fields[key] !== undefined) {
      updates.push(`${key} = ?`);
      values.push(fields[key]);
    }
  }

  if (updates.length === 0) throw new Error("No valid fields to update");

  values.push(id);
  await pool.execute(
    `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
    values
  );
  return findById(id);
};

/**
 * Set a new hashed password.
 */
const updatePassword = async (userId, newPassword) => {
  const pool = getPool();
  const password_hash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
  await pool.execute(
    `UPDATE users SET password_hash = ? WHERE id = ?`,
    [password_hash, userId]
  );
};

/**
 * Compare a plain password against the stored bcrypt hash.
 */
const verifyPassword = async (plainPassword, storedHash) => {
  return bcrypt.compare(plainPassword, storedHash);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  activateUser,
  updateUser,
  updatePassword,
  verifyPassword,
};
