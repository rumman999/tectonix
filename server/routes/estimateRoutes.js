import express from "express";
import { getMaterials, createEstimate } from "../controllers/estimateController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/materials", verifyToken, getMaterials);
router.post("/", verifyToken, createEstimate);

export default router;