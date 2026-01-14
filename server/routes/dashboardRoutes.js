import express from "express";
import { 
    getDashboardStats, 
    getRecentLogs, 
    reportSeismicActivity, // Import new function
    getSystemStatus,       // Import new function
    resolveAlert
} from "../controllers/dashboardController.js";

const router = express.Router();

// Existing routes
router.get("/stats", getDashboardStats);
router.get("/logs", getRecentLogs);

// NEW: Seismic Crowd-Sourcing Routes
router.post("/seismic/report", reportSeismicActivity);
router.get("/seismic/status", getSystemStatus);
router.post("/seismic/resolve", resolveAlert);

export default router;