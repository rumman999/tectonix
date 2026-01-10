import { useState, useEffect } from "react";
import { AlertTriangle, MapPin, Radio, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/axios"; // Use our secure instance

interface BeaconLog {
  beacon_id: string;
  status: string;
  activated_at: string;
  lat: number;
  lng: number;
}

const BeaconView = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<BeaconLog[]>([]);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get GPS Location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          toast({ variant: "destructive", title: "GPS Error", description: "Enable location to use this feature." });
        }
      );
    }
  }, []);

  // Fetch previous beacons
  const fetchHistory = async () => {
    try {
      const res = await api.get("/beacons/history");
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleActivate = async () => {
    if (!location) return toast({ variant: "destructive", title: "No GPS Signal", description: "Waiting for satellite lock..." });
    
    setLoading(true);
    try {
      await api.post("/beacons/activate", {
        latitude: location.lat,
        longitude: location.lng
      });
      
      toast({
        title: "BEACON ACTIVATED",
        description: "Rescue teams have been alerted with your coordinates.",
        className: "bg-red-600 text-white border-none"
      });
      
      fetchHistory(); // Refresh list
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed", description: error.response?.data?.message || "Server Error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* HEADER */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight text-red-600 flex items-center justify-center gap-2">
          <Radio className="h-8 w-8 animate-pulse" /> EMERGENCY BEACON
        </h2>
        <p className="text-muted-foreground">Only use this in life-threatening situations.</p>
      </div>

      {/* THE BIG RED BUTTON */}
      <Card className="border-red-100 shadow-xl bg-gradient-to-b from-white to-red-50">
        <CardContent className="pt-10 pb-10 flex flex-col items-center justify-center space-y-6">
          <div className="relative">
            {/* Pulsing Effect */}
            <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <button
              onClick={handleActivate}
              disabled={loading || !location}
              className="relative w-48 h-48 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 transition-all shadow-2xl flex flex-col items-center justify-center border-4 border-red-400 group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="h-16 w-16 text-white animate-spin" />
              ) : (
                <>
                  <AlertTriangle className="h-16 w-16 text-white mb-2" />
                  <span className="text-white font-bold text-lg tracking-widest">HELP ME</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-full border shadow-sm">
            <MapPin className="h-4 w-4 text-blue-500" />
            {location ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : "Locating..."}
          </div>
        </CardContent>
      </Card>

      {/* HISTORY TABLE */}
      <Card>
        <CardHeader>
          <CardTitle>Activation History</CardTitle>
          <CardDescription>Your previous distress signals</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No active distress signals.</p>
            ) : (
              history.map((log) => (
                <Alert key={log.beacon_id} className="border-l-4 border-l-red-500 bg-red-50/50">
                  <Radio className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-900 font-bold">Signal Sent</AlertTitle>
                  <AlertDescription className="text-red-800 flex justify-between items-center mt-1">
                    <span>{new Date(log.activated_at).toLocaleString()}</span>
                    <span className="bg-red-200 text-red-800 px-2 py-1 rounded text-xs font-bold uppercase">{log.status}</span>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BeaconView;