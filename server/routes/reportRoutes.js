import express from "express";
import multer from "multer";
import { createDamageReport } from "../controllers/reportController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import path from "path";
import fs from "fs";

const router = express.Router();

// Ensure 'uploads' directory exists
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

// Configure Image Storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp + original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// POST /api/reports
router.post("/", verifyToken, upload.single("image"), createDamageReport);

export default router;