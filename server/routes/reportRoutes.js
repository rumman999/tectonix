import express from "express";
import multer from "multer";
import { createDamageReport } from "../controllers/reportController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// Store the file in memory so we can send it directly to Supabase
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/reports
router.post("/", verifyToken, upload.single("image"), createDamageReport);

export default router;