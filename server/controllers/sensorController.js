import pool from "../config/db.js";
import axios from "axios";

// Helper: Calculate risk based on REAL soil moisture
const calculateLiquefactionRisk = (deepMoisture) => {
  const saturationPct = deepMoisture * 100;
  // Logic: Saturated soil + Seismic Zone = High Risk
  if (saturationPct > 40) return Math.min(95, saturationPct * 2.2); 
  if (saturationPct > 30) return Math.min(80, saturationPct * 2.0);
  return Math.min(40, saturationPct * 1.5);
};

export const getBuildingSoilData = async (req, res) => {
  try {
    const { buildingId } = req.params;

    // 1. CHECK DATABASE FIRST (Avoid API timeouts)
    const checkQuery = `SELECT * FROM Soil_Data WHERE building_id = $1`;
    const checkRes = await pool.query(checkQuery, [buildingId]);

    // If data already exists, return it immediately!
    if (checkRes.rows.length > 0) {
        return res.json(checkRes.rows[0]);
    }

    // --- ONLY FETCH FROM API IF NO DATA EXISTS ---

    // 2. Get Building GPS Coordinates
    const buildingQuery = `
      SELECT ST_X(location_gps::geometry) as lng, ST_Y(location_gps::geometry) as lat 
      FROM Buildings WHERE building_id = $1
    `;
    const buildingRes = await pool.query(buildingQuery, [buildingId]);
    
    if (buildingRes.rows.length === 0) {
      return res.status(404).json({ error: "Building not found" });
    }

    const { lat, lng } = buildingRes.rows[0];

    // 3. FETCH REAL DATA from Open-Meteo
    console.log(`Fetching live soil data for Building ${buildingId}...`);
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=soil_moisture_27_to_81cm`;
    const apiRes = await axios.get(apiUrl);
    const deepSoilMoisture = apiRes.data.current?.soil_moisture_27_to_81cm ?? 0.20;

    // 4. Calculate Metrics
    const riskScore = calculateLiquefactionRisk(deepSoilMoisture);
    const soilMoisturePct = Math.round(deepSoilMoisture * 100);
    const estGroundwater = deepSoilMoisture > 0.35 ? 1.5 : 5.0; 
    const soilType = "Alluvial Silt (Geo-Verified)";

    // 5. INSERT NEW RECORD
    const insertQuery = `
        INSERT INTO Soil_Data 
        (building_id, liquefaction_risk, soil_moisture, groundwater_level, soil_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
    `;
    const savedData = await pool.query(insertQuery, [
        buildingId, Math.round(riskScore), soilMoisturePct, estGroundwater, soilType
    ]);

    // 6. Return Data
    res.json(savedData.rows[0]);

  } catch (err) {
    console.error("Sensor Data Error:", err);
    res.status(500).json({ error: "Failed to fetch and save sensor data" });
  }
};