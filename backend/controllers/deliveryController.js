const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/deliveryModel");

exports.getAll = asyncHandler(async (req, res) => {
  const { warehouseId, status } = req.query;
  return sendSuccess(res, { deliveries: await model.findAll({ warehouseId, status }) });
});
exports.getOne = asyncHandler(async (req, res) => {
  const d = await model.findById(req.params.id);
  if (!d) throw new AppError("Delivery not found", 404);
  return sendSuccess(res, { delivery: d });
});
exports.create = asyncHandler(async (req, res) => {
  const { customer_id, warehouse_id, notes, items } = req.body;
  if (!warehouse_id || !items?.length) throw new AppError("warehouse_id and items are required", 422);
  const d = await model.create({ customer_id, warehouse_id, notes, created_by: req.user.id, items });
  return sendSuccess(res, { delivery: d }, "Delivery created", 201);
});
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["draft", "ready", "done", "cancelled"];
  if (!valid.includes(status)) throw new AppError(`status must be one of: ${valid.join(", ")}`, 422);
  const d = await model.updateStatus(req.params.id, status, req.user.id);
  return sendSuccess(res, { delivery: d }, "Delivery status updated");
});
