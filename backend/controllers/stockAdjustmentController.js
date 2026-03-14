const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/stockAdjustmentModel");

exports.getAll = asyncHandler(async (req, res) => {
  const { productId, warehouseId } = req.query;
  return sendSuccess(res, { adjustments: await model.findAll({ productId, warehouseId }) });
});
exports.getOne = asyncHandler(async (req, res) => {
  const a = await model.findById(req.params.id);
  if (!a) throw new AppError("Adjustment not found", 404);
  return sendSuccess(res, { adjustment: a });
});
exports.create = asyncHandler(async (req, res) => {
  const { product_id, warehouse_id, system_quantity, actual_quantity, reason } = req.body;
  if (!product_id || !warehouse_id || system_quantity == null || actual_quantity == null)
    throw new AppError("product_id, warehouse_id, system_quantity, actual_quantity are required", 422);
  const a = await model.create({ product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id: req.user.id });
  return sendSuccess(res, { adjustment: a }, "Stock adjustment recorded", 201);
});
