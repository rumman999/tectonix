import express from "express";
import { 
    getDashboardStats, 
    getRecentLogs, 
    reportSeismicActivity, 
    getSystemStatus,     
    resolveAlert,
    getAlertFeed,
    getSeismicChartData,
    getRiskDistribution,
    getBuildingRiskDistribution
} from "../controllers/dashboardController.js";



const router = express.Router();



router.get("/stats", getDashboardStats);
router.get("/logs", getRecentLogs);
router.get("/seismic/status", getSystemStatus);
router.get("/alerts", getAlertFeed);
router.get("/chart", getSeismicChartData);
router.get("/risk-distribution", getRiskDistribution);
router.get("/building-risk", getBuildingRiskDistribution);

router.post("/seismic/report", reportSeismicActivity);
router.post("/seismic/resolve", resolveAlert);


export default router;