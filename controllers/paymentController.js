const axios = require("axios");
const crypto = require("crypto");
const { db } = require("../config/firebase");

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

// INITIALIZE PAYMENT — accepts either a single orderId or an array of orderIds
const initializePayment = async (req, res) => {
  try {
   const { orderId, orderIds, email } = req.body;

   const ids = orderIds || (orderId ? [orderId] : null);

   if (!ids || ids.length === 0 || !email) {
     return res
       .status(400)
       .json({ message: "orderIds and email are required" });
   }

   // Compute the amount from the real order records — never trust a client-supplied amount
   let amount = 0;
   for (const id of ids) {
     const orderDoc = await db.collection("orders").doc(id).get();
     if (!orderDoc.exists) {
       return res.status(404).json({ message: `Order ${id} not found` });
     }
     amount += orderDoc.data().totalPrice;
   }

    const response = await axios.post(
      "https://api.paystack.co/transaction/initialize",
      {
        email,
        amount: amount * 100,
        metadata: { orderIds: ids },
        callback_url: "https://assur-electronics.web.app/order-success.html",
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

async function getExpectedTotal(orderIds) {
  let total = 0;
  for (const id of orderIds) {
    const doc = await db.collection("orders").doc(id).get();
    if (doc.exists) total += doc.data().totalPrice;
  }
  return total;
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
     const expectedTotal = await getExpectedTotal(orderIds);

     if (paymentData.amount !== expectedTotal * 100) {
       console.error(
         "Amount mismatch on verify:",
         paymentData.amount,
         "expected",
         expectedTotal * 100,
       );
       return res
         .status(400)
         .json({ message: "Payment amount does not match order total" });
     }

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
     const expectedTotal = await getExpectedTotal(orderIds);

     if (event.data.amount === expectedTotal * 100) {
       await markOrdersPaid(orderIds);
     } else {
       console.error(
         "Webhook amount mismatch:",
         event.data.amount,
         "expected",
         expectedTotal * 100,
       );
     }
   }

    res.sendStatus(200);
  } catch (error) {
    console.error("Webhook error:", error.message);
    res.sendStatus(500);
  }
};

module.exports = { initializePayment, verifyPayment, handleWebhook };
