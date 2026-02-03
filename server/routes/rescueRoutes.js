import express from "express";
import { getRescueFeed, getPersonnel, assignPersonnel, getMyAssignments,
  updateAssignmentStatus } from "../controllers/rescueController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/feed", verifyToken, getRescueFeed);
router.get("/personnel", verifyToken, getPersonnel);
router.post("/assign", verifyToken, assignPersonnel);
router.get("/my-missions", verifyToken, getMyAssignments);
router.put("/mission-status", verifyToken, updateAssignmentStatus);

export default router;