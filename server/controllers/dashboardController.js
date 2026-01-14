import pool from "../config/db.js";

export const getDashboardStats = async (req, res) => {
  try {
    // Run 3 queries in parallel for speed
    const [buildingsRes, sensorsRes, alertsRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM Buildings"),
      pool.query("SELECT COUNT(*) FROM Devices"),
      pool.query("SELECT COUNT(*) FROM Distress_Beacons WHERE status = 'Active'")
    ]);

    res.json({
      buildings: parseInt(buildingsRes.rows[0].count) || 0,
      sensors: parseInt(sensorsRes.rows[0].count) || 0,
      alerts: parseInt(alertsRes.rows[0].count) || 0,
      network_health: 98.5 // You can calculate this later based on active/inactive devices
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

export const getRecentLogs = async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT ON (v.vibe_id)
        v.vibe_id, 
        v.intensity_pga, 
        v.detected_at, 
        d.device_model,
        COALESCE(z.zone_name, 'Dhaka') as location_name, -- Default to 'Dhaka' if null
        ST_Y(v.location_gps::geometry) as lat, 
        ST_X(v.location_gps::geometry) as lng 
      FROM Seismic_Vibrations v
      LEFT JOIN Devices d ON v.device_id = d.device_id
      -- Join with Zones where the point is inside the boundary
      LEFT JOIN Zones z ON ST_Intersects(z.boundary, v.location_gps)
      
      -- Order by Time DESC, then by Smallest Zone (Specific) to Largest (General)
      ORDER BY v.vibe_id, ST_Area(z.boundary) ASC
    `;
    
    // We wrap the above logic to get the final list sorted by time
    const finalQuery = `
      WITH RankedLogs AS (
        SELECT 
            v.vibe_id, 
            v.intensity_pga, 
            v.detected_at, 
            d.device_model,
            COALESCE(z.zone_name, 'Dhaka') as zone_name,
            ST_Y(v.location_gps::geometry) as lat, 
            ST_X(v.location_gps::geometry) as lng,
            -- Rank zones by area: Smallest (1) is best match
            ROW_NUMBER() OVER (PARTITION BY v.vibe_id ORDER BY ST_Area(z.boundary) ASC) as rn
        FROM Seismic_Vibrations v
        LEFT JOIN Devices d ON v.device_id = d.device_id
        LEFT JOIN Zones z ON ST_Intersects(z.boundary, v.location_gps)
      )
      SELECT * FROM RankedLogs 
      WHERE rn = 1 -- Get only the best matching zone for each vibration
      ORDER BY detected_at DESC
      LIMIT 8;
    `;

    const result = await pool.query(finalQuery);

    const logs = result.rows.map(row => {
      let status = "stable";
      if (row.intensity_pga > 0.1) status = "warning";
      if (row.intensity_pga > 0.2) status = "alert";
      if (row.intensity_pga > 0.5) status = "critical";

      return {
        id: row.vibe_id,
        sensor: row.device_model || "Unknown",
        location: row.zone_name, // Now purely dynamic!
        status: status,
        magnitude: parseFloat(row.intensity_pga).toFixed(2),
        timestamp: row.detected_at
      };
    });

    res.json(logs);
  } catch (err) {
    console.error("Dashboard Logs Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};