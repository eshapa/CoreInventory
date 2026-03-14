const { getPool } = require("./db");

/**
 * Creates all required tables in TiDB if they don't already exist.
 * Safe to run on every server startup (idempotent).
 */
const initDb = async () => {
  const pool = getPool();

  const queries = [
    /* ─────────────────────────── users ─────────────────────────── */
    `CREATE TABLE IF NOT EXISTS users (
      id            BIGINT        NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name          VARCHAR(100)  NOT NULL,
      email         VARCHAR(255)  NOT NULL UNIQUE,
      password_hash VARCHAR(255)  NOT NULL,
      role          ENUM('inventory_manager', 'warehouse_staff') NOT NULL,
      is_active         TINYINT(1)  NOT NULL DEFAULT 1,
      is_email_verified TINYINT(1)  NOT NULL DEFAULT 0,
      created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                                          ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role  (role)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,

    /* ─────────────────────────── otps ──────────────────────────── */
    `CREATE TABLE IF NOT EXISTS otps (
      id         BIGINT       NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id    BIGINT       NOT NULL,
      otp_hash   VARCHAR(255) NOT NULL,
      type       ENUM('EMAIL_VERIFY', 'PASSWORD_RESET') NOT NULL,
      expires_at DATETIME     NOT NULL,
      used       TINYINT(1)   NOT NULL DEFAULT 0,
      created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_user_type (user_id, type),
      CONSTRAINT fk_otps_user FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const sql of queries) {
    await pool.execute(sql);
  }

  console.log("✅ TiDB tables verified / created");
};

module.exports = initDb;
