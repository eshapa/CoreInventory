const asyncHandler = require("express-async-handler");
const Joi = require("joi");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const transferModel = require("../models/transferModel");
// Placeholder for alertCheck if needed directly from controller
// const { checkAlerts } = require("../services/alertCheck");

const schemas = {
  createTransfer: Joi.object({
    source_warehouse_id: Joi.number().integer().required(),
    destination_warehouse_id: Joi.number().integer().invalid(Joi.ref("source_warehouse_id")).required().messages({
      "any.invalid": "Source and destination warehouses cannot be the same.",
    }),
    notes: Joi.string().allow("", null).optional(),
    items: Joi.array().items(
      Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().min(0.01).required(),
      })
    ).min(1).required(),
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid("done").required(),
  }),
};

const validateBody = (schema, body) => {
  const { error, value } = schema.validate(body, { abortEarly: false, stripUnknown: true, convert: true });
  if (error) {
    const errors = error.details.reduce((acc, d) => {
      acc[d.path.join(".")] = d.message.replace(/"/g, "");
      return acc;
    }, {});
    throw Object.assign(new AppError("Validation failed", 422), { errors });
  }
  return value;
};

/**
 * @desc    Get all transfers
 * @route   GET /api/transfers
 * @access  Private
 */
const getTransfers = asyncHandler(async (req, res) => {
  const transfers = await transferModel.getAllTransfers();
  return sendSuccess(res, transfers);
});

/**
 * @desc    Get transfer by ID (header + items)
 * @route   GET /api/transfers/:id
 * @access  Private
 */
const getTransferDetails = asyncHandler(async (req, res) => {
  const transfer = await transferModel.getTransferById(req.params.id);
  if (!transfer) throw new AppError("Transfer not found", 404);
  return sendSuccess(res, transfer);
});

/**
 * @desc    Create a new transfer (draft)
 * @route   POST /api/transfers
 * @access  Private
 */
const createTransfer = asyncHandler(async (req, res) => {
  const validData = validateBody(schemas.createTransfer, req.body);
  const { items, ...headerData } = validData;

  const transfer = await transferModel.createTransfer(headerData, items, req.user.id);
  return sendSuccess(res, transfer, "Transfer created as draft", 201);
});

/**
 * @desc    Update transfer status (draft -> done)
 * @route   PUT /api/transfers/:id/status
 * @access  Private
 */
const updateTransferStatus = asyncHandler(async (req, res) => {
  const { status } = validateBody(schemas.updateStatus, req.body);

  if (status === "done") {
    await transferModel.completeTransfer(req.params.id, req.user.id);
    
    // We would call checkAlerts here for every item in the transfer to handle Low Stock notifications
    // const transfer = await transferModel.getTransferById(req.params.id);
    // for (const item of transfer.items) {
    //   await checkAlerts(item.product_id, transfer.source_warehouse_id, db);
    //   await checkAlerts(item.product_id, transfer.destination_warehouse_id, db);
    // }

    return sendSuccess(res, null, "Transfer completed successfully");
  }

  throw new AppError("Invalid status transition", 400);
});

module.exports = {
  getTransfers,
  getTransferDetails,
  createTransfer,
  updateTransferStatus,
};
