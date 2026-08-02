const express = require("express");
const router = express.Router();

const {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
} = require("../controllers/orderController");

const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

router.post("/", protect, createOrder);
router.get("/", protect, restrictTo("admin"), getAllOrders);
router.get("/my-orders", protect, getMyOrders);
router.get("/:id", protect, getOrderById);
router.put("/:id/status", protect, restrictTo("admin"), updateOrderStatus);

module.exports = router;
