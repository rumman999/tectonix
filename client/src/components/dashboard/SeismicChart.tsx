import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, ReferenceLine } from "recharts";
import { seismicChartData } from "@/data/mockData";
import { GlassCard } from "@/components/ui/GlassCard";
import { Activity } from "lucide-react";

export const SeismicChart = () => {
  return (
    <GlassCard className="h-full" hover={false}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Recent Seismic Activity
          </h3>
          <p className="text-sm text-muted-foreground">
            24-hour magnitude readings
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
          <LineChart data={seismicChartData}>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
              domain={[0, 0.6]}
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
            />
            <Line
              type="monotone"
              dataKey="magnitude"
              stroke="hsl(187, 92%, 50%)"
              strokeWidth={2}
              dot={{ fill: "hsl(187, 92%, 50%)", strokeWidth: 0, r: 4 }}
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
