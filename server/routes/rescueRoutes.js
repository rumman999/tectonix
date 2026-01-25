import express from "express";
import { getRescueFeed, getPersonnel, assignPersonnel } from "../controllers/rescueController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/feed", verifyToken, getRescueFeed);
router.get("/personnel", verifyToken, getPersonnel);
router.post("/assign", verifyToken, assignPersonnel);

export default router;