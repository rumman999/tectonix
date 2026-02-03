import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import {
  ScanLine, Upload, CheckCircle, AlertTriangle, Camera, X,
  Menu, Building2, MapPin, Activity, Droplets, Waves, Eye
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// --- INTERFACES ---
interface PendingBuilding {
  building_id: string;
  building_name: string;
  address_text: string;
  construction_year: number;
  building_created_at: string;
  has_damage: boolean;
  damage_description?: string;
  damage_image?: string;
  severity_level?: number;
}

interface SoilData {
  liquefaction_risk: number;
  soil_moisture: number;
  groundwater_level: number;
  soil_type: string;
  source?: string;
}

export const AIScanner = () => {
  const { toast } = useToast();
  
  // Data State
  const [pendingList, setPendingList] = useState<PendingBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<PendingBuilding | null>(null);
  const [soilData, setSoilData] = useState<SoilData | null>(null);
  const [loadingSoil, setLoadingSoil] = useState(false);
  
  // Scan Workflow State
  const [scanImage, setScanImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<number | null>(null); 
  const [finalRiskScore, setFinalRiskScore] = useState<number>(50); 
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- HELPER: Fix Image URLs ---
  const getImageUrl = (path: string | undefined) => {
    if (!path) return "";
    
    // 1. Extract just the filename (e.g. '123.jpg') from any path string like 'server/uploads/123.jpg'
    const filename = path.split(/[/\\]/).pop();
    
    // 2. Use API_BASE_URL if set, otherwise default to localhost:5000
    const baseUrl = API_BASE_URL || "http://localhost:5000";
    
    // Result: http://localhost:5000/uploads/123.jpg
    return `${baseUrl}/uploads/${filename}`;
  };

  // --- 1. FETCH PENDING LIST ---
  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/buildings/pending`, { headers: getHeaders() });
      setPendingList(res.data);
    } catch (err) {
      console.error("Failed to load list", err);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // --- 2. FETCH SOIL DATA ---
  useEffect(() => {
    if (selectedBuilding) {
        const fetchSoil = async () => {
            setLoadingSoil(true);
            try {
                const res = await axios.get(`${API_BASE_URL}/api/sensors/building/${selectedBuilding.building_id}`);
                setSoilData(res.data);
            } catch (err) {
                console.error("Failed to fetch soil data", err);
                setSoilData(null);
            } finally {
                setLoadingSoil(false);
            }
        };
        fetchSoil();
    }
  }, [selectedBuilding]);

  // --- 3. IMAGE HANDLING ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setScanResult(null);
    }
  };

  // --- 4. AI ENGINE CONNECTION ---
  const handleScan = async () => {
    if (!scanImage || !selectedBuilding) {
        toast({ title: "Missing Input", description: "Please upload an image first.", variant: "destructive" });
        return;
    }
    
    setIsScanning(true);
    
    try {
        const formData = new FormData();
        formData.append("image", scanImage);
        formData.append("building_id", selectedBuilding.building_id);

        const headers = getHeaders();
        // @ts-ignore
        delete headers["Content-Type"];

        const res = await axios.post(
            `${API_BASE_URL}/api/scanner/analyze`, 
            formData,
            { headers }
        );

        const aiScore = res.data.riskScore || res.data.data?.riskScore || res.data.score || 0;

        setScanResult(aiScore);
        setFinalRiskScore(aiScore);

    } catch (err) {
        console.error("AI Engine Failed", err);
        toast({ 
            title: "Scan Failed", 
            description: "Could not connect to AI Engine. Please try again.", 
            variant: "destructive" 
        });
    } finally {
        setIsScanning(false);
    }
  };

  // --- 5. SUBMIT VERIFICATION ---
  const handleSubmitAssessment = async () => {
    if (!selectedBuilding) return;

    try {
        await axios.patch(
            `${API_BASE_URL}/api/buildings/${selectedBuilding.building_id}/risk`,
            { risk_score: finalRiskScore },
            { headers: getHeaders() }
        );

        toast({ 
            title: "Assessment Complete", 
            description: "Building risk score updated in database.",
            className: "bg-green-600 text-white border-none"
        });

        setShowResultDialog(false);
        setScanImage(null);
        setPreviewUrl(null);
        setScanResult(null);
        setSelectedBuilding(null);
        setSoilData(null);
        fetchPending();

    } catch (err) {
        toast({ title: "Error", description: "Failed to update database.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <ScanLine className="text-primary h-6 w-6" />
            <span>AI Scanner</span>
        </div>
        <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
                <SheetTitle className="hidden">Nav</SheetTitle>
                <DashboardSidebar />
            </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
         <DashboardSidebar />
      </div>

      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">AI Risk Assessment</h1>
            <p className="text-muted-foreground mt-1">Verify damage reports and analyze soil stability.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: PENDING LIST */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Pending Queue
                    <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{pendingList.length}</span>
                </h2>
                
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
                    {pendingList.map((b) => (
                        <motion.button
                            key={b.building_id}
                            onClick={() => { setSelectedBuilding(b); setScanImage(null); setPreviewUrl(null); setScanResult(null); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all relative overflow-hidden ${
                                selectedBuilding?.building_id === b.building_id
                                    ? "bg-primary/10 border-primary/50"
                                    : "bg-muted/20 border-white/5 hover:border-white/10"
                            }`}
                        >
                            {b.has_damage && (
                                <div className="absolute top-0 right-0 p-1.5 bg-destructive/20 rounded-bl-xl">
                                    <AlertTriangle className="h-4 w-4 text-destructive" />
                                </div>
                            )}
                            <h4 className="font-medium text-foreground truncate pr-6">{b.building_name}</h4>
                            <p className="text-xs text-muted-foreground mt-1 truncate">{b.address_text}</p>
                            <div className="flex items-center gap-2 mt-2">
                                {b.has_damage ? (
                                    <span className="text-xs font-bold text-destructive">Reported Damage</span>
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground">Unverified</span>
                                )}
                            </div>
                        </motion.button>
                    ))}
                    {pendingList.length === 0 && (
                         <div className="text-center py-10 text-muted-foreground text-sm">No pending assessments.</div>
                    )}
                </div>
            </div>

            {/* RIGHT: WORKSPACE */}
            <div className="lg:col-span-2">
                <AnimatePresence mode="wait">
                    {selectedBuilding ? (
                        <motion.div
                            key="workspace"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            {/* 1. Header Card */}
                            <GlassCard className="p-6" hover={false}>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h2 className="text-2xl font-bold text-foreground">{selectedBuilding.building_name}</h2>
                                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                            <MapPin className="h-4 w-4" /> {selectedBuilding.address_text}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-muted-foreground">ID: {selectedBuilding.building_id}</p>
                                        <p className="text-sm font-medium text-foreground">Built: {selectedBuilding.construction_year}</p>
                                    </div>
                                </div>
                            </GlassCard>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* 2. Real-Time Soil Data */}
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                                        <Activity className="h-4 w-4 text-primary" /> Soil & Sensor Data
                                    </h3>

                                    {loadingSoil ? (
                                         <div className="p-8 bg-muted/10 border border-dashed border-white/10 rounded-xl text-center">
                                            <span className="loading loading-spinner loading-sm text-primary"></span>
                                            <p className="text-xs text-muted-foreground mt-2">Fetching satellite data...</p>
                                         </div>
                                    ) : soilData ? (
                                        <div className="grid grid-cols-1 gap-3">
                                            {/* Liquefaction Risk Bar */}
                                            <div className="p-4 bg-muted/20 rounded-xl border border-white/5">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs text-muted-foreground">Liquefaction Risk</span>
                                                    <span className={`text-sm font-bold ${soilData.liquefaction_risk > 50 ? 'text-destructive' : 'text-success'}`}>
                                                        {soilData.liquefaction_risk}%
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full ${soilData.liquefaction_risk > 50 ? 'bg-destructive' : 'bg-success'}`} 
                                                        style={{ width: `${soilData.liquefaction_risk}%` }} 
                                                    />
                                                </div>
                                                <p className="text-[10px] text-muted-foreground mt-1 text-right">Source: Open-Meteo Satellite</p>
                                            </div>

                                            {/* Metrics */}
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="p-3 bg-muted/20 rounded-xl border border-white/5">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                        <Droplets className="h-3 w-3" /> Moisture
                                                    </span>
                                                    <span className="text-lg font-medium">{soilData.soil_moisture}%</span>
                                                </div>
                                                <div className="p-3 bg-muted/20 rounded-xl border border-white/5">
                                                    <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                                        <Waves className="h-3 w-3" /> Water Tbl
                                                    </span>
                                                    <span className="text-lg font-medium">{soilData.groundwater_level}m</span>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-muted/10 border border-dashed border-white/10 rounded-xl text-center">
                                            <p className="text-xs text-muted-foreground">No sensor data available.</p>
                                        </div>
                                    )}

                                    {/* Damage Report Section */}
                                    {selectedBuilding.has_damage && (
                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl mt-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="h-4 w-4 text-destructive" />
                                                <h3 className="font-semibold text-destructive text-sm">Damage Reported</h3>
                                            </div>
                                            <p className="text-xs text-foreground mb-3 line-clamp-3 italic">"{selectedBuilding.damage_description}"</p>
                                            <Button variant="outline" size="sm" onClick={() => setShowEvidenceDialog(true)} className="text-xs h-8 w-full">
                                                <Eye className="h-3 w-3 mr-1" /> View Proof
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                {/* 3. AI Scanner Area */}
                                <div className="flex flex-col">
                                    <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                                        <ScanLine className="h-4 w-4 text-primary" /> Visual Scan
                                    </h3>
                                    <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl bg-black/20 relative overflow-hidden min-h-[300px]">
                                        {previewUrl ? (
                                            <>
                                                <img src={previewUrl} alt="Scan Target" className="max-h-[250px] object-contain rounded-lg" />
                                                {isScanning && (
                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                                        <ScanLine className="h-10 w-10 text-primary animate-pulse mb-2" />
                                                        <p className="text-primary text-xs font-mono animate-pulse">ANALYZING STRUCTURE...</p>
                                                    </div>
                                                )}
                                                {!isScanning && !scanResult && (
                                                    <div className="absolute bottom-4 flex gap-2 bg-black/50 p-1 rounded-lg backdrop-blur-sm">
                                                        <Button variant="secondary" size="sm" onClick={() => { setScanImage(null); setPreviewUrl(null); }}>
                                                            Clear
                                                        </Button>
                                                        <GlowButton size="sm" onClick={handleScan}>
                                                            Scan Image
                                                        </GlowButton>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <div className="w-12 h-12 mx-auto mb-2 bg-muted/20 rounded-full flex items-center justify-center">
                                                    <Camera className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                                <p className="text-xs text-muted-foreground mb-3">Upload visual evidence</p>
                                                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
                                                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                                                    Select File
                                                </Button>
                                            </div>
                                        )}

                                        {/* AI Result Overlay */}
                                        {scanResult && (
                                            <motion.div 
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4 text-center"
                                            >
                                                <CheckCircle className="h-8 w-8 text-green-500 mb-2" />
                                                <h3 className="text-lg font-bold text-white">Scan Complete</h3>
                                                <div className="text-4xl font-black text-primary mb-4">{scanResult}%</div>
                                                <GlowButton size="sm" onClick={() => setShowResultDialog(true)}>
                                                    Verify & Submit
                                                </GlowButton>
                                            </motion.div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-muted/5">
                            <div className="text-center text-muted-foreground">
                                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>Select a building to retrieve<br/>real-time soil data.</p>
                            </div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
      </main>

      {/* FINAL ASSESSMENT DIALOG */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>Finalize Risk Assessment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-4 bg-muted/20 rounded-lg border border-white/5 flex justify-between">
                    <div className="text-center px-4 border-r border-white/10">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">AI Visual Score</p>
                        <p className="font-bold text-primary text-xl">{scanResult}%</p>
                    </div>
                    <div className="text-center px-4">
                        <p className="text-[10px] uppercase text-muted-foreground tracking-wider">Soil Risk</p>
                        <p className={`font-bold text-xl ${soilData?.liquefaction_risk! > 50 ? 'text-destructive' : 'text-success'}`}>
                            {soilData?.liquefaction_risk ?? "N/A"}%
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <Label className="text-xs text-muted-foreground">Confirm Final Risk Score (0-100)</Label>
                    <div className="flex gap-4 items-center">
                        <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={finalRiskScore} 
                            onChange={(e) => setFinalRiskScore(Number(e.target.value))}
                            className="w-24 bg-black/20 border-white/10 text-center text-lg font-bold h-10" 
                        />
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={finalRiskScore} 
                            onChange={(e) => setFinalRiskScore(Number(e.target.value))}
                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                        * Use your expert judgment to weigh the visual damage against the soil stability data.
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowResultDialog(false)}>Cancel</Button>
                <GlowButton onClick={handleSubmitAssessment}>
                    Submit Verification
                </GlowButton>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EVIDENCE VIEW DIALOG */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-3xl p-0 overflow-hidden">
            <div className="relative flex justify-center bg-black/80">
                <img 
                    src={getImageUrl(selectedBuilding?.damage_image)} 
                    alt="Damage Evidence" 
                    className="max-h-[80vh] w-auto object-contain"
                />
                <button onClick={() => setShowEvidenceDialog(false)} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors">
                    <X className="h-5 w-5 text-white" />
                </button>
            </div>
            <div className="p-4 bg-slate-900 border-t border-white/10">
                <h4 className="font-semibold mb-1 text-sm">User Report Description</h4>
                <p className="text-sm text-muted-foreground">{selectedBuilding?.damage_description}</p>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AIScanner;