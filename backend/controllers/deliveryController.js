const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/deliveryModel");

/** GET /api/deliveries?warehouseId=&status=&customerId=&search= */
exports.getAll = asyncHandler(async (req, res) => {
  const { warehouseId, status, customerId, search } = req.query;
  return sendSuccess(res, { deliveries: await model.findAll({ warehouseId, status, customerId, search }) });
});

/** GET /api/deliveries/:id */
exports.getOne = asyncHandler(async (req, res) => {
  const d = await model.findById(req.params.id);
  if (!d) throw new AppError("Delivery not found", 404);
  return sendSuccess(res, { delivery: d });
});

/** POST /api/deliveries */
exports.create = asyncHandler(async (req, res) => {
  const { customer_id, warehouse_id, notes, items } = req.body;
  if (!warehouse_id || !items?.length) throw new AppError("warehouse_id and items are required", 422);
  for (const item of items) {
    if (!item.product_id) throw new AppError("Each item must have a product_id", 422);
    if (!item.quantity || item.quantity <= 0) throw new AppError("Each item quantity must be > 0", 422);
  }
  const d = await model.create({ customer_id, warehouse_id, notes, created_by: req.user.id, items });
  return sendSuccess(res, { delivery: d }, "Delivery created", 201);
});

/** PUT /api/deliveries/:id — update header (draft only) */
exports.update = asyncHandler(async (req, res) => {
  const d = await model.findById(req.params.id);
  if (!d) throw new AppError("Delivery not found", 404);
  if (d.status !== "draft") throw new AppError("Can only edit deliveries in draft status", 422);
  const updated = await model.updateDelivery(req.params.id, req.body);
  return sendSuccess(res, { delivery: updated }, "Delivery updated");
});

/** PATCH /api/deliveries/:id/status */
exports.updateStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const valid = ["draft", "ready", "done", "cancelled"];
  if (!valid.includes(status)) throw new AppError(`status must be one of: ${valid.join(", ")}`, 422);
  const d = await model.updateStatus(req.params.id, status, req.user.id);
  return sendSuccess(res, { delivery: d }, "Delivery status updated");
});

/** POST /api/deliveries/:id/items — add items (draft only) */
exports.addItems = asyncHandler(async (req, res) => {
  const d = await model.findById(req.params.id);
  if (!d) throw new AppError("Delivery not found", 404);
  if (d.status !== "draft") throw new AppError("Can only add items to draft deliveries", 422);
  if (!req.body.items?.length) throw new AppError("items array is required", 422);
  for (const item of req.body.items) {
    if (!item.product_id) throw new AppError("Each item must have a product_id", 422);
    if (!item.quantity || item.quantity <= 0) throw new AppError("Each item quantity must be > 0", 422);
  }
  const updated = await model.addItems(req.params.id, req.body.items);
  return sendSuccess(res, { delivery: updated }, "Items added");
});

/** PUT /api/deliveries/:id/items/:itemId — update a line item (draft only) */
exports.updateItem = asyncHandler(async (req, res) => {
  const d = await model.findById(req.params.id);
  if (!d) throw new AppError("Delivery not found", 404);
  if (d.status !== "draft") throw new AppError("Can only edit items in draft deliveries", 422);
  await model.updateItem(req.params.itemId, req.body);
  const updated = await model.findById(req.params.id);
  return sendSuccess(res, { delivery: updated }, "Item updated");
});

/** DELETE /api/deliveries/:id/items/:itemId — remove a line item (draft only) */
exports.removeItem = asyncHandler(async (req, res) => {
  const d = await model.findById(req.params.id);
  if (!d) throw new AppError("Delivery not found", 404);
  if (d.status !== "draft") throw new AppError("Can only remove items from draft deliveries", 422);
  await model.removeItem(req.params.itemId);
  const updated = await model.findById(req.params.id);
  return sendSuccess(res, { delivery: updated }, "Item removed");
});
