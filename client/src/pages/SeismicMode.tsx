import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Activity, Radio, Smartphone, Settings2, Menu, ShieldAlert, Waves } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
// FIX: Imported SheetTitle to solve the accessibility error
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

// Helper for Persistent ID
const getClientId = () => {
  let uuid = localStorage.getItem("seismic_client_uuid");
  if (!uuid) {
    uuid = crypto.randomUUID();
    localStorage.setItem("seismic_client_uuid", uuid);
  }
  return uuid;
};

const SeismicMode = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [debugLog, setDebugLog] = useState<string>("Ready...");
  const [magnitude, setMagnitude] = useState(0);
  const [threshold, setThreshold] = useState([1.5]); 
  const [systemStatus, setSystemStatus] = useState("SAFE");
  const [shakeCount, setShakeCount] = useState(0);
  const [clientId, setClientId] = useState("");
  
  // Rate Limiting
  const lastReportTime = useRef<number>(0);
  const historyRef = useRef<number[]>(new Array(100).fill(0));
  const [graphPath, setGraphPath] = useState("");

  useEffect(() => {
    setClientId(getClientId());

    const checkStatus = async () => {
      try {
        const res = await api.get("/dashboard/seismic/status");
        if (res.data.status === "CRITICAL") {
            setSystemStatus("CRITICAL");
        } else {
            setSystemStatus("SAFE");
        }
      } catch (err) { console.error("Polling error", err); }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const reportShake = async (mag: number) => {
    const now = Date.now();
    if (now - lastReportTime.current < 5000) return;
    lastReportTime.current = now;

    try {
        const payload = { 
            lat: 23.8103, 
            lng: 90.4125, 
            magnitude: mag,
            client_uuid: clientId 
        };
        await api.post("/dashboard/seismic/report", payload);
        setDebugLog(`🚀 Sent: ${mag.toFixed(2)}g`);
        setShakeCount(prev => prev + 1);
    } catch (err: any) {
        setDebugLog("❌ " + err.message);
    }
  };

  const handleDismiss = async () => {
    try {
      await api.post("/dashboard/seismic/resolve");
      setSystemStatus("SAFE"); 
      setShakeCount(0);
    } catch (err) {
      console.error("Failed to resolve", err);
    }
  };

  const updateGraph = (mag: number) => {
    historyRef.current.push(mag);
    if (historyRef.current.length > 100) historyRef.current.shift();
    const width = 800; const height = 150; const step = width / 100;
    const path = historyRef.current.map((val, i) => {
        const y = height - (val * height * 5); 
        return `${i === 0 ? "M" : "L"} ${i * step} ${Math.max(0, Math.min(height, y))}`;
    }).join(" ");
    setGraphPath(path);
  };

  const startMonitoring = async () => {
    setIsMonitoring(true);
    setDebugLog("Active");
    if ('Accelerometer' in window) {
      try {
        // @ts-ignore
        const sensor = new Accelerometer({ frequency: 60 });
        sensor.addEventListener('reading', () => {
            const mag = Math.sqrt(sensor.x**2 + sensor.y**2 + sensor.z**2) / 9.8;
            handleReading(mag);
        });
        sensor.start();
        return;
      } catch (e) { console.log("Android API failed"); }
    }
    if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
      await (DeviceMotionEvent as any).requestPermission();
    }
    window.addEventListener("devicemotion", (event) => {
      const acc = event.accelerationIncludingGravity || event.acceleration; 
      if (!acc) return;
      const mag = Math.sqrt((acc.x||0)**2 + (acc.y||0)**2 + (acc.z||0)**2) / 9.8;
      handleReading(Math.abs(mag - 1));
    });
  };

  const handleReading = (mag: number) => {
      setMagnitude(mag);
      updateGraph(mag);
      if (mag > threshold[0]) reportShake(mag); 
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col md:flex-row">
      
      {/* RED ALERT SCREEN */}
      <AnimatePresence>
        {systemStatus === "CRITICAL" && (
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] bg-red-600 flex flex-col items-center justify-center text-center p-6"
            >
                <div className="animate-pulse flex flex-col items-center">
                    <ShieldAlert size={120} className="text-white mb-6" />
                    <h1 className="text-5xl font-black text-white mb-4">EARTHQUAKE</h1>
                    <p className="text-white/90 text-xl">System Triggered by Crowd Data</p>
                </div>
                <Button 
                    onClick={handleDismiss} 
                    className="mt-16 bg-white text-red-600 hover:bg-white/90 font-bold px-10 py-8 text-2xl rounded-full shadow-2xl"
                >
                    I AM SAFE (STOP ALARM)
                </Button>
            </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE HEADER */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <Activity className="text-primary h-5 w-5" /> 
            <span>SeismicMode</span>
        </div>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            
            {/* FIX 2: Width adjusted to w-64 to match Sidebar. [&>button]:hidden removes the X icon. */}
            <SheetContent side="left" className="w-64 p-0 border-r [&>button]:hidden">
                {/* FIX 1: Accessibility Title (Hidden) */}
                <SheetTitle className="hidden">Navigation Menu</SheetTitle>
                <DashboardSidebar />
            </SheetContent>
        </Sheet>
      </div>

      {/* DESKTOP SIDEBAR */}
      <div className="hidden md:block w-64 border-r bg-background/50 h-screen sticky top-0">
        <DashboardSidebar />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 flex flex-col gap-6 w-full max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-3">
              <span className="hidden md:block"><Radio className="h-8 w-8 text-primary" /></span>
              Crowd-Sourced Network
            </h1>
            <p className="text-sm text-muted-foreground mt-1 font-mono">
              ID: {clientId.slice(0, 8)}...
            </p>
          </div>

          {!isMonitoring ? (
            <Button size="lg" onClick={startMonitoring} className="w-full md:w-auto bg-primary text-white shadow-lg animate-pulse">
              <Smartphone className="mr-2 h-5 w-5" /> Activate Sensor
            </Button>
          ) : (
             <div className="w-full md:w-auto flex justify-center items-center gap-2 px-4 py-2 bg-destructive/10 border border-destructive/20 rounded-full">
                <div className="w-2 h-2 rounded-full bg-destructive animate-ping" />
                <span className="text-destructive font-bold text-sm tracking-wide">MONITORING</span>
             </div>
          )}
        </div>

        <div className="glass-card p-3 rounded-xl border border-white/10 bg-black/40 font-mono text-[10px] md:text-xs text-green-400 overflow-hidden text-ellipsis whitespace-nowrap">
           <span className="opacity-50 mr-2">{new Date().toLocaleTimeString()}</span>
           {">"} {debugLog}
        </div>

        <div className="glass-card rounded-2xl p-4 md:p-6 relative overflow-hidden min-h-[200px] flex flex-col justify-between">
            <div className="flex justify-between items-start z-10">
                <div><h3 className="text-lg font-semibold text-foreground">Live Seismograph</h3></div>
                <div className="text-right">
                    <div className={cn("text-3xl font-mono font-bold tabular-nums transition-colors", magnitude > threshold[0] ? "text-destructive" : "text-primary")}>
                        {magnitude.toFixed(2)}g
                    </div>
                </div>
            </div>
            <div className="relative h-[100px] w-full mt-4 bg-black/20 rounded-lg border border-white/5 overflow-hidden">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                    <path d={graphPath} fill="none" stroke={magnitude > threshold[0] ? "#ef4444" : "#22c55e"} strokeWidth="2" />
                </svg>
            </div>
        </div>

        <div className={cn("glass-card rounded-2xl p-6 flex flex-col items-center text-center transition-all duration-300 border-2", magnitude > threshold[0] ? "bg-destructive/10 border-destructive shadow-lg" : "border-transparent")}>
            {magnitude > threshold[0] ? (
                <>
                    <Radio className="h-12 w-12 text-destructive animate-ping mb-2" />
                    <h2 className="text-xl font-bold text-destructive">VIBRATION DETECTED</h2>
                    <p className="text-destructive/80 text-sm">Sending data to Tectonix Cloud...</p>
                </>
            ) : (
                <>
                    <Activity className="h-12 w-12 text-primary/50 mb-2" />
                    <h2 className="text-lg font-bold text-foreground">Standing By</h2>
                    <p className="text-muted-foreground text-sm">Local Reports Sent: {shakeCount}</p>
                </>
            )}
        </div>

        <div className="glass-card rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
                <Settings2 className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Sensor Sensitivity</h3>
            </div>
            <Slider value={threshold} onValueChange={setThreshold} max={3.0} step={0.1} className="my-4" />
            <div className="flex justify-between text-xs text-muted-foreground px-1">
                <span>Sensitive (Walking)</span>
                <span>Hard Shake (Earthquake)</span>
            </div>
        </div>
      </main>
    </div>
  );
};

export default SeismicMode;