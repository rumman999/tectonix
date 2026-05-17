import axios from "axios";
import api from "./axios";

// Import localized mock data
import mockDevices from "../data/mock_devices.json";
import mockSoilData from "../data/mock_soil_data.json";
import mockSeismicLogs from "../data/mock_seismic_logs.json";
import mockDisasters from "../data/mock_disasters.json";
import mockBeacons from "../data/mock_beacons.json";

// Initialize localStorage Database with Seed Data
const DB_PREFIX = "tectonix_db_";

const getDB = (key: string, defaultValue: any) => {
  const data = localStorage.getItem(DB_PREFIX + key);
  if (!data) {
    localStorage.setItem(DB_PREFIX + key, JSON.stringify(defaultValue));
    return defaultValue;
  }
  return JSON.parse(data);
};

const setDB = (key: string, value: any) => {
  localStorage.setItem(DB_PREFIX + key, JSON.stringify(value));
};

// Seed exact three Bangladeshi Demo Profiles requested
const seedUsers = [
  {
    user_id: "usr-specialist-01",
    email: "tanim_demo@struct.com",
    full_name: "Engr. Tanim Ahmed",
    phone_number: "+8801711122233",
    role_type: "Specialist",
    license_no: "CE-4521",
    specialization: "Structural Engineering"
  },
  {
    user_id: "usr-coordinator-01",
    email: "farhana_cmd@tectonix.gov.bd",
    full_name: "Commander Farhana Islam",
    phone_number: "+8801933344455",
    role_type: "Coordinator",
    badge_no: "FSCD-9908",
    rank: "Commander",
    blood_type: "O+"
  },
  {
    user_id: "usr-citizen-01",
    email: "rahim_dhaka@gmail.com",
    full_name: "Md. Rahim",
    phone_number: "+8801555566677",
    role_type: "Citizen"
  }
];

// Seed Buildings matching Dhaka coordinates and status
const seedBuildings = [
  {
    building_id: 1,
    building_name: "Jamuna Future Park",
    address_text: "Pragati Sarani, Kuril, Dhaka",
    construction_year: 2013,
    lat: 23.813,
    lng: 90.424,
    risk_score: 15
  },
  {
    building_id: 2,
    building_name: "Bashundhara City Shopping Mall",
    address_text: "Panthapath, Kawran Bazar, Dhaka",
    construction_year: 2004,
    lat: 23.751,
    lng: 90.392,
    risk_score: 22
  },
  {
    building_id: 3,
    building_name: "RAJUK Bhaban",
    address_text: "Dilkusha, Motijheel, Dhaka",
    construction_year: 1965,
    lat: 23.728,
    lng: 90.412,
    risk_score: 45
  },
  {
    building_id: 4,
    building_name: "Old Dhaka Garment Factory Building",
    address_text: "Lalbagh Road, Lalbagh, Old Dhaka",
    construction_year: 1988,
    lat: 23.7185,
    lng: 90.3882,
    risk_score: null, // Pending scan
    has_damage: true,
    severity_level: 85,
    damage_description: "Deep diagonal shear cracks observed along the structural load-bearing columns on the 3rd and 4th floors."
  },
  {
    building_id: 5,
    building_name: "Pan Pacific Sonargaon",
    address_text: "Kazi Nazrul Islam Ave, Kawran Bazar, Dhaka",
    construction_year: 1981,
    lat: 23.773,
    lng: 90.407,
    risk_score: 18
  },
  {
    building_id: 6,
    building_name: "BICC (Conference Centre)",
    address_text: "Sher-e-Bangla Nagar, Agargaon, Dhaka",
    construction_year: 2001,
    lat: 23.774,
    lng: 90.399,
    risk_score: 12
  },
  {
    building_id: 7,
    building_name: "Hatirjheel Tower",
    address_text: "Hatirjheel Circular Road, Dhaka",
    construction_year: 2015,
    lat: 23.763,
    lng: 90.415,
    risk_score: 52
  },
  {
    building_id: 8,
    building_name: "Dhaka Medical College Hospital",
    address_text: "Bakshibazar, Dhaka",
    construction_year: 1946,
    lat: 23.726,
    lng: 90.396,
    risk_score: null, // Pending scan
    has_damage: true,
    severity_level: 78,
    damage_description: "Severe settlement issues observed on the east wing of the older masonry structure."
  }
];

const seedMaterialRates = [
  { material_id: 1, item_name: "Rebar Steel (TMT 500W)", rate_per_unit: 95.5, unit: "kg" },
  { material_id: 2, item_name: "Portland Cement (Grade 43)", rate_per_unit: 10.2, unit: "bag" },
  { material_id: 3, item_name: "Coarse Aggregate (Stone chips)", rate_per_unit: 4.5, unit: "cft" },
  { material_id: 4, item_name: "Micro-concrete (SikaGrout)", rate_per_unit: 25.0, unit: "bag" },
  { material_id: 5, item_name: "Carbon Fiber (CFRP Wrap)", rate_per_unit: 120.0, unit: "sq.m" },
  { material_id: 6, item_name: "Skilled Structural Labor", rate_per_unit: 800.0, unit: "man-day" }
];

// Initialize dynamic databases without resetting historical states
let dbUsers = getDB("users", seedUsers);
let dbBuildings = getDB("buildings", seedBuildings);

