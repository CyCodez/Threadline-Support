const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const multer = require("multer");

const uploadDirectory = path.join(__dirname, "..", "uploads", "screenshots");

fs.mkdirSync(uploadDirectory, {
  recursive: true,
});

const allowedMimeTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

const extensionByMimeType = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDirectory);
  },

  filename: (_req, file, cb) => {
    const extension = extensionByMimeType[file.mimetype] || ".bin";

    const uniqueName = `${Date.now()}-${crypto
      .randomBytes(12)
      .toString("hex")}${extension}`;

    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error("Only PNG, JPG and WEBP screenshots are allowed.");

    error.statusCode = 400;

    return cb(error);
  }

  cb(null, true);
};

const uploadScreenshot = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 5 * 1024 * 1024,

    files: 1,
  },
});

module.exports = {
  uploadScreenshot,
  uploadDirectory,
};
