import express from 'express';
import { createBeacon, getMyBeacons } from '../controllers/beaconController.js';
import { verifyToken } from '../middleware/authMiddleware.js'; // <--- 1. Import it

const router = express.Router();

// 2. Add 'verifyToken' before the controller
router.post('/activate', verifyToken, createBeacon);
router.get('/history', verifyToken, getMyBeacons);

export default router;