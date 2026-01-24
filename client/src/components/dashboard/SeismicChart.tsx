import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Activity } from "lucide-react";
import { API_BASE_URL } from "@/config";

// Interface for our data
interface ChartDataPoint {
  time: string;
  magnitude: number;
}

export const SeismicChart = () => {
  const [data, setData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    const fetchChartData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/chart`);
        const jsonData = await res.json();
        if (res.ok) setData(jsonData);
      } catch (err) {
        console.error("Failed to load chart data", err);
      }
    };

    fetchChartData();
  }, []);

  return (
    <GlassCard className="h-full" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Seismic Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            24-hour magnitude readings (Live)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-primary" />
          <span className="text-xs text-muted-foreground">Magnitude</span>
          <div className="w-3 h-0.5 bg-destructive ml-2" />
          <span className="text-xs text-muted-foreground">Threshold</span>
        </div>
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }}
              interval={4} // Show fewer labels to avoid crowding
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              domain={[0, 0.6]} // Fixed scale for better visibility
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(222, 47%, 8%)",
                border: "1px solid hsl(222, 30%, 18%)",
                borderRadius: "8px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
              }}
              labelStyle={{ color: "hsl(210, 40%, 98%)" }}
            />
            <ReferenceLine
              y={0.3}
              stroke="hsl(0, 84%, 60%)"
              strokeDasharray="5 5"
              strokeOpacity={0.5}
              label={{ position: 'right', value: 'Danger', fill: 'hsl(0, 84%, 60%)', fontSize: 10 }}
            />
            <Line
              type="monotone"
              dataKey="magnitude"
              stroke="hsl(187, 92%, 50%)"
              strokeWidth={2}
              dot={false} // Remove dots for cleaner look on many points
              activeDot={{
                fill: "hsl(187, 92%, 50%)",
                strokeWidth: 0,
                r: 6,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </GlassCard>
  );
};