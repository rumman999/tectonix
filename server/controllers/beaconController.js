import pool from "../config/db.js";


export const createBeacon = async (req, res) => {
  try {
    const { lat, lng, status } = req.body;
    

    const userId = req.user.user_id; 

    if (!lat || !lng) {
      return res.status(400).json({ error: "GPS coordinates are required" });
    }

    const query = `
      INSERT INTO Distress_Beacons (user_id, active_gps, status, activated_at)
      VALUES ($1, ST_GeographyFromText($2), $3, NOW())
      RETURNING beacon_id, status, activated_at, 
                ST_Y(active_gps::geometry) as lat, 
                ST_X(active_gps::geometry) as lng
    `;
    
    const pointStr = `POINT(${lng} ${lat})`;

    const newBeacon = await pool.query(query, [
      userId, 
      pointStr, 
      status || 'Active'
    ]);

    res.json(newBeacon.rows[0]);

  } catch (err) {
    console.error("Create Beacon Error:", err.message);
    res.status(500).send("Server Error");
  }
};

export const getMyBeacons = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const query = `
      SELECT 
        beacon_id, 
        status, 
        activated_at,
        ST_Y(active_gps::geometry) as lat, 
        ST_X(active_gps::geometry) as lng
      FROM Distress_Beacons 
      WHERE user_id = $1 
      ORDER BY activated_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);

  } catch (err) {
    console.error("Get Beacons Error:", err.message);
    res.status(500).send("Server Error");
  }
};