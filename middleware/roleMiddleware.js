const { db } = require("../config/firebase");

const restrictTo = (...roles) => {
  return async (req, res, next) => {
    try {
      const userDoc = await db.collection("users").doc(req.user.uid).get();
      const userData = userDoc.data();

      if (!roles.includes(userData.role)) {
        return res.status(403).json({
          message: "Access denied. You do not have permission.",
        });
      }

      req.userRole = userData.role;
      next();
    } catch (error) {
      res.status(500).json({
        message: "Error checking permissions",
        error: error.message,
      });
    }
  };
};

module.exports = { restrictTo };
