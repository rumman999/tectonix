import { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL, getHeaders } from "@/config";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  Building2,
  Plus,
  MapPin,
  Calendar,
  User,
  ScanLine,
  ChevronRight,
  ArrowRightLeft,
  Check,
  Clock,
  Shield,
  Menu,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface BuildingOwnership {
  ownership_id: number;
  building_id: number;
  owner_id: string; // UUID
  owner_name: string;
  start_date: string;
  end_date: string | null;
}

interface OwnerOption {
  user_id: string;
  legal_name: string;
}

interface AIScan {
  scan_id: string;
  building_id: string;
  specialist_id: string;
  image_url: string;
  original_width: number;
  original_height: number;
  ai_confidence_score: number;
  verified_status: boolean;
  scan_timestamp: string;
}

const mockBuildings: Building[] = [
  {
    building_id: "bld-001",
    building_name: "Jamuna Future Park",
    location_gps: { lat: 23.813, lng: 90.424 },
    address_text: "Ka-244, Kuril, Progoti Sarani, Dhaka",
    construction_year: 2012,
    risk_score: 15,
  },
  {
    building_id: "bld-002",
    building_name: "Bashundhara City",
    location_gps: { lat: 23.751, lng: 90.392 },
    address_text: "Panthapath, Dhaka 1215",
    construction_year: 2004,
    risk_score: 22,
  },
  {
    building_id: "bld-003",
    building_name: "RAJUK Bhaban",
    location_gps: { lat: 23.728, lng: 90.412 },
    address_text: "Motijheel C/A, Dhaka 1000",
    construction_year: 1985,
    risk_score: 45,
  },
  {
    building_id: "bld-004",
    building_name: "Dhaka Medical Complex",
    location_gps: { lat: 23.726, lng: 90.396 },
    address_text: "Secretariat Road, Dhaka 1000",
    construction_year: 1962,
    risk_score: 78,
  },
];

const mockOwnerships: BuildingOwnership[] = [
  {
    ownership_id: "own-001",
    building_id: "bld-001",
    owner_id: "usr-101",
    owner_name: "Jamuna Group Ltd.",
    start_date: "2012-01-15",
    end_date: null,
  },
  {
    ownership_id: "own-002",
    building_id: "bld-002",
    owner_id: "usr-102",
    owner_name: "East West Property",
    start_date: "2004-06-20",
    end_date: null,
  },
];

const mockScans: AIScan[] = [
  {
    scan_id: "scn-001",
    building_id: "bld-001",
    specialist_id: "spc-201",
    image_url: "/scan-001.jpg",
    original_width: 1920,
    original_height: 1080,
    ai_confidence_score: 0.92,
    verified_status: true,
    scan_timestamp: "2025-01-10T14:32:00",
  },
  {
    scan_id: "scn-002",
    building_id: "bld-001",
    specialist_id: "spc-202",
    image_url: "/scan-002.jpg",
    original_width: 1920,
    original_height: 1080,
    ai_confidence_score: 0.87,
    verified_status: false,
    scan_timestamp: "2025-01-08T09:15:00",
  },
  {
    scan_id: "scn-003",
    building_id: "bld-003",
    specialist_id: "spc-201",
    image_url: "/scan-003.jpg",
    original_width: 1920,
    original_height: 1080,
    ai_confidence_score: 0.45,
    verified_status: true,
    scan_timestamp: "2025-01-05T16:45:00",
  },
];

const mockOwners = [
  { owner_id: "usr-101", name: "Jamuna Group Ltd." },
  { owner_id: "usr-102", name: "East West Property" },
  { owner_id: "usr-103", name: "Delta Holdings" },
  { owner_id: "usr-104", name: "Navana Real Estate" },
];

const getRiskColor = (score: number) => {
  if (score < 30) return "text-success";
  if (score < 60) return "text-warning";
  return "text-destructive";
};

const getRiskBadge = (score: number) => {
  if (score < 30) return <StatusBadge status="safe">Low Risk</StatusBadge>;
  if (score < 60) return <StatusBadge status="warning">Moderate</StatusBadge>;
  return (
    <StatusBadge status="danger" pulse>
      High Risk
    </StatusBadge>
  );
};

