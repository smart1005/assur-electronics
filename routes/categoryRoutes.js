const express = require("express");
const router = express.Router();

const {
  addCategory,
  getCategories,
  deleteCategory,
} = require("../controllers/categoryController");

const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

router.get("/", getCategories); // public — customer homepage needs this too
router.post("/", protect, restrictTo("admin"), addCategory);
router.delete("/:id", protect, restrictTo("admin"), deleteCategory);

module.exports = router;
