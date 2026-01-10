import { tickerUpdates } from "@/data/mockData";
import { Activity, AlertTriangle, Info, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export const LiveTicker = () => {
  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-3 w-3 text-warning" />;
      case "alert":
        return <Zap className="h-3 w-3 text-accent" />;
      case "info":
        return <Info className="h-3 w-3 text-primary" />;
      default:
        return <Activity className="h-3 w-3 text-success" />;
    }
  };

  const getTextColor = (type: string) => {
    switch (type) {
      case "warning":
        return "text-warning";
      case "alert":
        return "text-accent";
      case "info":
        return "text-primary";
      default:
        return "text-muted-foreground";
    }
  };

  const items = [...tickerUpdates, ...tickerUpdates];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-background/80 backdrop-blur-lg">
      <div className="relative overflow-hidden py-3">
        <div className="flex ticker-scroll whitespace-nowrap">
          {items.map((update, index) => (
            <div
              key={`${update.id}-${index}`}
              className="mx-8 inline-flex items-center gap-2"
            >
              {getIcon(update.type)}
              <span className="text-sm font-medium text-foreground">
                {update.sensor}:
              </span>
              <span className={cn("text-sm", getTextColor(update.type))}>
                {update.status}
              </span>
              <span className="mx-4 h-1 w-1 rounded-full bg-muted-foreground/50" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
