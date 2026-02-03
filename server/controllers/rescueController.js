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
      `),
    ]);

    res.json({
      beacons: beaconsRes.rows,
      events: eventsRes.rows,
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
    await client.query("BEGIN");

    const query = `
      INSERT INTO Rescue_Assignments 
      (task_type, beacon_id, event_id, responder_user_id)
      VALUES ($1, $2, $3, $4)
    `;

    for (const userId of responder_ids) {
      await client.query(query, [
        task_type,
        task_type === "Beacon" ? task_id : null,
        task_type === "Event" ? task_id : null,
        userId,
      ]);
    }

    await client.query("COMMIT");
    res.json({
      message: `Assigned ${responder_ids.length} responders successfully.`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Assignment failed" });
  } finally {
    client.release();
  }
};

export const getMyAssignments = async (req, res) => {
  const userId = req.user.user_id;
  try {
    const query = `
      SELECT 
        ra.assignment_id,
        ra.task_type,
        ra.status as assignment_status,
        ra.assigned_at,
        -- Beacon Details (if task_type = 'Beacon')
        b.beacon_id,
        ST_Y(b.active_gps::geometry) as beacon_lat, 
        ST_X(b.active_gps::geometry) as beacon_lng,
        u_victim.full_name as victim_name,
        u_victim.phone_number as victim_phone,
        -- Event Details (if task_type = 'Event')
        e.event_id,
        e.event_type,
        e.magnitude,
        ST_Y(e.epicenter_gps::geometry) as event_lat, 
        ST_X(e.epicenter_gps::geometry) as event_lng
      FROM Rescue_Assignments ra
      LEFT JOIN Distress_Beacons b ON ra.beacon_id = b.beacon_id
      LEFT JOIN Users u_victim ON b.user_id = u_victim.user_id
      LEFT JOIN Disaster_Events e ON ra.event_id = e.event_id
      WHERE ra.responder_user_id = $1 AND ra.status != 'Completed'
      ORDER BY ra.assigned_at DESC
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch assignments" });
  }
};

export const updateAssignmentStatus = async (req, res) => {
  const { assignment_id, status } = req.body;

  try {
    await pool.query(
      `UPDATE Rescue_Assignments SET status = $1 WHERE assignment_id = $2 AND responder_user_id = $3`,
      [status, assignment_id, req.user.id],
    );
    res.json({ message: "Status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update status" });
  }
};

export const resolveAlert = async (req, res) => {
  const { type, id } = req.body; // type: 'Beacon' | 'Event'

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (type === 'Beacon') {
      // 1. Mark Beacon as Resolved
      await client.query(
        `UPDATE Distress_Beacons SET status = 'Resolved' WHERE beacon_id = $1`,
        [id]
      );
      // 2. Mark all assignments for this beacon as Completed
      await client.query(
        `UPDATE Rescue_Assignments SET status = 'Completed' WHERE beacon_id = $1`,
        [id]
      );
    } else if (type === 'Event') {
      // 1. Mark Event as Inactive
      await client.query(
        `UPDATE Disaster_Events SET is_active = FALSE WHERE event_id = $1`,
        [id]
      );
       // 2. Mark all assignments for this event as Completed
       await client.query(
        `UPDATE Rescue_Assignments SET status = 'Completed' WHERE event_id = $1`,
        [id]
      );
    }

    await client.query('COMMIT');
    res.json({ message: "Alert resolved successfully" });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: "Failed to resolve alert" });
  } finally {
    client.release();
  }
};