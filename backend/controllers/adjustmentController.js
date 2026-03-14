const asyncHandler = require("express-async-handler");
const Joi = require("joi");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const adjustmentModel = require("../models/adjustmentModel");

const schemas = {
  createAdjustment: Joi.object({
    product_id: Joi.number().integer().required(),
    warehouse_id: Joi.number().integer().required(),
    actual_quantity: Joi.number().min(0).required(),
    reason: Joi.string().required(),
  }),
};

const validateBody = (schema, body) => {
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    const errors = error.details.reduce((acc, d) => {
      acc[d.path.join(".")] = d.message.replace(/"/g, "");
      return acc;
    }, {});
    throw Object.assign(new AppError("Validation failed", 422), { errors });
  }
  return value;
};

/**
 * @desc    Get all adjustments
 * @route   GET /api/adjustments
 * @access  Private
 */
const getAdjustments = asyncHandler(async (req, res) => {
  const adjustments = await adjustmentModel.getAllAdjustments();
  return sendSuccess(res, adjustments);
});

/**
 * @desc    Get system quantity for a product in a warehouse
 * @route   GET /api/adjustments/system-quantity?product_id=&warehouse_id=
 * @access  Private
 */
const getSystemQuantity = asyncHandler(async (req, res) => {
  const { product_id, warehouse_id } = req.query;
  
  if (!product_id || !warehouse_id) {
    throw new AppError("product_id and warehouse_id query parameters are required", 400);
  }

  const quantity = await adjustmentModel.getSystemQuantity(product_id, warehouse_id);
  return sendSuccess(res, { system_quantity: quantity });
});

/**
 * @desc    Create a new stock adjustment
 * @route   POST /api/adjustments
 * @access  Private
 */
const createAdjustment = asyncHandler(async (req, res) => {
  const validData = validateBody(schemas.createAdjustment, req.body);
  const adjustment = await adjustmentModel.createAdjustment(validData, req.user.id);
  
  // Call checkAlerts(adjustment.product_id, adjustment.warehouse_id) here later

  return sendSuccess(res, adjustment, "Stock adjusted successfully", 201);
});

module.exports = {
  getAdjustments,
  getSystemQuantity,
  createAdjustment,
};
