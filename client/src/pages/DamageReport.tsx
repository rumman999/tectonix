import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  Upload,
  Camera,
  MapPin,
  AlertTriangle,
  CheckCircle,
  X,
  Image as ImageIcon,
  Menu, // Added Menu icon
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

// FIX: Imports for Mobile Menu
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export const DamageReport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [severity, setSeverity] = useState(50);
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(droppedFile);
    }
  };

  const startHold = () => {
    setIsHolding(true);
    setHoldProgress(0);

    progressRef.current = setInterval(() => {
      setHoldProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressRef.current!);
          setIsSubmitted(true);
          return 100;
        }
        return prev + 2;
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
      
      {/* --- MOBILE HEADER --- */}
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

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
         <DashboardSidebar />
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        
        {/* Render Success View OR Form View */}
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
                        setSeverity(50);
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
            
            {/* Header Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Report Damage
              </h1>
              <p className="text-muted-foreground">
                Help emergency teams by reporting structural damage in your area.
              </p>
            </motion.div>

            {/* Upload Zone */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {preview ? (
                <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/10">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-64 object-cover"
                  />
                  <button
                    onClick={() => {
                      setFile(null);
                      setPreview(null);
                    }}
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
                    <p className="text-foreground font-medium mb-1">
                      Tap to upload photo
                    </p>
                    <p className="text-sm text-muted-foreground">
                      or drag and drop an image here
                    </p>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-3 mt-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/30 text-foreground font-medium hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-5 w-5" />
                  Gallery
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-muted/30 text-foreground font-medium hover:bg-muted/50 transition-colors">
                  <Camera className="h-5 w-5" />
                  Camera
                </button>
              </div>
            </motion.div>

            {/* Location */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">
                Location
              </label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Enter address or use GPS"
                  className="w-full bg-muted/20 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-xs px-3 py-1.5 bg-primary/20 text-primary rounded-lg hover:bg-primary/30 transition-colors">
                  Use GPS
                </button>
              </div>
            </motion.div>

            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the damage you're reporting..."
                rows={3}
                className="w-full bg-muted/20 border border-white/10 rounded-xl px-4 py-3.5 text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              />
            </motion.div>

            {/* Severity Slider */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="flex justify-between items-center mb-3">
                <label className="text-sm font-medium text-foreground">
                  Severity Level
                </label>
                <span
                  className={`text-sm font-bold bg-gradient-to-r ${getSeverityColor()} bg-clip-text text-transparent`}
                >
                  {getSeverityLabel()}
                </span>
              </div>

              <div className="relative">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={severity}
                  onChange={(e) => setSeverity(Number(e.target.value))}
                  className="w-full h-4 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, 
                      hsl(var(--success)) 0%, 
                      hsl(var(--warning)) 50%, 
                      hsl(var(--destructive)) 100%)`,
                  }}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Critical</span>
                </div>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="pt-4"
            >
              <motion.button
                onMouseDown={startHold}
                onMouseUp={endHold}
                onMouseLeave={endHold}
                onTouchStart={startHold}
                onTouchEnd={endHold}
                className="relative w-full py-5 rounded-2xl font-bold text-white overflow-hidden shadow-lg select-none"
                style={{
                  background: isHolding
                    ? `linear-gradient(to right, hsl(var(--destructive)), hsl(var(--warning)))`
                    : `linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))`,
                }}
              >
                {/* Progress Overlay */}
                <motion.div
                  className="absolute inset-0 bg-white/30"
                  style={{
                    width: `${holdProgress}%`,
                    transition: isHolding ? "none" : "width 0.3s ease-out",
                  }}
                />

                <span className="relative flex items-center justify-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {isHolding ? `Hold to Submit (${Math.round(holdProgress)}%)` : "Press & Hold to Submit"}
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