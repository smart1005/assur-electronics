const express = require("express");
const router = express.Router();
const {
  register,
  login,
  adminLogin,
  refreshToken
} = require("../controllers/authController");

router.post("/register", register);
router.post("/login", login);
router.post("/admin/login", adminLogin);
router.post("/refresh-token", refreshToken);

module.exports = router;
