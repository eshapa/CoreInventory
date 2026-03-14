const asyncHandler = require("express-async-handler");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/reportModel");

/**
 * GET /api/reports/inventory-valuation?warehouseId=&categoryId=
 * Current stock value based on latest receipt unit_price.
 */
exports.getInventoryValuation = asyncHandler(async (req, res) => {
  const { warehouseId, categoryId } = req.query;
  const data = await model.getInventoryValuation({ warehouseId, categoryId });
  return sendSuccess(res, data);
});

/**
 * GET /api/reports/stock-movement-trends?days=30&warehouseId=
 * Daily stock changes grouped by operation type.
 */
exports.getStockMovementTrends = asyncHandler(async (req, res) => {
  const { days, warehouseId } = req.query;
  const data = await model.getStockMovementTrends({ days, warehouseId });
  return sendSuccess(res, { trends: data });
});

/**
 * GET /api/reports/top-products?limit=10&days=30&warehouseId=
 * Most moved products by delivery volume.
 */
exports.getTopUsedProducts = asyncHandler(async (req, res) => {
  const { limit, days, warehouseId } = req.query;
  const data = await model.getTopUsedProducts({ limit, days, warehouseId });
  return sendSuccess(res, { products: data });
});

/**
 * GET /api/reports/warehouse-utilisation
 * Stock used vs capacity per warehouse.
 */
exports.getWarehouseUtilisation = asyncHandler(async (req, res) => {
  const data = await model.getWarehouseUtilisation();
  return sendSuccess(res, { warehouses: data });
});

/**
 * GET /api/reports/charts/monthly-stock-flow?months=6&warehouseId=
 * Monthly in/out/net for charts.
 */
exports.getMonthlyStockFlow = asyncHandler(async (req, res) => {
  const { months, warehouseId } = req.query;
  const data = await model.getMonthlyStockFlow({ months, warehouseId });
  return sendSuccess(res, { months: data });
});

/**
 * GET /api/reports/charts/category-distribution?warehouseId=
 * Stock per category for pie/bar charts.
 */
exports.getCategoryDistribution = asyncHandler(async (req, res) => {
  const { warehouseId } = req.query;
  const data = await model.getCategoryDistribution({ warehouseId });
  return sendSuccess(res, { categories: data });
});

/**
 * GET /api/reports/charts/warehouse-usage
 * Per-warehouse product count, quantity, utilisation %.
 */
exports.getWarehouseUsage = asyncHandler(async (req, res) => {
  const data = await model.getWarehouseUsage();
  return sendSuccess(res, { warehouses: data });
});
