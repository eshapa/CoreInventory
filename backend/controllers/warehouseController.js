const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/warehouseModel");

exports.getAll    = asyncHandler(async (req, res) => sendSuccess(res, { warehouses: await model.findAll() }));
exports.getOne    = asyncHandler(async (req, res) => {
  const w = await model.findById(req.params.id);
  if (!w) throw new AppError("Warehouse not found", 404);
  return sendSuccess(res, { warehouse: w });
});
exports.create    = asyncHandler(async (req, res) => {
  const { name, location, capacity } = req.body;
  if (!name) throw new AppError("name is required", 422);
  const w = await model.create({ name, location, capacity });
  return sendSuccess(res, { warehouse: w }, "Warehouse created", 201);
});
exports.update    = asyncHandler(async (req, res) => {
  const w = await model.findById(req.params.id);
  if (!w) throw new AppError("Warehouse not found", 404);
  const updated = await model.update(req.params.id, req.body);
  return sendSuccess(res, { warehouse: updated }, "Warehouse updated");
});
exports.remove    = asyncHandler(async (req, res) => {
  const w = await model.findById(req.params.id);
  if (!w) throw new AppError("Warehouse not found", 404);
  await model.remove(req.params.id);
  return sendSuccess(res, null, "Warehouse deleted");
});
