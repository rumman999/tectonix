import pool from "../config/db.js";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";

export const analyzeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { building_id } = req.body;
    const filePath = req.file.path;

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const aiResponse = await axios.post("http://127.0.0.1:8000/analyze", formData, {
      headers: {
        ...formData.getHeaders(),
      },
    });

    const aiData = aiResponse.data; 

    const riskScore = aiData.risk_score;
    const structuralIntegrity = Math.max(0, 100 - riskScore - 10);
    const liquefactionRisk = Math.min(100, riskScore + 20);
    const foundationStability = Math.max(0, 100 - riskScore * 1.2);

    let recommendations = [];
    if (aiData.risk_status === "CRITICAL_SOFT_STORY") {
      recommendations = [
        "Immediate soft-story retrofit required",
        "Install steel moment frames on ground floor",
        "Evacuate if visible cracks appear",
      ];
    } else if (aiData.risk_status === "MODERATE_RISK") {
      recommendations = [
        "Schedule structural engineer inspection",
        "Check foundation for minor shifting",
      ];
    } else {
      recommendations = ["Routine maintenance recommended", "Structure appears stable"];
    }

    /*
    await pool.query(
      "INSERT INTO Scans (building_id, risk_score, ai_data, scan_date) VALUES ($1, $2, $3, NOW())",
      [building_id, riskScore, JSON.stringify(aiData)]
    );
    */

    fs.unlinkSync(filePath);

    res.json({
      success: true,
      data: {
        riskScore: riskScore,
        riskLevel: aiData.risk_status,
        structuralIntegrity: Math.round(structuralIntegrity),
        liquefactionRisk: Math.round(liquefactionRisk),
        foundationStability: Math.round(foundationStability),
        recommendations: recommendations,
        detected_elements: aiData.detected_elements
      }
    });

  } catch (error) {
    console.error("AI Scan Error:", error.message);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ message: "AI Engine connection failed" });
  }
};
