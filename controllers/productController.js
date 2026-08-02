const { db } = require("../config/firebase");

const MAX_FEATURED_PRODUCTS = 8;

const parseBoolean = (value) =>
  value === true || value === "true" || value === 1 || value === "1";

const addProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      brand,
      stock,
      images,
      whatsapp,
      featured,
    } = req.body;

    const isFeatured = parseBoolean(featured);

    // Non-featured products must have a category
    if (!isFeatured && !category) {
      return res.status(400).json({
        message: "Category is required for non-featured products",
      });
    }

    // Featured products are capped at MAX_FEATURED_PRODUCTS
    if (isFeatured) {
      const featuredSnapshot = await db
        .collection("products")
        .where("featured", "==", true)
        .get();

      if (featuredSnapshot.size >= MAX_FEATURED_PRODUCTS) {
        return res.status(400).json({
          message: `Cannot add more than ${MAX_FEATURED_PRODUCTS} featured products. Remove one first.`,
        });
      }
    }

    const productRef = await db.collection("products").add({
      name,
      description,
      price,
      category: isFeatured ? null : category,
      brand,
      stock,
      images: images || [],
      whatsapp: whatsapp || "08022243721",
      featured: isFeatured,
      createdAt: new Date(),
    });

    res.status(201).json({
      message: "Product added successfully",
      id: productRef.id,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error adding product",
      error: error.message,
    });
  }
};

const getProducts = async (req, res) => {
  try {
    const { category, brand, search, featured } = req.query;

    let query = db.collection("products");

    if (category) {
      query = query.where("category", "==", category);
    }

    if (brand) {
      query = query.where("brand", "==", brand);
    }

    if (featured === "true") {
      query = query.where("featured", "==", true);
    }

    const snapshot = await query.get();
    let products = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    if (search) {
      const searchLower = search.toLowerCase();
      products = products.filter(
        (product) =>
          product.name.toLowerCase().includes(searchLower) ||
          product.brand.toLowerCase().includes(searchLower) ||
          product.description.toLowerCase().includes(searchLower),
      );
    }

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching products",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    res.status(200).json({
      id: doc.id,
      ...doc.data(),
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching product",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (Object.prototype.hasOwnProperty.call(updates, "featured")) {
      updates.featured = parseBoolean(updates.featured);
    }

    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    if (updates.featured === true && doc.data().featured !== true) {
      const featuredSnapshot = await db
        .collection("products")
        .where("featured", "==", true)
        .get();

      if (featuredSnapshot.size >= MAX_FEATURED_PRODUCTS) {
        return res.status(400).json({
          message: `Cannot add more than ${MAX_FEATURED_PRODUCTS} featured products. Remove one first.`,
        });
      }
    }

    await db.collection("products").doc(id).update(updates);

    res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating product",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await db.collection("products").doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({
        message: "Product not found",
      });
    }

    await db.collection("products").doc(id).delete();

    res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting product",
      error: error.message,
    });
  }
};

module.exports = {
  addProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
