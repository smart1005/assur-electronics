const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getFirestore } = require("firebase-admin/firestore");
const path = require("path");
const fs = require("fs");

const getServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    } catch (error) {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_KEY JSON");
    }
  }

  if (
    process.env.FIREBASE_PRIVATE_KEY &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PROJECT_ID
  ) {
    return {
      type: "service_account",
      project_id: process.env.FIREBASE_PROJECT_ID,
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  const serviceAccountPath = path.resolve(
    __dirname,
    "../serviceAccountKey.json",
  );
  if (fs.existsSync(serviceAccountPath)) {
    return require(serviceAccountPath);
  }

  throw new Error(
    "Firebase service account credentials are not configured. " +
      "Set FIREBASE_SERVICE_ACCOUNT_KEY or FIREBASE_PRIVATE_KEY/FIREBASE_CLIENT_EMAIL/FIREBASE_PROJECT_ID.",
  );
};

const serviceAccount = getServiceAccount();
const adminApp =
  getApps().length === 0
    ? initializeApp({ credential: cert(serviceAccount) })
    : getApps()[0];

const db = getFirestore(adminApp);

module.exports = { db };
