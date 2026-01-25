import express from "express";
import multer from "multer";
import { analyzeImage } from "../controllers/aiController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Configure basic storage
const upload = multer({ dest: "uploads/" });

// POST /api/scanner/analyze
router.post("/analyze", verifyToken, upload.single("image"), analyzeImage);

export default router;