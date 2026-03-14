const asyncHandler = require("express-async-handler");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/productModel");

/**
 * GET /api/products?categoryId=&search=
 * List all products with optional filters.
 */
exports.getAll = asyncHandler(async (req, res) => {
  const { categoryId, search, qr_code } = req.query;
  const products = await model.findAll({ categoryId, search, qr_code });
  return sendSuccess(res, { products });
});

/**
 * GET /api/products/:id
 * Get a single product by ID.
 */
exports.getOne = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);
  return sendSuccess(res, { product: p });
});

/**
 * GET /api/products/sku/:sku
 * Search product by SKU.
 */
exports.getBySku = asyncHandler(async (req, res) => {
  const p = await model.findBySku(req.params.sku);
  if (!p) throw new AppError("Product not found", 404);
  return sendSuccess(res, { product: p });
});

/**
 * GET /api/products/:id/stock
 * Stock availability across all warehouses.
 */
exports.getStockAvailability = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);
  const stocks = await model.getStockAvailability(req.params.id);
  const totalStock = stocks.reduce((sum, s) => sum + Number(s.quantity), 0);
  return sendSuccess(res, { product: p, totalStock, stockByWarehouse: stocks });
});

/**
 * POST /api/products
 * Create product. Optionally set initial stock in a warehouse (transactional).
 *
 * Body:
 *   name, sku, category_id?, description?, unit?, reorder_level?,
 *   initial_stock?, warehouse_id? (required if initial_stock is set)
 */
exports.create = asyncHandler(async (req, res) => {
  let { name, sku, category_id, description, unit, reorder_level,
          initial_stock, warehouse_id } = req.body;

  // Auto-generate SKU if not provided
  if (!sku) {
    sku = "PRD-" + Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  if (!name || !sku) throw new AppError("name and sku are required", 422);

  // Validate initial stock pairing
  if (initial_stock && !warehouse_id) {
    throw new AppError("warehouse_id is required when setting initial_stock", 422);
  }

  // Duplicate SKU check
  const existing = await model.findBySku(sku);
  if (existing) throw new AppError("SKU already exists", 409);

  // Auto-generate QR code from SKU
  const qr_code = `CINV-${sku}`;

  const p = await model.create({
    name, sku, category_id, description, unit, reorder_level,
    qr_code, initial_stock, warehouse_id, created_by: req.user.id,
  });

  // Return the product + any initial stock info
  const result = { product: p };
  if (initial_stock && warehouse_id) {
    result.initialStock = {
      warehouse_id,
      quantity: initial_stock,
      message: `Initial stock of ${initial_stock} set in warehouse ${warehouse_id}`,
    };
  }

  return sendSuccess(res, result, "Product created", 201);
});

/**
 * PUT /api/products/:id
 * Update product fields.
 */
exports.update = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);

  // If SKU is being changed, check for duplicates
  if (req.body.sku && req.body.sku !== p.sku) {
    const dup = await model.findBySku(req.body.sku);
    if (dup) throw new AppError("SKU already in use", 409);
  }

  const updated = await model.update(req.params.id, req.body);
  return sendSuccess(res, { product: updated }, "Product updated");
});

/**
 * DELETE /api/products/:id
 * Safe delete — checks FK dependencies first. Returns 409 if product is referenced.
 */
exports.remove = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);

  const deps = await model.checkDependencies(req.params.id);
  if (deps.length > 0) {
    const details = deps.map(d => `${d.count} ${d.label}`).join(", ");
    throw new AppError(
      `Cannot delete product — it has ${details}. Remove or reassign these first.`,
      409
    );
  }

  await model.remove(req.params.id);
  return sendSuccess(res, null, "Product deleted");
});

/**
 * PATCH /api/products/:id/qr-code
 * Generate/regenerate a QR code value from the product's SKU.
 */
exports.generateQrCode = asyncHandler(async (req, res) => {
  const p = await model.findById(req.params.id);
  if (!p) throw new AppError("Product not found", 404);

  // Custom QR value — can be overridden from body, otherwise auto-generated
  const qrValue = req.body.qr_code || `CINV-${p.sku}`;
  const updated = await model.setQrCode(req.params.id, qrValue);

  return sendSuccess(res, { product: updated }, "QR code generated");
});
