const express = require("express");
const router = express.Router();
const {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

router.get("/", getProducts);
router.get("/:id", getProductById);
router.post("/", protect, restrictTo("admin"), addProduct);
router.put("/:id", protect, restrictTo("admin"), updateProduct);
router.delete("/:id", protect, restrictTo("admin"), deleteProduct);

module.exports = router;
