const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/customerModel");

exports.getAll = asyncHandler(async (req, res) => sendSuccess(res, { customers: await model.findAll() }));
exports.getOne = asyncHandler(async (req, res) => {
  const c = await model.findById(req.params.id);
  if (!c) throw new AppError("Customer not found", 404);
  return sendSuccess(res, { customer: c });
});
exports.create = asyncHandler(async (req, res) => {
  const { name, phone, email, address } = req.body;
  if (!name) throw new AppError("name is required", 422);
  const c = await model.create({ name, phone, email, address });
  return sendSuccess(res, { customer: c }, "Customer created", 201);
});
exports.update = asyncHandler(async (req, res) => {
  const c = await model.findById(req.params.id);
  if (!c) throw new AppError("Customer not found", 404);
  const updated = await model.update(req.params.id, req.body);
  return sendSuccess(res, { customer: updated }, "Customer updated");
});
exports.remove = asyncHandler(async (req, res) => {
  const c = await model.findById(req.params.id);
  if (!c) throw new AppError("Customer not found", 404);
  await model.remove(req.params.id);
  return sendSuccess(res, null, "Customer deleted");
});
