import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface StatusBadgeProps {
  status: "safe" | "warning" | "danger" | "moderate" | "high" | "stable" | "alert";
  size?: "sm" | "md";
  pulse?: boolean;
  children?: ReactNode;
}

export const StatusBadge = ({ status, size = "md", pulse = true, children }: StatusBadgeProps) => {
  const statusConfig = {
    safe: { bg: "bg-success/20", text: "text-success", dot: "bg-success" },
    stable: { bg: "bg-success/20", text: "text-success", dot: "bg-success" },
    warning: { bg: "bg-warning/20", text: "text-warning", dot: "bg-warning" },
    moderate: { bg: "bg-warning/20", text: "text-warning", dot: "bg-warning" },
    danger: { bg: "bg-destructive/20", text: "text-destructive", dot: "bg-destructive" },
    high: { bg: "bg-destructive/20", text: "text-destructive", dot: "bg-destructive" },
    alert: { bg: "bg-accent/20", text: "text-accent", dot: "bg-accent" },
  };

  const config = statusConfig[status];
  const sizeStyles = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        config.bg,
        config.text,
        sizeStyles
      )}
    >
      <span className="relative flex h-2 w-2">
        {pulse && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              config.dot
            )}
          />
        )}
        <span className={cn("relative inline-flex h-2 w-2 rounded-full", config.dot)} />
      </span>
      {children || (status.charAt(0).toUpperCase() + status.slice(1))}
    </span>
  );
};
