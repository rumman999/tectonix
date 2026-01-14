import express from 'express';
import { createBeacon, getMyBeacons } from '../controllers/beaconController.js';


const router = express.Router();

router.post('/activate', createBeacon);
router.get('/history', getMyBeacons);

export default router;