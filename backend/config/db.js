const mysql = require("mysql2/promise");

let pool;

const connectDB = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.TIDB_HOST,
      port: parseInt(process.env.TIDB_PORT, 10) || 4000,
      user: process.env.TIDB_USER,
      password: process.env.TIDB_PASSWORD,
      database: process.env.TIDB_DATABASE,
      ssl:
        process.env.TIDB_SSL === "true"
          ? { rejectUnauthorized: true }
          : undefined,
      waitForConnections: true,
      connectionLimit: 20,
      idleTimeout: 60000,         // 60 s
      connectTimeout: 10000,      // 10 s
      queueLimit: 0,
      timezone: "+00:00",
    });

    // Validate connectivity on startup
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();

    console.log(
      `✅ TiDB Connected: ${process.env.TIDB_HOST}:${process.env.TIDB_PORT || 4000}/${process.env.TIDB_DATABASE}`
    );
  } catch (error) {
    console.error(`❌ TiDB connection error: ${error.message}`);
    process.exit(1);
  }
};

/**
 * Returns the shared mysql2 pool.
 * Call this AFTER connectDB() has been awaited.
 */
const getPool = () => {
  if (!pool) {
    throw new Error("Database pool is not initialised. Call connectDB() first.");
  }
  return pool;
};

module.exports = { connectDB, getPool };
