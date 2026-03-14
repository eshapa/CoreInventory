const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/transferModel");

/** GET /api/transfers?status=&warehouseId=&search= */
exports.getAll = asyncHandler(async (req, res) => {
  const { status, warehouseId, search } = req.query;
  return sendSuccess(res, { transfers: await model.findAll({ status, warehouseId, search }) });
});

/** GET /api/transfers/:id */
exports.getOne = asyncHandler(async (req, res) => {
  const t = await model.findById(req.params.id);
  if (!t) throw new AppError("Transfer not found", 404);
  return sendSuccess(res, { transfer: t });
});

/** POST /api/transfers */
exports.create = asyncHandler(async (req, res) => {
  const { source_warehouse_id, destination_warehouse_id, notes, items } = req.body;
  if (!source_warehouse_id || !destination_warehouse_id || !items?.length)
    throw new AppError("source_warehouse_id, destination_warehouse_id and items are required", 422);
  if (String(source_warehouse_id) === String(destination_warehouse_id))
    throw new AppError("Source and destination warehouses must differ", 422);
  for (const item of items) {
    if (!item.product_id) throw new AppError("Each item must have a product_id", 422);
    if (!item.quantity || item.quantity <= 0) throw new AppError("Each item quantity must be > 0", 422);
  }
  const t = await model.create({ source_warehouse_id, destination_warehouse_id, notes, created_by: req.user.id, items });
  return sendSuccess(res, { transfer: t }, "Transfer created", 201);
});

/** PUT /api/transfers/:id — update header (draft only) */
exports.update = asyncHandler(async (req, res) => {
  const t = await model.findById(req.params.id);
  if (!t) throw new AppError("Transfer not found", 404);
  if (t.status !== "draft") throw new AppError("Can only edit transfers in draft status", 422);
  if (req.body.source_warehouse_id && req.body.destination_warehouse_id &&
      String(req.body.source_warehouse_id) === String(req.body.destination_warehouse_id))
    throw new AppError("Source and destination warehouses must differ", 422);
  const updated = await model.updateTransfer(req.params.id, req.body);
  return sendSuccess(res, { transfer: updated }, "Transfer updated");
});

/** PATCH /api/transfers/:id/status */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["draft", "ready", "done", "cancelled"];
  if (!valid.includes(status)) throw new AppError(`status must be one of: ${valid.join(", ")}`, 422);
  const t = await model.updateStatus(req.params.id, status, req.user.id);
  return sendSuccess(res, { transfer: t }, "Transfer status updated");
});

/** POST /api/transfers/:id/items — add items (draft only) */
exports.addItems = asyncHandler(async (req, res) => {
  const t = await model.findById(req.params.id);
  if (!t) throw new AppError("Transfer not found", 404);
  if (t.status !== "draft") throw new AppError("Can only add items to draft transfers", 422);
  if (!req.body.items?.length) throw new AppError("items array is required", 422);
  for (const item of req.body.items) {
    if (!item.product_id) throw new AppError("Each item must have a product_id", 422);
    if (!item.quantity || item.quantity <= 0) throw new AppError("Each item quantity must be > 0", 422);
  }
  const updated = await model.addItems(req.params.id, req.body.items);
  return sendSuccess(res, { transfer: updated }, "Items added");
});

/** PUT /api/transfers/:id/items/:itemId — update a line item (draft only) */
exports.updateItem = asyncHandler(async (req, res) => {
  const t = await model.findById(req.params.id);
  if (!t) throw new AppError("Transfer not found", 404);
  if (t.status !== "draft") throw new AppError("Can only edit items in draft transfers", 422);
  await model.updateItem(req.params.itemId, req.body);
  const updated = await model.findById(req.params.id);
  return sendSuccess(res, { transfer: updated }, "Item updated");
});

/** DELETE /api/transfers/:id/items/:itemId — remove a line item (draft only) */
exports.removeItem = asyncHandler(async (req, res) => {
  const t = await model.findById(req.params.id);
  if (!t) throw new AppError("Transfer not found", 404);
  if (t.status !== "draft") throw new AppError("Can only remove items from draft transfers", 422);
  await model.removeItem(req.params.itemId);
  const updated = await model.findById(req.params.id);
  return sendSuccess(res, { transfer: updated }, "Item removed");
});
