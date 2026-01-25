import pool from "../config/db.js";
import { randomUUID } from "crypto";

export const getMaterials = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM Material_Rates ORDER BY item_name ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
};

export const createEstimate = async (req, res) => {
  const { building_id, total_cost, line_items } = req.body;
  
  let user_id = req.user.user_id; 
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  
  if (!user_id || !uuidRegex.test(String(user_id))) {
    console.log(`⚠️ User ID "${user_id}" is not a UUID. Using generated UUID for 'generated_by'.`);
    user_id = randomUUID(); 
  }

  if (!building_id) return res.status(400).json({ error: "Building ID is required" });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const estimateQuery = `
      INSERT INTO Retrofit_Estimates (building_id, generated_by, total_estimated_cost)
      VALUES ($1, $2, $3)
      RETURNING estimate_id
    `;
    
    const estimateRes = await client.query(estimateQuery, [
      building_id,
      user_id,
      total_cost || 0
    ]);
    const estimateId = estimateRes.rows[0].estimate_id;

    const lineItemQuery = `
      INSERT INTO Estimate_Line_Items (estimate_id, material_id, quantity, subtotal)
      VALUES ($1, $2, $3, $4)
    `;

    for (const item of line_items) {
      if (!item.material_id || isNaN(parseInt(item.material_id))) continue;

      await client.query(lineItemQuery, [
        estimateId,
        parseInt(item.material_id), // Material IDs are Serial (Int) -> OK
        item.quantity,
        item.subtotal
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: "Estimate saved successfully", estimate_id: estimateId });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("DATABASE ERROR:", err.message);
    
    if (err.code === '23503') {
        res.status(500).json({ error: "Foreign Key Error: The Building ID or User ID does not exist in the referenced tables." });
    } else {
        res.status(500).json({ error: err.message });
    }
  } finally {
    client.release();
  }
};
