import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Users,
  MapPin,
  Clock,
  Radio,
  Phone,
  CheckCircle,
  Rocket,
  Menu,
  Grid3X3,
  List,
  Flame,
  Map as MapIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  ZoomControl,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// --- TYPES (From your actual DB Schema) ---
interface Beacon {
  beacon_id: string;
  victim_name: string;
  phone_number: string;
  lat: number;
  lng: number;
  status: string;
  activated_at: string;
}

interface DisasterEvent {
  event_id: string;
  event_type: string;
  magnitude: number;
  start_time: string;
  lat: number;
  lng: number;
}

interface Responder {
  user_id: string;
  full_name: string;
  role_type: string;
  rank?: string;
  proficiency_level?: string;
  phone_number?: string;
}

const createBeaconIcon = () => {
  return L.divIcon({
    className: "custom-icon-marker",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute w-full h-full rounded-full opacity-50 animate-ping bg-red-500"></span>
        <span class="relative w-3.5 h-3.5 border-2 border-[#020617] rounded-full shadow-[0_0_15px] shadow-red-500/80 bg-red-500"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const createEventIcon = () => {
  return L.divIcon({
    className: "custom-icon-marker",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute w-full h-full rounded-full opacity-50 animate-ping bg-orange-500"></span>
        <span class="relative w-3.5 h-3.5 border-2 border-[#020617] rounded-full shadow-[0_0_15px] shadow-orange-500/80 bg-orange-500"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const RescueCoordinator = () => {
  const { toast } = useToast();

  // Data State
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [personnel, setPersonnel] = useState<Responder[]>([]);
  const [loading, setLoading] = useState(true);

  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Assignment Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [deployForm, setDeployForm] = useState<{
    type: "Beacon" | "Event" | "";
    id: string;
    responder_ids: string[];
  }>({ type: "", id: "", responder_ids: [] });

  const fetchData = async () => {
    try {
      const [feedRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/rescue/feed`, { headers: getHeaders() }),
        axios.get(`${API_BASE_URL}/api/rescue/personnel`, {
          headers: getHeaders(),
        }),
      ]);
      setBeacons(feedRes.data.beacons);
      setEvents(feedRes.data.events);
      setPersonnel(staffRes.data);
      setLoading(false);
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to load rescue feed",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Auto-refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // --- ACTIONS ---
  const handleResolve = async (type: "Beacon" | "Event", id: string) => {
    try {
      await axios.post(
        `${API_BASE_URL}/api/rescue/resolve`,
        { type, id },
        { headers: getHeaders() },
      );
      toast({ title: "Resolved", description: `${type} marked as resolved.` });
      // Optimistic UI update
      if (type === "Beacon")
        setBeacons((prev) => prev.filter((b) => b.beacon_id !== id));
      else setEvents((prev) => prev.filter((e) => e.event_id !== id));
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to resolve alert.",
        variant: "destructive",
      });
    }
  };

  const handleDeploySubmit = async () => {
    if (
      !deployForm.type ||
      !deployForm.id ||
      deployForm.responder_ids.length === 0
    )
      return;
    setAssigning(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/rescue/assign`,
        {
          task_type: deployForm.type,
          task_id: deployForm.id,
          responder_ids: deployForm.responder_ids,
        },
        { headers: getHeaders() },
      );
      toast({
        title: "Deployment Successful",
        description: `Assigned ${deployForm.responder_ids.length} personnel.`,
      });
      setIsAssignOpen(false);
      setDeployForm({ type: "", id: "", responder_ids: [] });
      fetchData(); // Refresh to reflect assignment
    } catch (err) {
      toast({
        title: "Assignment Failed",
        description: "Could not assign responders.",
        variant: "destructive",
      });
    } finally {
      setAssigning(false);
    }
  };

  const toggleResponder = (userId: string) => {
    setDeployForm((prev) => {
      const updatedIds = prev.responder_ids.includes(userId)
        ? prev.responder_ids.filter((id) => id !== userId)
        : [...prev.responder_ids, userId];
      return { ...prev, responder_ids: updatedIds };
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2 bg-card/80 backdrop-blur-sm rounded-lg border border-white/10"
      >
        <Menu className="h-5 w-5 text-foreground" />
      </button>

      <div
        className={`${sidebarOpen ? "block" : "hidden"} lg:block fixed z-40`}
      >
        <DashboardSidebar />
      </div>

      <main className="lg:ml-64 p-4 lg:p-8 pt-16 lg:pt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Radio className="h-7 w-7 lg:h-8 lg:w-8 text-destructive animate-pulse" />
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
                Rescue Mission Control
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Real-time alert coordination and deployment
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Toggle */}
            <div className="hidden lg:flex items-center gap-1 p-1 bg-muted/30 rounded-lg">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${viewMode === "grid" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${viewMode === "list" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-xl border border-destructive/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              <span className="text-xs font-medium text-destructive hidden sm:inline">
                {beacons.length + events.length} Active Alerts
              </span>
            </div>

            <GlowButton
              variant="accent"
              onClick={() => setIsAssignOpen(true)}
              size="sm"
            >
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Deploy Personnel</span>
            </GlowButton>
          </div>
        </motion.div>

        {/* Top Desktop Row: Map + Personnel */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-6">
          {/* Map Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-0 overflow-hidden h-[400px]" hover={false}>
              <div className="relative w-full h-full z-0">
                <MapContainer
                  center={[23.78, 90.4]} // Default center to Dhaka
                  zoom={12}
                  scrollWheelZoom={true}
                  zoomControl={false}
                  attributionControl={false}
                  className="w-full h-full z-0"
                  style={{ background: "#020617" }}
                >
                  {/* Dark Mode CartoDB Map Tiles */}
                  <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                  <ZoomControl position="topright" />

                  {/* Render Real SOS Beacons */}
                  {beacons.map((b) => (
                    <Marker
                      key={b.beacon_id}
                      position={[b.lat, b.lng]}
                      icon={createBeaconIcon()}
                    >
                      <Tooltip
                        direction="top"
                        offset={[0, -10]}
                        className="custom-tooltip"
                      >
                        SOS: {b.victim_name}
                      </Tooltip>
                      <Popup className="custom-dark-popup">
                        <div className="p-2 min-w-[150px]">
                          <h3 className="font-bold text-red-400 mb-1 flex items-center gap-2">
                            <Radio className="w-3 h-3" /> SOS Beacon
                          </h3>
                          <p className="text-sm text-foreground font-medium">
                            {b.victim_name}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Phone className="w-3 h-3" /> {b.phone_number}
                          </p>
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setDeployForm({
                                  type: "Beacon",
                                  id: b.beacon_id,
                                  responder_ids: [],
                                });
                                setIsAssignOpen(true);
                              }}
                              className="w-full py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded hover:bg-red-500/30 transition-colors"
                            >
                              Assign Rescue
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {/* Render Real Disaster Events */}
                  {events.map((e) => (
                    <Marker
                      key={e.event_id}
                      position={[e.lat, e.lng]}
                      icon={createEventIcon()}
                    >
                      <Tooltip
                        direction="top"
                        offset={[0, -10]}
                        className="custom-tooltip"
                      >
                        {e.event_type}
                      </Tooltip>
                      <Popup className="custom-dark-popup">
                        <div className="p-2 min-w-[150px]">
                          <h3 className="font-bold text-orange-400 mb-1 flex items-center gap-2">
                            <Flame className="w-3 h-3" /> {e.event_type}
                          </h3>
                          <p className="text-xs text-muted-foreground mt-1">
                            Magnitude: {e.magnitude || "N/A"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Started:{" "}
                            {new Date(e.start_time).toLocaleTimeString()}
                          </p>
                          <div className="mt-3">
                            <button
                              onClick={() => {
                                setDeployForm({
                                  type: "Event",
                                  id: e.event_id,
                                  responder_ids: [],
                                });
                                setIsAssignOpen(true);
                              }}
                              className="w-full py-1.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded hover:bg-orange-500/30 transition-colors"
                            >
                              Dispatch Team
                            </button>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>

                {/* Legend Overlay */}
                <div className="absolute bottom-4 left-4 z-[400] bg-background/90 backdrop-blur-md rounded-lg p-3 border border-white/10 pointer-events-auto shadow-xl">
                  <p className="text-xs font-bold text-foreground mb-2">
                    Live Tracking
                  </p>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 shadow-[0_0_8px_rgba(239,68,68,0.8)] bg-red-500 rounded-full" />
                      <span className="text-muted-foreground font-medium">
                        SOS Beacon
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2.5 h-2.5 shadow-[0_0_8px_rgba(249,115,22,0.8)] bg-orange-500 rounded-full" />
                      <span className="text-muted-foreground font-medium">
                        Disaster Event
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Personnel List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <GlassCard className="h-[400px] flex flex-col" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <Users className="w-4 h-4" /> Available Personnel
                </h3>
                <span className="text-xs text-muted-foreground">
                  {personnel.length} Ready
                </span>
              </div>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {personnel.map((p, idx) => (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="p-3 bg-muted/10 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="font-medium text-foreground text-sm">
                          {p.full_name}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground ml-4 mb-2">
                      {p.role_type.replace("_", " ")} •{" "}
                      {p.rank || p.proficiency_level || "General"}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/10 text-primary text-[10px] font-medium rounded-md hover:bg-primary/20">
                        <Phone className="h-3 w-3" /> Contact
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Mission Board (Grid/List Views) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Beacons Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-red-500/20 pb-2">
                  <h4 className="font-semibold text-red-400 flex items-center gap-2">
                    <Radio className="w-4 h-4" /> SOS Beacons
                  </h4>
                  <StatusBadge status="danger">{beacons.length}</StatusBadge>
                </div>
                {beacons.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active distress beacons.
                  </p>
                )}

                {beacons.map((beacon, idx) => (
                  <motion.div
                    key={beacon.beacon_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <GlassCard
                      className="p-4 border-l-2 border-l-red-500 bg-red-500/5"
                      hover={false}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {beacon.beacon_id.split("-")[0]}
                        </span>
                        <StatusBadge status="danger" pulse>
                          Active
                        </StatusBadge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">
                        {beacon.victim_name}
                      </h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                        <p className="flex items-center gap-2">
                          <Phone className="w-3 h-3" /> {beacon.phone_number}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapIcon className="w-3 h-3" />{" "}
                          {beacon.lat.toFixed(4)}, {beacon.lng.toFixed(4)}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />{" "}
                          {new Date(beacon.activated_at).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setDeployForm({
                              type: "Beacon",
                              id: beacon.beacon_id,
                              responder_ids: [],
                            });
                            setIsAssignOpen(true);
                          }}
                          className="flex-1 py-1.5 bg-accent/20 text-accent text-xs font-medium rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          Assign Rescue
                        </button>
                        <button
                          onClick={() =>
                            handleResolve("Beacon", beacon.beacon_id)
                          }
                          className="flex-1 py-1.5 bg-success/20 text-success text-xs font-medium rounded-lg hover:bg-success/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Resolve
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>

              {/* Events Column */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-orange-500/20 pb-2">
                  <h4 className="font-semibold text-orange-400 flex items-center gap-2">
                    <Flame className="w-4 h-4" /> Disaster Events
                  </h4>
                  <StatusBadge status="warning">{events.length}</StatusBadge>
                </div>
                {events.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active disaster events.
                  </p>
                )}

                {events.map((event, idx) => (
                  <motion.div
                    key={event.event_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <GlassCard
                      className="p-4 border-l-2 border-l-orange-500 bg-orange-500/5"
                      hover={false}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {event.event_id.split("-")[0]}
                        </span>
                        <StatusBadge status="warning">In Progress</StatusBadge>
                      </div>
                      <h3 className="font-bold text-foreground mb-1">
                        {event.event_type}
                      </h3>
                      <div className="space-y-1.5 text-xs text-muted-foreground mb-4">
                        <p className="flex items-center gap-2">
                          Magnitude: {event.magnitude || "N/A"}
                        </p>
                        <p className="flex items-center gap-2">
                          <MapIcon className="w-3 h-3" />{" "}
                          {event.lat?.toFixed(4) || "Unknown"},{" "}
                          {event.lng?.toFixed(4) || "Unknown"}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock className="w-3 h-3" />{" "}
                          {new Date(event.start_time).toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setDeployForm({
                              type: "Event",
                              id: event.event_id,
                              responder_ids: [],
                            });
                            setIsAssignOpen(true);
                          }}
                          className="flex-1 py-1.5 bg-accent/20 text-accent text-xs font-medium rounded-lg hover:bg-accent/30 transition-colors"
                        >
                          Dispatch Team
                        </button>
                        <button
                          onClick={() => handleResolve("Event", event.event_id)}
                          className="flex-1 py-1.5 bg-success/20 text-success text-xs font-medium rounded-lg hover:bg-success/30 transition-colors flex items-center justify-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Resolve
                        </button>
                      </div>
                    </GlassCard>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            /* List View */
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground text-lg">
                  All Active Alerts
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Type
                      </th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Subject
                      </th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Location
                      </th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                        Time
                      </th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ...beacons.map((b) => ({ ...b, _type: "Beacon" })),
                      ...events.map((e) => ({ ...e, _type: "Event" })),
                    ].map((alert, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 text-sm font-medium">
                          {alert._type === "Beacon" ? (
                            <span className="text-red-400">SOS Beacon</span>
                          ) : (
                            <span className="text-orange-400">Event</span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-foreground">
                          {alert._type === "Beacon"
                            ? (alert as any).victim_name
                            : (alert as any).event_type}
                        </td>
                        <td className="py-4 text-sm text-muted-foreground font-mono">
                          {alert.lat?.toFixed(3)}, {alert.lng?.toFixed(3)}
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {new Date(
                            (alert as any).activated_at ||
                              (alert as any).start_time,
                          ).toLocaleTimeString()}
                        </td>
                        <td className="py-4 text-right flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setDeployForm({
                                type: alert._type as any,
                                id:
                                  (alert as any).beacon_id ||
                                  (alert as any).event_id,
                                responder_ids: [],
                              });
                              setIsAssignOpen(true);
                            }}
                            className="px-3 py-1 bg-accent/20 text-accent text-xs rounded hover:bg-accent/30"
                          >
                            Assign
                          </button>
                          <button
                            onClick={() =>
                              handleResolve(
                                alert._type as any,
                                (alert as any).beacon_id ||
                                  (alert as any).event_id,
                              )
                            }
                            className="px-3 py-1 bg-success/20 text-success text-xs rounded hover:bg-success/30"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </main>

      {/* Unified Deployment Modal */}
      <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Rocket className="h-5 w-5 text-accent" /> Configure Deployment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {/* Step 1: Select Type */}
            <div>
              <p className="text-sm text-foreground mb-2">
                1. Select Emergency Type
              </p>
              <Select
                value={deployForm.type}
                onValueChange={(val: any) =>
                  setDeployForm({ ...deployForm, type: val, id: "" })
                }
              >
                <SelectTrigger className="bg-muted/30 border-white/10">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="Beacon">
                    SOS Beacon (Victim Alert)
                  </SelectItem>
                  <SelectItem value="Event">Disaster Event</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Step 2: Select Specific Emergency */}
            {deployForm.type && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <p className="text-sm text-foreground mb-2">
                  2. Target Location
                </p>
                <Select
                  value={deployForm.id}
                  onValueChange={(val) =>
                    setDeployForm({ ...deployForm, id: val })
                  }
                >
                  <SelectTrigger className="bg-muted/30 border-white/10">
                    <SelectValue placeholder="Select active incident" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-white/10">
                    {deployForm.type === "Beacon" &&
                      beacons.map((b) => (
                        <SelectItem key={b.beacon_id} value={b.beacon_id}>
                          {b.victim_name} - {b.phone_number}
                        </SelectItem>
                      ))}
                    {deployForm.type === "Event" &&
                      events.map((e) => (
                        <SelectItem key={e.event_id} value={e.event_id}>
                          {e.event_type} (Mag: {e.magnitude})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </motion.div>
            )}

            {/* Step 3: Select Personnel (Multi-Select capability built into the design) */}
            {deployForm.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-4"
              >
                <p className="text-sm text-foreground mb-2">
                  3. Assign Personnel ({deployForm.responder_ids.length}{" "}
                  selected)
                </p>
                <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {personnel.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No personnel available.
                    </p>
                  )}
                  {personnel.map((p) => (
                    <div
                      key={p.user_id}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        deployForm.responder_ids.includes(p.user_id)
                          ? "bg-primary/20 border-primary/50"
                          : "bg-muted/10 border-white/5 hover:bg-muted/20"
                      }`}
                      onClick={() => toggleResponder(p.user_id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={deployForm.responder_ids.includes(p.user_id)}
                          onCheckedChange={() => toggleResponder(p.user_id)}
                        />
                        <div>
                          <p className="font-medium text-sm leading-none mb-1 text-foreground">
                            {p.full_name}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {p.role_type.replace("_", " ")} •{" "}
                            {p.rank || p.proficiency_level}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsAssignOpen(false)}
                className="flex-1 px-4 py-2 bg-muted/30 text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <GlowButton
                variant="accent"
                onClick={handleDeploySubmit}
                disabled={
                  !deployForm.id ||
                  deployForm.responder_ids.length === 0 ||
                  assigning
                }
                className="flex-1"
              >
                {assigning ? "Deploying..." : "Deploy Now"}
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RescueCoordinator;
