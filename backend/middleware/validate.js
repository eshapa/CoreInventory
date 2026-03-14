const Joi = require("joi");
const { sendError } = require("../utils/responseUtils");

/**
 * Middleware factory for Joi schema validation.
 * Validates `req.body` against the given schema.
 *
 * @param {Joi.ObjectSchema} schema  Joi schema to validate against
 * @returns {import('express').RequestHandler}
 *
 * @example
 *   router.post('/login', validate(loginSchema), authController.login);
 */
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,      // collect ALL errors at once
    stripUnknown: true,     // remove unknown keys (security & cleanliness)
    convert: true,          // coerce types (e.g. "  email@x.com  " → trimmed)
  });

  if (error) {
    const errors = error.details.reduce((acc, detail) => {
      const key = detail.path.join(".");
      acc[key] = detail.message.replace(/"/g, "");
      return acc;
    }, {});

    return sendError(res, "Validation failed", 422, errors);
  }

  // Replace body with stripped / coerced value
  req.body = value;
  next();
};

module.exports = validate;
