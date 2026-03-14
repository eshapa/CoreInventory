const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/qrModel");

/**
 * POST /api/qr/scan
 *
 * Body: { qr_code: "CINV-SKU123" }
 *
 * 1. Looks up the product by qr_code value.
 * 2. Fetches stock levels across all warehouses.
 * 3. Adds per-warehouse low_stock flag (quantity <= reorder_level).
 * 4. Returns product info + stock summary + available actions.
 */
exports.scan = asyncHandler(async (req, res) => {
  const { qr_code } = req.body;
  if (!qr_code || !qr_code.trim()) {
    throw new AppError("qr_code is required", 422);
  }

  // ── 1. Resolve product ──────────────────────────────────
  const product = await model.findByQrCode(qr_code.trim());
  if (!product) throw new AppError("Product not found for this QR code", 404);

  // ── 2. Stock per warehouse ──────────────────────────────
  const rawStock = await model.getStockByWarehouse(product.id);

  // ── 3. Annotate each row with a low_stock flag ──────────
  const reorderLevel = Number(product.reorder_level) || 0;
  const stockByWarehouse = rawStock.map((row) => ({
    warehouse_id:   row.warehouse_id,
    warehouse_name: row.warehouse_name,
    location:       row.location,
    quantity:       Number(row.quantity),
    low_stock:      Number(row.quantity) <= reorderLevel,
  }));

  // ── 4. Summary flags ─────────────────────────────────────
  const totalQuantity = stockByWarehouse.reduce((sum, r) => sum + r.quantity, 0);
  const isLowStock    = stockByWarehouse.some((r) => r.low_stock);

  return sendSuccess(res, {
    product: {
      id:            product.id,
      name:          product.name,
      sku:           product.sku,
      category_name: product.category_name,
      unit:          product.unit,
      reorder_level: reorderLevel,
      qr_code:       product.qr_code,
    },
    stock_by_warehouse: stockByWarehouse,
    total_quantity:     totalQuantity,
    is_low_stock:       isLowStock,
    available_actions:  ["receive", "deliver", "transfer", "adjust"],
  });
});

/**
 * GET /api/qr/generate?sku=ABC123
 *
 * Returns the canonical QR value (CINV-{sku}) without hitting the DB.
 * Useful for the frontend to display a QR image before the product is saved,
 * or to preview what value will be stored.
 */
exports.generateQrValue = asyncHandler(async (req, res) => {
  const { sku } = req.query;
  if (!sku || !sku.trim()) {
    throw new AppError("sku query parameter is required", 422);
  }

  const qr_value = `CINV-${sku.trim().toUpperCase()}`;
  return sendSuccess(res, { qr_value, sku: sku.trim().toUpperCase() });
});
