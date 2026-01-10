// Mock data for Tectonix - AI Disaster Management System

export const seismicLogs = [
  { id: 1, sensor: "SEN-001", location: "Motijheel", status: "stable", magnitude: 0.02, timestamp: "2025-01-10T14:32:00" },
  { id: 2, sensor: "SEN-042", location: "Gulshan", status: "stable", magnitude: 0.01, timestamp: "2025-01-10T14:31:45" },
  { id: 3, sensor: "SEN-099", location: "Mirpur", status: "warning", magnitude: 0.12, timestamp: "2025-01-10T14:31:30" },
  { id: 4, sensor: "SEN-156", location: "Uttara", status: "stable", magnitude: 0.03, timestamp: "2025-01-10T14:31:15" },
  { id: 5, sensor: "SEN-203", location: "Dhanmondi", status: "stable", magnitude: 0.02, timestamp: "2025-01-10T14:31:00" },
  { id: 6, sensor: "SEN-287", location: "Banani", status: "alert", magnitude: 0.25, timestamp: "2025-01-10T14:30:45" },
  { id: 7, sensor: "SEN-312", location: "Mohammadpur", status: "stable", magnitude: 0.01, timestamp: "2025-01-10T14:30:30" },
  { id: 8, sensor: "SEN-445", location: "Bashundhara", status: "stable", magnitude: 0.04, timestamp: "2025-01-10T14:30:15" },
];

export const buildings = [
  { id: 1, name: "Jamuna Future Park", type: "Commercial", floors: 12, status: "safe", riskScore: 15, lat: 23.813, lng: 90.424 },
  { id: 2, name: "Bashundhara City", type: "Commercial", floors: 21, status: "safe", riskScore: 22, lat: 23.751, lng: 90.392 },
  { id: 3, name: "RAJUK Bhaban", type: "Government", floors: 18, status: "moderate", riskScore: 45, lat: 23.728, lng: 90.412 },
  { id: 4, name: "Rana Plaza Site", type: "Industrial", floors: 8, status: "high", riskScore: 85, lat: 23.896, lng: 90.253 },
  { id: 5, name: "Sonargaon Hotel", type: "Commercial", floors: 17, status: "safe", riskScore: 18, lat: 23.773, lng: 90.407 },
  { id: 6, name: "BICC", type: "Commercial", floors: 8, status: "safe", riskScore: 12, lat: 23.774, lng: 90.399 },
  { id: 7, name: "Hatirjheel Tower", type: "Residential", floors: 25, status: "moderate", riskScore: 52, lat: 23.763, lng: 90.415 },
  { id: 8, name: "Dhaka Medical", type: "Healthcare", floors: 6, status: "high", riskScore: 78, lat: 23.726, lng: 90.396 },
];

export const seismicChartData = [
  { time: "00:00", magnitude: 0.02, threshold: 0.3 },
  { time: "04:00", magnitude: 0.03, threshold: 0.3 },
  { time: "08:00", magnitude: 0.05, threshold: 0.3 },
  { time: "12:00", magnitude: 0.08, threshold: 0.3 },
  { time: "14:00", magnitude: 0.25, threshold: 0.3 },
  { time: "14:30", magnitude: 0.45, threshold: 0.3 },
  { time: "15:00", magnitude: 0.12, threshold: 0.3 },
  { time: "16:00", magnitude: 0.04, threshold: 0.3 },
  { time: "20:00", magnitude: 0.02, threshold: 0.3 },
];

export const riskDistribution = [
  { name: "Safe", value: 342, color: "hsl(142, 76%, 45%)" },
  { name: "Moderate", value: 89, color: "hsl(45, 93%, 47%)" },
  { name: "High Risk", value: 23, color: "hsl(0, 84%, 60%)" },
];

export const alertFeed = [
  { id: 1, type: "warning", title: "Micro-tremor Detected", location: "Sector 7, Uttara", time: "2 min ago", severity: "low" },
  { id: 2, type: "alert", title: "Building Assessment Required", location: "Banani DOHS", time: "15 min ago", severity: "medium" },
  { id: 3, type: "info", title: "Sensor Calibration Complete", location: "Motijheel Network", time: "1 hour ago", severity: "low" },
  { id: 4, type: "critical", title: "Liquefaction Risk Zone", location: "Old Dhaka", time: "3 hours ago", severity: "high" },
  { id: 5, type: "info", title: "New Sensor Online", location: "Bashundhara R/A", time: "5 hours ago", severity: "low" },
];

export const mapPins = [
  { id: 1, x: 25, y: 30, status: "safe", label: "Gulshan" },
  { id: 2, x: 45, y: 25, status: "safe", label: "Banani" },
  { id: 3, x: 60, y: 35, status: "warning", label: "Badda" },
  { id: 4, x: 35, y: 55, status: "safe", label: "Dhanmondi" },
  { id: 5, x: 55, y: 60, status: "danger", label: "Old Dhaka" },
  { id: 6, x: 70, y: 20, status: "safe", label: "Uttara" },
  { id: 7, x: 20, y: 70, status: "warning", label: "Mirpur" },
  { id: 8, x: 80, y: 45, status: "safe", label: "Bashundhara" },
];

export const tickerUpdates = [
  { id: 1, sensor: "SEN-402", status: "Stable", type: "normal" },
  { id: 2, sensor: "SEN-099", status: "Micro-tremor detected", type: "warning" },
  { id: 3, sensor: "SEN-287", status: "Elevated activity", type: "alert" },
  { id: 4, sensor: "SEN-156", status: "All systems nominal", type: "normal" },
  { id: 5, sensor: "SEN-445", status: "Calibrating...", type: "info" },
  { id: 6, sensor: "SEN-203", status: "Stable", type: "normal" },
  { id: 7, sensor: "SEN-312", status: "Ground water level: Normal", type: "normal" },
  { id: 8, sensor: "SEN-001", status: "Vibration within limits", type: "normal" },
];
