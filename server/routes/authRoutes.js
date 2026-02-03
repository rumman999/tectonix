import express from "express";
import {
  register,
  login,
  getUserProfile,
  changePassword,
  getAvailableSkills,
  addVolunteerSkill,
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get("/profile", verifyToken, getUserProfile);

router.post('/change-password', verifyToken, changePassword);
router.get('/skills', verifyToken, getAvailableSkills);
router.post('/skills', verifyToken, addVolunteerSkill);

export default router;
