import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InteractiveMap } from "@/components/dashboard/InteractiveMap"; // FIX: Import real map
import {
  Users,
  MapPin,
  Clock,
  Radio,
  Navigation,
  Phone,
  AlertTriangle,
  CheckCircle,
  Rocket,
  Menu,
  Grid3X3,
  List,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

// Mock data aligned with database schema
interface DisasterEvent {
  event_id: string;
  event_name: string;
  location: string;
  severity: "critical" | "high" | "medium" | "low";
}

interface RescueTeam {
  team_id: string;
  team_name: string;
  status: "available" | "deployed" | "returning";
  member_count: number;
  current_location: string;
  last_update: string;
}

interface RescueMission {
  mission_id: string;
  event_id: string;
  assigned_team_id: string | null;
  priority_level: "High" | "Medium" | "Low";
  status: "Dispatched" | "On_Site" | "Completed" | "Pending";
  location: string;
  description: string;
  created_at: string;
}

const mockEvents: DisasterEvent[] = [
  { event_id: "evt-001", event_name: "Fire at Chowk Bazar", location: "Chowk Bazar, Old Dhaka", severity: "critical" },
  { event_id: "evt-002", event_name: "Building Collapse - Mirpur", location: "Mirpur-10", severity: "high" },
  { event_id: "evt-003", event_name: "Gas Leak - Gulshan", location: "Gulshan-2", severity: "medium" },
  { event_id: "evt-004", event_name: "Flood Warning - Demra", location: "Demra Area", severity: "low" },
];

const mockTeams: RescueTeam[] = [
  { team_id: "team-001", team_name: "Red Squad - Alpha", status: "available", member_count: 6, current_location: "Base Camp HQ", last_update: "2 min ago" },
  { team_id: "team-002", team_name: "Blue Unit - Bravo", status: "deployed", member_count: 4, current_location: "Gulshan-2", last_update: "5 min ago" },
  { team_id: "team-003", team_name: "Green Team - Charlie", status: "available", member_count: 5, current_location: "Base Camp HQ", last_update: "1 min ago" },
  { team_id: "team-004", team_name: "Yellow Force - Delta", status: "returning", member_count: 4, current_location: "En route", last_update: "8 min ago" },
];

const mockMissions: RescueMission[] = [
  { mission_id: "msn-001", event_id: "evt-001", assigned_team_id: "team-002", priority_level: "High", status: "On_Site", location: "Chowk Bazar, Old Dhaka", description: "Active fire response - residential area", created_at: "2025-01-12T10:30:00" },
  { mission_id: "msn-002", event_id: "evt-002", assigned_team_id: null, priority_level: "High", status: "Pending", location: "Mirpur-10", description: "Structural collapse - search and rescue needed", created_at: "2025-01-12T11:15:00" },
  { mission_id: "msn-003", event_id: "evt-003", assigned_team_id: "team-004", priority_level: "Medium", status: "Dispatched", location: "Gulshan-2", description: "Gas leak containment", created_at: "2025-01-12T09:45:00" },
  { mission_id: "msn-004", event_id: "evt-004", assigned_team_id: null, priority_level: "Low", status: "Pending", location: "Demra Area", description: "Flood monitoring and evacuation prep", created_at: "2025-01-12T08:00:00" },
  { mission_id: "msn-005", event_id: "evt-001", assigned_team_id: "team-001", priority_level: "High", status: "Completed", location: "Chowk Bazar, Old Dhaka", description: "Initial perimeter secured", created_at: "2025-01-12T09:00:00" },
];

const getTeamStatusColor = (status: RescueTeam["status"]) => {
  switch (status) {
    case "deployed": return "bg-destructive";
    case "available": return "bg-success";
    case "returning": return "bg-warning";
  }
};

const getMissionStatusBadge = (status: RescueMission["status"]) => {
  switch (status) {
    case "Pending": return <StatusBadge status="warning">Pending</StatusBadge>;
    case "Dispatched": return <StatusBadge status="warning">Dispatched</StatusBadge>;
    case "On_Site": return <StatusBadge status="danger" pulse>On Site</StatusBadge>;
    case "Completed": return <StatusBadge status="safe">Completed</StatusBadge>;
  }
};

const getPriorityColor = (priority: RescueMission["priority_level"]) => {
  switch (priority) {
    case "High": return "text-destructive bg-destructive/10 border-destructive/30";
    case "Medium": return "text-warning bg-warning/10 border-warning/30";
    case "Low": return "text-muted-foreground bg-muted/10 border-muted/30";
  }
};

export const RescueCoordinator = () => {
  const [showDeployModal, setShowDeployModal] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [missions, setMissions] = useState(mockMissions);
  
  const [deployForm, setDeployForm] = useState({
    event_id: "",
    assigned_team_id: "",
    priority_level: "" as RescueMission["priority_level"] | "",
    description: "",
  });

  const handleDeployTeam = () => {
    const payload = {
      event_id: deployForm.event_id,
      assigned_team_id: deployForm.assigned_team_id,
      priority_level: deployForm.priority_level,
      status: "Dispatched",
      description: deployForm.description,
    };
    console.log("Deploy Team Payload:", JSON.stringify(payload, null, 2));
    
    const newMission: RescueMission = {
      mission_id: `msn-${Date.now()}`,
      event_id: deployForm.event_id,
      assigned_team_id: deployForm.assigned_team_id,
      priority_level: deployForm.priority_level as RescueMission["priority_level"],
      status: "Dispatched",
      location: mockEvents.find(e => e.event_id === deployForm.event_id)?.location || "",
      description: deployForm.description,
      created_at: new Date().toISOString(),
    };
    setMissions([newMission, ...missions]);
    
    setShowDeployModal(false);
    setDeployForm({ event_id: "", assigned_team_id: "", priority_level: "", description: "" });
  };

  const getTeamName = (teamId: string | null) => {
    if (!teamId) return null;
    return mockTeams.find(t => t.team_id === teamId)?.team_name;
  };

  const availableTeams = mockTeams.filter(t => t.status === "available");

  const missionsByStatus = {
    Pending: missions.filter(m => m.status === "Pending"),
    Dispatched: missions.filter(m => m.status === "Dispatched"),
    On_Site: missions.filter(m => m.status === "On_Site"),
    Completed: missions.filter(m => m.status === "Completed"),
  };

  return (
    <div className="min-h-screen bg-background">
      
      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <Radio className="text-destructive h-6 w-6" />
            <span>Mission Control</span>
        </div>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
                <SheetTitle className="hidden">Navigation</SheetTitle>
                <DashboardSidebar />
            </SheetContent>
        </Sheet>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        
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
                Real-time team deployment and mission management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            {/* View Toggle - Desktop only */}
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

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-destructive/10 rounded-xl border border-destructive/30">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
              </span>
              <span className="text-xs font-medium text-destructive">Active Emergency</span>
            </div>

            <GlowButton variant="accent" onClick={() => setShowDeployModal(true)} size="sm" className="w-full sm:w-auto">
              <Rocket className="h-4 w-4" />
              <span className="hidden sm:inline">Deploy Team</span>
              <span className="sm:hidden">Deploy</span>
            </GlowButton>
          </div>
        </motion.div>

        {/* --- MOBILE MAP (Added to view on Mobile) --- */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:hidden mb-6"
        >
          <GlassCard className="p-0 overflow-hidden h-[300px]" hover={false}>
             {/* FIX: Using Real Map Component */}
             <InteractiveMap />
          </GlassCard>
        </motion.div>

        {/* --- DESKTOP SPLIT VIEW: Map + Teams --- */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-6">
          {/* Map Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <GlassCard className="p-0 overflow-hidden h-[400px]" hover={false}>
              {/* FIX: Using Real Map Component */}
              <InteractiveMap />
            </GlassCard>
          </motion.div>

          {/* Team List */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <GlassCard className="h-[400px] flex flex-col" hover={false}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Active Teams</h3>
                <span className="text-xs text-muted-foreground">{mockTeams.length} teams</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {mockTeams.map((team, index) => (
                  <motion.div
                    key={team.team_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 bg-muted/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getTeamStatusColor(team.status)}`} />
                        <span className="font-medium text-foreground text-sm">{team.team_name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">{team.status}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{team.member_count} members</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        <span>{team.current_location}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors">
                        <Navigation className="h-3 w-3" />
                        Track
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-muted/30 text-foreground text-xs font-medium rounded-lg hover:bg-muted/50 transition-colors">
                        <Phone className="h-3 w-3" />
                        Contact
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        </div>

        {/* Mission Board - Kanban/Grid View (Desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hidden lg:block"
        >
          {viewMode === "grid" ? (
            <div className="grid grid-cols-4 gap-4">
              {(Object.keys(missionsByStatus) as Array<keyof typeof missionsByStatus>).map((status) => (
                <div key={status} className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                    <h4 className="font-medium text-foreground text-sm">{status.replace("_", " ")}</h4>
                    <span className="text-xs text-muted-foreground">{missionsByStatus[status].length}</span>
                  </div>
                  
                  <div className="space-y-3 min-h-[200px]">
                    {missionsByStatus[status].map((mission, idx) => (
                      <motion.div
                        key={mission.mission_id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.05 }}
                      >
                        <GlassCard className="p-4" hover={false}>
                          <div className="flex items-start justify-between mb-2">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getPriorityColor(mission.priority_level)}`}>
                              {mission.priority_level}
                            </span>
                            <span className="text-xs text-muted-foreground font-mono">{mission.mission_id}</span>
                          </div>
                          <p className="text-sm text-foreground font-medium mb-2 line-clamp-2">{mission.description}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                            <MapPin className="h-3 w-3" />
                            {mission.location}
                          </p>
                          {mission.assigned_team_id && (
                            <p className="text-xs text-primary flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {getTeamName(mission.assigned_team_id)}
                            </p>
                          )}
                        </GlassCard>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <GlassCard hover={false}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-foreground text-lg">Mission Queue</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Mission ID</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Priority</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Team</th>
                      <th className="text-left py-3 text-sm font-medium text-muted-foreground">Location</th>
                      <th className="text-right py-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {missions.map((mission, index) => (
                      <motion.tr
                        key={mission.mission_id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.05 * index }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="py-4 font-mono text-sm text-foreground">{mission.mission_id}</td>
                        <td className="py-4">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getPriorityColor(mission.priority_level)}`}>
                            {mission.priority_level}
                          </span>
                        </td>
                        <td className="py-4">{getMissionStatusBadge(mission.status)}</td>
                        <td className="py-4 text-sm text-muted-foreground">
                          {getTeamName(mission.assigned_team_id) || <span className="text-warning">Unassigned</span>}
                        </td>
                        <td className="py-4 text-sm text-muted-foreground">{mission.location}</td>
                        <td className="py-4 text-right">
                          <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors">
                            {mission.status === "Pending" ? "Assign" : "View"}
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </motion.div>

        {/* Mobile: Task List Only */}
        <div className="lg:hidden space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Active Missions</h3>
            <span className="text-xs text-muted-foreground">{missions.length} total</span>
          </div>

          {missions.map((mission, index) => (
            <motion.div
              key={mission.mission_id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard className="p-4" hover={false}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded border ${getPriorityColor(mission.priority_level)}`}>
                      {mission.priority_level}
                    </span>
                    {getMissionStatusBadge(mission.status)}
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">{mission.mission_id}</span>
                </div>

                <p className="text-sm text-foreground font-medium mb-2">{mission.description}</p>
                
                <div className="space-y-1.5 text-xs">
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {mission.location}
                  </p>
                  {mission.assigned_team_id && (
                    <p className="text-primary flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {getTeamName(mission.assigned_team_id)}
                    </p>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  {mission.status === "Pending" ? (
                    <button className="flex-1 py-2 bg-accent/20 text-accent text-xs font-medium rounded-lg">
                      Assign Team
                    </button>
                  ) : (
                    <>
                      <button className="flex-1 py-2 bg-success/20 text-success text-xs font-medium rounded-lg">
                        <CheckCircle className="h-3 w-3 inline mr-1" />
                        Complete
                      </button>
                      <button className="flex-1 py-2 bg-muted/30 text-foreground text-xs font-medium rounded-lg">
                        Update
                      </button>
                    </>
                  )}
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Deploy Team Modal */}
      <Dialog open={showDeployModal} onOpenChange={setShowDeployModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Rocket className="h-5 w-5 text-accent" />
              Deploy Rescue Team
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="event_id" className="text-foreground">Disaster Event</Label>
              <Select
                value={deployForm.event_id}
                onValueChange={(value) => setDeployForm({ ...deployForm, event_id: value })}
              >
                <SelectTrigger className="mt-1.5 bg-muted/30 border-white/10">
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {mockEvents.map((event) => (
                    <SelectItem key={event.event_id} value={event.event_id}>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className={`h-3 w-3 ${
                          event.severity === "critical" ? "text-destructive" :
                          event.severity === "high" ? "text-warning" : "text-muted-foreground"
                        }`} />
                        {event.event_name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="assigned_team_id" className="text-foreground">Assign Team</Label>
              <Select
                value={deployForm.assigned_team_id}
                onValueChange={(value) => setDeployForm({ ...deployForm, assigned_team_id: value })}
              >
                <SelectTrigger className="mt-1.5 bg-muted/30 border-white/10">
                  <SelectValue placeholder="Select available team" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {availableTeams.map((team) => (
                    <SelectItem key={team.team_id} value={team.team_id}>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-success rounded-full" />
                        {team.team_name} ({team.member_count} members)
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {availableTeams.length === 0 && (
                <p className="text-xs text-warning mt-1">No teams currently available</p>
              )}
            </div>

            <div>
              <Label htmlFor="priority_level" className="text-foreground">Priority Level</Label>
              <Select
                value={deployForm.priority_level}
                onValueChange={(value) => setDeployForm({ ...deployForm, priority_level: value as RescueMission["priority_level"] })}
              >
                <SelectTrigger className="mt-1.5 bg-muted/30 border-white/10">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  <SelectItem value="High">
                    <span className="text-destructive font-medium">High</span>
                  </SelectItem>
                  <SelectItem value="Medium">
                    <span className="text-warning font-medium">Medium</span>
                  </SelectItem>
                  <SelectItem value="Low">
                    <span className="text-muted-foreground font-medium">Low</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Mission Description</Label>
              <Input
                id="description"
                value={deployForm.description}
                onChange={(e) => setDeployForm({ ...deployForm, description: e.target.value })}
                placeholder="Brief description of the mission"
                className="mt-1.5 bg-muted/30 border-white/10"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowDeployModal(false)}
                className="flex-1 px-4 py-2.5 bg-muted/30 text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <GlowButton 
                variant="accent" 
                onClick={handleDeployTeam} 
                className="flex-1"
              >
                <Rocket className="h-4 w-4" />
                Deploy Now
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RescueCoordinator;