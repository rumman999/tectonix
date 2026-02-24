import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import {
  ScanLine,
  Upload,
  CheckCircle,
  AlertTriangle,
  Camera,
  X,
  Menu,
  Building2,
  MapPin,
  Activity,
  Droplets,
  Waves,
  Eye,
  Download,
  Shield,
  Clock,
  FileText,
  TrendingUp,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

// --- REPORT GENERATOR ---
const generateReport = (
  building: PendingBuilding,
  soil: SoilData | null,
  aiScore: number,
  finalScore: number,
) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const riskLevel =
    finalScore >= 75
      ? "CRITICAL"
      : finalScore >= 50
      ? "HIGH"
      : finalScore >= 25
      ? "MODERATE"
      : "LOW";

  // -- Header Branding --
  doc.setFontSize(22);
  doc.setTextColor(37, 99, 235); // Primary Blue Color
  doc.text("TECTONIX", 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text("Advanced Risk Assessment Report", 14, 26);

  // -- Divider --
  doc.setDrawColor(200);
  doc.line(14, 30, 196, 30);

  // -- Report Title --
  doc.setFontSize(16);
  doc.setTextColor(0);
  doc.text("Building Risk Assessment Report", 14, 42);

  // -- Building Details Section --
  doc.setFontSize(11);
  doc.text("Building Details:", 14, 52);
  doc.setFont("helvetica", "bold");
  doc.text(building.building_name || "N/A", 14, 58);

  doc.setFont("helvetica", "normal");
  doc.text(`Address: ${building.address_text}`, 14, 64);
  doc.text(
    `Constructed: ${building.construction_year} (${
      new Date().getFullYear() - building.construction_year
    } years old)`,
    14,
    70,
  );

  doc.text("Date Generated:", 130, 52);
  doc.text(date, 130, 58);
  doc.text(
    `Report ID: #RPT-${Date.now().toString().slice(-6).toUpperCase()}`,
    130,
    64,
  );

  // -- Damage Report Details --
  doc.text("Damage Reported:", 130, 70);
  if (building.has_damage) {
    doc.setTextColor(220, 38, 38); // Red
    doc.text(`YES (Severity: ${building.severity_level || "N/A"}/100)`, 165, 70);
  } else {
    doc.setTextColor(22, 163, 74); // Green
    doc.text("NO", 165, 70);
  }
  doc.setTextColor(0);

  // Description if damaged
  let startY = 80;
  if (building.has_damage && building.damage_description) {
    doc.text("Damage Description:", 14, startY);
    doc.setFont("helvetica", "italic");
    doc.text(`"${building.damage_description}"`, 14, startY + 6, {
      maxWidth: 180,
    });
    doc.setFont("helvetica", "normal");
    startY += 16;
  }

  // -- Soil & Environment Table --
  autoTable(doc, {
    startY: startY,
    head: [["Environmental & Soil Data", "Value"]],
    body: [
      ["Liquefaction Risk", soil ? `${soil.liquefaction_risk}%` : "N/A"],
      ["Soil Moisture", soil ? `${soil.soil_moisture}%` : "N/A"],
      ["Groundwater Level", soil ? `${soil.groundwater_level}m` : "N/A"],
      ["Soil Type", soil ? soil.soil_type : "N/A"],
    ],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
  });

  // -- AI Analysis Breakdown Table --
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [["Risk Factor Breakdown", "Weight", "Score Contribution"]],
    body: [
      ["Structural Damage (Visual AI)", "60%", `${Math.round(aiScore * 0.6)}%`],
      [
        "Soil & Liquefaction Hazard",
        "25%",
        soil ? `${Math.round(soil.liquefaction_risk * 0.25)}%` : "N/A",
      ],
      [
        "Building Age Factor",
        "15%",
        `${Math.min(
          100,
          Math.round(
            (new Date().getFullYear() - building.construction_year) * 2,
          ),
        )}%`,
      ],
    ],
    foot: [["Final Verified Risk Score", "", `${finalScore}% (${riskLevel})`]],
    theme: "grid",
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: {
      fillColor:
        finalScore >= 75
          ? [220, 38, 38]
          : finalScore >= 50
          ? [234, 179, 8]
          : [22, 163, 74],
      textColor: 255,
    },
  });

  // -- Recommendations Section --
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Recommendations:", 14, finalY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  let recY = finalY + 8;

  if (finalScore >= 75) {
    doc.text(
      "• IMMEDIATE structural assessment required by certified engineers.",
      14,
      recY,
    );
    recY += 6;
  } else if (finalScore >= 50) {
    doc.text(
      "• Schedule professional engineering review within 3 months.",
      14,
      recY,
    );
    recY += 6;
  }
  if (soil && soil.liquefaction_risk > 60) {
    doc.text(
      "• Soil reinforcement and foundation retrofitting highly recommended.",
      14,
      recY,
    );
    recY += 6;
  }
  doc.text(
    "• Consider running a Tectonix Retrofit Estimate for reinforcement costs.",
    14,
    recY,
  );
  recY += 6;

  // -- Footer --
  doc.setFontSize(9);
  doc.setTextColor(128);
  doc.text(
    "Disclaimer: This report is generated by AI and remote sensor data. It does not replace",
    14,
    275,
  );
  doc.text("a physical inspection by a licensed structural engineer.", 14, 280);
  doc.text("Generated by Tectonix Platform", 14, 285);


  doc.save(`Tectonix_Risk_Report_${building.building_id}_${date}.pdf`);
};

