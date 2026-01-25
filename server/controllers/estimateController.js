import pool from "../config/db.js";
import { randomUUID } from "crypto"; // Import the UUID generator

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
export const createEstimate = async (req, res) => {
  const { building_id, total_cost, line_items } = req.body;
  
  // 1. Get the User ID from the token (which is "6")
  let user_id = req.user.user_id; 

  // 2. CHECK: Is it a valid UUID? If not (like "6"), generate a fake one.
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!user_id || !uuidRegex.test(String(user_id))) {
    console.log(`⚠️ User ID "${user_id}" is not a UUID. Generating a temporary UUID for this estimate.`);
    user_id = randomUUID(); // Generates a valid string like 'a0eebc99-9c0b...'
  }

  // Basic Validation
  if (!building_id) return res.status(400).json({ error: "Building ID is required" });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 3. Insert using the (possibly fake) UUID
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

    // 4. Insert Line Items
    const lineItemQuery = `
      INSERT INTO Estimate_Line_Items (estimate_id, material_id, quantity, subtotal)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of line_items) {
      if (!item.material_id || isNaN(parseInt(item.material_id))) continue;

      await client.query(lineItemQuery, [
        estimateId,
        parseInt(item.material_id),
        item.quantity || 0,
        item.subtotal || 0
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: "Estimate saved successfully", estimate_id: estimateId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("DATABASE ERROR:", err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};