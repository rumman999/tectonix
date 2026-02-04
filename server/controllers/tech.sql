-- 1

SELECT user_id FROM users WHERE email = $1


-- 2

INSERT INTO users (email, password_hash, full_name, phone_number, role_type) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING user_id, email, role_type, full_name

-- 3

INSERT INTO specialists (user_id, license_no, specialization) VALUES ($1, $2, $3)


-- 4

INSERT INTO first_responders (user_id, badge_no, rank, blood_type, supervisor_id) 
                 VALUES ($1, $2, $3, $4, $5)


-- 5

INSERT INTO owners (user_id, legal_name, owner_type) VALUES ($1, $2, $3)


-- 6

INSERT INTO volunteers (user_id, verification_date) VALUES ($1, CURRENT_DATE)


-- 7

SELECT skill_id FROM skills WHERE skill_name = $1

-- 8

INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id


-- 9

INSERT INTO volunteer_skills (volunteer_id, skill_id, proficiency_level) 
                 VALUES ($1, $2, $3)


-- 10

SELECT * FROM Users WHERE email = $1


-- 11

SELECT user_id, full_name, email, phone_number, role_type FROM Users WHERE user_id = $1


-- 12

SELECT license_no, specialization FROM Specialists WHERE user_id = $1


-- 13

SELECT badge_no, rank, blood_type, supervisor_id 
FROM First_Responders 
WHERE user_id = $1


-- 14

SELECT proficiency_level, verification_date FROM Volunteers WHERE user_id = $1


-- 15

SELECT legal_name, owner_type FROM Owners WHERE user_id = $1


-- 16

SELECT COUNT(*) FROM building_ownership WHERE owner_id = $1 AND end_date IS NULL


-- 17

SELECT password_hash FROM Users WHERE user_id = $1


-- 18

UPDATE Users SET password_hash = $1 WHERE user_id = $2


-- 19

SELECT * FROM Skills ORDER BY skill_name ASC


-- 20

SELECT s.skill_id, s.skill_name, vs.proficiency_level 
FROM Volunteer_Skills vs
JOIN Skills s ON vs.skill_id = s.skill_id
WHERE vs.volunteer_id = $1


-- 21

INSERT INTO Volunteer_Skills (volunteer_id, skill_id, proficiency_level)
             VALUES ($1, $2, $3)
             ON CONFLICT (volunteer_id, skill_id) 
             DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level

-- 22

INSERT INTO Distress_Beacons (user_id, active_gps, status, activated_at)
      VALUES ($1, ST_GeographyFromText($2), $3, NOW())
      RETURNING beacon_id, status, activated_at, 
                ST_Y(active_gps::geometry) as lat, 
                ST_X(active_gps::geometry) as lng

-- 23

SELECT beacon_id, 
        status, 
        activated_at,
        ST_Y(active_gps::geometry) as lat, 
        ST_X(active_gps::geometry) as lng
      FROM Distress_Beacons 
      WHERE user_id = $1 
      ORDER BY activated_at DESC

-- 24

SELECT b.building_id, 
      b.building_name, 
      b.address_text, 
      b.construction_year, 
      b.risk_score,
      ST_X(b.location_gps::geometry) as lng, 
      ST_Y(b.location_gps::geometry) as lat
FROM Buildings b
JOIN Building_Ownership bo ON b.building_id = bo.building_id
WHERE bo.owner_id = $1 AND bo.end_date IS NULL
ORDER BY b.created_at DESC


-- 25

SELECT b.building_id, 
      b.building_name, 
      b.address_text, 
      b.construction_year, 
      b.risk_score,
      ST_X(b.location_gps::geometry) as lng, 
      ST_Y(b.location_gps::geometry) as lat 
FROM Buildings b 
ORDER BY b.created_at DESC


-- 26

INSERT INTO Buildings 
    (building_name, address_text, construction_year, location_gps, risk_score)
    VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), NULL)
    RETURNING building_id, building_name


-- 27

INSERT INTO building_ownership (building_id, owner_id, start_date)
        VALUES ($1, $2, CURRENT_DATE)


-- 28

SELECT bo.ownership_id, bo.start_date, bo.end_date,
    o.user_id as owner_id, o.legal_name as owner_name, o.owner_type
