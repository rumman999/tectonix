import express from "express";
import { 
  getBuildings, 
  createBuilding, 
  getOwnershipHistory, 
  transferOwnership,
  getAllOwners,
  getBuildingList,
  updateRiskScore,
  getReportableBuildings
} from "../controllers/buildingController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

// 1. GET ALL (Secured with verifyToken so controller can see req.user)
router.get("/", verifyToken, getBuildings);

// 2. PUBLIC LIST (For dropdowns/calculator)
router.get("/list", getBuildingList);

// 3. CREATE BUILDING (Secured: Needs verifyToken to check if user is Owner)
router.post("/", verifyToken, createBuilding);

// 4. REPORTABLE LIST (Secured)
router.get("/reportable", verifyToken, getReportableBuildings);

// 5. OTHER ROUTES
router.get("/owners", getAllOwners);
router.get("/:id/ownership", getOwnershipHistory);
router.post("/transfer", transferOwnership);
router.patch("/:id/risk", updateRiskScore);

export default router;