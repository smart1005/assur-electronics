const { db } = require("../config/firebase");

const addCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const normalizedName = name.trim();

    // Prevent duplicate categories (case-insensitive check)
    const existing = await db.collection("categories").get();
    const duplicate = existing.docs.find(
      (doc) => doc.data().name.toLowerCase() === normalizedName.toLowerCase(),
    );

    if (duplicate) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const categoryRef = await db.collection("categories").add({
      name: normalizedName,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Category added successfully",
      id: categoryRef.id,
      name: normalizedName,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding category",
      error: error.message,
    });
  }
};

const getCategories = async (req, res) => {
  try {
    const snapshot = await db
      .collection("categories")
      .orderBy("createdAt", "desc")
      .get();
    const categories = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.status(200).json({ categories });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching categories",
      error: error.message,
    });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("categories").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "Category not found" });
    }

    await db.collection("categories").doc(id).delete();

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting category",
      error: error.message,
    });
  }
};

module.exports = { addCategory, getCategories, deleteCategory };