FROM building_ownership bo
JOIN Owners o ON bo.owner_id = o.user_id
WHERE bo.building_id = $1
ORDER BY bo.start_date DESC


-- 29

SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC


-- 30

SELECT b.building_id, b.building_name 
FROM Buildings b 
JOIN Building_Ownership bo ON b.building_id = bo.building_id 
WHERE bo.owner_id = $1 AND bo.end_date IS NULL
ORDER BY b.created_at DESC

-- 31

SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC


-- 32

UPDATE Buildings 
SET risk_score = $1 
WHERE building_id = $2

-- 33

UPDATE building_ownership 
SET end_date = $2 
WHERE building_id = $1 AND end_date IS NULL

-- 34

INSERT INTO building_ownership (building_id, owner_id, start_date)
      VALUES ($1, $2, $3)


-- 35

SELECT user_id, legal_name FROM Owners ORDER BY legal_name ASC


-- 36

SELECT b.building_id, b.building_name, b.address_text, b.construction_year, 
        b.created_at as building_created_at,
        dr.description as damage_description,
        dr.image_proof_url as damage_image,
        dr.severity_level, dr.location_text as report_location,
        CASE WHEN dr.report_id IS NOT NULL THEN TRUE ELSE FALSE END as has_damage
FROM Buildings b
LEFT JOIN(SELECT DISTINCT ON (building_id) *
          FROM Damage_Reports
          ORDER BY building_id, submitted_at DESC) dr ON b.building_id = dr.building_id
WHERE b.risk_score IS NULL
ORDER BY has_damage DESC, b.created_at DESC


-- 37

SELECT building_id as id,
    building_name as name,
    address_text as location,
    risk_score, 
    ST_X(location_gps::geometry) as lng, 
    ST_Y(location_gps::geometry) as lat
FROM Buildings
WHERE location_gps IS NOT NULL
ORDER BY risk_score DESC;


-- 38

SELECT COUNT(*) FROM Buildings
SELECT COUNT(*) FROM Devices
SELECT COUNT(*) FROM Distress_Beacons WHERE status = 'Active'


-- 39

SELECT v.vibe_id, v.intensity_pga, v.detected_at, d.device_model,
    ST_X(v.location_gps::geometry) as lng,
    ST_Y(v.location_gps::geometry) as lat,
    z.zone_name
FROM Seismic_Vibrations v
LEFT JOIN Devices d ON v.device_id = d.device_id
LEFT JOIN LATERAL (SELECT zone_name 
                    FROM zones 
                    WHERE ST_Intersects(zones.boundary, v.location_gps::geography)
                    ORDER BY ST_Area(boundary) ASC 
                    LIMIT 1) z ON true
ORDER BY v.detected_at DESC 
LIMIT 15;


-- 40

SELECT 
    CASE 
        WHEN intensity_pga > 1.2 THEN 'Danger'
        WHEN intensity_pga > 0.4 THEN 'Warning'
        ELSE 'Safe'
        END as risk_level,
        COUNT(*) as count
    FROM (
        SELECT DISTINCT ON (device_id) intensity_pga 
        FROM Seismic_Vibrations 
        ORDER BY device_id, detected_at DESC) last_readings
    GROUP BY risk_level;


-- 41

SELECT 
    CASE 
        WHEN risk_score < 20 THEN 'Safe'
        WHEN risk_score > 80 THEN 'High Risk'
        ELSE 'Moderate Risk'
        END as name,
        COUNT(*) as value
    FROM Buildings
    GROUP BY name;


-- 42

SELECT device_id FROM Devices WHERE client_uuid = $1 LIMIT 1


-- 43

UPDATE Devices SET last_active = NOW() WHERE device_id = $1


-- 44

UPDATE Devices SET user_id = $2 WHERE device_id = $1


-- 45

INSERT INTO Devices (client_uuid, device_model, user_id, last_active) 
            VALUES ($1, $2, $3, NOW()) RETURNING device_id

-- 46

INSERT INTO Seismic_Vibrations (device_id, location_gps, intensity_pga, detected_at) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, NOW())

-- 47

SELECT COUNT(DISTINCT device_id) FROM Seismic_Vibrations 
            WHERE detected_at > NOW() - INTERVAL '10 seconds'

