const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const dotenv = require("dotenv");

// Load env first — before any other imports that read process.env
dotenv.config();

const { connectDB } = require("./config/db");
const initDb = require("./config/initDb");
const AppError = require("./utils/AppError");
const { sendError } = require("./utils/responseUtils");

const app = express();

/* ═══════════════════════════════════════════
   SECURITY MIDDLEWARE
═══════════════════════════════════════════ */
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === "production",
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ═══════════════════════════════════════════
   GENERAL MIDDLEWARE
═══════════════════════════════════════════ */
app.use(express.json({ limit: "10kb" }));          // prevent large body DoS
app.use(express.urlencoded({ extended: false }));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Trust first proxy (needed for rate-limit IP detection on platforms like Railway / Render)
app.set("trust proxy", 1);

/* ═══════════════════════════════════════════
   ROUTES
═══════════════════════════════════════════ */
app.use("/api/auth",  require("./routes/authRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

/* ═══════════════════════════════════════════
   HEALTH CHECK
═══════════════════════════════════════════ */
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

/* ═══════════════════════════════════════════
   404 HANDLER
═══════════════════════════════════════════ */
app.use((req, res) => {
  sendError(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

/* ═══════════════════════════════════════════
   GLOBAL ERROR HANDLER
═══════════════════════════════════════════ */
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Expose validation errors if present
  if (err.errors) {
    return res.status(err.statusCode || 422).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err.isOperational) {
    return sendError(res, err.message, err.statusCode);
  }

  // Unexpected / programming errors — don't leak details in production
  console.error("💥 UNHANDLED ERROR:", err);
  return sendError(
    res,
    process.env.NODE_ENV === "production" ? "Something went wrong" : err.message,
    500
  );
});

/* ═══════════════════════════════════════════
   STARTUP
═══════════════════════════════════════════ */
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();   // Connect pool
    await initDb();      // Create tables if needed
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

start();

module.exports = app;
