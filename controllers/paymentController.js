const axios = require("axios");
const crypto = require("crypto");
const { db } = require("../config/firebase");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// INITIALIZE PAYMENT — accepts either a single orderId or an array of orderIds
const initializePayment = async (req, res) => {
  try {
    const { orderId, orderIds, email, amount } = req.body;

    const ids = orderIds || (orderId ? [orderId] : null);

    if (!ids || ids.length === 0 || !email || !amount) {
      return res
        .status(400)
        .json({ message: "orderIds, email, and amount are required" });
    }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        metadata: { orderIds: ids },
        callback_url: `${req.protocol}://${req.get("host")}/order-success.html`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    res.status(200).json({
      message: "Payment initialized",
      data: response.data.data,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error initializing payment",
      error: error.response?.data?.message || error.message,
    });
  }
};

async function markOrdersPaid(orderIds) {
  if (!orderIds || orderIds.length === 0) return;
  await Promise.all(
    orderIds.map((id) =>
      db.collection("orders").doc(id).update({ paymentStatus: "paid" }),
    ),
  );
}

// VERIFY PAYMENT
const verifyPayment = async (req, res) => {
  try {
    const { reference } = req.params;

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      },
    );

    const paymentData = response.data.data;

    if (paymentData.status === "success") {
      const orderIds = paymentData.metadata?.orderIds || [];
      await markOrdersPaid(orderIds);

      return res.status(200).json({
        message: "Payment verified successfully",
        data: paymentData,
      });
    }

    res.status(400).json({
      message: "Payment not successful",
      data: paymentData,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error verifying payment",
      error: error.response?.data?.message || error.message,
    });
  }
};

// WEBHOOK — Paystack calls this directly the moment a payment succeeds
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers["x-paystack-signature"];

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(req.body) // raw Buffer (see index.js — this route uses express.raw)
      .digest("hex");

    if (hash !== signature) {
      return res.status(401).json({ message: "Invalid signature" });
    }

    const event = JSON.parse(req.body.toString());

    if (event.event === "charge.success") {
      const orderIds = event.data.metadata?.orderIds || [];
      await markOrdersPaid(orderIds);
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.sendStatus(500);
  }
};

module.exports = { initializePayment, verifyPayment, handleWebhook };
