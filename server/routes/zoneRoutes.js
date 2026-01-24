import express from 'express';
import { getZoneFromLocation } from '../controllers/zoneController.js';

const router = express.Router();

router.post('/identify', getZoneFromLocation);

export default router;