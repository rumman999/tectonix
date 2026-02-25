import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Menu, MapPin, Clock, Phone, Navigation,
  AlertTriangle, User, Shield, Flame,
  ChevronRight, Radio, ShieldCheck, CheckCircle,
  MessageCircle, 
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { NavigationMap } from "@/components/dashboard/NavigationMap";
import { MissionChat } from "@/components/mission/MissionChat";

interface Assignment {
  assignment_id: string | number;
  task_type: 'Beacon' | 'Event';
  assignment_status: string;
  assigned_at: string;
  beacon_lat?: number;
  beacon_lng?: number;
  victim_name?: string;
  victim_phone?: string;
  event_type?: string;
  magnitude?: number;
  event_lat?: number;
  event_lng?: number;
}

// Map the DB statuses to standard UI statuses
const normalizeStatus = (status: string) => {
  const s = status.toLowerCase().trim();
  if (s === "assigned" || s === "pending") return "Pending";
  if (s === "accepted") return "Accepted";
  if (s === "en route") return "En Route";
  if (s === "on scene" || s === "arrived") return "On Scene";
  if (s === "completed") return "Completed";
  return "Pending";
};

const getNextStatusLabel = (s: string): string | null => {
  switch (s) {
    case "Pending": return "Accept Mission";
    case "Accepted": return "Mark En Route";
    case "En Route": return "Arrive at Scene";
    case "On Scene": return "Complete Mission";
    default: return null;
  }
};

const getNextStatusValue = (s: string): string | null => {
  switch (s) {
    case "Pending": return "Accepted";
    case "Accepted": return "En Route";
    case "En Route": return "On Scene";
    case "On Scene": return "Completed";
    default: return null;
  }
};

const getStatusBadgeType = (s: string) => {
  switch (s) {
    case "Pending": return "warning";
    case "Accepted": return "moderate";
    case "En Route": return "alert";
    case "On Scene": return "danger";
    case "Completed": return "safe";
    default: return "default";
  }
};

