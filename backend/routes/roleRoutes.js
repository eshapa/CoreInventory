const router = require("express").Router();
const { findAll } = require("../models/roleModel");
const { sendSuccess } = require("../utils/responseUtils");
const asyncHandler = require("express-async-handler");

/** GET /api/roles — public, used to populate frontend role dropdown */
router.get("/", asyncHandler(async (req, res) => {
  const roles = await findAll();
  return sendSuccess(res, { roles });
}));

module.exports = router;
