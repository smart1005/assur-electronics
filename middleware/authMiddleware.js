const { db } = require("../config/firebase");
const { getAuth } = require("firebase-admin/auth");

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "No token provided. Please login.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decodedToken = await getAuth().verifyIdToken(token);
    req.user = decodedToken;

    next();
  } catch (error) {
    res.status(401).json({
      message: "Invalid or expired token. Please login again.",
      error: error.message,
    });
  }
};

module.exports = { protect };