// --- RISK GAUGE COMPONENT ---
const RiskGauge = ({
  score,
  label,
  size = "lg",
}: {
  score: number;
  label: string;
  size?: "sm" | "lg";
}) => {
  const riskColor =
    score >= 75
      ? "text-destructive"
      : score >= 50
      ? "text-warning"
      : score >= 25
      ? "text-accent"
      : "text-success";
  const riskBg =
    score >= 75
      ? "bg-destructive/20 border-destructive/50"
      : score >= 50
      ? "bg-warning/20 border-warning/50"
      : score >= 25
      ? "bg-accent/20 border-accent/50"
      : "bg-success/20 border-success/50";

  const dimension = size === "lg" ? "w-32 h-32" : "w-20 h-20";
  const textSize = size === "lg" ? "text-3xl" : "text-base";

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        // --- CHANGED ANIMATION HERE ---
        initial={{ opacity: 0, scale: 0.8, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut", delay: 0.1 }}
        // ------------------------------
        className={cn(
          "rounded-full border-2 flex items-center justify-center",
          dimension,
          riskBg,
        )}
      >
        <span className={cn("font-bold px-2 text-center", textSize, riskColor)}>
          {score}%
        </span>
      </motion.div>
      <span className="text-xs text-muted-foreground font-medium text-center">
        {label}
      </span>
    </div>
  );
};

// --- METRIC ROW ---
const MetricRow = ({
  icon: Icon,
  label,
  value,
  color,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
  >
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className={cn("text-sm font-semibold", color || "text-foreground")}>
      {value}
    </span>
  </motion.div>
);

export const AIScanner = () => {
  const { toast } = useToast();

  // Data State
  const [pendingList, setPendingList] = useState<PendingBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] =
    useState<PendingBuilding | null>(null);
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

  const getImageUrl = (path: string | undefined) => {
    if (!path) return "";

    if (path.startsWith("http")) {
      return path;
    }

    // Fallback for older local files
    const filename = path.split(/[/\\]/).pop();
    const baseUrl = API_BASE_URL || "http://localhost:5000";
    return `${baseUrl}/uploads/${filename}`;
  };

  // --- 1. FETCH PENDING LIST ---
  const fetchPending = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/buildings/pending`, {
        headers: getHeaders(),
      });
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
          const res = await axios.get(
            `${API_BASE_URL}/api/sensors/building/${selectedBuilding.building_id}`,
          );
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
      toast({
        title: "Missing Input",
        description: "Please upload an image first.",
        variant: "destructive",
      });
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
        { headers },
      );

      const aiScore =
        res.data.riskScore || res.data.data?.riskScore || res.data.score || 0;

      setScanResult(aiScore);
      setFinalRiskScore(50);
    } catch (err) {
      console.error("AI Engine Failed", err);
      toast({
        title: "Scan Failed",
        description: "Could not connect to AI Engine. Please try again.",
        variant: "destructive",
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
        { headers: getHeaders() },
      );

      toast({ 
            title: "Assessment Verified", 
            description: "Building risk score updated and report logged in the audit trail.",
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
      toast({
        title: "Error",
        description: "Failed to update database.",
        variant: "destructive",
      });
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
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-64 border-r [&>button]:hidden"
          >
            <SheetTitle className="hidden">Nav</SheetTitle>
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground">
            AI Risk Assessment
          </h1>
          <p className="text-muted-foreground mt-1">
            Verify damage reports and analyze soil stability.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT: PENDING LIST */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              Pending Queue
              <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                {pendingList.length}
              </span>
            </h2>

            <div className="space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto pr-2 custom-scrollbar">
              {pendingList.map((b) => (
                <motion.button
                  key={b.building_id}
                  onClick={() => {
                    setSelectedBuilding(b);
                    setScanImage(null);
                    setPreviewUrl(null);
                    setScanResult(null);
                  }}
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
                  <h4 className="font-medium text-foreground truncate pr-6">
                    {b.building_name}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {b.address_text}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    {b.has_damage ? (
                      <span className="text-xs font-bold text-destructive">
                        Reported Damage
                      </span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        Unverified
                      </span>
                    )}
                  </div>
                </motion.button>
              ))}
              {pendingList.length === 0 && (
                <div className="text-center py-10 text-muted-foreground text-sm">
                  No pending assessments.
                </div>
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
                        <h2 className="text-2xl font-bold text-foreground">
                          {selectedBuilding.building_name}
                        </h2>
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-4 w-4" />{" "}
                          {selectedBuilding.address_text}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          ID: {selectedBuilding.building_id}
                        </p>
                        <p className="text-sm font-medium text-foreground">
                          Built: {selectedBuilding.construction_year}
                        </p>
                      </div>
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 2. Real-Time Soil Data */}
                    <div className="space-y-4">
                      <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <Activity className="h-4 w-4 text-primary" /> Soil &
                        Sensor Data
                      </h3>

                      {loadingSoil ? (
                        <div className="p-8 bg-muted/10 border border-dashed border-white/10 rounded-xl text-center">
                          <span className="loading loading-spinner loading-sm text-primary"></span>
                          <p className="text-xs text-muted-foreground mt-2">
                            Fetching satellite data...
                          </p>
                        </div>
                      ) : soilData ? (
                        <div className="grid grid-cols-1 gap-3">
                          {/* Liquefaction Risk Bar */}
                          <div className="p-4 bg-muted/20 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs text-muted-foreground">
                                Liquefaction Risk
                              </span>
                              <span
                                className={`text-sm font-bold ${
                                  soilData.liquefaction_risk > 50
                                    ? "text-destructive"
                                    : "text-success"
                                }`}
                              >
                                {soilData.liquefaction_risk}%
                              </span>
                            </div>
                            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  soilData.liquefaction_risk > 50
                                    ? "bg-destructive"
                                    : "bg-success"
                                }`}
                                style={{
                                  width: `${soilData.liquefaction_risk}%`,
                                }}
                              />
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-1 text-right">
                              Source: Open-Meteo Satellite
                            </p>
                          </div>

                          {/* Metrics */}
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-muted/20 rounded-xl border border-white/5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <Droplets className="h-3 w-3" /> Moisture
                              </span>
                              <span className="text-lg font-medium">
                                {soilData.soil_moisture}%
                              </span>
                            </div>
                            <div className="p-3 bg-muted/20 rounded-xl border border-white/5">
                              <span className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                                <Waves className="h-3 w-3" /> Water Tbl
                              </span>
                              <span className="text-lg font-medium">
                                {soilData.groundwater_level}m
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-muted/10 border border-dashed border-white/10 rounded-xl text-center">
                          <p className="text-xs text-muted-foreground">
                            No sensor data available.
                          </p>
                        </div>
                      )}

                      {/* Damage Report Section */}
                      {selectedBuilding.has_damage && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="h-4 w-4 text-destructive" />
                            <h3 className="font-semibold text-destructive text-sm">
                              Damage Reported
                            </h3>
                          </div>
                          <p className="text-xs text-foreground mb-3 line-clamp-3 italic">
                            "{selectedBuilding.damage_description}"
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowEvidenceDialog(true)}
                            className="text-xs h-8 w-full"
                          >
                            <Eye className="h-3 w-3 mr-1" /> View Damage Photo
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* 3. AI Scanner Area */}
                    <div className="flex flex-col">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <ScanLine className="h-4 w-4 text-primary" /> Visual
                        Scan
                      </h3>
                      <div className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-white/10 rounded-xl bg-black/20 relative overflow-hidden min-h-[300px]">
                        {previewUrl ? (
                          <>
                            <img
                              src={previewUrl}
                              alt="Scan Target"
                              className="max-h-[250px] object-contain rounded-lg"
                            />
                            {isScanning && (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm">
                                <ScanLine className="h-10 w-10 text-primary animate-pulse mb-2" />
                                <p className="text-primary text-xs font-mono animate-pulse">
                                  ANALYZING STRUCTURE...
                                </p>
                              </div>
                            )}
                            {!isScanning && !scanResult && (
                              <div className="absolute bottom-4 flex gap-2 bg-black/50 p-1 rounded-lg backdrop-blur-sm">
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => {
                                    setScanImage(null);
                                    setPreviewUrl(null);
                                  }}
                                >
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
                            <p className="text-xs text-muted-foreground mb-3">
                              Upload visual evidence
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                            >
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
                            <h3 className="text-lg font-bold text-white">
                              Scan Complete
                            </h3>
                            <div className="text-4xl font-black text-primary mb-4">
                              {scanResult}%
                            </div>
                            <GlowButton
                              size="sm"
                              onClick={() => setShowResultDialog(true)}
                            >
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
                    <p>
                      Select a building to retrieve
                      <br />
                      real-time soil data.
                    </p>
                  </div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="max-w-xl bg-background/95 backdrop-blur-xl border-white/10 p-0 overflow-hidden">
          {/* Header Banner */}
          <div className="relative px-6 pt-6 pb-4 border-b border-white/10">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Risk Assessment Report
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-muted-foreground mt-1 flex items-center pl-2 gap-1">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleString()}
            </p>
          </div>

          <div className="px-6 py-4 max-h-[65vh] overflow-y-auto space-y-5">
            {/* Score Comparison Row */}
            <div className="flex items-center justify-around py-3">
              <RiskGauge score={scanResult ?? 0} label="AI Visual Score" />
              <div className="flex flex-col items-center gap-1">
                <TrendingUp className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">
                  Combined
                </span>
              </div>
              <RiskGauge
                score={soilData?.liquefaction_risk ?? 0}
                label="Soil Risk"
              />
            </div>

            {/* Building Summary */}
            <div className="glass-card rounded-xl p-4">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                <Building2 className="h-3 w-3" /> Building Details
              </h4>
              <MetricRow
                icon={FileText}
                label="Name"
                value={selectedBuilding?.building_name ?? "—"}
                delay={0.1}
              />
              <MetricRow
                icon={MapPin}
                label="Address"
                value={selectedBuilding?.address_text ?? "—"}
                delay={0.15}
              />
              <MetricRow
                icon={Clock}
                label="Built"
                value={`${selectedBuilding?.construction_year ?? "—"} (${
                  selectedBuilding
                    ? new Date().getFullYear() -
                      selectedBuilding.construction_year
                    : 0
                } yrs old)`}
                delay={0.2}
              />
              <MetricRow
                icon={AlertTriangle}
                label="Damage Reported"
                value={selectedBuilding?.has_damage ? "Yes" : "No"}
                color={
                  selectedBuilding?.has_damage
                    ? "text-destructive"
                    : "text-success"
                }
                delay={0.25}
              />
            </div>

            {/* Environmental Data */}
            {soilData && (
              <div className="glass-card rounded-xl p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Waves className="h-3 w-3" /> Environmental Factors
                </h4>
                <MetricRow
                  icon={Activity}
                  label="Liquefaction Risk"
                  value={`${soilData.liquefaction_risk}%`}
                  color={
                    soilData.liquefaction_risk > 50
                      ? "text-destructive"
                      : "text-success"
                  }
                  delay={0.1}
                />
                <MetricRow
                  icon={Droplets}
                  label="Soil Moisture"
                  value={`${soilData.soil_moisture}%`}
                  delay={0.15}
                />
                <MetricRow
                  icon={Waves}
                  label="Groundwater Level"
                  value={`${soilData.groundwater_level}m`}
                  delay={0.2}
                />
                <MetricRow
                  icon={FileText}
                  label="Soil Type"
                  value={soilData.soil_type}
                  delay={0.25}
                />
              </div>
            )}

            {/* --- CALCULATE SUGGESTED SCORE --- */}
            {(() => {
              const structuralScore = Math.round((scanResult ?? 0) * 0.6);
              const soilScore = soilData
                ? Math.round(soilData.liquefaction_risk * 0.25)
                : 0;
              const ageFactor = selectedBuilding
                ? Math.min(
                    100,
                    Math.round(
                      (new Date().getFullYear() -
                        selectedBuilding.construction_year) *
                        2,
                    ),
                  )
                : 0;
              const ageScore = Math.round(ageFactor * 0.15);
              const suggestedScore = structuralScore + soilScore + ageScore;

              return (
                <>
                  {/* Risk Breakdown Bars */}
                  <div className="glass-card rounded-xl p-4">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Risk Breakdown
                    </h4>
                    {[
                      {
                        label: "Structural (Visual AI)",
                        value: structuralScore,
                        weight: "60%",
                      },
                      {
                        label: "Soil & Liquefaction",
                        value: soilScore,
                        weight: "25%",
                      },
                      { label: "Age Factor", value: ageScore, weight: "15%" },
                    ].map((item, i) => (
                      <div key={item.label} className="mb-3 last:mb-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            {item.label}{" "}
                            <span className="opacity-50">({item.weight})</span>
                          </span>
                          <span className="text-foreground font-medium">
                            {item.value}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{
                              delay: 0.3 + i * 0.15,
                              duration: 0.6,
                            }}
                            className="h-full rounded-full bg-primary"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Suggested Score Summary */}
                    <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                      <span className="text-xs font-medium text-muted-foreground">
                        Calculated Suggested Score:
                      </span>
                      <span className="text-sm font-bold text-primary">
                        {suggestedScore}%
                      </span>
                    </div>
                  </div>

                  {/* Final Score Slider */}
                  <div className="glass-card rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Confirm Final Risk Score
                      </Label>
                      {/* Button to quickly apply the suggested math score */}
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-6 text-[10px] px-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                        onClick={() => setFinalRiskScore(suggestedScore)}
                      >
                        Apply Suggested
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 mt-3">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={finalRiskScore}
                        onChange={(e) =>
                          setFinalRiskScore(Number(e.target.value))
                        }
                        className="w-20 bg-muted/30 border-white/10 text-center text-lg font-bold h-10"
                      />
                      <div className="flex-1 relative">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          value={finalRiskScore}
                          onChange={(e) =>
                            setFinalRiskScore(Number(e.target.value))
                          }
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                      <span
                        className={cn(
                          "text-sm font-bold min-w-[70px] text-right",
                          finalRiskScore >= 75
                            ? "text-destructive"
                            : finalRiskScore >= 50
                            ? "text-warning"
                            : "text-success",
                        )}
                      >
                        {finalRiskScore >= 75
                          ? "Critical"
                          : finalRiskScore >= 50
                          ? "High"
                          : finalRiskScore >= 25
                          ? "Moderate"
                          : "Low"}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-2 italic">
                      * Use your expert judgment to weigh visual damage against
                      soil stability data.
                    </p>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Footer Actions */}
          <DialogFooter className="px-6 py-4 border-t border-white/10 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              className="border-white/10 gap-2"
              onClick={() => {
                if (selectedBuilding) {
                  generateReport(
                    selectedBuilding,
                    soilData,
                    scanResult ?? 0,
                    finalRiskScore,
                  );
                  toast({
                    title: "Report Downloaded",
                    description: "Assessment report saved to your device.",
                  });
                }
              }}
            >
              <Download className="h-4 w-4" />
              Save Report
            </Button>
            <div className="flex gap-2 flex-1 sm:justify-end">
              <Button
                variant="ghost"
                onClick={() => setShowResultDialog(false)}
                className="border border-white/10"
              >
                Cancel
              </Button>
              <GlowButton
                variant="primary"
                size="md"
                onClick={handleSubmitAssessment}
              >
                <CheckCircle className="h-4 w-4" />
                Submit Verification
              </GlowButton>
            </div>
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
          </div>
          <div className="p-4 bg-slate-900 border-t border-white/10">
            <h4 className="font-semibold mb-1 text-sm">
              User Report Description
            </h4>
            <p className="text-sm text-muted-foreground">
              {selectedBuilding?.damage_description}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIScanner;
