import express from "express";
import { 
  getBuildings, 
  createBuilding, 
  getOwnershipHistory, 
  transferOwnership,
  getAllOwners,
  getBuildingList,
  updateRiskScore,
  getReportableBuildings,
  getPendingAssessments,
  getBuildingMapData,
  getBuildingReports,
} from "../controllers/buildingController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, getBuildings);
router.get("/list", getBuildingList);
router.post("/", verifyToken, createBuilding);
router.get("/reportable", verifyToken, getReportableBuildings);
router.get("/owners", getAllOwners);
router.get("/:id/ownership", getOwnershipHistory);
router.post("/transfer", transferOwnership);
router.get('/map-data', getBuildingMapData);
router.patch("/:id/risk", verifyToken, updateRiskScore);
router.get("/pending", verifyToken, getPendingAssessments);
router.get("/:id/reports", verifyToken, getBuildingReports);

export default router;