require("dotenv").config();

const express = require("express");
const app = express();
const PORT = process.env.PORT || 4000;

const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const categoryRoutes = require("./routes/categoryRoutes");

const { errorHandler } = require("./middleware/errorHandler");
app.get("/", (req, res) => {
  res.json({ message: "Assur Electronics API is running" });
});
app.use(express.static("public"));
app.use("/api/payments/webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "8mb" }));
app.use("/api/orders", orderRoutes);

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/categories", categoryRoutes);
// error handler must be LAST — after all routes
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
