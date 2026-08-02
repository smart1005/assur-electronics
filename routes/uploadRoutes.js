const express = require("express");
const router = express.Router();
const { uploadImage } = require("../controllers/uploadController");
const { protect } = require("../middleware/authMiddleware");
const { restrictTo } = require("../middleware/roleMiddleware");

router.post("/image", protect, restrictTo("admin"), uploadImage);

module.exports = router;
