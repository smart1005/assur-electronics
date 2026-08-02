const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        message: "No image provided",
      });
    }

    const result = await cloudinary.uploader.upload(image, {
      folder: "assur-electronics",
      resource_type: "image",
    });

    res.status(200).json({
      message: "Image uploaded successfully",
      url: result.secure_url,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error uploading image",
      error: error.message,
    });
  }
};

module.exports = { uploadImage };
