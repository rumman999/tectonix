import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  // Normalize status to lowercase to ensure matching works
  const normalizedStatus = status?.toLowerCase() || "unknown";

  // Configuration for all possible statuses
  const config: Record<string, { style: string; label: string }> = {
    // --- NEW: Matches your Backend logic (safe/warning/danger) ---
    safe: { 
      style: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25", 
      label: "Safe" 
    },
    danger: { 
      style: "bg-red-600/15 text-red-600 border-red-600/30 hover:bg-red-600/25 animate-pulse", 
      label: "Danger" 
    },

    // --- Existing Mappings ---
    warning: { 
      style: "bg-amber-500/15 text-amber-600 border-amber-500/30 hover:bg-amber-500/25", 
      label: "Warning" 
    },
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
    stable: { 
      style: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/25", 
      label: "Stable" 
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
        "font-bold border px-2.5 py-0.5 transition-all duration-300", 
        selection.style,
        size === "sm" && "text-[10px] px-2 py-0 uppercase tracking-wider",
        size === "lg" && "text-sm px-3 py-1"
      )}
    >
      {selection.label}
    </Badge>
  );
}