// Force self-repair of beacons to support 5 entries and ensure active ones are unassigned on refresh
const currentSavedBeacons = localStorage.getItem(DB_PREFIX + "beacons");
if (!currentSavedBeacons || JSON.parse(currentSavedBeacons).length !== 5 || JSON.parse(currentSavedBeacons)[1].assigned_squad !== "") {
  const updatedBeacons = [
    {
      beacon_id: "beacon-sos-01",
      victim_name: "Kuddus Ali",
      phone_number: "+8801711223344",
      lat: 23.7185,
      lng: 90.3882,
      status: "Active",
      relative_minutes: 10,
      description: "Trapped in a 6-story garment factory stairwell in Lalbagh",
      assigned_squad: ""
    },
    {
      beacon_id: "beacon-sos-02",
      victim_name: "Farhana Islam",
      phone_number: "+8801819876543",
      lat: 23.7460,
      lng: 90.3735,
      status: "Active",
      relative_minutes: 5,
      description: "Soft-story collapse at a residential building in Dhanmondi Road 8",
      assigned_squad: ""
    },
    {
      beacon_id: "beacon-sos-03",
      victim_name: "Abul Kalam",
      phone_number: "+8801912345678",
      lat: 23.8068,
      lng: 90.3675,
      status: "Completed",
      relative_minutes: 14,
      description: "Road blocked by debris near Mirpur 10 roundabout, urgent medical help needed",
      assigned_squad: "FSCD Squad Alpha - Fire Service and Civil Defence"
    },
    {
      beacon_id: "beacon-sos-04",
      victim_name: "Nusrat Jahan",
      phone_number: "+8801612345679",
      lat: 23.773,
      lng: 90.407,
      status: "Active",
      relative_minutes: 25,
      description: "Minor structural cracking in Uttara Sector 3 residential building, request rapid inspection",
      assigned_squad: ""
    },
    {
      beacon_id: "beacon-sos-05",
      victim_name: "Sajid Hasan",
      phone_number: "+8801512345670",
      lat: 23.751,
      lng: 90.392,
      status: "Active",
      relative_minutes: 40,
      description: "Debris falls blocking entryway in Mohammadpur Town Hall Market",
      assigned_squad: ""
    }
  ];
  localStorage.setItem(DB_PREFIX + "beacons", JSON.stringify(updatedBeacons));
}

let dbBeacons = getDB("beacons", mockBeacons);
let dbDisasters = getDB("disasters", mockDisasters);
let dbDevices = getDB("devices", mockDevices);
let dbSeismicLogs = getDB("seismic_logs", mockSeismicLogs);
let dbSoilData = getDB("soil_data", mockSoilData);
let dbMaterialRates = getDB("material_rates", seedMaterialRates);
let dbEstimates = getDB("estimates", []);
let dbReports = getDB("reports", []);
let dbSystemAlert = getDB("system_alert", { status: "CRITICAL" }); // Start critical to showcase consensus and alarm modal
let dbOwnershipHistory = getDB("ownership_history", [
  { ownership_id: 1, building_id: 1, owner_id: "usr-citizen-01", owner_name: "Md. Rahim", owner_type: "Individual", start_date: "2013-05-12", end_date: null },
  { ownership_id: 2, building_id: 2, owner_id: "usr-citizen-01", owner_name: "Md. Rahim", owner_type: "Individual", start_date: "2004-10-20", end_date: null },
  { ownership_id: 3, building_id: 3, owner_id: "usr-citizen-01", owner_name: "Md. Rahim", owner_type: "Individual", start_date: "1965-02-05", end_date: null },
  { ownership_id: 4, building_id: 4, owner_id: "usr-citizen-01", owner_name: "Md. Rahim", owner_type: "Individual", start_date: "1988-06-18", end_date: null }
]);

const seedMissions = [
  {
    mission_id: "mission-03",
    task_type: "Beacon",
    task_id: "beacon-sos-03",
    responder_ids: ["usr-coordinator-01", "usr-specialist-01"],
    status: "Completed",
    assigned_at: new Date(Date.now() - 7200000).toISOString()
  }
];

// Force self-repair of stale local storage key to ensure active ones are unassigned on startup/refresh
const currentSavedMissions = localStorage.getItem(DB_PREFIX + "missions");
if (!currentSavedMissions || JSON.parse(currentSavedMissions).length !== 1) {
  localStorage.setItem(DB_PREFIX + "missions", JSON.stringify(seedMissions));
}

let dbMissions = getDB("missions", seedMissions);

const seedChatMessages = {
  "beacon-sos-01": [
    { sender: "System", message: "Rescue mission initiated. FSCD Lead Commander Farhana Islam assigned.", timestamp: new Date(Date.now() - 300000).toISOString() },
    { sender: "Commander Farhana Islam", message: "RAB Rapid Rescue Squad en-route to the Lalbagh garment factory. Approaching Lalbagh Fort roundabout.", timestamp: new Date(Date.now() - 200000).toISOString() },
    { sender: "Kuddus Ali", message: "Please hurry, structural pillars are starting to flake concrete.", timestamp: new Date(Date.now() - 100000).toISOString() }
  ],
  "beacon-sos-02": [
    { sender: "System", message: "Rescue mission assigned to Commander Farhana Islam.", timestamp: new Date(Date.now() - 600000).toISOString() },
    { sender: "Commander Farhana Islam", message: "Fire Service Team Delta en-route. Approaching Dhanmondi Lake side.", timestamp: new Date(Date.now() - 400000).toISOString() },
    { sender: "Farhana Islam", message: "Stairs are blocked but our unit is structurally intact. Standing by on the 2nd-floor balcony.", timestamp: new Date(Date.now() - 200000).toISOString() }
  ],
  "beacon-sos-03": [
    { sender: "System", message: "Road clearance operation launched at Mirpur 10.", timestamp: new Date(Date.now() - 1200000).toISOString() },
    { sender: "Commander Farhana Islam", message: "Debris successfully cleared using heavy excavator. Roundabout is safe.", timestamp: new Date(Date.now() - 900000).toISOString() },
    { sender: "System", message: "Mission marked as secured.", timestamp: new Date(Date.now() - 800000).toISOString() }
  ],
  "beacon-sos-04": [
    { sender: "System", message: "Inspection mission assigned to Engr. Tanim Ahmed & Commander Farhana.", timestamp: new Date(Date.now() - 800000).toISOString() },
    { sender: "Engr. Tanim Ahmed", message: "On-site in Uttara. Scanning building pillars with Tectonix LiDAR sensor.", timestamp: new Date(Date.now() - 600000).toISOString() },
    { sender: "Nusrat Jahan", message: "Thank you Engr. Tanim, let us know if we need to evacuate.", timestamp: new Date(Date.now() - 400000).toISOString() }
  ],
  "beacon-sos-05": [
    { sender: "System", message: "Emergency debris clearance mission initiated at Mohammadpur.", timestamp: new Date(Date.now() - 200000).toISOString() }
  ]
};

