const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/stockAdjustmentModel");

/** GET /api/stock-adjustments?productId=&warehouseId= */
exports.getAll = asyncHandler(async (req, res) => {
  const { productId, warehouseId } = req.query;
  return sendSuccess(res, { adjustments: await model.findAll({ productId, warehouseId }) });
});

/** GET /api/stock-adjustments/:id */
exports.getOne = asyncHandler(async (req, res) => {
  const a = await model.findById(req.params.id);
  if (!a) throw new AppError("Adjustment not found", 404);
  return sendSuccess(res, { adjustment: a });
});

/**
 * POST /api/stock-adjustments
 * system_quantity is auto-read from current inventory if not provided.
 */
exports.create = asyncHandler(async (req, res) => {
  const { product_id, warehouse_id, system_quantity, actual_quantity, reason } = req.body;
  if (!product_id || !warehouse_id || actual_quantity == null)
    throw new AppError("product_id, warehouse_id, and actual_quantity are required", 422);
  const a = await model.create({ product_id, warehouse_id, system_quantity, actual_quantity, reason, user_id: req.user.id });
  return sendSuccess(res, { adjustment: a }, "Stock adjustment recorded", 201);
});

/**
 * GET /api/stock-adjustments/system-quantity?productId=&warehouseId=
 * Returns the current system quantity for a product+warehouse (for frontend pre-fill).
 */
exports.getSystemQuantity = asyncHandler(async (req, res) => {
  const { productId, warehouseId } = req.query;
  if (!productId || !warehouseId) throw new AppError("productId and warehouseId are required", 422);
  const quantity = await model.getSystemQuantity(productId, warehouseId);
  return sendSuccess(res, { productId: Number(productId), warehouseId: Number(warehouseId), systemQuantity: quantity });
});
