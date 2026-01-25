import pool from "../config/db.js";

// GET /api/estimates/materials
export const getMaterials = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Material_Rates ORDER BY item_name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

// POST /api/estimates
// server/controllers/estimateController.js

export const createEstimate = async (req, res) => {
  const { building_id, total_cost, line_items } = req.body;
  
  // FIX: Do NOT use parseInt(). UUIDs must remain as strings.
  const user_id = req.user.user_id; 

  // Basic Validation
  if (!building_id) return res.status(400).json({ error: "Building ID is required" });
  if (!user_id) return res.status(401).json({ error: "Unauthorized: No user ID found" });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create the Estimate Record
    // user_id here is the UUID string from your JWT
    const estimateQuery = `
      INSERT INTO Retrofit_Estimates (building_id, generated_by, total_cost)
      VALUES ($1, $2, $3)
      RETURNING estimate_id
    `;
    const estimateRes = await client.query(estimateQuery, [
      building_id, 
      user_id, 
      total_cost || 0
    ]);
    const estimateId = estimateRes.rows[0].estimate_id;

    // 2. Insert Line Items
    const lineItemQuery = `
      INSERT INTO Estimate_Line_Items (estimate_id, material_id, quantity, subtotal)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of line_items) {
      await client.query(lineItemQuery, [
        estimateId,
        item.material_id,
        item.quantity,
        item.subtotal
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: "Estimate saved successfully", estimate_id: estimateId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("DATABASE ERROR:", err.message); // This will show the error in your terminal
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};