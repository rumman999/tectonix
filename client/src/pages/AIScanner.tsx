import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlowButton } from "@/components/ui/GlowButton";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Upload,
  ScanLine,
  Building2,
  AlertTriangle,
  CheckCircle,
  Loader2,
  FileImage,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ScanState = "idle" | "uploading" | "scanning" | "complete";

interface ScanResult {
  riskScore: number;
  riskLevel: string;
  structuralIntegrity: number;
  liquefactionRisk: number;
  foundationStability: number;
  recommendations: string[];
}

const AIScanner = () => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

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

  const startScan = () => {
    setScanState("uploading");

    setTimeout(() => {
      setScanState("scanning");

      setTimeout(() => {
        setScanResult({
          riskScore: 85,
          riskLevel: "High",
          structuralIntegrity: 42,
          liquefactionRisk: 78,
          foundationStability: 35,
          recommendations: [
            "Immediate structural assessment required",
            "Soil reinforcement recommended for foundation",
            "Install seismic isolators for critical equipment",
            "Consider building retrofitting options",
          ],
        });
        setScanState("complete");
      }, 3000);
    }, 1000);
  };

  const resetScan = () => {
    setUploadedFile(null);
    setScanState("idle");
    setScanResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Area */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <div
              className={cn(
                "relative glass-card rounded-2xl p-8 min-h-[400px] flex flex-col items-center justify-center transition-all duration-300",
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

                  <label className="cursor-pointer">
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileInput}
                    />
                    <GlowButton variant="ghost" size="md">
                      <FileImage className="h-4 w-4" />
                      Browse Files
                    </GlowButton>
                  </label>

                  <p className="text-xs text-muted-foreground mt-6">
                    Supports: JPG, PNG, WEBP (Max 10MB)
                  </p>

                  {/* Dashed Border */}
                  <div className="absolute inset-4 border-2 border-dashed border-muted-foreground/30 rounded-xl pointer-events-none" />
                </>
              ) : (
                <div className="relative w-full h-full">
                  {/* Preview Image Placeholder */}
                  <div className="w-full h-64 bg-muted/30 rounded-xl flex items-center justify-center relative overflow-hidden">
                    <Building2 className="h-16 w-16 text-muted-foreground" />

                    {/* Scanning Overlay */}
                    <AnimatePresence>
                      {scanState === "scanning" && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 bg-background/80 flex items-center justify-center"
                        >
                          {/* Scan Line */}
                          <motion.div
                            animate={{ y: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_20px_hsl(187,92%,50%)]"
                          />

                          {/* Grid Overlay */}
                          <div className="absolute inset-0 grid-pattern opacity-50" />

                          {/* Scanning Text */}
                          <div className="text-center z-10">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                            <p className="text-primary font-medium">Analyzing structure...</p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* File Info */}
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileImage className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm text-foreground truncate max-w-[200px]">
                        {uploadedFile.name}
                      </span>
                    </div>
                    <button
                      onClick={resetScan}
                      className="p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                      <X className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>

                  {/* Scan Button */}
                  {scanState === "idle" && (
                    <div className="mt-6">
                      <GlowButton variant="primary" size="lg" className="w-full" onClick={startScan}>
                        <ScanLine className="h-5 w-5" />
                        Start AI Scan
                      </GlowButton>
                    </div>
                  )}

                  {scanState === "uploading" && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-primary">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Uploading...</span>
                    </div>
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
                    {/* Risk Score Header */}
                    <div className="text-center mb-8">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 200 }}
                        className="inline-flex items-center justify-center w-32 h-32 rounded-full bg-destructive/20 border-4 border-destructive mb-4"
                      >
                        <div>
                          <span className="text-4xl font-bold text-destructive">
                            {scanResult.riskScore}%
                          </span>
                        </div>
                      </motion.div>
                      <h3 className="text-2xl font-bold text-foreground">
                        Risk Level: <span className="text-destructive">{scanResult.riskLevel}</span>
                      </h3>
                      <p className="text-muted-foreground mt-2">
                        High Liquefaction Potential Detected
                      </p>
                    </div>

                    {/* Risk Metrics */}
                    <div className="space-y-4 mb-8">
                      {[
                        { label: "Structural Integrity", value: scanResult.structuralIntegrity, color: "bg-warning" },
                        { label: "Liquefaction Risk", value: scanResult.liquefactionRisk, color: "bg-destructive" },
                        { label: "Foundation Stability", value: scanResult.foundationStability, color: "bg-warning" },
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

                    {/* Action Buttons */}
                    <div className="mt-8 flex gap-4">
                      <GlowButton variant="primary" size="md" className="flex-1">
                        Download Report
                      </GlowButton>
                      <GlowButton variant="ghost" size="md" onClick={resetScan}>
                        Scan Another
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
                    Upload an image to see<br />AI risk analysis results
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
