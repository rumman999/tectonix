-- ==========================================
-- AUTHENTICATION & USER MANAGEMENT
-- Controller: authController.js
-- ==========================================

-- 1. Check if User Exists (Registration)
-- Used in `register` to verify if the email is already in the database before creating a new account.
SELECT user_id FROM users WHERE email = $1;


-- 2. Create Base User
-- Used in `register` to insert the core user details into the Users table.
INSERT INTO users (email, password_hash, full_name, phone_number, role_type) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING user_id, email, role_type, full_name;

-- 3. Add Specialist Details
-- Used in `register` if the role is 'Specialist' or 'Civil_Engineer'.
INSERT INTO specialists (user_id, license_no, specialization) VALUES ($1, $2, $3);


-- 4. Add First Responder Details
-- Used in `register` if the role is 'First_Responder'.
INSERT INTO first_responders (user_id, badge_no, rank, blood_type, supervisor_id) 
                 VALUES ($1, $2, $3, $4, $5);


-- 5. Add Owner Details
-- Used in `register` if the role is 'Owner'.
INSERT INTO owners (user_id, legal_name, owner_type) VALUES ($1, $2, $3);


-- 6. Add Volunteer Details
-- Used in `register` if the role is 'Volunteer'. Sets verification date to today.
INSERT INTO volunteers (user_id, verification_date) VALUES ($1, CURRENT_DATE);


-- 7. Find Skill ID
-- Used in `register` (helper) to look up an existing skill by name.
SELECT skill_id FROM skills WHERE skill_name = $1;

-- 8. Create New Skill
-- Used in `register` (helper) to add a new skill if it doesn't exist yet.
INSERT INTO skills (skill_name) VALUES ($1) RETURNING skill_id;


-- 9. Link Skill to Volunteer
-- Used in `register` (helper) to associate a skill with a volunteer profile.
INSERT INTO volunteer_skills (volunteer_id, skill_id, proficiency_level) 
                 VALUES ($1, $2, $3);


-- 10. Login User Lookup
-- Used in `login` to retrieve user credentials (password hash) by email.
SELECT * FROM Users WHERE email = $1;


-- 11. Fetch User Profile (Base)
-- Used in `getProfile` to get general user information.
SELECT user_id, full_name, email, phone_number, role_type FROM Users WHERE user_id = $1;


-- 12. Fetch Specialist Profile Data
-- Used in `getProfile` to retrieve extra fields specific to Specialists.
SELECT license_no, specialization FROM Specialists WHERE user_id = $1;


-- 13. Fetch First Responder Profile Data
-- Used in `getProfile` to retrieve extra fields specific to Responders.
SELECT badge_no, rank, blood_type, supervisor_id 
FROM First_Responders 
WHERE user_id = $1;


-- 14. Fetch Volunteer Profile Data
-- Used in `getProfile` to retrieve extra fields specific to Volunteers.
SELECT proficiency_level, verification_date FROM Volunteers WHERE user_id = $1;


-- 15. Fetch Owner Profile Data
-- Used in `getProfile` to retrieve extra fields specific to Owners.
SELECT legal_name, owner_type FROM Owners WHERE user_id = $1;


-- 16. Count Owner's Active Buildings
-- Used in `getProfile` to show Owners how many buildings they currently manage.
SELECT COUNT(*) FROM building_ownership WHERE owner_id = $1 AND end_date IS NULL;


-- 17. Get Password Hash (Reset)
-- Used in `changePassword` to verify the old password before changing it.
SELECT password_hash FROM Users WHERE user_id = $1;


-- 18. Update Password
-- Used in `changePassword` to save the new hashed password.
UPDATE Users SET password_hash = $1 WHERE user_id = $2;


-- 19. List All Skills
-- Used in `getSkills` to populate dropdowns for volunteers.
SELECT * FROM Skills ORDER BY skill_name ASC;


-- 20. Get Volunteer's Skills
-- Used in `getUserSkills` to show a volunteer their current skill set.
SELECT s.skill_id, s.skill_name, vs.proficiency_level 
FROM Volunteer_Skills vs
JOIN Skills s ON vs.skill_id = s.skill_id
WHERE vs.volunteer_id = $1;


