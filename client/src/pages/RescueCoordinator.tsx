import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion } from "framer-motion";
import {
  Siren,
  Flame,
  Radio,
  Users,
  CheckCircle,
  MapPin,
  Clock,
  ShieldAlert,
  Menu
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

// --- TYPES ---
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
  event_type: string; // 'Earthquake', 'Fire'
  magnitude: number;
  start_time: string;
  lat: number;
  lng: number;
}

interface Responder {
  user_id: string;
  full_name: string;
  role_type: string;
  rank?: string; // Only for First Responders
  proficiency_level?: string; // Only for Volunteers
}

export const RescueCoordinator = () => {
  const { toast } = useToast();
  
  // Data State
  const [beacons, setBeacons] = useState<Beacon[]>([]);
  const [events, setEvents] = useState<DisasterEvent[]>([]);
  const [personnel, setPersonnel] = useState<Responder[]>([]);
  
  // UI State
  const [loading, setLoading] = useState(true);
  
  // Assignment Modal State
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<{ type: 'Beacon' | 'Event', id: string } | null>(null);
  const [selectedResponderIds, setSelectedResponderIds] = useState<string[]>([]);
  const [assigning, setAssigning] = useState(false);

  // 1. Fetch Data
  const fetchData = async () => {
    try {
      const [feedRes, staffRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/rescue/feed`, { headers: getHeaders() }),
        axios.get(`${API_BASE_URL}/api/rescue/personnel`, { headers: getHeaders() })
      ]);
      
      setBeacons(feedRes.data.beacons);
      setEvents(feedRes.data.events);
      setPersonnel(staffRes.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to load rescue feed", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchData();
    // Optional: Poll every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 2. Open Assignment Modal
  const openAssignModal = (type: 'Beacon' | 'Event', id: string) => {
    setSelectedTask({ type, id });
    setSelectedResponderIds([]);
    setIsAssignOpen(true);
  };

  // 3. Handle Assignment
  const handleAssignSubmit = async () => {
    if (!selectedTask || selectedResponderIds.length === 0) return;

    setAssigning(true);
    try {
      await axios.post(
        `${API_BASE_URL}/api/rescue/assign`,
        {
          task_type: selectedTask.type,
          task_id: selectedTask.id,
          responder_ids: selectedResponderIds
        },
        { headers: getHeaders() }
      );

      toast({ 
        title: "Deployment Successful", 
        description: `Assigned ${selectedResponderIds.length} responders.`,
        className: "bg-green-600 text-white"
      });
      setIsAssignOpen(false);
    } catch (err) {
      console.error(err);
      toast({ title: "Assignment Failed", description: "Could not assign responders.", variant: "destructive" });
    } finally {
      setAssigning(false);
    }
  };

  // Toggle Selection in Modal
  const toggleResponder = (userId: string) => {
    setSelectedResponderIds(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <ShieldAlert className="text-primary h-6 w-6" />
            <span>Rescue Ops</span>
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
            <Siren className="text-red-500 animate-pulse" />
            Rescue Coordination
          </h1>
          <p className="text-muted-foreground">Manage active distress signals and disaster events.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* COLUMN 1: DISTRESS BEACONS */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <Radio className="text-red-400" /> Active Beacons
            </h2>
            {beacons.length === 0 && !loading && (
              <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-muted-foreground">
                No active distress beacons.
              </div>
            )}
            {beacons.map(beacon => (
              <motion.div 
                key={beacon.beacon_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-red-400">{beacon.victim_name}</h3>
                    <p className="text-sm text-white/70 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(beacon.activated_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded uppercase font-bold tracking-wider">
                    SOS
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-4 h-4" /> 
                  {beacon.lat.toFixed(4)}, {beacon.lng.toFixed(4)}
                </div>
                <Button 
                    onClick={() => openAssignModal('Beacon', beacon.beacon_id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                >
                  <Users className="w-4 h-4 mr-2" /> Assign Responders
                </Button>
              </motion.div>
            ))}
          </div>

          {/* COLUMN 2: DISASTER EVENTS */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
              <Flame className="text-orange-400" /> Active Incidents
            </h2>
            {events.length === 0 && !loading && (
              <div className="p-6 rounded-xl border border-dashed border-white/10 text-center text-muted-foreground">
                No active disaster events.
              </div>
            )}
            {events.map(event => (
              <motion.div 
                key={event.event_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 transition-colors"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-orange-400">{event.event_type}</h3>
                    <p className="text-sm text-white/70">
                       Magnitude: {event.magnitude || 'N/A'}
                    </p>
                  </div>
                  <span className="px-2 py-1 bg-orange-500/20 text-orange-300 text-xs rounded uppercase font-bold tracking-wider">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                   <MapPin className="w-4 h-4" /> 
                   {event.lat?.toFixed(4) || 'Unknown'}, {event.lng?.toFixed(4) || 'Unknown'}
                </div>
                <Button 
                    onClick={() => openAssignModal('Event', event.event_id)}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <Users className="w-4 h-4 mr-2" /> Dispatch Teams
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* --- ASSIGNMENT MODAL --- */}
        <Dialog open={isAssignOpen} onOpenChange={setIsAssignOpen}>
          <DialogContent className="bg-slate-900 border-white/10 text-white max-h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Deploy Personnel</DialogTitle>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto p-1 space-y-2 my-2">
               {personnel.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No personnel available.</p>
               )}
               {personnel.map(p => (
                 <div 
                    key={p.user_id} 
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedResponderIds.includes(p.user_id) 
                        ? 'bg-primary/20 border-primary' 
                        : 'bg-muted/10 border-white/5 hover:bg-muted/20'
                    }`}
                    onClick={() => toggleResponder(p.user_id)}
                 >
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            checked={selectedResponderIds.includes(p.user_id)} 
                            onCheckedChange={() => toggleResponder(p.user_id)}
                        />
                        <div>
                            <p className="font-medium text-sm">{p.full_name}</p>
                            <p className="text-xs text-muted-foreground">
                                {p.role_type} • {p.rank || p.proficiency_level || 'General'}
                            </p>
                        </div>
                    </div>
                    {selectedResponderIds.includes(p.user_id) && <CheckCircle className="w-4 h-4 text-primary" />}
                 </div>
               ))}
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setIsAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleAssignSubmit} disabled={selectedResponderIds.length === 0 || assigning}>
                 {assigning ? "Deploying..." : `Deploy (${selectedResponderIds.length})`}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
};

export default RescueCoordinator;