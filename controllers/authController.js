const axios = require("axios");
const { getAuth } = require("firebase-admin/auth");
const { db } = require("../config/firebase");

const FIREBASE_API_KEY = process.env.FIREBASE_API_KEY;
if (!FIREBASE_API_KEY) {
  throw new Error("FIREBASE_API_KEY is required for auth controller");
}

const signInWithEmailAndPassword = async (email, password) => {
  const response = await axios.post(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      email,
      password,
      returnSecureToken: true,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

  return response.data;
};

const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;

    const userRecord = await getAuth().createUser({
      email,
      password,
      displayName: name,
    });

    await db.collection("users").doc(userRecord.uid).set({
      name,
      email,
      phone,
      address,
      role: "customer",
      createdAt: new Date(),
    });

    const authResult = await signInWithEmailAndPassword(email, password);

    res.status(201).json({
      message: "Account created successfully",
      token: authResult.idToken,
      user: {
        id: userRecord.uid,
        name,
        email,
        role: "customer",
      },
    });
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Error creating account";
    res.status(500).json({
      message: "Error creating account",
      error: message,
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const authResult = await signInWithEmailAndPassword(email, password);
    const userDoc = await db.collection("users").doc(authResult.localId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User record not found",
      });
    }

    const userData = userDoc.data();

    res.status(200).json({
      message: "Login successful",
      token: authResult.idToken,
      user: {
        id: authResult.localId,
        name: userData.name,
        email: authResult.email,
        role: userData.role,
      },
    });
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Error logging in";
    res.status(500).json({
      message: "Error logging in",
      error: message,
    });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const authResult = await signInWithEmailAndPassword(email, password);
    const userDoc = await db.collection("users").doc(authResult.localId).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        message: "User record not found",
      });
    }

    const userData = userDoc.data();

    if (userData.role !== "admin" && userData.role !== "superadmin") {
      return res.status(403).json({
        message: "Access denied. Admins only.",
      });
    }

    res.status(200).json({
      message: "Admin login successful",
      token: authResult.idToken,
      user: {
        id: authResult.localId,
        name: userData.name,
        email: authResult.email,
        role: userData.role,
      },
    });
  } catch (error) {
    const message =
      error.response?.data?.error?.message ||
      error.message ||
      "Error logging in";
    res.status(500).json({
      message: "Error logging in",
      error: message,
    });
  }
};

module.exports = { register, login, adminLogin };
