/**
 * Operational (expected) errors that should be sent to the client.
 * Extends the native Error class so stack traces are preserved.
 */
class AppError extends Error {
  /**
   * @param {string} message   Human-readable error message
   * @param {number} statusCode HTTP status code (4xx / 5xx)
   */
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    // Capture v8 stack trace, excluding this constructor frame
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
