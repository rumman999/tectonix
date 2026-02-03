import pool from "../config/db.js";

export const getBuildings = async (req, res) => {
  try {
    const { user_id, role } = req.user; 
    
    let query = "";
    let params = [];

    const selectFields = `
      b.building_id, 
      b.building_name, 
      b.address_text, 
      b.construction_year, 
      b.risk_score,
      ST_X(b.location_gps::geometry) as lng, 
      ST_Y(b.location_gps::geometry) as lat 
    `;

    if (role === 'Owner') {

      query = `
        SELECT ${selectFields}
        FROM Buildings b
        JOIN Building_Ownership bo ON b.building_id = bo.building_id
        WHERE bo.owner_id = $1 AND bo.end_date IS NULL
        ORDER BY b.created_at DESC
      `;
      params = [user_id];
    } else {

      query = `
        SELECT ${selectFields} 
        FROM Buildings b 
        ORDER BY b.created_at DESC
      `;
    }

    const result = await pool.query(query, params);
    
    const buildings = result.rows.map(row => ({
      ...row,
      location_gps: { lat: row.lat, lng: row.lng }
    }));

    res.json(buildings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

export const createBuilding = async (req, res) => {
  const { building_name, address_text, construction_year, location_gps } = req.body;
  
  // 1. Validation: Only Owners can create
  // req.user comes from verifyToken middleware
  const { user_id, role } = req.user; 

  if (role !== 'Owner') {
      return res.status(403).json({ error: "Only Owners can register new buildings." });
  }
  
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 2. Insert Building
    const buildingQuery = `
      INSERT INTO Buildings 
      (building_name, address_text, construction_year, location_gps, risk_score)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), NULL)
      RETURNING building_id, building_name
    `;
    
    const buildingResult = await client.query(buildingQuery, [
      building_name, 
      address_text, 
      construction_year, 
      location_gps.lng, 
      location_gps.lat
    ]);

    const newBuilding = buildingResult.rows[0];

    const ownershipQuery = `
        INSERT INTO building_ownership (building_id, owner_id, start_date)
        VALUES ($1, $2, CURRENT_DATE)
    `;

    await client.query(ownershipQuery, [newBuilding.building_id, user_id]);

    await client.query('COMMIT');

    res.json(newBuilding);

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Create Building Error:", err);
    res.status(500).json({ error: "Failed to create building" });
  } finally {
    client.release();
  }
};

export const getOwnershipHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT bo.ownership_id, bo.start_date, bo.end_date,
             o.user_id as owner_id, o.legal_name as owner_name, o.owner_type
      FROM building_ownership bo
      JOIN Owners o ON bo.owner_id = o.user_id
      WHERE bo.building_id = $1
      ORDER BY bo.start_date DESC
    `;
    const result = await pool.query(query, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};


export const getBuildingList = async (req, res) => {
  try {
    const result = await pool.query("SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

export const getReportableBuildings = async (req, res) => {
  try {
    const { user_id, role } = req.user;
    let query = "";
    let params = [];

    if (role === 'Owner') {
       query = `
         SELECT b.building_id, b.building_name 
         FROM Buildings b 
         JOIN Building_Ownership bo ON b.building_id = bo.building_id 
         WHERE bo.owner_id = $1 AND bo.end_date IS NULL
         ORDER BY b.created_at DESC
       `;
       params = [user_id];
    } else if (role === 'Specialist') {
       query = "SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC";
    } else {
       return res.json([]);
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Reportable Buildings Error:", err);
    res.status(500).json({ error: "Server Error" });
  }
};

export const updateRiskScore = async (req, res) => {
  const { id } = req.params;
  const { risk_score } = req.body;

  try {
    const query = `
      UPDATE Buildings 
      SET risk_score = $1 
      WHERE building_id = $2
    `;
    await pool.query(query, [risk_score, id]);
    res.json({ message: "Risk score updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update risk score" });
  }
};

export const transferOwnership = async (req, res) => {
  const { building_id, owner_id, start_date } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`
      UPDATE building_ownership 
      SET end_date = $2 
      WHERE building_id = $1 AND end_date IS NULL
    `, [building_id, start_date]);

    await client.query(`
      INSERT INTO building_ownership (building_id, owner_id, start_date)
      VALUES ($1, $2, $3)
    `, [building_id, owner_id, start_date]);

    await client.query('COMMIT');
    res.json({ message: "Ownership transferred successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Transfer failed" });
  } finally {
    client.release();
  }
};

export const getAllOwners = async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, legal_name FROM Owners ORDER BY legal_name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};
