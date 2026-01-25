import express from "express";
import { 
  getBuildings, 
  createBuilding, 
  getOwnershipHistory, 
  transferOwnership,
  getAllOwners,
  getBuildingList,
  updateRiskScore
} from "../controllers/buildingController.js";

const router = express.Router();

router.get("/", getBuildings);
router.get("/list", getBuildingList);
router.post("/", createBuilding);
router.get("/owners", getAllOwners);
router.get("/:id/ownership", getOwnershipHistory);
router.post("/transfer", transferOwnership);
router.patch("/:id/risk", updateRiskScore);

export default router;