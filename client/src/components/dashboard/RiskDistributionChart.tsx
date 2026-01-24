import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { GlassCard } from "@/components/ui/GlassCard";
import { Building2 } from "lucide-react";
import { API_BASE_URL } from "@/config";

// 1. Define Colors for Building Risks
const COLORS: Record<string, string> = {
  "Safe": "#10b981",          // Emerald (Green)
  "Moderate Risk": "#f59e0b", // Amber (Orange/Yellow)
  "High Risk": "#ef4444",     // Red
};

interface RiskData {
  name: string;
  value: number;
  color: string;
}

export const RiskDistributionChart = () => {
  const [data, setData] = useState<RiskData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 2. Fetch from the NEW endpoint
        const res = await fetch(`${API_BASE_URL}/api/dashboard/building-risk`);
        const json = await res.json();
        
        if (res.ok) {
          // Map response to colors
          const formattedData = json.map((item: any) => ({
            name: item.name,
            value: item.value,
            color: COLORS[item.name] || "#94a3b8" // Default slate if mismatch
          }));

          // Sort order: Safe -> Moderate -> High
          const order = ["Safe", "Moderate Risk", "High Risk"];
          formattedData.sort((a: RiskData, b: RiskData) => order.indexOf(a.name) - order.indexOf(b.name));

          setData(formattedData);
        }
      } catch (err) {
        console.error("Failed to fetch building risks", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <GlassCard className="h-full" hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Risk Distribution
        </h3>
      </div>

      {loading ? (
         <div className="h-32 flex items-center justify-center text-muted-foreground text-sm">
           Scanning Building Data...
         </div>
      ) : (
        <div className="flex items-center gap-4">
          {/* Pie Chart Section */}
          <div className="w-32 h-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={55}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(222, 47%, 8%)",
                    border: "1px solid hsl(222, 30%, 18%)",
                    borderRadius: "8px",
                  }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "hsl(210, 40%, 98%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend / List Section */}
          <div className="flex-1 space-y-3">
            {data.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-foreground">{item.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-foreground">
                    {item.value}
                  </span>
                  <span className="text-xs text-muted-foreground ml-1">
                    ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                  </span>
                </div>
              </div>
            ))}
            
            {data.length === 0 && (
               <div className="text-xs text-muted-foreground text-center">No building assessments found.</div>
            )}
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Assessed</span>
          <span className="font-semibold text-foreground">{total} Buildings</span>
        </div>
      </div>
    </GlassCard>
  );
};