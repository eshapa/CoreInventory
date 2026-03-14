const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const stockModel = require("../models/inventoryStockModel");
const ledgerModel = require("../models/stockLedgerModel");

/** GET /api/inventory?warehouseId=X */
exports.getForWarehouse = asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;
  if (!warehouseId) throw new AppError("warehouseId query param is required", 422);
  const stocks = await stockModel.getAllForWarehouse(warehouseId);
  return sendSuccess(res, { stocks });
});

/** GET /api/inventory/product/:productId */
exports.getForProduct = asyncHandler(async (req, res) => {
  const stocks = await stockModel.getAllForProduct(req.params.productId);
  return sendSuccess(res, { stocks });
});

/**
 * GET /api/inventory/ledger?productId=&warehouseId=&operationType=&startDate=&endDate=&search=&limit=
 * Move History — full stock ledger with rich filters.
 */
exports.getLedger = asyncHandler(async (req, res) => {
  const { productId, warehouseId, operationType, categoryId, startDate, endDate, search, limit } = req.query;
  const entries = await ledgerModel.getHistory({ productId, warehouseId, operationType, categoryId, startDate, endDate, search, limit });
  return sendSuccess(res, { entries });
});

/**
 * GET /api/inventory/ledger/summary?warehouseId=&startDate=&endDate=
 * Movement summary grouped by operation type.
 */
exports.getLedgerSummary = asyncHandler(async (req, res) => {
  const { warehouseId, startDate, endDate } = req.query;
  const summary = await ledgerModel.getSummary({ warehouseId, startDate, endDate });
  return sendSuccess(res, { summary });
});
