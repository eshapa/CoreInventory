const { getPool } = require("../config/db");
const bcrypt = require("bcryptjs");

const BCRYPT_ROUNDS = 12;

/**
 * Create a new user in the database.
 * Password is bcrypt-hashed here so the controller stays lean.
 *
 * @param {{ name: string, email: string, password: string, role: string }} data
 * @returns {Promise<{ id: number, name: string, email: string, role: string }>}
 */
const createUser = async ({ name, email, password, role }) => {
  const pool = getPool();
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const [result] = await pool.execute(
    `INSERT INTO users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email.toLowerCase().trim(), password_hash, role]
  );

  return findById(result.insertId);
};

/**
 * Find a user by email address.
 * @param {string} email
 * @param {boolean} [withPassword=false]  Include password_hash in result
 */
const findByEmail = async (email, withPassword = false) => {
  const pool = getPool();
  const columns = withPassword
    ? "id, name, email, password_hash, role, is_active, is_email_verified, created_at, updated_at"
    : "id, name, email, role, is_active, is_email_verified, created_at, updated_at";

  const [rows] = await pool.execute(
    `SELECT ${columns} FROM users WHERE email = ? LIMIT 1`,
    [email.toLowerCase().trim()]
  );
  return rows[0] || null;
};

/**
 * Find a user by primary key.
 * @param {number} id
 */
const findById = async (id) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT id, name, email, role, is_active, is_email_verified, created_at, updated_at
     FROM users WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

/**
 * Mark user's email as verified.
 * @param {number} userId
 */
const setEmailVerified = async (userId) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE users SET is_email_verified = 1 WHERE id = ?`,
    [userId]
  );
};

/**
 * Update user profile fields (name only for now; extend as needed).
 * @param {number} id
 * @param {{ name?: string }} fields
 * @returns {Promise<object>} Updated user
 */
const updateUser = async (id, fields) => {
  const pool = getPool();
  const allowed = ["name"];
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
 * Set a new password for a user (hashes the plain-text password).
 * @param {number} userId
 * @param {string} newPassword  Plain-text password
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
 * Compare a plain-text password against the stored hash.
 * @param {string} plainPassword
 * @param {string} storedHash
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (plainPassword, storedHash) => {
  return bcrypt.compare(plainPassword, storedHash);
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  setEmailVerified,
  updateUser,
  updatePassword,
  verifyPassword,
};
