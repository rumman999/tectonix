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
import { getBuildingSoilData } from "./controllers/sensorController.js";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./config/db.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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

app.get("/api/sensors/building/:buildingId", getBuildingSoilData);

app.use('/uploads', express.static('/home/spycakes/code/tectonix/server/uploads'));

updateMaterialRates();

cron.schedule('0 0 * * *', () => {
    console.log("⏰ Running Daily Price Update Job");
    updateMaterialRates();
});


app.get("/", (req, res) => {
  res.send("Tectonix API is running");
});

// Wrap Express with HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Or your specific frontend URL
    methods: ["GET", "POST"]
  }
});

// Make 'io' available to our Express controllers (crucial for system messages later!)
app.set('io', io);

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // 1. Join a specific mission room
  socket.on("join_mission", (taskId) => {
    socket.join(taskId);
    console.log(`User joined room: ${taskId}`);
  });

  // 2. Handle incoming messages
  socket.on("send_message", async (data) => {
    
    const { taskId, taskType, senderId, senderName, text } = data;

    try {
      // CRITICAL: Prevent Postgres from crashing if the ID is missing, empty, or not a UUID
      const validSenderId = (senderId && senderId.length > 10) ? senderId : null;

      // Save to database
      const result = await pool.query(
        `INSERT INTO Mission_Messages (task_type, task_id, sender_id, message) 
         VALUES ($1, $2, $3, $4) 
         RETURNING message_id, task_type, task_id, sender_id, message, is_system_message, created_at`,
        [taskType, taskId, validSenderId, text]
      );

      const savedMessage = {
        ...result.rows[0],
        sender_name: senderName || "A Responder" // Fallback name
      };

      // Broadcast to everyone in that specific room
      io.to(taskId).emit("receive_message", savedMessage);
      

    } catch (err) {
      console.error("❌ DATABASE INSERT ERROR:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
