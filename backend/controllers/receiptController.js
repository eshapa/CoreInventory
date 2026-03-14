const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/receiptModel");

/** GET /api/receipts?warehouseId=&status=&supplierId=&search= */
exports.getAll = asyncHandler(async (req, res) => {
  const { warehouseId, status, supplierId, search } = req.query;
  return sendSuccess(res, { receipts: await model.findAll({ warehouseId, status, supplierId, search }) });
});

/** GET /api/receipts/:id */
exports.getOne = asyncHandler(async (req, res) => {
  const r = await model.findById(req.params.id);
  if (!r) throw new AppError("Receipt not found", 404);
  return sendSuccess(res, { receipt: r });
});

/** POST /api/receipts — create with items */
exports.create = asyncHandler(async (req, res) => {
  const { supplier_id, warehouse_id, notes, items } = req.body;
  if (!warehouse_id || !items?.length) throw new AppError("warehouse_id and items are required", 422);
  // Validate every line item
  for (const item of items) {
    if (!item.product_id) throw new AppError("Each item must have a product_id", 422);
    if (!item.quantity || item.quantity <= 0) throw new AppError("Each item quantity must be > 0", 422);
  }
  const r = await model.create({ supplier_id, warehouse_id, notes, created_by: req.user.id, items });
  return sendSuccess(res, { receipt: r }, "Receipt created", 201);
});

/** PUT /api/receipts/:id — update header (draft only) */
exports.update = asyncHandler(async (req, res) => {
  const r = await model.findById(req.params.id);
  if (!r) throw new AppError("Receipt not found", 404);
  if (r.status !== "draft") throw new AppError("Can only edit receipts in draft status", 422);
  const updated = await model.updateReceipt(req.params.id, req.body);
  return sendSuccess(res, { receipt: updated }, "Receipt updated");
});

/** PATCH /api/receipts/:id/status */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["draft", "ready", "done", "cancelled"];
  if (!valid.includes(status)) throw new AppError(`status must be one of: ${valid.join(", ")}`, 422);
  const r = await model.updateStatus(req.params.id, status, req.user.id);
  return sendSuccess(res, { receipt: r }, "Receipt status updated");
});

/** POST /api/receipts/:id/items — add items (draft only) */
exports.addItems = asyncHandler(async (req, res) => {
  const r = await model.findById(req.params.id);
  if (!r) throw new AppError("Receipt not found", 404);
  if (r.status !== "draft") throw new AppError("Can only add items to draft receipts", 422);
  if (!req.body.items?.length) throw new AppError("items array is required", 422);
  for (const item of req.body.items) {
    if (!item.product_id) throw new AppError("Each item must have a product_id", 422);
    if (!item.quantity || item.quantity <= 0) throw new AppError("Each item quantity must be > 0", 422);
  }
  const updated = await model.addItems(req.params.id, req.body.items);
  return sendSuccess(res, { receipt: updated }, "Items added");
});

/** PUT /api/receipts/:id/items/:itemId — update a line item (draft only) */
exports.updateItem = asyncHandler(async (req, res) => {
  const r = await model.findById(req.params.id);
  if (!r) throw new AppError("Receipt not found", 404);
  if (r.status !== "draft") throw new AppError("Can only edit items in draft receipts", 422);
  await model.updateItem(req.params.itemId, req.body);
  const updated = await model.findById(req.params.id);
  return sendSuccess(res, { receipt: updated }, "Item updated");
});

/** DELETE /api/receipts/:id/items/:itemId — remove a line item (draft only) */
exports.removeItem = asyncHandler(async (req, res) => {
  const r = await model.findById(req.params.id);
  if (!r) throw new AppError("Receipt not found", 404);
  if (r.status !== "draft") throw new AppError("Can only remove items from draft receipts", 422);
  await model.removeItem(req.params.itemId);
  const updated = await model.findById(req.params.id);
  return sendSuccess(res, { receipt: updated }, "Item removed");
});
