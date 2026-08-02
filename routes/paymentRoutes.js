const express = require("express");
const router = express.Router();

const {
  initializePayment,
  verifyPayment,
  handleWebhook,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");

router.post("/initialize", protect, initializePayment);
router.get("/verify/:reference", protect, verifyPayment);
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  handleWebhook,
);

module.exports = router;
