import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/config";
import { alertFeed } from "@/data/mockData";
import { GlassCard } from "@/components/ui/GlassCard";
import { AlertTriangle, Bell, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";


interface Alert {
  id: string;
  type: "critical" | "alert" | "warning" | "info";
  title: string;
  time: string;
  location: string;
}

export const AlertFeed = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/alerts`);
        const data = await res.json();
        if (res.ok) setAlerts(data);
      } catch (err) {
        console.error("Alerts fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <Zap className="h-4 w-4 text-destructive" />;
      case "alert":
        return <AlertTriangle className="h-4 w-4 text-accent" />;
      case "warning":
        return <Bell className="h-4 w-4 text-warning" />;
      default:
        return <Info className="h-4 w-4 text-primary" />;
    }
  };

  const getBorderColor = (type: string) => {
    switch (type) {
      case "critical":
        return "border-l-destructive";
      case "alert":
        return "border-l-accent";
      case "warning":
        return "border-l-warning";
      default:
        return "border-l-primary";
    }
  };

  return (
    <GlassCard className="h-full" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          Alert Feed
        </h3>
        <span className="text-xs text-muted-foreground px-2 py-1 bg-muted rounded-full">
          {alerts.length} alerts
        </span>
      </div>

      <div className="space-y-3 max-h-[280px] overflow-y-auto pr-2">
        {alerts.map((alert, index) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={cn(
              "p-3 rounded-lg bg-muted/30 border-l-2 hover:bg-muted/50 transition-colors cursor-pointer",
              getBorderColor(alert.type)
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {alert.title}
                  </h4>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {alert.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {alert.location}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </GlassCard>
  );
};
