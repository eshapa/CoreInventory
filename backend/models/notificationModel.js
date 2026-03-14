const { getPool } = require("../config/db");

const getForUser = async (userId) => {
  const pool = getPool();
  const [rows] = await pool.execute(
    `SELECT n.*, a.alert_type
     FROM notifications n
     LEFT JOIN alerts a ON n.alert_id = a.id
     WHERE n.user_id = ?
     ORDER BY n.created_at DESC`,
    [userId]
  );
  return rows;
};

const getUnreadCount = async (userId) => {
  const pool = getPool();
  const [[row]] = await pool.execute(
    `SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0`,
    [userId]
  );
  return Number(row.count);
};

const markRead = async (id, userId) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
};

const markAllRead = async (userId) => {
  const pool = getPool();
  await pool.execute(
    `UPDATE notifications SET is_read = 1 WHERE user_id = ?`,
    [userId]
  );
};

const create = async ({ user_id, alert_id = null, title, message }) => {
  const pool = getPool();
  await pool.execute(
    `INSERT INTO notifications (user_id, alert_id, title, message) VALUES (?, ?, ?, ?)`,
    [user_id, alert_id, title, message]
  );
};

module.exports = { getForUser, getUnreadCount, markRead, markAllRead, create };
