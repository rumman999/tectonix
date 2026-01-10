import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { mapPins } from "@/data/mockData";
import { cn } from "@/lib/utils";
import cityMap from "@/assets/city-map-3d.jpg";

export const InteractiveMap = () => {
  const [hoveredPin, setHoveredPin] = useState<number | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "safe":
        return "bg-success";
      case "warning":
        return "bg-warning";
      case "danger":
        return "bg-destructive";
      default:
        return "bg-muted";
    }
  };

  const getStatusGlow = (status: string) => {
    switch (status) {
      case "safe":
        return "shadow-[0_0_20px_rgba(34,197,94,0.5)]";
      case "warning":
        return "shadow-[0_0_20px_rgba(234,179,8,0.5)]";
      case "danger":
        return "shadow-[0_0_20px_rgba(239,68,68,0.5)]";
      default:
        return "";
    }
  };

  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden glass-card">
      {/* Map Image */}
      <img
        src={cityMap}
        alt="3D Subsurface Map of Dhaka"
        className="w-full h-full object-cover"
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />

      {/* Status Pins */}
      {mapPins.map((pin) => (
        <motion.div
          key={pin.id}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: pin.id * 0.1, type: "spring", stiffness: 300 }}
          className="absolute"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          onMouseEnter={() => setHoveredPin(pin.id)}
          onMouseLeave={() => setHoveredPin(null)}
        >
          {/* Pin */}
          <div className="relative cursor-pointer">
            <div
              className={cn(
                "w-4 h-4 rounded-full transition-all duration-300",
                getStatusColor(pin.status),
                getStatusGlow(pin.status),
                hoveredPin === pin.id && "scale-150"
              )}
            />
            {/* Pulse Ring */}
            <div
              className={cn(
                "absolute inset-0 w-4 h-4 rounded-full animate-ping opacity-50",
                getStatusColor(pin.status)
              )}
            />
          </div>

          {/* Tooltip */}
          <AnimatePresence>
            {hoveredPin === pin.id && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                className="absolute left-1/2 -translate-x-1/2 -top-16 z-10"
              >
                <div className="glass-card px-3 py-2 rounded-lg whitespace-nowrap">
                  <div className="text-sm font-semibold text-foreground">
                    {pin.label}
                  </div>
                  <div className="text-xs text-muted-foreground capitalize">
                    Status: {pin.status}
                  </div>
                </div>
                <div className="w-2 h-2 bg-card rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 glass-card px-4 py-3 rounded-lg">
        <div className="text-xs font-medium text-muted-foreground mb-2">
          Sensor Status
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-foreground">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-xs text-foreground">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-foreground">Danger</span>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="absolute top-4 left-4">
        <h3 className="text-lg font-semibold text-foreground">
          3D Subsurface Map
        </h3>
        <p className="text-sm text-muted-foreground">
          Real-time sensor network visualization
        </p>
      </div>
    </div>
  );
};
