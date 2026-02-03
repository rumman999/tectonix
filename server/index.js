import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cron from 'node-cron';

import authRoutes from "./routes/authRoutes.js";
import beaconRoutes from "./routes/beaconRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import zoneRoutes from './routes/zoneRoutes.js'; 
import buildingRoutes from "./routes/buildingRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";
import estimateRoutes from "./routes/estimateRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import rescueRoutes from "./routes/rescueRoutes.js";
import { updateMaterialRates } from './jobs/priceUpdater.js';



dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use("/api/auth", authRoutes);
app.use("/api/beacons", beaconRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use('/api/zones', zoneRoutes);
app.use("/api/buildings", buildingRoutes);
app.use("/api/scanner", aiRoutes);
app.use("/api/estimates", estimateRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/rescue", rescueRoutes);

updateMaterialRates();

cron.schedule('0 0 * * *', () => {
    console.log("⏰ Running Daily Price Update Job");
    updateMaterialRates();
});


app.get("/", (req, res) => {
  res.send("Tectonix API is running");
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
