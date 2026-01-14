import express from "express";
import { getDashboardStats, getRecentLogs } from "../controllers/dashboardController.js";

const router = express.Router();

router.get("/stats", getDashboardStats);
router.get("/logs", getRecentLogs);

export default router;