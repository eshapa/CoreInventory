const asyncHandler = require("express-async-handler");
const { sendSuccess } = require("../utils/responseUtils");
const dashboard = require("../models/dashboardModel");

/**
 * GET /api/dashboard/kpis
 * Returns all KPI card numbers in a single call.
 */
exports.getKPIs = asyncHandler(async (req, res) => {
  const [totalProducts, lowStock, pending] = await Promise.all([
    dashboard.getTotalProductsInStock(),
    dashboard.getLowAndOutOfStock(),
    dashboard.getPendingCounts(),
  ]);

  return sendSuccess(res, {
    totalProductsInStock: totalProducts,
    lowStockCount:        lowStock.lowStockCount,
    outOfStockCount:      lowStock.outOfStockCount,
    pendingReceipts:      pending.pendingReceipts,
    pendingDeliveries:    pending.pendingDeliveries,
    pendingTransfers:     pending.pendingTransfers,
  });
});

/**
 * GET /api/dashboard/staff-kpis
 * Returns scoped KPI numbers for the currently logged-in staff member.
 */
exports.getStaffKPIs = asyncHandler(async (req, res) => {
  const kpis = await dashboard.getStaffKPIs(req.user.id);
  return sendSuccess(res, kpis);
});

/**
 * GET /api/dashboard/low-stock
 * Returns the full list of low/out-of-stock items.
 */
exports.getLowStock = asyncHandler(async (req, res) => {
  const data = await dashboard.getLowAndOutOfStock();
  return sendSuccess(res, data);
});

/**
 * GET /api/dashboard/charts/stock-movement?days=30
 * Stock movement over time for line/bar chart.
 */
exports.getStockMovement = asyncHandler(async (req, res) => {
  const days = parseInt(req.query.days || "30", 10);
  const data = await dashboard.getStockMovementGraph(days);
  return sendSuccess(res, { movements: data });
});

/**
 * GET /api/dashboard/charts/category-distribution
 * Stock quantities grouped by product category (for pie/bar chart).
 */
exports.getCategoryDistribution = asyncHandler(async (req, res) => {
  const data = await dashboard.getCategoryDistribution();
  return sendSuccess(res, { categories: data });
});

/**
 * GET /api/dashboard/charts/warehouse-distribution
 * Stock quantities grouped by warehouse (for pie/bar chart).
 */
exports.getWarehouseDistribution = asyncHandler(async (req, res) => {
  const data = await dashboard.getWarehouseDistribution();
  return sendSuccess(res, { warehouses: data });
});

/**
 * GET /api/dashboard/documents/counts
 * Receipt/delivery/transfer counts grouped by status.
 */
exports.getDocumentCounts = asyncHandler(async (req, res) => {
  const data = await dashboard.getDocumentCounts();
  return sendSuccess(res, data);
});

/**
 * GET /api/dashboard/documents?type=&status=&warehouseId=&categoryId=
 * Filtered document listing.
 */
exports.getFilteredDocuments = asyncHandler(async (req, res) => {
  const { type, status, warehouseId, categoryId } = req.query;
  const data = await dashboard.getFilteredDocuments({ type, status, warehouseId, categoryId });
  return sendSuccess(res, { documents: data });
});
