import pool from "../config/db.js";

// GET /api/buildings
export const getBuildings = async (req, res) => {
  try {
    // Convert PostGIS geography to Lat/Lng for frontend
    const query = `
      SELECT 
        building_id, 
        building_name, 
        address_text, 
        construction_year, 
        risk_score,
        ST_X(location_gps::geometry) as lng, 
        ST_Y(location_gps::geometry) as lat 
      FROM Buildings 
      WHERE risk_score IS NOT NULL
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    
    // Format for frontend
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

// POST /api/buildings
export const createBuilding = async (req, res) => {
  const { building_name, address_text, construction_year, location_gps } = req.body;
  
  try {
    const query = `
      INSERT INTO Buildings 
      (building_name, address_text, construction_year, location_gps, risk_score)
      VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), NULL)
      RETURNING building_id, building_name
    `;
    
    const result = await pool.query(query, [
      building_name, 
      address_text, 
      construction_year, 
      location_gps.lng, 
      location_gps.lat
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create building" });
  }
};

// GET /api/buildings/:id/ownership
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

// [EXISTING CODE ABOVE...]

// NEW: Get ALL buildings (ID & Name) for the dropdown
// (Unlike getBuildings, this includes ones with NULL risk_score)
export const getBuildingList = async (req, res) => {
  try {
    const result = await pool.query("SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// NEW: Update Risk Score (Manual Verification)
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

// POST /api/buildings/transfer
export const transferOwnership = async (req, res) => {
  const { building_id, owner_id, start_date } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Close current ownership (if any)
    await client.query(`
      UPDATE building_ownership 
      SET end_date = $2 
      WHERE building_id = $1 AND end_date IS NULL
    `, [building_id, start_date]);

    // 2. Insert new ownership
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

// GET /api/buildings/owners (For Dropdown)
export const getAllOwners = async (req, res) => {
  try {
    const result = await pool.query("SELECT user_id, legal_name FROM Owners ORDER BY legal_name ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: "Server Error" });
  }
};