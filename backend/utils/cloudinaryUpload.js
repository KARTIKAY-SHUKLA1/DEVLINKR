const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("./cloudinary"); // this should be your cloudinary.js config

// Storage setup
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "DevMeetUsers",
    allowed_formats: ["jpg", "png", "jpeg", "gif", "webp", "pdf"],
    public_id: (req, file) => {
      const name = file.originalname.split(".")[0].replace(/\s+/g, "_");
      return `${name}-${Date.now()}`;
    },
  },
});

const upload = multer({ storage });

module.exports = upload;