export const BuildingManager = () => {
  const [buildings, setBuildings] = useState<Building[]>([]); // Real Data
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(
    null,
  );
  const [ownershipHistory, setOwnershipHistory] = useState<BuildingOwnership[]>(
    [],
  ); // Real Data
  const [ownerOptions, setOwnerOptions] = useState<OwnerOption[]>([]); // For Dropdown

  const [activeTab, setActiveTab] = useState<"details" | "ownership" | "scans">(
    "details",
  );
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  // Form state for Add Building
  const [newBuilding, setNewBuilding] = useState({
    building_name: "",
    address_text: "",
    construction_year: new Date().getFullYear(),
    location_gps_lat: 0,
    location_gps_lng: 0,
  });

  // Form state for Transfer Ownership
  const [transfer, setTransfer] = useState({
    owner_id: "",
    start_date: "",
  });

  const buildingScans = selectedBuilding
    ? mockScans.filter((s) => s.building_id === selectedBuilding.building_id)
    : [];

  const fetchBuildings = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/buildings`, {
        headers: getHeaders(),
      });
      setBuildings(res.data);
    } catch (err) {
      console.error("Failed to fetch buildings", err);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  // 2. Fetch Details (Ownership) when building selected
  useEffect(() => {
    if (selectedBuilding && activeTab === "ownership") {
      const fetchOwnership = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/buildings/${selectedBuilding.building_id}/ownership`,
            { headers: getHeaders() },
          );
          setOwnershipHistory(res.data);

          // Also fetch owners list for the dropdown
          const ownersRes = await axios.get(
            `${API_BASE_URL}/api/buildings/owners`,
            { headers: getHeaders() },
          );
          setOwnerOptions(ownersRes.data);
        } catch (err) {
          console.error("Failed to fetch details", err);
        }
      };
      fetchOwnership();
    }
  }, [selectedBuilding, activeTab]);

  const handleAddBuilding = async () => {
    try {
      const payload = {
        building_name: newBuilding.building_name,
        address_text: newBuilding.address_text,
        construction_year: newBuilding.construction_year,
        location_gps: {
          lat: newBuilding.location_gps_lat,
          lng: newBuilding.location_gps_lng,
        },
      };

      await axios.post(`${API_BASE_URL}/api/buildings`, payload, {
        headers: getHeaders(),
      });

      setShowAddModal(false);
      fetchBuildings();

      setNewBuilding({
        building_name: "",
        address_text: "",
        construction_year: new Date().getFullYear(),
        location_gps_lat: 0,
        location_gps_lng: 0,
      });
    } catch (err) {
      console.error("Failed to create building", err);
    }
  };

  const handleTransferOwnership = async () => {
    try {
      const payload = {
        building_id: selectedBuilding?.building_id,
        owner_id: transfer.owner_id,
        start_date: transfer.start_date,
      };

      await axios.post(`${API_BASE_URL}/api/buildings/transfer`, payload, {
        headers: getHeaders(),
      });

      setShowTransferModal(false);
      setTransfer({ owner_id: "", start_date: "" });

      // Refresh ownership list
      if (selectedBuilding) {
        const res = await axios.get(
          `${API_BASE_URL}/api/buildings/${selectedBuilding.building_id}/ownership`,
          { headers: getHeaders() },
        );
        setOwnershipHistory(res.data);
      }
    } catch (err) {
      console.error("Transfer failed", err);
    }
  };

  const handleSelectBuilding = (building: Building) => {
    setSelectedBuilding(building);
    setActiveTab("details");
    setMobileView("detail");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Building2 className="text-primary h-6 w-6" />
          <span>Asset Manager</span>
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
            <SheetTitle className="hidden">Navigation</SheetTitle>
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8"
        >
          <div className="flex items-center gap-3">
            <Building2 className="h-7 w-7 md:h-8 md:w-8 text-primary" />
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                Building Asset Manager
              </h1>
              <p className="text-sm text-muted-foreground hidden sm:block">
                Manage buildings, ownership, and AI scan records
              </p>
            </div>
          </div>

          <GlowButton onClick={() => setShowAddModal(true)} size="sm">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add Building</span>
            <span className="sm:hidden">Add</span>
          </GlowButton>
        </motion.div>

        {/* Split View */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          {/* Building List (Left Column) */}
          {/* Logic: Hidden on mobile if viewing details. Always shown on desktop. */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`md:col-span-4 ${
              mobileView === "detail" ? "hidden md:block" : "block"
            }`}
          >
            <GlassCard
              className="h-auto md:h-[calc(100vh-180px)] overflow-hidden"
              hover={false}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Buildings</h3>
                <span className="text-xs text-muted-foreground">
                  {buildings.length} registered
                </span>
              </div>

              <div className="space-y-3 max-h-[60vh] md:max-h-[calc(100vh-280px)] overflow-y-auto pr-2">
                {buildings.map((building, index) => (
                  <motion.button
                    key={building.building_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectBuilding(building)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedBuilding?.building_id === building.building_id
                        ? "bg-primary/10 border-primary/50"
                        : "bg-muted/20 border-white/5 hover:border-white/10"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-foreground truncate">
                          {building.building_name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">
                            {building.address_text}
                          </span>
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Est. {building.construction_year}
                          </span>
                          <span
                            className={`text-xs font-medium ${getRiskColor(
                              building.risk_score,
                            )}`}
                          >
                            Risk: {building.risk_score}%
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </GlassCard>
          </motion.div>

          {/* Building Details (Right Column) */}
          {/* Logic: Hidden on mobile if viewing list. Always shown on desktop. */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`md:col-span-8 ${
              mobileView === "list" ? "hidden md:block" : "block"
            }`}
          >
            {selectedBuilding ? (
              <GlassCard
                className="h-auto md:h-[calc(100vh-180px)] overflow-hidden"
                hover={false}
              >
                {/* Mobile Back Button */}
                <button
                  onClick={() => setMobileView("list")}
                  className="md:hidden flex items-center gap-2 text-muted-foreground mb-4"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="text-sm">Back to list</span>
                </button>

                {/* Building Header */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4 mb-6 pb-4 border-b border-white/10">
                  <div>
                    <h2 className="text-xl md:text-2xl font-bold text-foreground">
                      {selectedBuilding.building_name}
                    </h2>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1 text-sm">
                      <MapPin className="h-4 w-4" />
                      {selectedBuilding.address_text}
                    </p>
                  </div>
                  {getRiskBadge(selectedBuilding.risk_score)}
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                  {[
                    { id: "details", label: "Details", icon: Building2 },
                    { id: "ownership", label: "Ownership", icon: User },
                    // { id: "scans", label: "Scan History", icon: ScanLine },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        activeTab === tab.id
                          ? "bg-primary/20 text-primary border border-primary/30"
                          : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                      }`}
                    >
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="max-h-[60vh] md:max-h-[calc(100vh-420px)] overflow-y-auto pr-2">
                  <AnimatePresence mode="wait">
                    {/* DETAILS TAB */}
                    {activeTab === "details" && (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                      >
                        <div className="p-4 bg-muted/20 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-1">
                            Building ID
                          </p>
                          <p className="font-mono text-sm text-foreground">
                            {selectedBuilding.building_id}
                          </p>
                        </div>
                        <div className="p-4 bg-muted/20 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-1">
                            Construction Year
                          </p>
                          <p className="font-medium text-foreground flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-primary" />
                            {selectedBuilding.construction_year}
                          </p>
                        </div>
                        <div className="p-4 bg-muted/20 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-1">
                            GPS Latitude
                          </p>
                          <p className="font-mono text-sm text-foreground">
                            {selectedBuilding.location_gps.lat}
                          </p>
                        </div>
                        <div className="p-4 bg-muted/20 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-1">
                            GPS Longitude
                          </p>
                          <p className="font-mono text-sm text-foreground">
                            {selectedBuilding.location_gps.lng}
                          </p>
                        </div>
                        <div className="sm:col-span-2 p-4 bg-muted/20 rounded-xl">
                          <p className="text-xs text-muted-foreground mb-1">
                            Risk Assessment
                          </p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-3 bg-muted/30 rounded-full overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{
                                  width: `${selectedBuilding.risk_score}%`,
                                }}
                                transition={{ duration: 0.8 }}
                                className={`h-full rounded-full ${
                                  selectedBuilding.risk_score < 30
                                    ? "bg-success"
                                    : selectedBuilding.risk_score < 60
                                    ? "bg-warning"
                                    : "bg-destructive"
                                }`}
                              />
                            </div>
                            <span
                              className={`font-bold ${getRiskColor(
                                selectedBuilding.risk_score,
                              )}`}
                            >
                              {selectedBuilding.risk_score}%
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* OWNERSHIP TAB */}
                    {activeTab === "ownership" && (
                      <motion.div
                        key="ownership"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                          <h4 className="font-medium text-foreground">
                            Current Owners
                          </h4>
                          <button
                            onClick={() => setShowTransferModal(true)}
                            className="flex items-center gap-2 px-3 py-1.5 bg-accent/10 text-accent text-sm font-medium rounded-lg hover:bg-accent/20 transition-colors"
                          >
                            <ArrowRightLeft className="h-4 w-4" />
                            Transfer Ownership
                          </button>
                        </div>
                        {/* Change buildingOwnerships.length to ownershipHistory.length */}
                        {ownershipHistory.length > 0 ? (
                          ownershipHistory.map((ownership) => (
                            <div
                              key={ownership.ownership_id}
                              className="p-4 bg-muted/20 rounded-xl border border-white/5"
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <p className="font-medium text-foreground flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" />
                                    {ownership.owner_name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Owner ID: {ownership.owner_id}
                                  </p>
                                </div>
                                {!ownership.end_date && (
                                  <StatusBadge status="safe">
                                    Active
                                  </StatusBadge>
                                )}
                              </div>
                              <div className="mt-3 pt-3 border-t border-white/5 flex flex-wrap gap-4 text-sm">
                                <span className="text-muted-foreground flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {/* Use new Date() to format the DB timestamp */}
                                  Start:{" "}
                                  {new Date(
                                    ownership.start_date,
                                  ).toLocaleDateString()}
                                </span>
                                {ownership.end_date && (
                                  <span className="text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    End:{" "}
                                    {new Date(
                                      ownership.end_date,
                                    ).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No ownership records found</p>
                          </div>
                        )}
                      </motion.div>
                    )}

                    {/* SCANS TAB */}
                    {activeTab === "scans" && (
                      <motion.div
                        key="scans"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <h4 className="font-medium text-foreground mb-4">
                          AI Scan History
                        </h4>

                        {buildingScans.length > 0 ? (
                          buildingScans.map((scan, index) => (
                            <motion.div
                              key={scan.scan_id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-4 bg-muted/20 rounded-xl border border-white/5"
                            >
                              <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                                <div>
                                  <p className="font-mono text-sm text-foreground">
                                    {scan.scan_id}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {new Date(
                                      scan.scan_timestamp,
                                    ).toLocaleString()}
                                  </p>
                                </div>
                                {scan.verified_status ? (
                                  <StatusBadge status="safe">
                                    <Check className="h-3 w-3" />
                                    Verified
                                  </StatusBadge>
                                ) : (
                                  <StatusBadge status="warning">
                                    Pending
                                  </StatusBadge>
                                )}
                              </div>

                              <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-3">
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    AI Confidence
                                  </p>
                                  <p
                                    className={`font-bold ${
                                      scan.ai_confidence_score >= 0.8
                                        ? "text-success"
                                        : scan.ai_confidence_score >= 0.6
                                        ? "text-warning"
                                        : "text-destructive"
                                    }`}
                                  >
                                    {(scan.ai_confidence_score * 100).toFixed(
                                      0,
                                    )}
                                    %
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Dimensions
                                  </p>
                                  <p className="text-sm text-foreground">
                                    {scan.original_width}×{scan.original_height}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">
                                    Specialist
                                  </p>
                                  <p className="text-sm text-foreground font-mono">
                                    {scan.specialist_id}
                                  </p>
                                </div>
                              </div>
                            </motion.div>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <ScanLine className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No scans recorded for this building</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </GlassCard>
            ) : (
              <GlassCard
                className="h-64 md:h-[calc(100vh-180px)] flex items-center justify-center"
                hover={false}
              >
                <div className="text-center text-muted-foreground">
                  <Building2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Select a building to view details</p>
                  <p className="text-sm mt-1">
                    Or click "Add Building" to register a new asset
                  </p>
                </div>
              </GlassCard>
            )}
          </motion.div>
        </div>
      </main>

      {/* Add Building Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-md mx-4 overflow-y-auto max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Plus className="h-5 w-5 text-primary" />
              Add New Building
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="building_name" className="text-foreground">
                Building Name
              </Label>
              <Input
                id="building_name"
                value={newBuilding.building_name}
                onChange={(e) =>
                  setNewBuilding({
                    ...newBuilding,
                    building_name: e.target.value,
                  })
                }
                placeholder="Enter building name"
                className="mt-1.5 bg-muted/30 border-white/10"
              />
            </div>

            <div>
              <Label htmlFor="address_text" className="text-foreground">
                Address
              </Label>
              <Input
                id="address_text"
                value={newBuilding.address_text}
                onChange={(e) =>
                  setNewBuilding({
                    ...newBuilding,
                    address_text: e.target.value,
                  })
                }
                placeholder="Full street address"
                className="mt-1.5 bg-muted/30 border-white/10"
              />
            </div>

            <div>
              <Label htmlFor="construction_year" className="text-foreground">
                Construction Year
              </Label>
              <Input
                id="construction_year"
                type="number"
                value={newBuilding.construction_year}
                onChange={(e) =>
                  setNewBuilding({
                    ...newBuilding,
                    construction_year: parseInt(e.target.value),
                  })
                }
                min={1900}
                max={new Date().getFullYear()}
                className="mt-1.5 bg-muted/30 border-white/10"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="location_gps_lat" className="text-foreground">
                  Latitude
                </Label>
                <Input
                  id="location_gps_lat"
                  type="number"
                  step="0.000001"
                  value={newBuilding.location_gps_lat}
                  onChange={(e) =>
                    setNewBuilding({
                      ...newBuilding,
                      location_gps_lat: parseFloat(e.target.value),
                    })
                  }
                  placeholder="23.8103"
                  className="mt-1.5 bg-muted/30 border-white/10"
                />
              </div>
              <div>
                <Label htmlFor="location_gps_lng" className="text-foreground">
                  Longitude
                </Label>
                <Input
                  id="location_gps_lng"
                  type="number"
                  step="0.000001"
                  value={newBuilding.location_gps_lng}
                  onChange={(e) =>
                    setNewBuilding({
                      ...newBuilding,
                      location_gps_lng: parseFloat(e.target.value),
                    })
                  }
                  placeholder="90.4125"
                  className="mt-1.5 bg-muted/30 border-white/10"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 bg-muted/30 text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <GlowButton onClick={handleAddBuilding} className="flex-1">
                <Shield className="h-4 w-4" />
                Save Building
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Modal */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ArrowRightLeft className="h-5 w-5 text-accent" />
              Transfer Ownership
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="owner_id" className="text-foreground">
                New Owner
              </Label>
              <Select
                value={transfer.owner_id}
                onValueChange={(value) =>
                  setTransfer({ ...transfer, owner_id: value })
                }
              >
                <SelectTrigger className="mt-1.5 bg-muted/30 border-white/10">
                  <SelectValue placeholder="Select owner" />
                </SelectTrigger>
                <SelectContent className="bg-card border-white/10">
                  {/* FIX: Use 'ownerOptions' instead of 'ownershipHistory' */}
                  {ownerOptions.map((owner) => (
                    <SelectItem key={owner.user_id} value={owner.user_id}>
                      {/* FIX: Use 'legal_name' to match the OwnerOption interface */}
                      {owner.legal_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="start_date" className="text-foreground">
                Transfer Date
              </Label>
              <Input
                id="start_date"
                type="date"
                value={transfer.start_date}
                onChange={(e) =>
                  setTransfer({ ...transfer, start_date: e.target.value })
                }
                className="mt-1.5 bg-muted/30 border-white/10"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowTransferModal(false)}
                className="flex-1 px-4 py-2.5 bg-muted/30 text-foreground rounded-lg hover:bg-muted/50 transition-colors"
              >
                Cancel
              </button>
              <GlowButton
                variant="accent"
                onClick={handleTransferOwnership}
                className="flex-1"
              >
                <Check className="h-4 w-4" />
                Confirm Transfer
              </GlowButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuildingManager;