-- 21. Update/Insert Volunteer Skill
-- Used in `updateUserSkills` to add a skill or update proficiency if it already exists.
INSERT INTO Volunteer_Skills (volunteer_id, skill_id, proficiency_level)
             VALUES ($1, $2, $3)
             ON CONFLICT (volunteer_id, skill_id) 
             DO UPDATE SET proficiency_level = EXCLUDED.proficiency_level;


-- ==========================================
-- BEACONS & BUILDING MANAGEMENT
-- Controllers: beaconController.js, buildingController.js
-- ==========================================

-- 22. Activate Distress Beacon
-- Used in `createBeacon` to register a new emergency signal with GPS coordinates.
INSERT INTO Distress_Beacons (user_id, active_gps, status, activated_at)
      VALUES ($1, ST_GeographyFromText($2), $3, NOW())
      RETURNING beacon_id, status, activated_at, 
                ST_Y(active_gps::geometry) as lat, 
                ST_X(active_gps::geometry) as lng;

-- 23. Get User Beacon History
-- Used in `getUserBeacons` to show a user their past and current alerts.
SELECT beacon_id, 
        status, 
        activated_at,
        ST_Y(active_gps::geometry) as lat, 
        ST_X(active_gps::geometry) as lng
      FROM Distress_Beacons 
      WHERE user_id = $1 
      ORDER BY activated_at DESC;

-- 24. List Buildings (For Owner)
-- Used in `getBuildings` when the user is an Owner. Fetches only their active properties.
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
ORDER BY b.created_at DESC;


-- 25. List Buildings (For Specialist/Admin)
-- Used in `getBuildings` when the user is a Specialist. Fetches all buildings in the system.
SELECT b.building_id, 
      b.building_name, 
      b.address_text, 
      b.construction_year, 
      b.risk_score,
      ST_X(b.location_gps::geometry) as lng, 
      ST_Y(b.location_gps::geometry) as lat 
FROM Buildings b 
ORDER BY b.created_at DESC;


-- 26. Register New Building
-- Used in `addBuilding` to insert basic building details.
INSERT INTO Buildings 
    (building_name, address_text, construction_year, location_gps, risk_score)
    VALUES ($1, $2, $3, ST_SetSRID(ST_MakePoint($4, $5), 4326), NULL)
    RETURNING building_id, building_name;


-- 27. Link Building to Owner
-- Used in `addBuilding` immediately after creation to assign ownership.
INSERT INTO building_ownership (building_id, owner_id, start_date)
        VALUES ($1, $2, CURRENT_DATE);


-- 28. Get Ownership History
-- Used in `getOwnershipHistory` to see past and present owners of a building.
SELECT bo.ownership_id, bo.start_date, bo.end_date,
    o.user_id as owner_id, o.legal_name as owner_name, o.owner_type
FROM building_ownership bo
JOIN Owners o ON bo.owner_id = o.user_id
WHERE bo.building_id = $1
ORDER BY bo.start_date DESC;


-- 29. Simple Building List
-- Used in `getBuildingList` for dropdown menus or selectors.
SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC;


-- 30. Get Pending Assessments (Owner Filter)
-- Used in `getPendingAssessments` to find buildings owned by the user that need checking.
SELECT b.building_id, b.building_name 
FROM Buildings b 
JOIN Building_Ownership bo ON b.building_id = bo.building_id 
WHERE bo.owner_id = $1 AND bo.end_date IS NULL
ORDER BY b.created_at DESC;

-- 31. Get All Buildings (Simple)
-- Used in `getPendingAssessments` (Specialist view) as a fallback list.
SELECT building_id, building_name FROM Buildings ORDER BY created_at DESC;


-- 32. Update Risk Score
-- Used in `updateRiskScore` (AI Scanner) to save the calculated risk after an assessment.
UPDATE Buildings 
SET risk_score = $1 
WHERE building_id = $2;

-- 33. End Current Ownership
-- Used in `transferOwnership` to close the record for the previous owner.
UPDATE building_ownership 
SET end_date = $2 
WHERE building_id = $1 AND end_date IS NULL;

-- 34. Start New Ownership
-- Used in `transferOwnership` to create the record for the new owner.
INSERT INTO building_ownership (building_id, owner_id, start_date)
      VALUES ($1, $2, $3);


