import pool from "../config/db.js";

export const createBeacon = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    
    const user_id = req.user.user_id; 

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "GPS Location required" });
    }


    const newBeacon = await pool.query(
      `INSERT INTO Distress_Beacons (user_id, active_gps, status) 
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), 'Active') 
       RETURNING beacon_id, status, activated_at`,
      [user_id, longitude, latitude]
    );

    res.json({ 
      message: "Rescue Beacon Activated!", 
      beacon: newBeacon.rows[0] 
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

export const getMyBeacons = async (req, res) => {
  try {
    const user_id = req.user.user_id;
    
    const result = await pool.query(
      `SELECT beacon_id, status, activated_at, 
              ST_Y(active_gps::geometry) as lat, 
              ST_X(active_gps::geometry) as lng 
       FROM Distress_Beacons 
       WHERE user_id = $1 
       ORDER BY activated_at DESC`,
      [user_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};