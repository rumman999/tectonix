import pool from '../config/db.js';

export const getZoneFromLocation = async (req, res) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and Longitude are required' });
  }

  try {
    const query = `
      SELECT zone_name 
      FROM zones 
      WHERE ST_Intersects(
        boundary,
        ST_SetSRID(ST_MakePoint($1::float, $2::float), 4326)::geography
      )
      ORDER BY ST_Area(boundary) ASC
      LIMIT 1;
    `;

    const result = await pool.query(query, [longitude, latitude]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Location is not inside any known zone.' });
    }

    res.json({ zone_name: result.rows[0].zone_name });

  } catch (error) {
    console.error('Error finding zone:', error.message);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
