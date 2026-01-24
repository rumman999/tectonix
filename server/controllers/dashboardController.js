import pool from "../config/db.js";
import jwt from "jsonwebtoken";

// --- GET DASHBOARD STATS ---
export const getDashboardStats = async (req, res) => {
  try {
    const [buildingsRes, sensorsRes, alertsRes] = await Promise.all([
      pool.query("SELECT COUNT(*) FROM Buildings"),
      pool.query("SELECT COUNT(*) FROM Devices"),
      pool.query("SELECT COUNT(*) FROM Distress_Beacons WHERE status = 'Active'")
    ]);

    res.json({
      buildings: parseInt(buildingsRes.rows[0].count) || 0,
      sensors: parseInt(sensorsRes.rows[0].count) || 0,
      alerts: parseInt(alertsRes.rows[0].count) || 0,
      network_health: 98.5 
    });
  } catch (err) {
    console.error("Stats Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

export const getRecentLogs = async (req, res) => {
  try {
    // 1. You MUST use ST_X and ST_Y to get coordinates from the geometry/geography column
    // 2. Added the LATERAL JOIN to find the specific zone name
    const result = await pool.query(`
      SELECT 
        v.vibe_id, 
        v.intensity_pga, 
        v.detected_at, 
        d.device_model,
        ST_X(v.location_gps::geometry) as lng, -- Extracts Longitude
        ST_Y(v.location_gps::geometry) as lat, -- Extracts Latitude
        z.zone_name
      FROM Seismic_Vibrations v
      LEFT JOIN Devices d ON v.device_id = d.device_id
      LEFT JOIN LATERAL (
        SELECT zone_name FROM zones 
        WHERE ST_Intersects(zones.boundary, v.location_gps::geography)
        ORDER BY ST_Area(boundary) ASC 
        LIMIT 1
      ) z ON true
      ORDER BY v.detected_at DESC 
      LIMIT 15;
    `);

    const logs = result.rows.map(row => {
      // Clean up the browser string
      let sensorType = row.device_model || "Mobile Sensor";
      if (sensorType.includes("Mozilla")) {
        sensorType = sensorType.includes("Android") ? "Android Device" : 
                     sensorType.includes("iPhone") ? "iOS Device" : "Web Browser";
      }

      return {
        id: row.vibe_id.toString().substring(0, 8),
        sensor: sensorType,
        location: row.zone_name || "Unknown Zone",
        // CRITICAL: You must include these so the map has coordinates!
        lat: parseFloat(row.lat),
        lng: parseFloat(row.lng),
        status: row.intensity_pga > 1.0 ? "danger" : row.intensity_pga > 0.3 ? "warning" : "safe",
        magnitude: parseFloat(row.intensity_pga).toFixed(2),
        timestamp: row.detected_at
      };
    });

    res.json(logs);
  } catch (err) {
    console.error("Logs Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// --- GET RISK DISTRIBUTION ---
export const getRiskDistribution = async (req, res) => {
  try {
    const query = `
      SELECT 
        CASE 
          WHEN intensity_pga > 1.2 THEN 'Danger'
          WHEN intensity_pga > 0.4 THEN 'Warning'
          ELSE 'Safe'
        END as risk_level,
        COUNT(*) as count
      FROM (
        SELECT DISTINCT ON (device_id) intensity_pga 
        FROM Seismic_Vibrations 
        ORDER BY device_id, detected_at DESC
      ) last_readings
      GROUP BY risk_level;
    `;

    const result = await pool.query(query);
    
    // Format for Recharts (e.g., [{ name: 'Safe', value: 10 }, ...])
    const distribution = result.rows.map(row => ({
      name: row.risk_level,
      value: parseInt(row.count)
    }));

    res.json(distribution);
  } catch (err) {
    console.error("Risk Dist Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// --- GET BUILDING RISK DISTRIBUTION ---
export const getBuildingRiskDistribution = async (req, res) => {
  try {
    // Logic:
    // Risk Score < 20 : Safe
    // Risk Score > 80 : High Risk
    // 20 - 80         : Moderate Risk
    const query = `
      SELECT 
        CASE 
          WHEN risk_score < 20 THEN 'Safe'
          WHEN risk_score > 80 THEN 'High Risk'
          ELSE 'Moderate Risk'
        END as name,
        COUNT(*) as value
      FROM Buildings
      GROUP BY name;
    `;

    const result = await pool.query(query);
    
    // Send back formatted data
    const distribution = result.rows.map(row => ({
      name: row.name,
      value: parseInt(row.value)
    }));

    res.json(distribution);
  } catch (err) {
    console.error("Building Risk Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};


// --- REPORT SEISMIC ACTIVITY (The Trigger) ---
export const reportSeismicActivity = async (req, res) => {
    const { lat, lng, magnitude, client_uuid } = req.body;
    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    
    // 1. OPTIONAL: Link User ID if logged in
    let user_id = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            user_id = decoded.user_id;
        } catch (error) { console.log("Anonymous Report"); }
    }

    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');

        let deviceId;

        // 2. Find or Create Device
        const deviceCheck = await client.query(
            "SELECT device_id FROM Devices WHERE client_uuid = $1 LIMIT 1", [client_uuid]
        );

        if (deviceCheck.rows.length > 0) {
            deviceId = deviceCheck.rows[0].device_id;
            // Update last_active
            await client.query("UPDATE Devices SET last_active = NOW() WHERE device_id = $1", [deviceId]);
            if(user_id) {
                 await client.query("UPDATE Devices SET user_id = $2 WHERE device_id = $1", [deviceId, user_id]);
            }
        } else {
            const newDevice = await client.query(
                `INSERT INTO Devices (client_uuid, device_model, user_id, last_active) 
                 VALUES ($1, $2, $3, NOW()) RETURNING device_id`,
                [client_uuid, userAgent, user_id]
            );
            deviceId = newDevice.rows[0].device_id;
        }

        // 3. Log Vibration
        await client.query(
            `INSERT INTO Seismic_Vibrations (device_id, location_gps, intensity_pga, detected_at) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, NOW())`,
            [deviceId, lng, lat, magnitude]
        );

        // 4. CHECK FOR DANGER (Sliding Window 10s)
        const countResult = await client.query(`
            SELECT COUNT(DISTINCT device_id) FROM Seismic_Vibrations 
            WHERE detected_at > NOW() - INTERVAL '10 seconds'
        `);

        const distinctDeviceCount = parseInt(countResult.rows[0].count);
        
        // --- THRESHOLD LOGIC ---
        // Actually it would be 50, used a lower value of devices for demonstration
        if (distinctDeviceCount >= 2) {
            
            // A. Create Event if missing
            const activeEvent = await client.query(
                "SELECT event_id FROM Disaster_Events WHERE event_type = 'Earthquake' AND is_active = TRUE"
            );

            if (activeEvent.rows.length === 0) {
                await client.query(
                    `INSERT INTO Disaster_Events (event_type, epicenter_gps, magnitude, is_active)
                     VALUES ('Earthquake', ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, TRUE)`,
                    [lng, lat, 5.0]
                );
            }

            // B. FORCE UPDATE THE SYSTEM ALERT STATUS
            await client.query("UPDATE system_alerts SET status = 'CRITICAL'");
        }

        await client.query('COMMIT');
        res.json({ status: distinctDeviceCount >= 1 ? 'CRITICAL' : 'SAFE', deviceCount: distinctDeviceCount });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Report Error:", err);
        res.status(500).send("Server Error");
    } finally {
        client.release();
    }
};

// --- RESOLVE ALERT (The "I Am Safe" Button) ---
export const resolveAlert = async (req, res) => {
  try {
    // 1. Turn off Event
    await pool.query("UPDATE Disaster_Events SET is_active = FALSE WHERE is_active = TRUE");
    
    // 2. Clear Vibrations (Reset Counter)
    await pool.query("DELETE FROM Seismic_Vibrations");

    // 3. Reset System Status (Turn off Red Screen)
    await pool.query("UPDATE system_alerts SET status = 'SAFE'");

    res.json({ message: "System Reset to Safe." });
  } catch (err) {
    console.error("Resolve Error:", err);
    res.status(500).send("Server Error");
  }
};

// --- GET CHART DATA (24 Hours) ---
export const getSeismicChartData = async (req, res) => {
  try {
    // We fetch data specifically from our "Main Station" or average all sensors
    const query = `
      SELECT 
        to_char(detected_at, 'HH24:MI') as time,
        AVG(intensity_pga)::numeric(10,3) as magnitude
      FROM Seismic_Vibrations
      WHERE detected_at > NOW() - INTERVAL '24 hours'
      GROUP BY detected_at
      ORDER BY detected_at ASC;
    `;

    const result = await pool.query(query);

    // Format for Recharts
    const chartData = result.rows.map(row => ({
      time: row.time,
      magnitude: parseFloat(row.magnitude)
    }));

    res.json(chartData);
  } catch (err) {
    console.error("Chart Data Error:", err.message);
    res.status(500).json({ error: "Server Error" });
  }
};

// --- GET UNIFIED ALERT FEED ---
export const getAlertFeed = async (req, res) => {
  try {
    const query = `
      (
        -- 1. Active Earthquakes
        SELECT 
          event_id::text as id, 
          'critical' as type, 
          'Earthquake Detected' as title, 
          NOW() as time, -- Fallback to NOW() if timestamp column differs
          'Epicenter: ' || event_type as location
        FROM Disaster_Events 
        WHERE is_active = TRUE
      )
      UNION ALL
      (
        -- 2. Rescue Requests
        SELECT 
          beacon_id::text as id, 
          'alert' as type, 
          'Rescue Requested' as title, 
          activated_at as time, 
          'Status: ' || status as location
        FROM Distress_Beacons 
        WHERE status = 'Active'
      )
      UNION ALL
      (
        -- 3. Severe Vibrations (Using your working logic from Recent Logs)
        SELECT 
          v.vibe_id::text as id, 
          'warning' as type,
          'Seismic Activity' as title, 
          v.detected_at as time, 
          COALESCE(z.zone_name, 'Dhaka') as location
        FROM Seismic_Vibrations v
        LEFT JOIN LATERAL (
          SELECT zone_name FROM zones 
          WHERE ST_Intersects(zones.boundary, v.location_gps::geography)
          LIMIT 1
        ) z ON true
        WHERE v.intensity_pga > 0.5
      )
      ORDER BY time DESC 
      LIMIT 10;
    `;

    const result = await pool.query(query);
    
    const formattedAlerts = result.rows.map(row => ({
      id: row.id,
      type: row.type,
      title: row.title,
      location: row.location,
      time: new Date(row.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    res.json(formattedAlerts);
  } catch (err) {
    // THIS WILL SHOW YOU THE REAL ERROR IN YOUR TERMINAL
    console.error("CRITICAL DATABASE ERROR:", err.message); 
    res.status(500).json({ error: "Database error", details: err.message });
  }
};

// --- GET STATUS ---
export const getSystemStatus = async (req, res) => {
    try {
        // We now check system_alerts first for speed
        const result = await pool.query("SELECT status FROM system_alerts LIMIT 1");
        
        if (result.rows.length > 0 && result.rows[0].status === 'CRITICAL') {
             // Fetch details if needed
             const event = await pool.query("SELECT * FROM Disaster_Events WHERE is_active = TRUE LIMIT 1");
             res.json({ status: 'CRITICAL', details: event.rows[0] });
        } else {
            res.json({ status: 'SAFE' });
        }
    } catch (err) {
        res.status(500).send("Server Error");
    }
};