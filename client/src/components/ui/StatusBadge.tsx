import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  // Normalize status to lowercase to ensure matching works (e.g., "Active" -> "active")
  const normalizedStatus = status?.toLowerCase() || "unknown";

  // Configuration for all possible statuses in your app
  const config: Record<string, { style: string; label: string }> = {
    // Beacon Statuses
    active: { 
      style: "bg-red-500/15 text-red-600 border-red-500/30 hover:bg-red-500/25", 
      label: "Active" 
    },
    resolved: { 
      style: "bg-green-500/15 text-green-600 border-green-500/30 hover:bg-green-500/25", 
      label: "Resolved" 
    },
    false_alarm: { 
      style: "bg-gray-500/15 text-gray-600 border-gray-500/30 hover:bg-gray-500/25", 
      label: "False Alarm" 
    },
    
    // Seismic/Dashboard Statuses
    stable: { 
      style: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25", 
      label: "Stable" 
    },
    warning: { 
      style: "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25", 
      label: "Warning" 
    },
    alert: { 
      style: "bg-orange-500/15 text-orange-600 border-orange-500/30 hover:bg-orange-500/25", 
      label: "Alert" 
    },
    critical: { 
      style: "bg-red-600/15 text-red-700 border-red-600/30 hover:bg-red-600/25", 
      label: "Critical" 
    },
    
    // Fallback
    unknown: { 
      style: "bg-slate-500/15 text-slate-600 border-slate-500/30", 
      label: status || "Unknown" 
    },
  };

  // Safely select the style, falling back to 'unknown' if the status key is missing
  const selection = config[normalizedStatus] || config.unknown;

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "font-medium border px-2.5 py-0.5 transition-colors", 
        selection.style,
        size === "sm" && "text-xs px-2 py-0",
        size === "lg" && "text-sm px-3 py-1"
      )}
    >
      {selection.label}
    </Badge>
  );
}