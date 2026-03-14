const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/productModel");

exports.getAll = asyncHandler(async (req, res) => {
  const { categoryId } = req.query;
  const products = await model.findAll({ categoryId });
  return sendSuccess(res, { products });
});
exports.getOne = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);
  return sendSuccess(res, { product: p });
});
exports.getBySku = asyncHandler(async (req, res) => {
  const p = await model.findBySku(req.params.sku);
  if (!p) throw new AppError("Product not found", 404);
  return sendSuccess(res, { product: p });
});
exports.create = asyncHandler(async (req, res) => {
  const { name, sku, category_id, description, unit, reorder_level, qr_code } = req.body;
  if (!name || !sku) throw new AppError("name and sku are required", 422);
  const existing = await model.findBySku(sku);
  if (existing) throw new AppError("SKU already exists", 409);
  const p = await model.create({ name, sku, category_id, description, unit, reorder_level, qr_code });
  return sendSuccess(res, { product: p }, "Product created", 201);
});
exports.update = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);
  const updated = await model.update(req.params.id, req.body);
  return sendSuccess(res, { product: updated }, "Product updated");
});
exports.remove = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);
  await model.remove(req.params.id);
  return sendSuccess(res, null, "Product deleted");
});
