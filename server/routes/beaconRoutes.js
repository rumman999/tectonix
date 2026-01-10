import express from 'express';
import { createBeacon, getMyBeacons } from '../controllers/beaconController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/activate', verifyToken, createBeacon);
router.get('/history', verifyToken, getMyBeacons);

export default router;