const currentSavedChats = localStorage.getItem(DB_PREFIX + "chat_messages");
if (!currentSavedChats || Object.keys(JSON.parse(currentSavedChats)).length !== 5) {
  localStorage.setItem(DB_PREFIX + "chat_messages", JSON.stringify(seedChatMessages));
}

let dbChatMessages = getDB("chat_messages", seedChatMessages);

// Helper relative time generator
const getTimestamp = (minutesAgo: number) => {
  return new Date(Date.now() - minutesAgo * 60 * 1000).toISOString();
};

// 2. Real-Time Dynamic Seismic Chart Ticking Setup
// Seeding tx_seismic on first run with 100 historical normal city vibration readings at 1.5s intervals
const existingSeismic = localStorage.getItem("tx_seismic");
if (!existingSeismic || JSON.parse(existingSeismic).length < 100) {
  const seedSeismic = [];
  const baseTime = Date.now();
  for (let i = 99; i >= 0; i--) {
    seedSeismic.push({
      intensity_pga: parseFloat((0.01 + Math.random() * 0.04).toFixed(3)),
      detected_at: new Date(baseTime - i * 1500).toISOString(),
      device_uuid: "e2efc2e9-9af4-4f1c-92ed-97f312264ca4"
    });
  }
  localStorage.setItem("tx_seismic", JSON.stringify(seedSeismic));
}

// Background Interval loop ticking every 1.5 seconds
setInterval(() => {
  try {
    const txSeismic = JSON.parse(localStorage.getItem("tx_seismic") || "[]");
    
    // Check if system alert is currently in a CRITICAL state
    const alertState = JSON.parse(localStorage.getItem(DB_PREFIX + "system_alert") || '{"status":"SAFE"}');
    
    // Generate new point. If critical, trigger occasional spike, otherwise standard ambient noise (0.01 - 0.05)
    let ambientIntensity = parseFloat((0.01 + Math.random() * 0.04).toFixed(3));
    if (alertState.status === "CRITICAL" && Math.random() < 0.25) {
      ambientIntensity = parseFloat((0.45 + Math.random() * 0.35).toFixed(3)); // Big earthquake spike
    }

    const newPoint = {
      intensity_pga: ambientIntensity,
      detected_at: new Date().toISOString(),
      device_uuid: "e2efc2e9-9af4-4f1c-92ed-97f312264ca4"
    };

    txSeismic.push(newPoint);
    if (txSeismic.length > 100) {
      txSeismic.shift(); // Keep only last 100 points
    }
    localStorage.setItem("tx_seismic", JSON.stringify(txSeismic));
  } catch (err) {
    console.error("Error ticking tx_seismic background loop", err);
  }
}, 1500);

// Default Seed User Session on Boot (Defaulting to Specialist Tanim for smooth initial display)
if (!localStorage.getItem("tx_current_user") || !localStorage.getItem("token")) {
  localStorage.setItem("token", "mock-jwt-specialist");
  localStorage.setItem("tx_current_user", JSON.stringify(dbUsers[0]));
  localStorage.setItem("user", JSON.stringify(dbUsers[0]));
}

