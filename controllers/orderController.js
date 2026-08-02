const { db } = require("../config/firebase");

// CREATE ORDER — customer places an order
const createOrder = async (req, res) => {
  try {
    const {
      productId,
      quantity,
      customerName,
      customerEmail,
      customerAddress,
    } = req.body;
    const customer = req.user.uid; // from authMiddleware

    if (
      !productId ||
      !quantity ||
      !customerName ||
      !customerEmail ||
      !customerAddress
    ) {
      return res.status(400).json({ message: "Missing required order fields" });
    }

    const productRef = db.collection("products").doc(productId);

    const order = await db.runTransaction(async (transaction) => {
      const productDoc = await transaction.get(productRef);

      if (!productDoc.exists) {
        throw new Error("Product not found");
      }

      const productData = productDoc.data();

      if (productData.stock < quantity) {
        throw new Error("Insufficient stock");
      }

      const newStock = productData.stock - quantity;
      transaction.update(productRef, { stock: newStock });

      const totalPrice = productData.price * quantity;

      const orderRef = db.collection("orders").doc();
      const newOrder = {
        productId,
        quantity,
        customer,
        customerName,
        customerEmail,
        customerAddress,
        totalPrice,
        status: "pending",
        paymentStatus: "unpaid",
        createdAt: new Date().toISOString(),
      };

      transaction.set(orderRef, newOrder);

      return { id: orderRef.id, ...newOrder };
    });

    res.status(201).json({
      message: "Order created successfully",
      order,
    });
  } catch (error) {
    res.status(400).json({
      message: "Error creating order",
      error: error.message,
    });
  }
};

// GET ALL ORDERS — admin only
const getAllOrders = async (req, res) => {
  try {
    const snapshot = await db.collection("orders").get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching orders", error: error.message });
  }
};

// GET MY ORDERS — customer sees their own orders
const getMyOrders = async (req, res) => {
  try {
    const customer = req.user.uid;
    const snapshot = await db
      .collection("orders")
      .where("customer", "==", customer)
      .get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.status(200).json({ orders });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching your orders", error: error.message });
  }
};

// GET ONE ORDER — only the order's owner or an admin/superadmin may view it
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const orderDoc = await db.collection("orders").doc(id).get();

    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    const order = orderDoc.data();

    const userDoc = await db.collection("users").doc(req.user.uid).get();
    const role = userDoc.exists ? userDoc.data().role : null;
    const isOwner = order.customer === req.user.uid;
    const isAdmin = role === "admin" || role === "superadmin";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ message: "Access denied. Not your order." });
    }

    res.status(200).json({ id: orderDoc.id, ...order });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching order", error: error.message });
  }
};

// UPDATE ORDER STATUS — admin only
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = [
      "pending",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const orderRef = db.collection("orders").doc(id);
    const orderDoc = await orderRef.get();

    if (!orderDoc.exists) {
      return res.status(404).json({ message: "Order not found" });
    }

    await orderRef.update({ status });

    res.status(200).json({ message: "Order status updated", status });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating order status", error: error.message });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
};
