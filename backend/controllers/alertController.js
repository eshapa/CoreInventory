const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/alertModel");

exports.getAll = asyncHandler(async (req, res) => {
  const { isResolved, alertType } = req.query;
  const resolved = isResolved === undefined ? undefined : isResolved === "true";
  return sendSuccess(res, { alerts: await model.findAll({ isResolved: resolved, alertType }) });
});
exports.getOne = asyncHandler(async (req, res) => {
  const a = await model.findById(req.params.id);
  if (!a) throw new AppError("Alert not found", 404);
  return sendSuccess(res, { alert: a });
});
exports.resolve = asyncHandler(async (req, res) => {
  const a = await model.findById(req.params.id);
  if (!a) throw new AppError("Alert not found", 404);
  const updated = await model.resolve(req.params.id);
  return sendSuccess(res, { alert: updated }, "Alert resolved");
});