// Mock Request Router
const handleMockRequest = (url: string, method: string, data: any, headers: any): { status: number, data: any, statusText?: string } => {
  const cleanUrl = url.replace(/https?:\/\/[^\/]+/, "").replace(/\/api\//, "/").split("?")[0];

  // 1. STATEFUL MULTI-ROLE AUTH INTERCEPTORS
  if (cleanUrl === "/auth/login") {
    const { email } = data;
    // Find matching profile in seed users
    let matchedUser = dbUsers.find((u: any) => u.email === email);
    
    // Fallback: If not found, check if it matches a custom register or create new citizen
    if (!matchedUser) {
      matchedUser = {
        user_id: `usr-${Math.random().toString(36).substr(2, 9)}`,
        email: email,
        full_name: email.split("@")[0].toUpperCase(),
        role_type: data.role_type || "Citizen"
      };
      dbUsers.push(matchedUser);
      setDB("users", dbUsers);
    }

    // Set persistence to both tx_current_user and user for comprehensive compatibility
    localStorage.setItem("tx_current_user", JSON.stringify(matchedUser));
    localStorage.setItem("user", JSON.stringify(matchedUser));
    localStorage.setItem("token", `mock-token-${matchedUser.user_id}-${Date.now()}`);

    return {
      status: 200,
      data: {
        token: `mock-token-${matchedUser.user_id}`,
        user: matchedUser
      }
    };
  }

  if (cleanUrl === "/auth/register") {
    const newUser = {
      user_id: `usr-${Math.random().toString(36).substr(2, 9)}`,
      email: data.email,
      full_name: data.full_name,
      phone_number: data.phone_number,
      role_type: data.role_type,
      license_no: data.license_no || null,
      specialization: data.specialization || null,
      badge_no: data.badge_no || null,
      rank: data.rank || null,
      legal_name: data.legal_name || null,
      owner_type: data.owner_type || null,
      proficiency_level: data.proficiency_level || null,
      blood_type: data.blood_type || null
    };

    dbUsers.push(newUser);
    setDB("users", dbUsers);

    localStorage.setItem("tx_current_user", JSON.stringify(newUser));
    localStorage.setItem("user", JSON.stringify(newUser));
    localStorage.setItem("token", `mock-token-${newUser.user_id}`);

    return {
      status: 200,
      data: {
        token: `mock-token-${newUser.user_id}`,
        user: newUser
      }
    };
  }

  if (cleanUrl === "/auth/me" || cleanUrl === "/auth/profile") {
    const currentUser = localStorage.getItem("tx_current_user") || localStorage.getItem("user");
    if (currentUser) {
      const parsedUser = JSON.parse(currentUser);
      // If Coordinator, ensure role_type maps to Coordinator for sidebar allowedRoles filtering
      if (parsedUser.email === "farhana_cmd@tectonix.gov.bd") {
        parsedUser.role_type = "Coordinator";
      }
      return { status: 200, data: parsedUser };
    }
    return { status: 401, data: { message: "Unauthorized: No active session found." }, statusText: "Unauthorized" };
  }

  if (cleanUrl === "/auth/logout") {
    localStorage.removeItem("tx_current_user");
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return { status: 200, data: { message: "Logged out successfully" } };
  }

  if (cleanUrl === "/auth/skills") {
    if (method === "get") {
      return { status: 200, data: ["First Aid", "Search & Rescue", "Crowd Control", "Communications", "Logistics"] };
    }
    return { status: 200, data: { message: "Skills updated" } };
  }

  if (cleanUrl === "/auth/change-password") {
    return { status: 200, data: { message: "Password updated successfully" } };
  }

  // 2. LIVE REAL-TIME CHART ROUTING
  if (cleanUrl === "/seismic-data") {
    const txSeismic = JSON.parse(localStorage.getItem("tx_seismic") || "[]");
    return { status: 200, data: txSeismic };
  }

  if (cleanUrl === "/dashboard/chart") {
    const txSeismic = JSON.parse(localStorage.getItem("tx_seismic") || "[]");
    
    // Map dynamic tx_seismic points into expected Time and Magnitude format for Recharts seismograph
    const mappedChartData = txSeismic.map((pt: any) => ({
      time: new Date(pt.detected_at).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' }),
      magnitude: pt.intensity_pga,
      threshold: 0.3
    }));

    return { status: 200, data: mappedChartData };
  }

  // 3. MONITORING & ALERTS
  if (cleanUrl === "/dashboard/stats") {
    const activeBeacons = dbBeacons.filter((b: any) => b.status === "Active").length;
    return {
      status: 200,
      data: {
        buildings: dbBuildings.length,
        sensors: dbDevices.length,
        alerts: dbSystemAlert.status === "CRITICAL" ? activeBeacons + 1 : activeBeacons,
        network_health: 98.5
      }
    };
  }

  if (cleanUrl === "/dashboard/logs") {
    // Return dynamically enriched logs from device mesh
    const enrichedLogs = dbSeismicLogs.map((log: any, index: number) => {
      let sensorType = log.device_model || "Mobile Sensor";
      return {
        id: log.vibe_id || `vibe-${index}`,
        sensor: sensorType,
        location: log.zone_name || "Unknown Zone",
        lat: log.lat,
        lng: log.lng,
        status: log.intensity_pga > 0.7 ? "danger" : log.intensity_pga > 0.3 ? "warning" : "safe",
        magnitude: parseFloat(log.intensity_pga).toFixed(2),
        timestamp: getTimestamp(log.relative_minutes || index * 2)
      };
    });
    return { status: 200, data: enrichedLogs };
  }

  if (cleanUrl === "/dashboard/building-risk") {
    const safeCount = dbBuildings.filter((b: any) => b.risk_score !== null && b.risk_score < 20).length + 3;
    const moderateCount = dbBuildings.filter((b: any) => b.risk_score !== null && b.risk_score >= 20 && b.risk_score < 75).length + 2;
    const highCount = dbBuildings.filter((b: any) => b.risk_score === null || b.risk_score >= 75).length;
    return {
      status: 200,
      data: [
        { name: "Safe", value: safeCount, color: "hsl(142, 76%, 45%)" },
        { name: "Moderate", value: moderateCount, color: "hsl(45, 93%, 47%)" },
        { name: "High Risk", value: highCount, color: "hsl(0, 84%, 60%)" }
      ]
    };
  }

  if (cleanUrl === "/dashboard/alerts") {
    const alertsList = [];
    if (dbSystemAlert.status === "CRITICAL") {
      const activeEvent = dbDisasters.find((d: any) => d.is_active);
      if (activeEvent) {
        alertsList.push({
          id: activeEvent.event_id,
          type: "critical",
          title: "Earthquake Detected",
          location: `Epicenter: Old Dhaka (Lat: ${activeEvent.lat}, Lon: ${activeEvent.lng})`,
          time: new Date(getTimestamp(activeEvent.relative_minutes || 15)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    }

    dbBeacons.forEach((b: any) => {
      if (b.status === "Active") {
        alertsList.push({
          id: b.beacon_id,
          type: "alert",
          title: "Rescue Requested",
          location: b.description || `SOS Beacon in Dhaka`,
          time: new Date(getTimestamp(b.relative_minutes || 10)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    dbSeismicLogs.forEach((v: any, index: number) => {
      if (v.intensity_pga > 0.5) {
        alertsList.push({
          id: v.vibe_id || `warning-${index}`,
          type: "warning",
          title: "Seismic Activity Spike",
          location: `${v.zone_name || "Dhaka Zone"} (${v.intensity_pga}g PGA)`,
          time: new Date(getTimestamp(v.relative_minutes || 15)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    return { status: 200, data: alertsList.slice(0, 10) };
  }

  if (cleanUrl === "/dashboard/seismic/status") {
    const activeEvent = dbDisasters.find((d: any) => d.is_active);
    if (dbSystemAlert.status === "CRITICAL" && activeEvent) {
      return {
        status: 200,
        data: {
          status: "CRITICAL",
          details: {
            event_id: activeEvent.event_id,
            event_type: "Earthquake",
            magnitude: activeEvent.magnitude,
            lat: activeEvent.lat,
            lng: activeEvent.lng,
            is_active: true,
            start_time: getTimestamp(activeEvent.relative_minutes || 15)
          }
        }
      };
    }
    return { status: 200, data: { status: "SAFE" } };
  }

  if (cleanUrl === "/dashboard/seismic/report") {
    const { lat, lng, magnitude, client_uuid } = data;
    
    // Append vibration to logs
    const newLog = {
      vibe_id: `vibe-${Date.now()}`,
      device_id: dbDevices.length + 1,
      device_model: "Interactive Sensor",
      lat: lat || 23.78,
      lng: lng || 90.4,
      intensity_pga: magnitude,
      zone_name: lat && lng ? (lat < 23.74 ? "Old Dhaka / Lalbagh" : "Gulshan / Banani") : "Dhaka",
      relative_minutes: 0
    };
    dbSeismicLogs.unshift(newLog);
    setDB("seismic_logs", dbSeismicLogs);

    // Dynamic seismograph spike injection
    const txSeismic = JSON.parse(localStorage.getItem("tx_seismic") || "[]");
    txSeismic.push({
      intensity_pga: magnitude,
      detected_at: new Date().toISOString(),
      device_uuid: client_uuid || "e2efc2e9-9af4-4f1c-92ed-97f312264ca4"
    });
    localStorage.setItem("tx_seismic", JSON.stringify(txSeismic));

    if (magnitude > 1.5) {
      dbSystemAlert = { status: "CRITICAL" };
      setDB("system_alert", dbSystemAlert);

      const activeEvent = dbDisasters.find((d: any) => d.is_active);
      if (!activeEvent) {
        dbDisasters.push({
          event_id: `event-${Date.now()}`,
          event_type: "Earthquake",
          magnitude: parseFloat((4.0 + Math.random() * 2).toFixed(1)),
          lat: lat || 23.7150,
          lng: lng || 90.3880,
          is_active: true,
          relative_minutes: 0
        });
        setDB("disasters", dbDisasters);
      }
    }

    return {
      status: 200,
      data: {
        status: dbSystemAlert.status,
        deviceCount: dbSeismicLogs.filter(l => l.relative_minutes <= 1).length
      }
    };
  }

  if (cleanUrl === "/dashboard/seismic/resolve") {
    dbSystemAlert = { status: "SAFE" };
    setDB("system_alert", dbSystemAlert);
    
    dbDisasters.forEach((d: any) => d.is_active = false);
    setDB("disasters", dbDisasters);

    dbSeismicLogs = dbSeismicLogs.filter((l: any) => l.intensity_pga <= 0.1);
    setDB("seismic_logs", dbSeismicLogs);

    return { status: 200, data: { message: "System alarm resolved" } };
  }

  // 4. BUILDINGS
  if (cleanUrl === "/buildings") {
    if (method === "get") {
      const currentUser = localStorage.getItem("tx_current_user") || localStorage.getItem("user");
      if (currentUser) {
        const user = JSON.parse(currentUser);
        if (user.role_type === "Citizen" || user.role_type === "Owner") {
          // Filter to owned buildings
          const ownedIds = dbOwnershipHistory
            .filter((h: any) => h.owner_id === user.user_id && h.end_date === null)
            .map((h: any) => h.building_id);
          const ownedBuildings = dbBuildings.filter((b: any) => ownedIds.includes(b.building_id));
          return { status: 200, data: ownedBuildings };
        }
      }
      return { status: 200, data: dbBuildings };
    }

    if (method === "post") {
      const newBuilding = {
        building_id: dbBuildings.length + 1,
        building_name: data.building_name,
        address_text: data.address_text,
        construction_year: parseInt(data.construction_year) || 2020,
        lat: parseFloat(data.lat) || 23.78 + (Math.random() * 0.1 - 0.05),
        lng: parseFloat(data.lng) || 90.4 + (Math.random() * 0.1 - 0.05),
        risk_score: null
      };
      dbBuildings.push(newBuilding);
      setDB("buildings", dbBuildings);

      const currentUser = localStorage.getItem("tx_current_user") || localStorage.getItem("user");
      const user = currentUser ? JSON.parse(currentUser) : dbUsers[2]; // fallback to Rahim
      
      dbOwnershipHistory.push({
        ownership_id: dbOwnershipHistory.length + 1,
        building_id: newBuilding.building_id,
        owner_id: user.user_id,
        owner_name: user.full_name,
        owner_type: "Individual",
        start_date: new Date().toISOString().split("T")[0],
        end_date: null
      });
      setDB("ownership_history", dbOwnershipHistory);

      return { status: 200, data: newBuilding };
    }
  }

  if (cleanUrl === "/buildings/map-data") {
    const mapData = dbBuildings.map((b: any) => ({
      id: b.building_id,
      name: b.building_name,
      location: b.address_text,
      risk_score: b.risk_score,
      lat: b.lat,
      lng: b.lng
    }));
    return { status: 200, data: mapData };
  }

  if (cleanUrl === "/buildings/pending") {
    const pendingList = dbBuildings.filter((b: any) => b.risk_score === null);
    return { status: 200, data: pendingList };
  }

  if (cleanUrl.startsWith("/buildings/") && cleanUrl.endsWith("/ownership")) {
    const buildingId = parseInt(cleanUrl.split("/")[2]);
    const history = dbOwnershipHistory.filter((h: any) => h.building_id === buildingId);
    return { status: 200, data: history };
  }

  if (cleanUrl === "/buildings/owners") {
    const ownersList = dbUsers.filter((u: any) => u.role_type === "Citizen" || u.role_type === "Owner");
    return { status: 200, data: ownersList };
  }

  if (cleanUrl === "/buildings/transfer") {
    const { building_id, owner_id } = data;
    const previous = dbOwnershipHistory.find((h: any) => h.building_id === building_id && h.end_date === null);
    if (previous) {
      previous.end_date = new Date().toISOString().split("T")[0];
    }
    const nextOwner = dbUsers.find((u: any) => u.user_id === owner_id) || dbUsers[2];
    dbOwnershipHistory.push({
      ownership_id: dbOwnershipHistory.length + 1,
      building_id: building_id,
      owner_id: owner_id,
      owner_name: nextOwner.full_name,
      owner_type: "Individual",
      start_date: new Date().toISOString().split("T")[0],
      end_date: null
    });
    setDB("ownership_history", dbOwnershipHistory);
    return { status: 200, data: { message: "Ownership transferred successfully" } };
  }

  if (cleanUrl === "/buildings/reportable") {
    return { status: 200, data: dbBuildings };
  }

  if (cleanUrl.startsWith("/buildings/") && cleanUrl.endsWith("/risk")) {
    const buildingId = parseInt(cleanUrl.split("/")[2]);
    const building = dbBuildings.find((b: any) => b.building_id === buildingId);
    if (building) {
      building.risk_score = data.risk_score;
      building.has_damage = false;
      setDB("buildings", dbBuildings);
    }
    return { status: 200, data: { message: "Risk score updated" } };
  }

  // 5. SENSORS & AI ANALYSIS
  if (cleanUrl.startsWith("/sensors/building/")) {
    const buildingId = parseInt(cleanUrl.split("/")[3]);
    let soil = dbSoilData.find((s: any) => s.building_id === buildingId);
    
    if (!soil) {
      const building = dbBuildings.find((b: any) => b.building_id === buildingId) || dbBuildings[0];
      const isSouthDhaka = building.lat < 23.74;
      soil = {
        building_id: buildingId,
        liquefaction_risk: isSouthDhaka ? Math.round(70 + Math.random() * 20) : Math.round(20 + Math.random() * 20),
        soil_moisture: isSouthDhaka ? Math.round(40 + Math.random() * 10) : Math.round(15 + Math.random() * 10),
        groundwater_level: isSouthDhaka ? parseFloat((1.0 + Math.random() * 1.5).toFixed(1)) : parseFloat((10.0 + Math.random() * 8.0).toFixed(1)),
        soil_type: isSouthDhaka ? "Alluvial Silt / Soft Clay" : "Red Clay / Madhupur Tract"
      };
      dbSoilData.push(soil);
      setDB("soil_data", dbSoilData);
    }
    return { status: 200, data: soil };
  }

  if (cleanUrl === "/scanner/analyze") {
    const buildingId = data.get ? parseInt(data.get("building_id")) : 4;
    const building = dbBuildings.find((b: any) => b.building_id === buildingId) || dbBuildings[3];
    const baseScore = building.has_damage ? 70 : 30;
    const randomizedResultScore = Math.min(100, Math.max(10, Math.round(baseScore + Math.random() * 20)));
    return {
      status: 200,
      data: {
        riskScore: randomizedResultScore,
        confidence: "94.2%",
        detections: ["Shear Cracks detected on columns", "Possible soft-story configuration on ground level floor"]
      }
    };
  }

  // 6. DISTRESS BEACONS & RESCUE MISSION CONTROL
  if (cleanUrl === "/beacons/history") {
    return { status: 200, data: dbBeacons };
  }

  if (cleanUrl === "/beacons/activate") {
    const newBeacon = {
      beacon_id: `beacon-${Date.now()}`,
      victim_name: data.victim_name || "Md. Rahim",
      phone_number: data.phone_number || "+8801555566677",
      lat: data.lat || 23.7460,
      lng: data.lng || 90.3735,
      status: "Active",
      relative_minutes: 0,
      description: data.description || "Active emergency beacon triggered by Citizen.",
      assigned_squad: ""
    };
    dbBeacons.unshift(newBeacon);
    setDB("beacons", dbBeacons);
    return { status: 200, data: newBeacon };
  }

  if (cleanUrl === "/rescue/feed") {
    const activeBeacons = dbBeacons.filter((b: any) => b.status === "Active").map((b: any) => ({
      beacon_id: b.beacon_id,
      victim_name: b.victim_name,
      phone_number: b.phone_number,
      lat: b.lat,
      lng: b.lng,
      status: b.status,
      activated_at: getTimestamp(b.relative_minutes || 0),
      description: b.description || ""
    }));

    const activeEvents = dbDisasters.filter((d: any) => d.is_active).map((d: any) => ({
      event_id: d.event_id,
      event_type: d.event_type,
      magnitude: d.magnitude,
      start_time: getTimestamp(d.relative_minutes || 15),
      lat: d.lat,
      lng: d.lng
    }));

    return {
      status: 200,
      data: {
        beacons: activeBeacons,
        events: activeEvents
      }
    };
  }

  if (cleanUrl === "/rescue/personnel") {
    const respondersList = dbUsers.filter((u: any) => u.role_type === "Coordinator" || u.role_type === "First_Responder" || u.role_type === "Volunteer" || u.role_type === "Specialist");
    return { status: 200, data: respondersList };
  }

  if (cleanUrl === "/rescue/resolve") {
    const { type, id } = data;
    if (type === "Beacon") {
      const beacon = dbBeacons.find((b: any) => b.beacon_id === id);
      if (beacon) beacon.status = "Resolved";
    } else {
      const event = dbDisasters.find((d: any) => d.event_id === id);
      if (event) event.is_active = false;
      dbSystemAlert = { status: "SAFE" };
      setDB("system_alert", dbSystemAlert);
    }
    setDB("beacons", dbBeacons);
    setDB("disasters", dbDisasters);
    return { status: 200, data: { message: `${type} marked as resolved.` } };
  }

  if (cleanUrl === "/rescue/assign") {
    const { task_type, task_id, responder_ids } = data;
    
    if (task_type === "Beacon") {
      const beacon = dbBeacons.find((b: any) => b.beacon_id === task_id);
      if (beacon) {
        const primaryResponder = dbUsers.find((u: any) => u.user_id === responder_ids[0]) || dbUsers[1];
        beacon.assigned_squad = `${primaryResponder.full_name} Lead - RAB Rapid Rescue`;
      }
    }

    dbMissions.push({
      mission_id: `mission-${Date.now()}`,
      task_type,
      task_id,
      responder_ids,
      status: "In Progress",
      assigned_at: new Date().toISOString()
    });

    setDB("beacons", dbBeacons);
    setDB("missions", dbMissions);

    if (!dbChatMessages[task_id]) {
      dbChatMessages[task_id] = [
        { sender: "System", message: `Rescue mission assigned. First responder dispatched.`, timestamp: new Date().toISOString() }
      ];
      setDB("chat_messages", dbChatMessages);
    }

    return { status: 200, data: { message: "Squad assigned successfully." } };
  }

  if (cleanUrl === "/rescue/my-missions") {
    const currentUser = localStorage.getItem("tx_current_user") || localStorage.getItem("user");
    const userId = currentUser ? JSON.parse(currentUser).user_id : "usr-coordinator-01";
    
    const myMissions = dbMissions.filter((m: any) => m.responder_ids.includes(userId) || userId === "usr-coordinator-01");
    const enrichedMissions = myMissions.map((m: any) => {
      const isBeacon = m.task_type === "Beacon";
      if (isBeacon) {
        const beacon = dbBeacons.find((b: any) => b.beacon_id === m.task_id);
        return {
          assignment_id: m.mission_id,
          task_type: "Beacon",
          assignment_status: m.status,
          assigned_at: m.assigned_at,
          beacon_id: m.task_id,
          beacon_lat: beacon ? beacon.lat : 23.7185,
          beacon_lng: beacon ? beacon.lng : 90.3882,
          victim_name: beacon ? beacon.victim_name : "Kuddus Ali",
          victim_phone: beacon ? beacon.phone_number : "+8801711223344"
        };
      } else {
        const event = dbDisasters.find((d: any) => d.event_id === m.task_id);
        return {
          assignment_id: m.mission_id,
          task_type: "Event",
          assignment_status: m.status,
          assigned_at: m.assigned_at,
          event_id: m.task_id,
          event_type: event ? event.event_type : "Earthquake Epicenter Response",
          magnitude: event ? event.magnitude : 6.2,
          event_lat: event ? event.lat : 23.7150,
          event_lng: event ? event.lng : 90.3880
        };
      }
    });
    return { status: 200, data: enrichedMissions };
  }

  if (cleanUrl === "/rescue/mission-status") {
    const { assignment_id, status } = data;
    const mission = dbMissions.find((m: any) => m.mission_id === assignment_id);
    if (mission) {
      mission.status = status;
      if (status === "Completed") {
        const beacon = dbBeacons.find((b: any) => b.beacon_id === mission.task_id);
        if (beacon) beacon.status = "Resolved";
        const disaster = dbDisasters.find((d: any) => d.event_id === mission.task_id);
        if (disaster) disaster.is_active = false;
      }
      setDB("missions", dbMissions);
      setDB("beacons", dbBeacons);
      setDB("disasters", dbDisasters);
    }
    return { status: 200, data: { message: "Mission status updated" } };
  }

  if (cleanUrl.startsWith("/rescue/chat/")) {
    const taskId = cleanUrl.split("/")[3];
    const messages = dbChatMessages[taskId] || [];
    return { status: 200, data: messages };
  }

  if (cleanUrl.startsWith("/rescue/chat-send/")) {
    const taskId = cleanUrl.split("/")[3];
    if (!dbChatMessages[taskId]) dbChatMessages[taskId] = [];
    dbChatMessages[taskId].push({
      sender: data.sender || "Responder",
      message: data.message,
      timestamp: new Date().toISOString()
    });
    setDB("chat_messages", dbChatMessages);
    return { status: 200, data: dbChatMessages[taskId] };
  }

  // 7. DAMAGE REPORTS & RETROFIT CALCULATORS
  if (cleanUrl === "/reports" && method === "post") {
    let buildingId, description, severity;
    if (data.get) {
      buildingId = parseInt(data.get("building_id"));
      description = data.get("description");
      severity = parseInt(data.get("severity_level")) || 50;
    } else {
      buildingId = data.building_id;
      description = data.description;
      severity = data.severity_level || 50;
    }

    const newReport = {
      report_id: dbReports.length + 1,
      building_id: buildingId,
      description: description,
      severity_level: severity,
      submitted_at: new Date().toISOString()
    };
    dbReports.push(newReport);
    setDB("reports", dbReports);

    const building = dbBuildings.find((b: any) => b.building_id === buildingId);
    if (building) {
      building.risk_score = null;
      building.has_damage = true;
      building.severity_level = severity;
      building.damage_description = description;
      setDB("buildings", dbBuildings);
    }

    return { status: 200, data: newReport };
  }

  if (cleanUrl === "/estimates/materials") {
    return { status: 200, data: dbMaterialRates };
  }

  if (cleanUrl === "/estimates" && method === "post") {
    const newEstimate = {
      estimate_id: dbEstimates.length + 1,
      building_id: data.building_id,
      total_estimated_cost: data.total_estimated_cost,
      generated_at: new Date().toISOString()
    };
    dbEstimates.push(newEstimate);
    setDB("estimates", dbEstimates);
    return { status: 200, data: newEstimate };
  }

  if (cleanUrl.startsWith("/zones/identify")) {
    const { lat, lng } = data || {};
    if (lat && lng) {
      if (lat < 23.73) return { status: 200, data: { zone_name: "Old Dhaka / Lalbagh" } };
      if (lat > 23.82) return { status: 200, data: { zone_name: "Uttara" } };
      if (lng > 90.40) return { status: 200, data: { zone_name: "Gulshan / Banani" } };
      return { status: 200, data: { zone_name: "Mirpur / Mohammadpur" } };
    }
    return { status: 200, data: { zone_name: "Dhaka Municipality" } };
  }

  // FALLBACK
  return { status: 404, data: { message: "Mock API endpoint not found" }, statusText: "Not Found" };
};

// Apply custom adapter to Axios global default and custom instance
const mockAxiosAdapter = async (config: any) => {
  const method = (config.method || "get").toLowerCase();
  const url = config.url || "";
  let payload = config.data;
  
  // Parse FormData if needed
  if (payload instanceof FormData) {
    payload = payload; // Keep FormData object as-is for the mock router's getter
  } else if (payload && typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch (e) {}
  }
  
  try {
    const mockResult = handleMockRequest(url, method, payload, config.headers);
    
    // Simulate natural browser network latency (100ms - 250ms) for a premium responsive feel
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));

    if (mockResult.status >= 200 && mockResult.status < 300) {
      return {
        data: mockResult.data,
        status: mockResult.status,
        statusText: mockResult.statusText || "OK",
        headers: {},
        config: config,
        request: {}
      };
    } else {
      const err: any = new Error(mockResult.data?.message || "Mock API Request Failed");
      err.response = {
        data: mockResult.data,
        status: mockResult.status,
        statusText: mockResult.statusText || "Error",
        headers: {},
        config: config
      };
      throw err;
    }
  } catch (error) {
    return Promise.reject(error);
  }
};

// Set adapter on both default axios and custom instance
axios.defaults.adapter = mockAxiosAdapter;
api.defaults.adapter = mockAxiosAdapter;

// Intercept native window.fetch
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  let url = "";
  if (typeof input === "string") {
    url = input;
  } else if (input instanceof URL) {
    url = input.toString();
  } else if (input instanceof Request) {
    url = input.url;
  }

  // Intercept all API endpoints
  if (url.includes("/api/")) {
    const method = (init?.method || "get").toLowerCase();
    let body = null;
    if (init?.body) {
      if (typeof init.body === "string") {
        try {
          body = JSON.parse(init.body);
        } catch {
          body = init.body;
        }
      } else {
        body = init.body;
      }
    }

    const headers: any = {};
    if (init?.headers) {
      if (init.headers instanceof Headers) {
        init.headers.forEach((val, key) => {
          headers[key] = val;
        });
      } else if (Array.isArray(init.headers)) {
        init.headers.forEach(([key, val]) => {
          headers[key] = val;
        });
      } else {
        Object.assign(headers, init.headers);
      }
    }

    const mockResult = handleMockRequest(url, method, body, headers);
    
    // Simulate natural latency
    await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 100));

    return new Response(JSON.stringify(mockResult.data), {
      status: mockResult.status,
      statusText: mockResult.statusText || "OK",
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }

  return originalFetch(input, init);
};

// Inject custom SSE/WebSocket simulation hooks into window for live ticking feeds
const tickFeeds = () => {
  setInterval(() => {
    const status = localStorage.getItem(DB_PREFIX + "system_alert");
    const parsedAlert = status ? JSON.parse(status) : { status: "SAFE" };
    
    // Periodically add micro background vibration logs if system is safe
    if (parsedAlert.status === "SAFE" && Math.random() < 0.3) {
      const logs = getDB("seismic_logs", mockSeismicLogs);
      const randomLog = {
        vibe_id: `vibe-${Date.now()}`,
        device_id: Math.floor(1 + Math.random() * 5),
        device_model: ["iPhone 14", "Pixel 7 Pro", "Xiaomi Redmi Note 12", "Samsung Galaxy A54"][Math.floor(Math.random() * 4)],
        lat: 23.7000 + Math.random() * 0.18,
        lng: 90.3400 + Math.random() * 0.11,
        intensity_pga: parseFloat((0.01 + Math.random() * 0.08).toFixed(2)),
        zone_name: ["Old Dhaka / Lalbagh", "Gulshan / Banani", "Mirpur / Mohammadpur", "Uttara"][Math.floor(Math.random() * 4)],
        relative_minutes: 0
      };
      
      logs.unshift(randomLog);
      if (logs.length > 30) logs.pop();
      setDB("seismic_logs", logs);
    }
  }, 10000); // Trigger background tick noise every 10 seconds
};

tickFeeds();

console.log("🚀 [Tectonix Static Interceptor Engine] Decoupling Active. Central state initialized in localStorage.");
