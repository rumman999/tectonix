import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { riskDistribution } from "@/data/mockData";
import { GlassCard } from "@/components/ui/GlassCard";
import { Building2 } from "lucide-react";

export const RiskDistributionChart = () => {
  const total = riskDistribution.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <GlassCard className="h-full" hover={false}>
      <div className="flex items-center gap-2 mb-4">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">
          Risk Distribution
        </h3>
      </div>

      <div className="flex items-center gap-4">
        <div className="w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={riskDistribution}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={4}
                dataKey="value"
              >
                {riskDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(222, 47%, 8%)",
                  border: "1px solid hsl(222, 30%, 18%)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(210, 40%, 98%)" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-3">
          {riskDistribution.map((item) => (
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
                  ({((item.value / total) * 100).toFixed(0)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Assessed</span>
          <span className="font-semibold text-foreground">{total} Buildings</span>
        </div>
      </div>
    </GlassCard>
  );
};
