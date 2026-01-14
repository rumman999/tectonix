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

// --- GET RECENT LOGS ---
export const getRecentLogs = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT v.vibe_id, v.intensity_pga, v.detected_at, d.device_model 
      FROM Seismic_Vibrations v
      LEFT JOIN Devices d ON v.device_id = d.device_id
      ORDER BY v.detected_at DESC LIMIT 8
    `);

    const logs = result.rows.map(row => ({
      id: row.vibe_id,
      sensor: row.device_model || "Unknown",
      location: "Dhaka",
      status: row.intensity_pga > 0.2 ? "alert" : "stable",
      magnitude: parseFloat(row.intensity_pga).toFixed(2),
      timestamp: row.detected_at
    }));

    res.json(logs);
  } catch (err) {
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
        // Change '1' back to '50' when ready for production!
        if (distinctDeviceCount >= 1) {
            
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