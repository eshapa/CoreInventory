/**
 * Standardised JSON response helpers.
 * Keeps controller code DRY and ensures a consistent response shape.
 */

/**
 * Send a successful response.
 * @param {import('express').Response} res
 * @param {object|null} data
 * @param {string} [message]
 * @param {number} [statusCode=200]
 */
const sendSuccess = (res, data = null, message = "Success", statusCode = 200) => {
  const payload = { success: true, message };
  if (data !== null) payload.data = data;
  return res.status(statusCode).json(payload);
};

/**
 * Send an error response.
 * @param {import('express').Response} res
 * @param {string} message
 * @param {number} [statusCode=500]
 * @param {object|null} [errors=null]   Optional field-level validation errors
 */
const sendError = (res, message = "Internal Server Error", statusCode = 500, errors = null) => {
  const payload = { success: false, message };
  if (errors) payload.errors = errors;
  return res.status(statusCode).json(payload);
};

module.exports = { sendSuccess, sendError };
