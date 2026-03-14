const router = require("express").Router();
const ctrl = require("../controllers/notificationController");
const { protect, authorize } = require("../middleware/authMiddleware");

const BOTH = ["inventory_manager", "warehouse_staff"];

router.get  ("/",              protect, authorize(...BOTH), ctrl.getAll);
router.get  ("/unread-count",  protect, authorize(...BOTH), ctrl.getUnreadCount);
router.patch("/:id/read",  protect, authorize(...BOTH), ctrl.markRead);
router.patch("/read-all",  protect, authorize(...BOTH), ctrl.markAllRead);

module.exports = router;