-- 35. List All Owners
-- Used in `getOwners` to populate the transfer ownership dropdown.
SELECT user_id, legal_name FROM Owners ORDER BY legal_name ASC;


-- 36. Get Pending Assessments (Detailed)
-- Used in `getPendingAssessments` to fetch buildings needing AI scans, prioritizing those with reported damage.
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
ORDER BY has_damage DESC, b.created_at DESC;


-- 37. Get Building Map Data
-- Used in `getBuildingMapData` to plot buildings on the interactive map.
SELECT building_id as id,
    building_name as name,
    address_text as location,
    risk_score, 
    ST_X(location_gps::geometry) as lng, 
    ST_Y(location_gps::geometry) as lat
FROM Buildings
WHERE location_gps IS NOT NULL
ORDER BY risk_score DESC;




-- ==========================================
-- DASHBOARD & SEISMIC MONITORING
-- Controllers: dashboardController.js, aiController.js
-- ==========================================

-- 38. Dashboard KPI Counters
-- Used in `getStats` to fetch top-level metrics for the dashboard.
SELECT COUNT(*) FROM Buildings;
SELECT COUNT(*) FROM Devices;
SELECT COUNT(*) FROM Distress_Beacons WHERE status = 'Active';


-- 39. Recent Activity Logs
-- Used in `getRecentLogs` to show recent seismic vibrations and their zones.
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


-- 40. Seismic Risk Distribution
-- Used in `getRiskDistribution` to chart the intensity of recent vibrations.
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


-- 41. Building Health Distribution
-- Used in `getRiskDistribution` (or similar chart) to show building safety status.
SELECT 
    CASE 
        WHEN risk_score < 20 THEN 'Safe'
        WHEN risk_score > 80 THEN 'High Risk'
        ELSE 'Moderate Risk'
        END as name,
        COUNT(*) as value
    FROM Buildings
    GROUP BY name;


-- 42. Check Device Existence
-- Used in `handleIoTData` to verify an incoming data stream from a sensor client.
SELECT device_id FROM Devices WHERE client_uuid = $1 LIMIT 1;


-- 43. Update Device Heartbeat
-- Used in `handleIoTData` to mark an existing device as active.
UPDATE Devices SET last_active = NOW() WHERE device_id = $1;


-- 44. Assign Device to User
-- Used in `handleIoTData` (Auth Logic) to link a device to a logged-in user.
UPDATE Devices SET user_id = $2 WHERE device_id = $1;


-- 45. Register New Device
-- Used in `handleIoTData` to create a new record for a previously unknown sensor.
INSERT INTO Devices (client_uuid, device_model, user_id, last_active) 
            VALUES ($1, $2, $3, NOW()) RETURNING device_id;

-- 46. Log Seismic Data
-- Used in `handleIoTData` to store raw vibration data (PGA) from sensors.
INSERT INTO Seismic_Vibrations (device_id, location_gps, intensity_pga, detected_at) 
            VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, NOW());

-- 47. Check Sensor Consensus
-- Used in `handleIoTData` (Logic) to see if enough devices detected movement recently.
SELECT COUNT(DISTINCT device_id) FROM Seismic_Vibrations 
            WHERE detected_at > NOW() - INTERVAL '10 seconds';

-- 48. Check Active Event
-- Used in `handleIoTData` to prevent triggering duplicate earthquake alerts.
SELECT event_id FROM Disaster_Events WHERE event_type = 'Earthquake' AND is_active = TRUE;


-- 49. Trigger Earthquake Event
-- Used in `handleIoTData` to officially start "Seismic Mode" when consensus is reached.
INSERT INTO Disaster_Events (event_type, epicenter_gps, magnitude, is_active)
            VALUES ('Earthquake', ST_SetSRID(ST_MakePoint($1, $2), 4326), $3, TRUE);


-- 50. Set System Alert Critical
-- Used in `handleIoTData` to flip the global system switch to Danger.
UPDATE system_alerts SET status = 'CRITICAL';


-- 51. Reset System (Safe Mode)
-- Used in `resetSystem` to clear active events and reset sensor logs.
UPDATE Disaster_Events SET is_active = FALSE WHERE is_active = TRUE;
DELETE FROM Seismic_Vibrations;
UPDATE system_alerts SET status = 'SAFE';