-- 48

SELECT event_id FROM Disaster_Events WHERE event_type = 'Earthquake' AND is_active = TRUE


-- 49

INSERT INTO Disaster_Events (event_type, epicenter_gps, magnitude, is_active)
            VALUES ('Earthquake', ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, TRUE)


-- 50

UPDATE system_alerts SET status = 'CRITICAL'


-- 51

UPDATE Disaster_Events SET is_active = FALSE WHERE is_active = TRUE
DELETE FROM Seismic_Vibrations
UPDATE system_alerts SET status = 'SAFE'


-- 52

SELECT to_char(detected_at, 'HH24:MI') as time, AVG(intensity_pga)::numeric(10,3) as magnitude
FROM Seismic_Vibrations
WHERE detected_at > NOW() - INTERVAL '24 hours'
GROUP BY detected_at
ORDER BY detected_at ASC;

-- 53

(
    -- 1. Active Earthquakes
        SELECT 
          event_id::text as id, 
          'critical' as type, 
          'Earthquake Detected' as title, 
          NOW() as time, -- Fallback to NOW() if timestamp column differs
          'Epicenter: ' || event_type as location
        FROM Disaster_Events 
        WHERE is_active = TRUE
      )
      UNION ALL
      (
        -- 2. Rescue Requests
        SELECT 
          beacon_id::text as id, 
          'alert' as type, 
          'Rescue Requested' as title, 
          activated_at as time, 
          'Status: ' || status as location
        FROM Distress_Beacons 
        WHERE status = 'Active'
      )
      UNION ALL
      (
        -- 3. Severe Vibrations (Using your working logic from Recent Logs)
        SELECT 
          v.vibe_id::text as id, 
          'warning' as type,
          'Seismic Activity' as title, 
          v.detected_at as time, 
          COALESCE(z.zone_name, 'Dhaka') as location
        FROM Seismic_Vibrations v
        LEFT JOIN LATERAL (
          SELECT zone_name FROM zones 
          WHERE ST_Intersects(zones.boundary, v.location_gps::geography)
          LIMIT 1
        ) z ON true
        WHERE v.intensity_pga > 0.5
      )
      ORDER BY time DESC 
      LIMIT 10;

-- 54

SELECT status FROM system_alerts LIMIT 1


-- 55

SELECT * FROM Disaster_Events WHERE is_active = TRUE LIMIT 1


-- estimateController

-- 56

SELECT * FROM Material_Rates ORDER BY item_name ASC


-- 57

INSERT INTO Retrofit_Estimates (building_id, generated_by, total_estimated_cost)
      VALUES ($1, $2, $3)
      RETURNING estimate_id

-- 58

INSERT INTO Estimate_Line_Items (estimate_id, material_id, quantity, subtotal)
      VALUES ($1, $2, $3, $4)

-- reportController

-- 59

INSERT INTO Damage_Reports 
      (user_id, building_id, description, severity_level, location_text, image_proof_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING report_id

-- 60

UPDATE Buildings SET risk_score = NULL WHERE building_id = $1


-- 61

SELECT b.beacon_id, b.status, b.activated_at, 
        ST_Y(b.active_gps::geometry) as lat, 
        ST_X(b.active_gps::geometry) as lng,
        u.full_name as victim_name, 
        u.phone_number
FROM Distress_Beacons b
JOIN Users u ON b.user_id = u.user_id
WHERE b.status = 'Active'
ORDER BY b.activated_at DESC

-- sensorController

--62

SELECT * FROM Soil_Data WHERE building_id = $1

-- 63

SELECT ST_X(location_gps::geometry) as lng, ST_Y(location_gps::geometry) as lat 
FROM Buildings WHERE building_id = $1

-- 64

INSERT INTO Soil_Data 
        (building_id, liquefaction_risk, soil_moisture, groundwater_level, soil_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *

-- zoneController

-- 65

SELECT zone_name 
FROM zones 
WHERE ST_Intersects(
        boundary,
        ST_SetSRID(ST_MakePoint($1::float, $2::float), 4326)::geography
      )
ORDER BY ST_Area(boundary) ASC
LIMIT 1;

