const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/categoryModel");

exports.getAll = asyncHandler(async (req, res) => sendSuccess(res, { categories: await model.findAll() }));
exports.getOne = asyncHandler(async (req, res) => {
  const c = await model.findById(req.params.id);
  if (!c) throw new AppError("Category not found", 404);
  return sendSuccess(res, { category: c });
});
exports.create = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  if (!name) throw new AppError("name is required", 422);
  const c = await model.create({ name, description });
  return sendSuccess(res, { category: c }, "Category created", 201);
});
exports.update = asyncHandler(async (req, res) => {
  const c = await model.findById(req.params.id);
  if (!c) throw new AppError("Category not found", 404);
  const updated = await model.update(req.params.id, req.body);
  return sendSuccess(res, { category: updated }, "Category updated");
});
exports.remove = asyncHandler(async (req, res) => {
  const c = await model.findById(req.params.id);
  if (!c) throw new AppError("Category not found", 404);
  await model.remove(req.params.id);
  return sendSuccess(res, null, "Category deleted");
});