const getNextStatusButtonStyle = (s: string) => {
  switch (s) {
    case "Pending": return "bg-primary hover:bg-primary/80 text-primary-foreground";
    case "Accepted": return "bg-accent hover:bg-accent/80 text-accent-foreground";
    case "En Route": return "bg-destructive hover:bg-destructive/80 text-white";
    case "On Scene": return "bg-success hover:bg-success/80 text-white";
    default: return "";
  }
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export const ResponderMissions = () => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatMission, setChatMission] = useState<{id: string, type: 'Beacon' | 'Event'} | null>(null);
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const fetchMissions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/rescue/my-missions`, {
        headers: getHeaders(),
      });
      setMissions(res.data);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load missions", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const handleStatusUpdate = async (id: string | number, currentStatus: string) => {
    const newStatus = getNextStatusValue(currentStatus);
    if (!newStatus) return;

    try {
      await axios.put(
        `${API_BASE_URL}/api/rescue/mission-status`,
        { assignment_id: id, status: newStatus },
        { headers: getHeaders() }
      );

      toast({ title: "Status Updated", description: `Mission marked as ${newStatus}` });

      // Optimistic UI update
      setMissions((prev) =>
        prev.map((m) =>
          m.assignment_id === id ? { ...m, assignment_status: newStatus } : m
        )
      );
    } catch (err) {
      console.error(err);
      toast({ title: "Update Failed", description: "Could not update status in database.", variant: "destructive" });
    }
  };

const [navMission, setNavMission] = useState<{lat: number, lng: number} | null>(null);

const openNavigation = (lat?: number, lng?: number) => {
  if (lat && lng) {
    setNavMission({ lat, lng });
  } else {
    toast({ title: "Location Error", description: "Coordinates missing.", variant: "destructive" });
  }
};
  const activeMissions = missions.filter((m) => normalizeStatus(m.assignment_status) !== "Completed");
  const completedMissions = missions.filter((m) => normalizeStatus(m.assignment_status) === "Completed");

  const MissionCard = ({ mission, compact = false }: { mission: Assignment; compact?: boolean }) => {
    const isBeacon = mission.task_type === "Beacon";
    const status = normalizeStatus(mission.assignment_status);
    const lat = isBeacon ? mission.beacon_lat : mission.event_lat;
    const lng = isBeacon ? mission.beacon_lng : mission.event_lng;
    const nextLabel = getNextStatusLabel(status);

    const Icon = isBeacon ? Radio : Flame;
    const colorClass = isBeacon ? "text-destructive" : "text-warning";

    return (

        <GlassCard 
            className="p-4 lg:p-5 h-full flex flex-col" 
            hover={true} 
            glow={isBeacon && status !== "Completed" ? "accent" : "none"} // Glow only for Beacons if active
        >
          {/* Top row */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className={cn("p-2 rounded-lg bg-muted/30", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm lg:text-base leading-tight">
                  {isBeacon ? `Rescue: ${mission.victim_name}` : `Incident: ${mission.event_type}`}
                </h3>
                <span className="text-xs text-muted-foreground font-mono">
                  ID: {String(mission.assignment_id).split("-")[0]}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 mt-1">
              <StatusBadge status={getStatusBadgeType(status) as any} size="sm">
                {status}
              </StatusBadge>
            </div>
          </div>

          {/* Beacon / Victim Info */}
          {isBeacon && mission.victim_name && (
            <div className="flex items-center gap-2 mb-3 p-2.5 bg-destructive/5 border border-destructive/15 rounded-lg">
              <User className="h-4 w-4 text-destructive shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{mission.victim_name}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Distress Beacon Active</p>
              </div>
              {mission.victim_phone && (
                <a
                  href={`tel:${mission.victim_phone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="shrink-0 p-2 rounded-lg bg-success/15 text-success hover:bg-success/25 transition-colors"
                >
                  <Phone className="h-4 w-4" />
                </a>
              )}
            </div>
          )}

          {/* Event Info */}
          {!isBeacon && mission.magnitude && (
            <div className="flex items-center gap-2 mb-3 p-2.5 bg-warning/5 border border-warning/15 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Magnitude: {mission.magnitude}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Area Assessment</p>
              </div>
            </div>
          )}

          {/* Info rows */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
              <span className="truncate font-mono">
                Lat: {lat?.toFixed(4)}, Lng: {lng?.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>Assigned: {formatTime(mission.assigned_at)}</span>
            </div>
            {!compact && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Shield className="h-3.5 w-3.5 shrink-0" />
                  <span>Assigned by HQ Dispatch</span>
                </div>
            )}
          </div>

          {/* Actions - Pushed to bottom with mt-auto */}
          <div className="flex items-center gap-2 mt-auto pt-2">
            {!compact && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); openNavigation(lat, lng); }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" /> Navigate
                  </button>
                  
                  {/* --- NEW CHAT BUTTON --- */}
                  <button
                    type="button"
                    onClick={(e) => { 
                      e.preventDefault();
                      e.stopPropagation(); 
                      setChatMission({ id: isBeacon ? mission.beacon_id! : mission.event_id!, type: isBeacon ? 'Beacon' : 'Event' }); 
                    }}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 bg-muted/30 text-foreground text-xs font-medium rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Chat
                  </button>
                </>
            )}

            {nextLabel && (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(mission.assignment_id, status); }}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg transition-colors",
                  getNextStatusButtonStyle(status)
                )}
              >
                {nextLabel} <ChevronRight className="h-3.5 w-3.5" />
              </motion.button>
            )}

            {status === "Completed" && (
              <div className="flex-1 flex items-center justify-center gap-1.5 bg-success/10 border border-success/20 rounded-lg text-xs font-medium text-success py-2">
                <CheckCircle className="h-3.5 w-3.5" /> Mission Secured
              </div>
            )}
          </div>
        </GlassCard>
   
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
          <ShieldCheck className="text-primary h-6 w-6" />
          <span>My Missions</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu /></Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      <main className="md:ml-64 p-4 md:p-8 pb-24 lg:pb-8">
        {/* Desktop Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="hidden md:flex items-center gap-3 mb-8">
          <div className="p-2.5 rounded-xl bg-primary/15">
            <ShieldCheck className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Missions</h1>
            <p className="text-sm text-muted-foreground">
              {activeMissions.length} active · {completedMissions.length} completed
            </p>
          </div>
        </motion.div>

        {loading && <p className="text-muted-foreground animate-pulse">Syncing with HQ...</p>}

        {/* Active Missions */}
        {!loading && activeMissions.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3 px-1">
              Active Missions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {activeMissions.map((m) => (
                  <motion.div
                    key={m.assignment_id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full"
                  >
                    <MissionCard mission={m} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Completed Missions */}
        {!loading && completedMissions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground/70 uppercase tracking-wider mb-3 px-1">
              Mission History
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 opacity-70">
              <AnimatePresence mode="popLayout">
                {completedMissions.map((m) => (
                  <motion.div
                    key={m.assignment_id}
                    layout
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="h-full"
                  >
                    <MissionCard mission={m} compact />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {!loading && missions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-white/10 rounded-xl bg-white/5 mt-4">
            <ShieldCheck className="h-16 w-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-1">No Missions Assigned</h3>
            <p className="text-sm text-muted-foreground">You are currently on standby. Await dispatch.</p>
          </div>
        )}
      </main>

      {navMission && (
        <NavigationMap 
            destLat={navMission.lat} 
            destLng={navMission.lng} 
            onClose={() => setNavMission(null)} 
        />
      )}

      <AnimatePresence>
        {chatMission && (
          <MissionChat 
            taskId={chatMission.id} 
            taskType={chatMission.type} 
            currentUser={currentUser} 
            onClose={() => setChatMission(null)} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ResponderMissions;