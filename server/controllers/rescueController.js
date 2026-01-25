import pool from "../config/db.js";

export const getRescueFeed = async (req, res) => {
  try {
    const [beaconsRes, eventsRes] = await Promise.all([
      pool.query(`
        SELECT 
          b.beacon_id, 
          b.status, 
          b.activated_at, 
          ST_Y(b.active_gps::geometry) as lat, 
          ST_X(b.active_gps::geometry) as lng,
          u.full_name as victim_name, 
          u.phone_number
        FROM Distress_Beacons b
        JOIN Users u ON b.user_id = u.user_id
        WHERE b.status = 'Active'
        ORDER BY b.activated_at DESC
      `),
      pool.query(`
        SELECT 
          event_id, 
          event_type, 
          magnitude, 
          start_time,
          ST_Y(epicenter_gps::geometry) as lat, 
          ST_X(epicenter_gps::geometry) as lng
        FROM Disaster_Events 
        WHERE is_active = TRUE
        ORDER BY start_time DESC
      `)
    ]);

    res.json({
      beacons: beaconsRes.rows,
      events: eventsRes.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch rescue feed" });
  }
};

export const getPersonnel = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.user_id, 
        u.full_name, 
        u.phone_number, 
        u.role_type,
        fr.rank,
        fr.badge_no,
        v.proficiency_level
      FROM Users u
      LEFT JOIN First_Responders fr ON u.user_id = fr.user_id
      LEFT JOIN Volunteers v ON u.user_id = v.user_id
      WHERE u.role_type IN ('First_Responder', 'Volunteer')
      ORDER BY u.full_name ASC
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch personnel" });
  }
};

export const assignPersonnel = async (req, res) => {
  const { task_type, task_id, responder_ids } = req.body;
  // task_type: 'Beacon' | 'Event'
  // task_id: UUID
  // responder_ids: string[] (Array of UUIDs)

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const query = `
      INSERT INTO Rescue_Assignments 
      (task_type, beacon_id, event_id, responder_user_id)
      VALUES ($1, $2, $3, $4)
    `;

    for (const userId of responder_ids) {
      await client.query(query, [
        task_type,
        task_type === 'Beacon' ? task_id : null,
        task_type === 'Event' ? task_id : null,
        userId
      ]);
    }

    await client.query('COMMIT');
    res.json({ message: `Assigned ${responder_ids.length} responders successfully.` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Assignment failed" });
  } finally {
    client.release();
  }
};
