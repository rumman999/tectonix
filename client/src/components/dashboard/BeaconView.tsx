import { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  AlertTriangle, 
  Radio, 
  ShieldAlert, 
  History, 
  ArrowLeft, 
  Loader2,
  MapPin,
  PowerOff 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// FIX: Use the hook pattern for Toasts
import { useToast } from "@/hooks/use-toast"; 

interface BeaconLog {
  beacon_id: string;
  status: "Active" | "Resolved" | "False_Alarm";
  activated_at: string;
  lat: number;
  lng: number;
}

// FIX: Ensure 'export default' is present to resolve App.tsx import error
export default function BeaconView() {
  const navigate = useNavigate();
  const { toast } = useToast(); // FIX: Initialize the toast hook
  
  const [isActive, setIsActive] = useState(false);
  const [history, setHistory] = useState<BeaconLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/beacons/history", getAuthHeaders());
      setHistory(res.data);
      
      // Smart Logic: If the LATEST log is 'Active', the beacon is ON.
      if (res.data.length > 0 && res.data[0].status === "Active") {
        setIsActive(true);
      } else {
        setIsActive(false);
      }
    } catch (err) {
      console.error("Failed to fetch history");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleToggleBeacon = async () => {
    setLoading(true);
    setError("");
    
    try {
      if (!navigator.geolocation) {
        throw new Error("Geolocation is not supported by your browser");
      }

      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          // TOGGLE LOGIC: 
          // If active -> Send "Resolved" (Deactivate)
          // If inactive -> Send "Active" (Activate)
          const newStatus = isActive ? "Resolved" : "Active";
          
          const payload = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            status: newStatus 
          };

          await axios.post(
            "http://localhost:5000/api/beacons/activate", 
            payload,
            getAuthHeaders()
          );
          
          // Toast Notification Logic
          if (!isActive) {
             // We just turned it ON
             toast({ 
               title: "Beacon Activated!", 
               description: "Live location broadcasting to rescue teams.",
               variant: "destructive" 
             });
          } else {
             // We just turned it OFF
             toast({ 
               title: "Beacon Deactivated", 
               description: "Your status has been updated to Resolved.",
               // variant: "default" (green/normal)
             });
          }

          // Update local state
          setIsActive(!isActive);
          fetchHistory(); 

        } catch (err: any) {
          setError(err.response?.data?.message || "Failed to update beacon");
        } finally {
          setLoading(false);
        }
      });

    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-0">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate(-1)}
          className="hover:bg-white/10 text-muted-foreground hover:text-white rounded-full"
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" />
            Emergency Beacon
          </h2>
          <p className="text-sm text-muted-foreground">
            Broadcast your live location to nearby rescue teams.
          </p>
        </div>
      </div>

      {/* Main Action Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass-card rounded-2xl p-8 text-center border shadow-lg relative overflow-hidden transition-colors duration-500 ${isActive ? 'border-red-500/40 bg-red-950/10' : 'border-white/10'}`}
      >
        {/* Background Pulse Effect if Active */}
        {isActive && (
          <div className="absolute inset-0 bg-red-500/10 animate-pulse z-0 pointer-events-none" />
        )}

        <div className="relative z-10 flex flex-col items-center gap-6">
          <div className={`p-4 rounded-full transition-all duration-500 ${isActive ? 'bg-red-500/20' : 'bg-primary/10'}`}>
            <Radio className={`h-12 w-12 ${isActive ? 'text-red-500 animate-ping' : 'text-primary'}`} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-foreground">
              {isActive ? "BEACON ACTIVE" : "System Ready"}
            </h3>
            <p className="text-muted-foreground max-w-md mx-auto">
              {isActive 
                ? "Your location is continuously broadcasting. Click below to resolve the alert when you are safe." 
                : "Press the button below only in case of a critical emergency. This will share your GPS coordinates."}
            </p>
          </div>

          {/* The Toggle Button */}
          <button
            onClick={handleToggleBeacon}
            disabled={loading} // Only disable while network request is happening
            className={`
              group relative w-48 h-48 rounded-full border-4 flex items-center justify-center flex-col gap-2 transition-all duration-300 shadow-xl cursor-pointer
              ${isActive 
                ? "border-red-500 bg-red-900/80 hover:bg-red-950 text-white animate-pulse hover:animate-none" 
                : "border-red-600 bg-red-600 hover:bg-red-700 hover:scale-105 hover:shadow-[0_0_40px_-10px_rgba(220,38,38,0.7)]"
              }
            `}
          >
            {loading ? (
              <Loader2 className="h-10 w-10 text-white animate-spin" />
            ) : isActive ? (
              // ACTIVE STATE (Show "Stop")
              <>
                <PowerOff className="h-10 w-10 text-white" />
                <span className="text-white font-bold tracking-wider text-lg">DEACTIVATE</span>
                <span className="text-xs text-red-200">(I am Safe)</span>
              </>
            ) : (
              // INACTIVE STATE (Show "Activate")
              <>
                <AlertTriangle className="h-10 w-10 text-white fill-white/20" />
                <span className="text-white font-bold tracking-wider text-lg">ACTIVATE</span>
                <span className="text-xs text-red-200">SOS</span>
              </>
            )}
            
            {/* Ripple rings (Only visible when NOT active) */}
            {!isActive && (
              <span className="absolute inset-0 rounded-full border border-white/20 scale-110 opacity-0 group-hover:scale-125 group-hover:opacity-100 transition-all duration-700" />
            )}
          </button>

          {error && (
            <Alert variant="destructive" className="max-w-md mt-4 bg-red-950/50 border-red-900">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </motion.div>

      {/* History List */}
      <motion.div
        initial={{ opacity: 0, delay: 0.1 }}
        animate={{ opacity: 1 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <History className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold text-foreground">Activation History</h3>
        </div>

        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No previous activations found.</p>
          ) : (
            history.map((log) => (
              <div 
                key={log.beacon_id} 
                className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${
                    log.status === 'Active' ? 'bg-red-500/20 text-red-500' : 
                    log.status === 'Resolved' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                  }`}>
                    <Radio className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {new Date(log.activated_at).toLocaleDateString()}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.activated_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <MapPin className="h-3 w-3" />
                      {log.lat.toFixed(4)}, {log.lng.toFixed(4)}
                    </div>
                  </div>
                </div>
                <StatusBadge status={log.status} size="sm" />
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
}