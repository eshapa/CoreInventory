const asyncHandler = require("express-async-handler");
const { sendSuccess } = require("../utils/responseUtils");
const model = require("../models/notificationModel");

exports.getAll = asyncHandler(async (req, res) => {
  return sendSuccess(res, { notifications: await model.getForUser(req.user.id) });
});
exports.getUnreadCount = asyncHandler(async (req, res) => {
  return sendSuccess(res, { unreadCount: await model.getUnreadCount(req.user.id) });
});
exports.markRead = asyncHandler(async (req, res) => {
  await model.markRead(req.params.id, req.user.id);
  return sendSuccess(res, null, "Notification marked as read");
});
exports.markAllRead = asyncHandler(async (req, res) => {
  await model.markAllRead(req.user.id);
  return sendSuccess(res, null, "All notifications marked as read");
});
