const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/supplierModel");

exports.getAll = asyncHandler(async (req, res) => sendSuccess(res, { suppliers: await model.findAll() }));
exports.getOne = asyncHandler(async (req, res) => {
  const s = await model.findById(req.params.id);
  if (!s) throw new AppError("Supplier not found", 404);
  return sendSuccess(res, { supplier: s });
});
exports.create = asyncHandler(async (req, res) => {
  const { name, contact_person, phone, email, address } = req.body;
  if (!name) throw new AppError("name is required", 422);
  const s = await model.create({ name, contact_person, phone, email, address });
  return sendSuccess(res, { supplier: s }, "Supplier created", 201);
});
exports.update = asyncHandler(async (req, res) => {
  const s = await model.findById(req.params.id);
  if (!s) throw new AppError("Supplier not found", 404);
  const updated = await model.update(req.params.id, req.body);
  return sendSuccess(res, { supplier: updated }, "Supplier updated");
});
exports.remove = asyncHandler(async (req, res) => {
  const s = await model.findById(req.params.id);
  if (!s) throw new AppError("Supplier not found", 404);
  await model.remove(req.params.id);
  return sendSuccess(res, null, "Supplier deleted");
});
