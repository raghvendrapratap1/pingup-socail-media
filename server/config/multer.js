

import multer from "multer";

// Storage settings (ya default memory storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // folder jahan files save hongi
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

// Multer instance
const upload = multer({ storage });

export default upload;
