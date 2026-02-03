import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion } from "framer-motion";
import { 
  ShieldCheck, 
  MapPin, 
  Navigation, 
  Phone, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Menu 
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface Assignment {
  assignment_id: string;
  task_type: 'Beacon' | 'Event';
  assignment_status: string;
  assigned_at: string;
  // Beacon specific
  beacon_lat?: number;
  beacon_lng?: number;
  victim_name?: string;
  victim_phone?: string;
  // Event specific
  event_type?: string;
  magnitude?: number;
  event_lat?: number;
  event_lng?: number;
}

export const ResponderMissions = () => {
  const { toast } = useToast();
  const [missions, setMissions] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMissions = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/rescue/my-missions`, { 
        headers: getHeaders() 
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

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await axios.put(
        `${API_BASE_URL}/api/rescue/mission-status`,
        { assignment_id: id, status: newStatus },
        { headers: getHeaders() }
      );
      
      toast({ title: "Status Updated", description: `Mission marked as ${newStatus}` });
      
      if (newStatus === 'Completed') {
        // Remove from list if completed
        setMissions(prev => prev.filter(m => m.assignment_id !== id));
      } else {
        // Update local state
        setMissions(prev => prev.map(m => 
          m.assignment_id === id ? { ...m, assignment_status: newStatus } : m
        ));
      }
    } catch (err) {
      toast({ title: "Update Failed", description: "Please try again.", variant: "destructive" });
    }
  };

  const openMaps = (lat?: number, lng?: number) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldCheck className="text-primary h-6 w-6" />
            <span>My Missions</span>
        </div>
        <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
                <DashboardSidebar />
            </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      <main className="md:ml-64 p-4 md:p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
            <ShieldCheck className="text-primary" />
            Active Assignments
          </h1>
          <p className="text-muted-foreground">View and manage your deployed rescue tasks.</p>
        </div>

        {loading && <p className="text-muted-foreground">Syncing with HQ...</p>}

        {!loading && missions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-xl font-semibold">No Active Missions</h3>
                <p className="text-muted-foreground">You are currently on standby.</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {missions.map((mission) => {
            const isBeacon = mission.task_type === 'Beacon';
            const lat = isBeacon ? mission.beacon_lat : mission.event_lat;
            const lng = isBeacon ? mission.beacon_lng : mission.event_lng;

            return (
              <motion.div
                key={mission.assignment_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`glass-card rounded-xl p-6 border-l-4 ${
                    isBeacon ? 'border-l-red-500' : 'border-l-orange-500'
                }`}
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Badge variant={isBeacon ? "destructive" : "default"} className="uppercase">
                                {mission.task_type}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Clock className="w-3 h-3" /> 
                                {new Date(mission.assigned_at).toLocaleTimeString()}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold text-foreground">
                            {isBeacon ? `Rescue: ${mission.victim_name}` : `Incident: ${mission.event_type}`}
                        </h3>
                    </div>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                        {mission.assignment_status}
                    </Badge>
                </div>

                {/* Details */}
                <div className="space-y-3 mb-6 bg-black/20 p-4 rounded-lg">
                    {isBeacon && (
                        <div className="flex items-center gap-3 text-sm">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <a href={`tel:${mission.victim_phone}`} className="hover:text-primary transition-colors">
                                {mission.victim_phone || "No number available"}
                            </a>
                        </div>
                    )}
                    {!isBeacon && (
                        <div className="flex items-center gap-3 text-sm">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            <span>Magnitude: {mission.magnitude}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-sm">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="font-mono text-xs">{lat?.toFixed(5)}, {lng?.toFixed(5)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3">
                    <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => openMaps(lat, lng)}
                    >
                        <Navigation className="w-4 h-4 mr-2" />
                        Navigate
                    </Button>
                    
                    {mission.assignment_status === 'Pending' && (
                        <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => handleStatusUpdate(mission.assignment_id, 'Accepted')}
                        >
                            Accept Mission
                        </Button>
                    )}

                    {mission.assignment_status === 'Accepted' && (
                        <Button 
                            className="w-full bg-amber-600 hover:bg-amber-700"
                            onClick={() => handleStatusUpdate(mission.assignment_id, 'En Route')}
                        >
                            Start Route
                        </Button>
                    )}

                    {mission.assignment_status === 'En Route' && (
                        <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700"
                            onClick={() => handleStatusUpdate(mission.assignment_id, 'On Scene')}
                        >
                            Arrive at Scene
                        </Button>
                    )}

                    {mission.assignment_status === 'On Scene' && (
                        <Button 
                            className="w-full bg-green-600 hover:bg-green-700"
                            onClick={() => handleStatusUpdate(mission.assignment_id, 'Completed')}
                        >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Complete
                        </Button>
                    )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default ResponderMissions;