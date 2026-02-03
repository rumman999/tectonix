import { motion } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  Image as ImageIcon,
  Menu,
  Loader2,
  Building2,
  Check,
  ChevronsUpDown,
  Search
} from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { API_BASE_URL, getHeaders } from "@/config";
import { useToast } from "@/hooks/use-toast";

// --- NEW IMPORTS FOR SEARCHABLE DROPDOWN ---
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils"; 

interface Building {
  building_id: number;
  building_name: string;
}

export const DamageReport = () => {
  const { toast } = useToast();
  
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [severity, setSeverity] = useState(50);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  
  // Building Data State
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [isBuildingOpen, setIsBuildingOpen] = useState(false); 

  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/buildings/reportable`, { headers: getHeaders() });
        setBuildings(res.data);
      } catch (err) {
        console.error("Failed to load buildings");
      }
    };
    fetchBuildings();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(droppedFile);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation not supported", variant: "destructive" });
      return;
    }
    toast({ title: "Locating...", description: "Fetching GPS coordinates." });
    
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        toast({ title: "Location Found", description: "Coordinates updated.", className: "bg-green-600 text-white" });
      },
      (err) => {
        console.error(err);
        toast({ title: "Location Error", description: "Could not fetch GPS.", variant: "destructive" });
      }
    );
  };

  const submitReport = async () => {
    // --- UPDATED VALIDATION LOGIC ---
    
    // 1. Description is required
    if (!description) {
        toast({ title: "Missing Description", description: "Please describe the damage.", variant: "destructive" });
        setHoldProgress(0);
        return;
    }

    // 2. Building selection is required IF the user has buildings available to select (Owner/Specialist)
    if (buildings.length > 0 && !selectedBuildingId) {
        toast({ title: "Building Required", description: "Please select the affected building from the list.", variant: "destructive" });
        setHoldProgress(0);
        return;
    }

    setIsSubmitting(true);

    try {
        const formData = new FormData();
        formData.append("description", description);
        formData.append("location", location); 
        formData.append("severity", severity.toString());
        
        if (selectedBuildingId) {
            formData.append("building_id", selectedBuildingId);
        }

        if (file) {
            formData.append("image", file);
        }

        const headers = getHeaders();
        // @ts-ignore
        delete headers["Content-Type"]; 

        await axios.post(`${API_BASE_URL}/api/reports`, formData, { headers });

        setIsSubmitted(true);
        toast({ title: "Success", description: "Report submitted successfully.", className: "bg-green-600 text-white" });

    } catch (err) {
        console.error(err);
        toast({ title: "Error", description: "Failed to submit report.", variant: "destructive" });
        setHoldProgress(0);
    } finally {
        setIsSubmitting(false);
    }
  };

  const startHold = () => {
    if (isSubmitting) return;
    setIsHolding(true);
    setHoldProgress(0);

    progressRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressRef.current!);
          submitReport(); 
          return 100;
        }
        return prev + 4; 
      });
    }, 30);
  };

  const endHold = () => {
    setIsHolding(false);
    if (progressRef.current) {
      clearInterval(progressRef.current);
    }
    if (holdProgress < 100) {
      setHoldProgress(0);
    }
  };

  const getSeverityColor = () => {
    if (severity < 33) return "from-success to-emerald-400";
    if (severity < 66) return "from-warning to-amber-400";
    return "from-destructive to-red-400";
  };

  const getSeverityLabel = () => {
    if (severity < 33) return "Low";
    if (severity < 66) return "Moderate";
    return "Critical";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <Activity className="text-primary h-6 w-6" />
            <span>Report Damage</span>
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

      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        
        {isSubmitted ? (
          <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center max-w-md"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-24 h-24 mx-auto mb-6 rounded-full bg-success/20 flex items-center justify-center"
              >
                <CheckCircle className="h-12 w-12 text-success" />
              </motion.div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Report Submitted!
              </h1>
              <p className="text-muted-foreground mb-8">
                Your damage report has been received. Emergency teams will be
                notified shortly.
              </p>
              <div className="flex gap-4 justify-center">
                 <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-xl font-medium hover:bg-muted/80"
                 >
                    Dashboard
                 </Link>
                 <button
                    onClick={() => {
                        setIsSubmitted(false);
                        setFile(null);
                        setPreview(null);
                        setDescription("");
                        setLocation("");
                        setSelectedBuildingId("");
                        setSeverity(50);
                        setHoldProgress(0);
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium"
                 >
                    New Report
                 </button>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="max-w-lg mx-auto space-y-6">
            
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Report Damage
              </h1>
              <p className="text-muted-foreground">
                Help emergency teams by reporting structural damage in your area.
              </p>
            </motion.div>

            {/* Upload Zone */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10">
                  <img src={preview} alt="Preview" className="w-full h-64 object-cover" />
                  <button
                    onClick={() => { setFile(null); setPreview(null); }}
                    className="absolute top-3 right-3 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <motion.div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="relative border-2 border-dashed border-white/20 rounded-2xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group"
                >
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-primary/10 to-transparent" />
                  <div className="relative">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <ImageIcon className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <p className="text-foreground font-medium mb-1">Tap to upload photo</p>
                    <p className="text-sm text-muted-foreground">or drag and drop an image here</p>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Building Searchable Dropdown (Only visible if buildings exist) */}
            {buildings.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                <label className="block text-sm font-medium text-foreground mb-2">Affected Building <span className="text-destructive">*</span></label>
                <Popover open={isBuildingOpen} onOpenChange={setIsBuildingOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isBuildingOpen}
                      className="w-full justify-between bg-muted/20 border-white/10 h-12 text-foreground font-normal hover:bg-muted/30 hover:text-foreground"
                    >
                      {selectedBuildingId
                        ? buildings.find((b) => String(b.building_id) === selectedBuildingId)?.building_name
                        : "Select or search building..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-slate-900 border-white/10 text-white">
                    <Command className="bg-transparent">
                      <div className="flex items-center border-b border-white/10 px-3" cmdk-input-wrapper="">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <CommandInput 
                            placeholder="Search buildings..." 
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        />
                      </div>
                      <CommandList>
                        <CommandEmpty>No building found.</CommandEmpty>
                        <CommandGroup>
                          {buildings.map((building) => (
                            <CommandItem
                              key={building.building_id}
                              value={building.building_name} // Search by name
                              onSelect={() => {
                                setSelectedBuildingId(String(building.building_id));
                                setIsBuildingOpen(false);
                              }}
                              className="aria-selected:bg-primary/20 aria-selected:text-white"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedBuildingId === String(building.building_id) ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {building.building_name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </motion.div>
            )}

            {/* Location */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <label className="block text-sm font-medium text-foreground mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter address or use GPS"
                  className="w-full bg-muted/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button 
                    onClick={handleGetLocation}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors"
                >
                  Use GPS
                </button>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
              <label className="block text-sm font-medium text-foreground mb-2">Description <span className="text-destructive">*</span></label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the damage you're reporting..."
                rows={3}
                className="w-full bg-muted/20 border border-white/10 rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </motion.div>

            {/* Severity */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-foreground">Severity Level <span className="text-destructive">*</span></label>
                <span className={`text-sm font-bold bg-gradient-to-r ${getSeverityColor()} bg-clip-text text-transparent`}>
                  {getSeverityLabel()}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={severity}
                onChange={(e) => setSeverity(Number(e.target.value))}
                className="w-full h-4 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, hsl(var(--success)) 0%, hsl(var(--warning)) 50%, hsl(var(--destructive)) 100%)`,
                }}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="pt-4">
              <motion.button
                disabled={isSubmitting}
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                className={`relative w-full py-5 rounded-2xl font-bold text-white overflow-hidden shadow-lg select-none ${isSubmitting ? 'cursor-not-allowed opacity-80' : ''}`}
                style={{
                  background: isHolding
                    ? `linear-gradient(to right, hsl(var(--destructive)), hsl(var(--warning)))`
                    : `linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))`,
                }}
              >
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  style={{
                    width: `${holdProgress}%`,
                    transition: isHolding ? "none" : "width 0.3s ease-out",
                  }}
                />
                <span className="relative flex items-center justify-center gap-2">
                  {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <AlertTriangle className="h-5 w-5" />}
                  {isSubmitting ? "Uploading..." : isHolding ? `Hold to Submit (${Math.round(holdProgress)}%)` : "Press & Hold to Submit"}
                </span>
              </motion.button>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Hold the button for 1.5 seconds to prevent accidental submissions
              </p>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
};

export default DamageReport;