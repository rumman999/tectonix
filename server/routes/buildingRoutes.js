import express from "express";
import { 
  getBuildings, 
  createBuilding, 
  getOwnershipHistory, 
  transferOwnership,
  getAllOwners 
} from "../controllers/buildingController.js";

const router = express.Router();

router.get("/", getBuildings);
router.post("/", createBuilding);
router.get("/owners", getAllOwners);
router.get("/:id/ownership", getOwnershipHistory);
router.post("/transfer", transferOwnership);

export default router;