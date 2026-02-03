import pool from "../config/db.js";

export const createDamageReport = async (req, res) => {
  try {
    const { description, severity, location, building_id } = req.body;
    const user_id = req.user.user_id;

    const imagePath = req.file ? req.file.path : null;

    const query = `
      INSERT INTO Damage_Reports 
      (user_id, building_id, description, severity_level, location_text, image_proof_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING report_id
    `;

    const bId = (building_id && building_id !== "null") ? building_id : null;

    await pool.query(query, [
      user_id,
      bId,
      description,
      parseInt(severity) || 50,
      location,
      imagePath
    ]);

    if (bId) {
      await pool.query(
        `UPDATE Buildings SET risk_score = NULL WHERE building_id = $1`,
        [bId]
      );
    }

    res.status(201).json({ message: "Report submitted successfully" });

  } catch (err) {
    console.error("Report Submission Error:", err);
    res.status(500).json({ error: "Failed to submit report" });
  }
};