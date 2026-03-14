const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/transferModel");

exports.getAll = asyncHandler(async (req, res) => {
  const { status } = req.query;
  return sendSuccess(res, { transfers: await model.findAll({ status }) });
});
exports.getOne = asyncHandler(async (req, res) => {
  const t = await model.findById(req.params.id);
  if (!t) throw new AppError("Transfer not found", 404);
  return sendSuccess(res, { transfer: t });
});
exports.create = asyncHandler(async (req, res) => {
  const { source_warehouse_id, destination_warehouse_id, notes, items } = req.body;
  if (!source_warehouse_id || !destination_warehouse_id || !items?.length)
    throw new AppError("source_warehouse_id, destination_warehouse_id and items are required", 422);
  if (source_warehouse_id === destination_warehouse_id)
    throw new AppError("Source and destination warehouses must differ", 422);
  const t = await model.create({ source_warehouse_id, destination_warehouse_id, notes, created_by: req.user.id, items });
  return sendSuccess(res, { transfer: t }, "Transfer created", 201);
});
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["draft", "ready", "done", "cancelled"];
  if (!valid.includes(status)) throw new AppError(`status must be one of: ${valid.join(", ")}`, 422);
  const t = await model.updateStatus(req.params.id, status, req.user.id);
  return sendSuccess(res, { transfer: t }, "Transfer status updated");
});
