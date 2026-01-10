import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Users,
  MapPin,
  Clock,
  Radio,
  Navigation,
  Phone,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import cityMapImage from "@/assets/city-map-3d.jpg";

interface Team {
  id: string;
  name: string;
  status: "deployed" | "standby" | "returning";
  members: number;
  location: string;
  lastUpdate: string;
}

interface Mission {
  id: string;
  title: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "active" | "completed";
  assignedTeam: string | null;
  location: string;
  reportedAt: string;
}

const teams: Team[] = [
  {
    id: "1",
    name: "Alpha Squad",
    status: "deployed",
    members: 6,
    location: "Mirpur Zone 4",
    lastUpdate: "2 min ago",
  },
  {
    id: "2",
    name: "Bravo Unit",
    status: "deployed",
    members: 4,
    location: "Gulshan-2",
    lastUpdate: "5 min ago",
  },
  {
    id: "3",
    name: "Charlie Team",
    status: "standby",
    members: 5,
    location: "Base Camp",
    lastUpdate: "1 min ago",
  },
  {
    id: "4",
    name: "Delta Force",
    status: "returning",
    members: 4,
    location: "En route",
    lastUpdate: "8 min ago",
  },
];

const missions: Mission[] = [
  {
    id: "1",
    title: "Collapsed Structure - Residential",
    priority: "high",
    status: "active",
    assignedTeam: "Alpha Squad",
    location: "House 45, Road 12, Mirpur",
    reportedAt: "15 min ago",
  },
  {
    id: "2",
    title: "Gas Leak Detection",
    priority: "high",
    status: "active",
    assignedTeam: "Bravo Unit",
    location: "Commercial Complex, Gulshan",
    reportedAt: "23 min ago",
  },
  {
    id: "3",
    title: "Structural Assessment Required",
    priority: "medium",
    status: "pending",
    assignedTeam: null,
    location: "School Building, Dhanmondi",
    reportedAt: "45 min ago",
  },
  {
    id: "4",
    title: "Evacuation Support",
    priority: "medium",
    status: "pending",
    assignedTeam: null,
    location: "Apartment Block C, Uttara",
    reportedAt: "1 hr ago",
  },
  {
    id: "5",
    title: "Road Clearance",
    priority: "low",
    status: "completed",
    assignedTeam: "Delta Force",
    location: "Main Highway, Sector 7",
    reportedAt: "2 hrs ago",
  },
];

const getTeamStatusColor = (status: Team["status"]) => {
  switch (status) {
    case "deployed":
      return "bg-destructive";
    case "standby":
      return "bg-success";
    case "returning":
      return "bg-warning";
  }
};

const getMissionStatusBadge = (status: Mission["status"]) => {
  switch (status) {
    case "pending":
      return <StatusBadge status="warning">Pending</StatusBadge>;
    case "active":
      return <StatusBadge status="danger" pulse>Active</StatusBadge>;
    case "completed":
      return <StatusBadge status="safe">Completed</StatusBadge>;
  }
};

const getPriorityColor = (priority: Mission["priority"]) => {
  switch (priority) {
    case "high":
      return "text-destructive";
    case "medium":
      return "text-warning";
    case "low":
      return "text-muted-foreground";
  }
};

export const RescueCoordinator = () => {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Radio className="h-8 w-8 text-destructive animate-pulse" />
              <h1 className="text-3xl font-bold text-foreground">
                Rescue Coordinator
              </h1>
            </div>
            <p className="text-muted-foreground">
              Real-time team deployment and mission management
            </p>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 rounded-xl border border-destructive/30">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
              </span>
              <span className="text-sm font-medium text-destructive">
                Active Emergency
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-3 gap-6">
          {/* Map Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="col-span-2"
          >
            <GlassCard className="p-0 overflow-hidden h-[500px]">
              <div className="relative w-full h-full">
                <img
                  src={cityMapImage}
                  alt="City Map"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />

                {/* Team Markers */}
                <div className="absolute top-1/4 left-1/3">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative"
                  >
                    <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/50">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 px-2 py-1 rounded text-xs font-medium">
                      Alpha Squad
                    </div>
                  </motion.div>
                </div>

                <div className="absolute top-1/2 right-1/4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                    className="relative"
                  >
                    <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center shadow-lg shadow-destructive/50">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap bg-background/90 px-2 py-1 rounded text-xs font-medium">
                      Bravo Unit
                    </div>
                  </motion.div>
                </div>

                {/* Mission Markers */}
                <div className="absolute top-1/3 left-1/2">
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <div className="w-6 h-6 bg-warning rounded-full flex items-center justify-center shadow-lg">
                      <AlertTriangle className="h-3 w-3 text-black" />
                    </div>
                  </motion.div>
                </div>

                {/* Legend */}
                <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-white/10">
                  <p className="text-xs font-medium text-foreground mb-2">
                    Legend
                  </p>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-destructive rounded-full" />
                      <span className="text-muted-foreground">
                        Deployed Team
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-warning rounded-full" />
                      <span className="text-muted-foreground">
                        Active Mission
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 bg-success rounded-full" />
                      <span className="text-muted-foreground">Cleared Zone</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Team List */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="h-[500px] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Active Teams</h3>
                <span className="text-xs text-muted-foreground">
                  {teams.length} teams
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                {teams.map((team, index) => (
                  <motion.div
                    key={team.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className="p-4 bg-muted/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${getTeamStatusColor(
                            team.status
                          )}`}
                        />
                        <span className="font-medium text-foreground">
                          {team.name}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {team.status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{team.members} members</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{team.location}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{team.lastUpdate}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors">
                        <Navigation className="h-3 w-3" />
                        Track
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-muted/30 text-foreground text-xs font-medium rounded-lg hover:bg-muted/50 transition-colors">
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

        {/* Missions Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6"
        >
          <GlassCard>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-foreground text-lg">
                Mission Queue
              </h3>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-destructive/10 text-destructive text-sm font-medium rounded-lg hover:bg-destructive/20 transition-colors">
                  + New Mission
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                      Mission
                    </th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                      Priority
                    </th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                      Assigned Team
                    </th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                      Location
                    </th>
                    <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                      Reported
                    </th>
                    <th className="text-right py-3 text-sm font-medium text-muted-foreground">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {missions.map((mission, index) => (
                    <motion.tr
                      key={mission.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * index }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-4">
                        <span className="font-medium text-foreground">
                          {mission.title}
                        </span>
                      </td>
                      <td className="py-4">
                        <span
                          className={`font-medium uppercase text-xs ${getPriorityColor(
                            mission.priority
                          )}`}
                        >
                          {mission.priority}
                        </span>
                      </td>
                      <td className="py-4">
                        {getMissionStatusBadge(mission.status)}
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {mission.assignedTeam || (
                          <span className="text-warning">Unassigned</span>
                        )}
                      </td>
                      <td className="py-4 text-muted-foreground text-sm">
                        {mission.location}
                      </td>
                      <td className="py-4 text-muted-foreground text-sm">
                        {mission.reportedAt}
                      </td>
                      <td className="py-4 text-right">
                        <button className="px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-lg hover:bg-primary/20 transition-colors">
                          {mission.status === "pending" ? "Assign" : "View"}
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </motion.div>
      </main>
    </div>
  );
};

export default RescueCoordinator;