-- 52. Seismic Chart Data
-- Used in `getSeismicData` to fetch 24-hour average magnitude data for graphs.
SELECT to_char(detected_at, 'HH24:MI') as time, AVG(intensity_pga)::numeric(10,3) as magnitude
FROM Seismic_Vibrations
WHERE detected_at > NOW() - INTERVAL '24 hours'
GROUP BY detected_at
ORDER BY detected_at ASC;

-- 53. Unified Alert Feed
-- Used in `getAlertFeed` to combine Earthquakes, Rescue Requests, and High Vibrations into one list.
(
    -- 1. Active Earthquakes
        SELECT 
          event_id::text as id, 
          'critical' as type, 
          'Earthquake Detected' as title, 
          NOW() as time, 
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
        -- 3. Severe Vibrations
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

-- 54. Check System Status
-- Used in `getSystemStatus` to poll if the app should be in Red Mode.
SELECT status FROM system_alerts LIMIT 1;


-- 55. Get Active Event Details
-- Used in `getSystemStatus` to provide details about the current disaster.
SELECT * FROM Disaster_Events WHERE is_active = TRUE LIMIT 1;


-- ==========================================
-- ESTIMATES, REPORTS, RESCUE, SENSORS & ZONES
-- Controllers: estimate, report, rescue, sensor, zone
-- ==========================================

-- estimateController

-- 56. Fetch Material Rates
-- Used in `getMaterialRates` to fetch current prices for retrofit calculations.
SELECT * FROM Material_Rates ORDER BY item_name ASC;


-- 57. Create Retrofit Estimate
-- Used in `saveEstimate` to create the main record for a cost calculation.
INSERT INTO Retrofit_Estimates (building_id, generated_by, total_estimated_cost)
      VALUES ($1, $2, $3)
      RETURNING estimate_id;

-- 58. Add Estimate Items
-- Used in `saveEstimate` to save individual line items (materials used).
INSERT INTO Estimate_Line_Items (estimate_id, material_id, quantity, subtotal)
      VALUES ($1, $2, $3, $4);

-- reportController

-- 59. Submit Damage Report
-- Used in `submitReport` to save user-submitted damage evidence.
INSERT INTO Damage_Reports 
      (user_id, building_id, description, severity_level, location_text, image_proof_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING report_id;

-- 60. Reset Risk Score on Damage
-- Used in `submitReport`. If damage is reported, the old AI score is invalid and set to NULL.
UPDATE Buildings SET risk_score = NULL WHERE building_id = $1;


-- rescueController

-- 61. Get Active Rescue Missions
-- Used in `getActiveMissions` to list active beacons with victim details for Responders.
SELECT b.beacon_id, b.status, b.activated_at, 
        ST_Y(b.active_gps::geometry) as lat, 
        ST_X(b.active_gps::geometry) as lng,
        u.full_name as victim_name, 
        u.phone_number
FROM Distress_Beacons b
JOIN Users u ON b.user_id = u.user_id
WHERE b.status = 'Active'
ORDER BY b.activated_at DESC;

-- sensorController

-- 62. Check Existing Soil Data
-- Used in `getBuildingSoilData` to return cached data if it exists (Cache-First strategy).
SELECT * FROM Soil_Data WHERE building_id = $1;

-- 63. Get Building Coordinates
-- Used in `getBuildingSoilData` to find Lat/Lng for the external Weather API lookup.
SELECT ST_X(location_gps::geometry) as lng, ST_Y(location_gps::geometry) as lat 
FROM Buildings WHERE building_id = $1;

-- 64. Save New Soil Data
-- Used in `getBuildingSoilData` to store the API result into the database.
INSERT INTO Soil_Data 
        (building_id, liquefaction_risk, soil_moisture, groundwater_level, soil_type)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *;

-- zoneController

-- 65. Identify Zone by Point
-- Used in `getZoneByPoint` to find which administrative zone a specific GPS point belongs to.
SELECT zone_name 
FROM zones 
WHERE ST_Intersects(
        boundary,
        ST_SetSRID(ST_MakePoint($1::float, $2::float), 4326)::geography
      )
ORDER BY ST_Area(boundary) ASC
LIMIT 1;