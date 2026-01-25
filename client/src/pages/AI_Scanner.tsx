import { useState, useCallback, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassCard } from "@/components/ui/GlassCard";
import { API_BASE_URL, getHeaders } from "@/config";
import {
  Upload,
  ScanLine,
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileImage,
  X,
  Menu,
  Save,
  Edit2
} from "lucide-react";
import { cn } from "@/lib/utils";

import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Import Input
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast"; // Import Toast

type ScanState = "idle" | "uploading" | "scanning" | "complete" | "error";

interface ScanResult {
  riskScore: number;
  riskLevel: string;
  structuralIntegrity: number;
  liquefactionRisk: number;
  foundationStability: number;
  recommendations: string[];
}

interface Building {
  building_id: number;
  building_name: string;
}

const AIScanner = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null); // FIX: Ref for file input

  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  
  // Dropdown States
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");

  // Manual Verify State
  const [manualScore, setManualScore] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);

  // 1. Fetch Buildings for Dropdown (Using the new /list endpoint)
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        // Use /list to get ALL buildings, including those with NULL risk
        const res = await axios.get(`${API_BASE_URL}/api/buildings/list`, { headers: getHeaders() });
        setBuildings(res.data);
      } catch (err) {
        console.error("Failed to load buildings");
      }
    };
    fetchBuildings();
  }, []);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const startScan = async () => {
    if (!uploadedFile || !selectedBuildingId) {
      setErrorMsg("Please select a building and upload an image.");
      return;
    }

    setScanState("uploading");
    setErrorMsg("");

    try {
      const formData = new FormData();
      formData.append("image", uploadedFile);
      formData.append("building_id", selectedBuildingId);

      // --- FIX STARTS HERE ---
      // Get standard headers (like Authorization)
      const headers = getHeaders();
      
      // CRITICAL: Remove 'Content-Type' so the browser can set the correct boundary for the file
      // @ts-ignore
      delete headers["Content-Type"]; 

      const res = await axios.post(
        `${API_BASE_URL}/api/scanner/analyze`, 
        formData, 
        { headers } // Pass the modified headers
      );
      // --- FIX ENDS HERE ---

      setScanState("scanning");

      setTimeout(() => {
        const result = res.data.data;
        setScanResult(result);
        setManualScore(String(result.riskScore)); 
        setScanState("complete");
      }, 1500);

    } catch (err) {
      console.error("Scan failed", err);
      setScanState("error");
      setErrorMsg("Failed to connect to AI engine.");
    }
  };

  // NEW: Save Verified Score
  const saveVerifiedScore = async () => {
    if (!selectedBuildingId || !manualScore) return;
    
    setIsSaving(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/api/buildings/${selectedBuildingId}/risk`,
        { risk_score: parseFloat(manualScore) },
        { headers: getHeaders() }
      );

      toast({
        title: "Verification Complete",
        description: "Building risk score updated successfully.",
        variant: "default", 
        className: "bg-green-500 text-white border-none"
      });

      // Optional: Reset after success
      // resetScan(); 

    } catch (err) {
      console.error("Update failed", err);
      toast({
        title: "Update Failed",
        description: "Could not save the verified score.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const resetScan = () => {
    setUploadedFile(null);
    setScanState("idle");
    setScanResult(null);
    setErrorMsg("");
    setManualScore("");
  };

  const getRiskColor = (score: number) => {
    if (score > 60) return "text-destructive";
    if (score > 30) return "text-warning";
    return "text-success";
  };

  const getRiskBg = (score: number) => {
    if (score > 60) return "bg-destructive";
    if (score > 30) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="min-h-screen bg-background">
      
      {/* Mobile Header & Sidebar (Keeping exact styling) */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <ScanLine className="text-primary h-6 w-6" />
            <span>AI Scanner</span>
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

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      <main className="md:ml-64 p-6 transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <ScanLine className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              AI Building Scanner
            </h1>
          </div>
          <p className="text-muted-foreground">
            Upload building images for AI-powered seismic risk assessment
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div
              className={cn(
                "relative glass-card rounded-2xl p-8 min-h-[450px] flex flex-col items-center justify-center transition-all duration-300",
                dragActive && "border-primary glow-border-primary",
                uploadedFile && "border-success/50"
              )}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {!uploadedFile ? (
                <>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                    className="mb-6"
                  >
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="h-10 w-10 text-primary" />
                    </div>
                  </motion.div>

                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    Drop building image here
                  </h3>
                  <p className="text-muted-foreground text-center mb-6">
                    or click to browse from your device
                  </p>

                  <div className="w-full max-w-xs mb-6">
                    <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
                      <SelectTrigger className="bg-background/50 border-white/10">
                        <SelectValue placeholder="Select a Building" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.length > 0 ? (
                          buildings.map((b) => (
                            <SelectItem key={b.building_id} value={String(b.building_id)}>
                              {b.building_name}
                            </SelectItem>
                          ))
                        ) : (
                          <div className="p-2 text-xs text-muted-foreground">No buildings found</div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* FIX: Hidden input + Explicit Button Click */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileInput}
                  />
                  <GlowButton 
                    variant="ghost" 
                    size="md" 
                    onClick={() => fileInputRef.current?.click()} // <--- Fixes the click issue
                  >
                    <FileImage className="h-4 w-4" />
                    Browse Files
                  </GlowButton>

                  <p className="text-xs text-muted-foreground mt-6">
                    Supports: JPG, PNG, WEBP (Max 10MB)
                  </p>

                  <div className="absolute inset-4 border-2 border-dashed border-muted-foreground/30 rounded-xl pointer-events-none" />
                </>
              ) : (
                <div className="relative w-full h-full">
                  <div className="w-full h-64 bg-muted/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <img 
                        src={URL.createObjectURL(uploadedFile)} 
                        alt="Preview" 
                        className="w-full h-full object-cover opacity-60"
                    />
                    
                    <AnimatePresence>
                      {(scanState === "scanning" || scanState === "uploading") && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-background/80 flex items-center justify-center"
                        >
                          <motion.div
                            animate={{ y: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_hsl(187,92%,50%)]"
                          />
                          <div className="text-center z-10">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                            <p className="text-primary font-medium">
                                {scanState === "uploading" ? "Uploading to Cloud..." : "AI Analyzing..."}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate max-w-[200px]">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={resetScan}
                      disabled={scanState === 'uploading' || scanState === 'scanning'}
                      className="p-2 hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {scanState === "idle" && (
                    <div className="mt-6">
                      <GlowButton variant="primary" size="lg" className="w-full" onClick={startScan}>
                        <ScanLine className="h-5 w-5" />
                        Start AI Scan
                      </GlowButton>
                    </div>
                  )}
                  
                  {errorMsg && (
                      <p className="text-destructive text-sm text-center mt-3">{errorMsg}</p>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Results Area */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <AnimatePresence mode="wait">
              {scanState === "complete" && scanResult ? (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <GlassCard className="p-8" hover={false}>
                    
                    {/* Header - Manual Verification Mode */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-foreground">AI Assessment Complete</h3>
                        <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">Recommendation</span>
                      </div>

                      <div className="bg-muted/20 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                         <span className="text-sm text-muted-foreground mb-2">AI Suggested Score</span>
                         <span className={`text-4xl font-bold ${getRiskColor(scanResult.riskScore)}`}>
                            {scanResult.riskScore}
                         </span>
                         <p className="text-xs text-muted-foreground mt-1 text-center">
                            Risk Level: {scanResult.riskLevel}
                         </p>
                      </div>
                    </div>

                    {/* Verification Form */}
                    <div className="space-y-4 mb-8">
                       <div className="space-y-2">
                          <label className="text-sm font-medium text-foreground flex items-center gap-2">
                             <Edit2 className="w-4 h-4 text-primary" />
                             Verify Final Risk Score
                          </label>
                          <div className="flex gap-3">
                             <Input 
                                type="number" 
                                value={manualScore} 
                                onChange={(e) => setManualScore(e.target.value)}
                                className="bg-background/50 border-white/10 text-lg font-bold w-full"
                             />
                             <GlowButton onClick={saveVerifiedScore} disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin w-4 h-4" /> : <Save className="w-4 h-4" />}
                                Verify
                             </GlowButton>
                          </div>
                          <p className="text-xs text-muted-foreground">
                             Review the AI suggestion above. Manually adjust if necessary and click Verify to update the database.
                          </p>
                       </div>
                    </div>

                    {/* Risk Metrics */}
                    <div className="space-y-4 mb-8">
                      {[
                        { label: "Structural Integrity", value: scanResult.structuralIntegrity, color: getRiskBg(100 - scanResult.structuralIntegrity) },
                        { label: "Liquefaction Risk", value: scanResult.liquefactionRisk, color: getRiskBg(scanResult.liquefactionRisk) },
                      ].map((metric, index) => (
                        <div key={metric.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">{metric.label}</span>
                            <span className="text-foreground font-medium">{metric.value}%</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${metric.value}%` }}
                              transition={{ delay: index * 0.2, duration: 0.8, ease: "easeOut" }}
                              className={cn("h-full rounded-full", metric.color)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Recommendations */}
                    <div>
                      <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-warning" />
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {scanResult.recommendations.map((rec, index) => (
                          <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.5 + index * 0.1 }}
                            className="flex items-start gap-2 text-sm text-muted-foreground"
                          >
                            <CheckCircle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            {rec}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-8">
                      <GlowButton variant="ghost" size="md" onClick={resetScan} className="w-full">
                        Scan Another Building
                      </GlowButton>
                    </div>
                  </GlassCard>
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="glass-card rounded-2xl p-8 h-full min-h-[400px] flex flex-col items-center justify-center"
                >
                  <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mb-4">
                    <ScanLine className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-muted-foreground text-center">
                    Select a building and upload an image<br />to verify risk levels
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default AIScanner;