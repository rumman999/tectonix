import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  ScanLine,
  Upload,
  CheckCircle,
  AlertTriangle,
  Camera,
  X,
  ChevronRight,
  Menu,
  Building2,
  MapPin,
  Clock,
  Eye
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
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
  // Damage Report Fields (May be null)
  has_damage: boolean;
  damage_description?: string;
  damage_image?: string;
  severity_level?: number;
  report_location?: string;
}

export const AIScanner = () => {
  const { toast } = useToast();
  
  // Data State
  const [pendingList, setPendingList] = useState<PendingBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<PendingBuilding | null>(null);
  
  // Scan Workflow State
  const [scanImage, setScanImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<number | null>(null); // AI Score
  const [finalRiskScore, setFinalRiskScore] = useState<number>(50); // Specialist Input
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showEvidenceDialog, setShowEvidenceDialog] = useState(false); // For viewing user report image

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. FETCH PENDING ASSESSMENTS ---
  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/buildings/pending`, { headers: getHeaders() });
      setPendingList(res.data);
    } catch (err) {
      console.error("Failed to load pending assessments", err);
      toast({ title: "Error", description: "Could not load building list.", variant: "destructive" });
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // --- 2. HANDLE FILE UPLOAD ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setScanImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      // Reset previous results
      setScanResult(null);
    }
  };

  // --- 3. RUN AI SCAN (Mock for now, can be real API) ---
  const handleScan = async () => {
    if (!scanImage || !selectedBuilding) return;
    
    setIsScanning(true);
    
    // Simulate AI Processing Delay
    setTimeout(() => {
        // Mock Result: Random score between 30 and 90
        const mockScore = Math.floor(Math.random() * (90 - 30 + 1)) + 30;
        setScanResult(mockScore);
        setFinalRiskScore(mockScore); // Default manual input to AI suggestion
        setIsScanning(false);
    }, 2500);
  };

  // --- 4. SUBMIT FINAL ASSESSMENT ---
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
            description: `${selectedBuilding.building_name} risk score updated to ${finalRiskScore}%.`,
            className: "bg-green-600 text-white"
        });

        setShowResultDialog(false);
        setScanImage(null);
        setPreviewUrl(null);
        setScanResult(null);
        setSelectedBuilding(null);
        
        // Refresh list
        fetchPending();

    } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to update risk score.", variant: "destructive" });
    }
  };

  // Helper to use user's damage image as the scan image
  const useDamageImage = async () => {
    if (selectedBuilding?.damage_image) {
        setPreviewUrl(`${API_BASE_URL}/${selectedBuilding.damage_image}`);
        // Note: For a real file upload to backend, you'd need to fetch blob and convert to File
        // For this demo, we assume the backend can handle the URL or we skip the file check for "Reuse"
        setScanImage(new File([], "reuse.jpg")); // Dummy file to pass check
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
            <p className="text-muted-foreground mt-1">Review pending buildings and assign risk scores.</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* LEFT: PENDING LIST */}
            <div className="lg:col-span-1 space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Pending Assessments
                    <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">{pendingList.length}</span>
                </h2>
                
                <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2">
                    {pendingList.length === 0 && (
                        <p className="text-muted-foreground text-sm">No pending buildings found.</p>
                    )}
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
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(b.building_created_at).toLocaleDateString()}
                                </span>
                                {b.has_damage ? (
                                    <span className="text-xs font-bold text-destructive">Reported Damage</span>
                                ) : (
                                    <span className="text-xs font-medium text-muted-foreground">Unverified</span>
                                )}
                            </div>
                        </motion.button>
                    ))}
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
                        >
                            <GlassCard className="min-h-[500px] flex flex-col" hover={false}>
                                {/* Header Info */}
                                <div className="flex justify-between items-start mb-6 border-b border-white/10 pb-4">
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

                                {/* Damage Report Section (If Exists) */}
                                {selectedBuilding.has_damage && (
                                    <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="h-5 w-5 text-destructive" />
                                            <h3 className="font-semibold text-destructive">Reported Damage</h3>
                                        </div>
                                        <p className="text-sm text-foreground mb-3">"{selectedBuilding.damage_description}"</p>
                                        <div className="flex gap-3">
                                            {selectedBuilding.damage_image && (
                                                <Button 
                                                    variant="outline" 
                                                    size="sm" 
                                                    onClick={() => setShowEvidenceDialog(true)}
                                                    className="text-xs h-8"
                                                >
                                                    <Eye className="h-3 w-3 mr-2" /> View Evidence
                                                </Button>
                                            )}
                                            {selectedBuilding.damage_image && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    onClick={useDamageImage}
                                                    className="text-xs h-8 text-primary hover:text-primary hover:bg-primary/10"
                                                >
                                                    <Upload className="h-3 w-3 mr-2" /> Use for Scan
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Scanner Area */}
                                <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-white/10 rounded-xl bg-black/20 relative overflow-hidden">
                                    {previewUrl ? (
                                        <>
                                            <img src={previewUrl} alt="Scan Target" className="max-h-[300px] object-contain rounded-lg" />
                                            {isScanning && (
                                                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                                    <ScanLine className="h-12 w-12 text-primary animate-pulse mb-4" />
                                                    <p className="text-primary font-mono animate-pulse">ANALYZING STRUCTURE...</p>
                                                </div>
                                            )}
                                            {!isScanning && !scanResult && (
                                                <div className="absolute bottom-6 flex gap-3">
                                                    <Button variant="secondary" onClick={() => { setScanImage(null); setPreviewUrl(null); }}>
                                                        <X className="h-4 w-4 mr-2" /> Clear
                                                    </Button>
                                                    <GlowButton onClick={handleScan}>
                                                        <ScanLine className="h-4 w-4 mr-2" /> Start AI Scan
                                                    </GlowButton>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <div className="text-center">
                                            <div className="w-16 h-16 mx-auto mb-4 bg-muted/20 rounded-full flex items-center justify-center">
                                                <Camera className="h-8 w-8 text-muted-foreground" />
                                            </div>
                                            <p className="text-foreground font-medium">Upload Image for Analysis</p>
                                            <p className="text-xs text-muted-foreground mb-4">Required to calculate risk score</p>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                className="hidden" 
                                                ref={fileInputRef} 
                                                onChange={handleFileChange} 
                                            />
                                            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                                                <Upload className="h-4 w-4 mr-2" /> Select File
                                            </Button>
                                        </div>
                                    )}

                                    {/* Scan Result Display */}
                                    {scanResult && (
                                        <motion.div 
                                            initial={{ scale: 0.9, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
                                        >
                                            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                                            <h3 className="text-xl font-bold text-white mb-2">Analysis Complete</h3>
                                            <p className="text-muted-foreground mb-6">AI estimates a risk probability of:</p>
                                            <div className="text-5xl font-black text-primary mb-8">{scanResult}%</div>
                                            <GlowButton onClick={() => setShowResultDialog(true)}>
                                                Proceed to Assessment
                                            </GlowButton>
                                        </motion.div>
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    ) : (
                        <div className="h-full min-h-[400px] flex items-center justify-center border-2 border-dashed border-white/10 rounded-2xl bg-muted/5">
                            <div className="text-center text-muted-foreground">
                                <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p>Select a building from the list to start assessment</p>
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
                <div className="p-4 bg-muted/20 rounded-lg border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">AI Suggested Score</span>
                        <span className="font-bold text-primary">{scanResult}%</span>
                    </div>
                    <div className="h-2 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${scanResult}%` }} />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label>Confirm Final Risk Score (0-100)</Label>
                    <div className="flex gap-4 items-center">
                        <Input 
                            type="number" 
                            min="0" 
                            max="100" 
                            value={finalRiskScore} 
                            onChange={(e) => setFinalRiskScore(Number(e.target.value))}
                            className="w-24 bg-black/20 border-white/10 text-center text-lg font-bold" 
                        />
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={finalRiskScore} 
                            onChange={(e) => setFinalRiskScore(Number(e.target.value))}
                            className="flex-1"
                        />
                    </div>
                    <p className="text-xs text-muted-foreground">
                        You can adjust the score based on your expert manual review.
                    </p>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setShowResultDialog(false)}>Cancel</Button>
                <GlowButton onClick={handleSubmitAssessment}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Assessment
                </GlowButton>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* EVIDENCE VIEW DIALOG */}
      <Dialog open={showEvidenceDialog} onOpenChange={setShowEvidenceDialog}>
        <DialogContent className="bg-black border-white/10 text-white max-w-3xl p-0 overflow-hidden">
            <div className="relative">
                <img 
                    src={`${API_BASE_URL}/${selectedBuilding?.damage_image}`} 
                    alt="Damage Evidence" 
                    className="w-full h-auto max-h-[80vh] object-contain"
                />
                <button 
                    onClick={() => setShowEvidenceDialog(false)}
                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full hover:bg-white/20 transition-colors"
                >
                    <X className="h-5 w-5 text-white" />
                </button>
            </div>
            <div className="p-4 bg-slate-900 border-t border-white/10">
                <h4 className="font-semibold mb-1">User Report</h4>
                <p className="text-sm text-muted-foreground">{selectedBuilding?.damage_description}</p>
            </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default AIScanner;