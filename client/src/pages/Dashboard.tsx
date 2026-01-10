import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { InteractiveMap } from "@/components/dashboard/InteractiveMap";
import { SeismicChart } from "@/components/dashboard/SeismicChart";
import { RiskDistributionChart } from "@/components/dashboard/RiskDistributionChart";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { seismicLogs } from "@/data/mockData";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Radio, Building2, AlertTriangle, Activity } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";


const Dashboard = () => {
  const stats = [
    { icon: Radio, label: "Active Sensors", value: "2,456", change: "+12" },
    { icon: Building2, label: "Buildings Monitored", value: "15,234", change: "+89" },
    { icon: AlertTriangle, label: "Active Alerts", value: "3", change: "-2" },
    { icon: Activity, label: "Network Health", value: "99.8%", change: "+0.1%" },
  ];

  const navigate = useNavigate();
  const [user, setUser] = useState<{ full_name: string; role_type: string } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {/* Command Center */}
            Welcome,
          </h1>
          <p className="text-muted-foreground">
            {/* Real-time seismic monitoring and risk assessment for Dhaka Metropolitan */}
            <span className="font-semibold text-primary">{user?.full_name || "User"}</span> ({user?.role_type})
          </p>
        </motion.div>

        {/* Stats Row */}
        {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-card rounded-xl p-4 hover:border-primary/30 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </span>
                    <span className="text-xs text-success">{stat.change}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div> */}

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Map - Large */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="col-span-12 lg:col-span-8 h-[400px]"
          >
            {/* <InteractiveMap /> */}
          </motion.div>

          {/* Alert Feed */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="col-span-12 lg:col-span-4"
          >
            {/* <AlertFeed /> */}
          </motion.div>

          {/* Seismic Chart */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="col-span-12 lg:col-span-8"
          >
            <SeismicChart />
          </motion.div> */}

          {/* Risk Distribution */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="col-span-12 lg:col-span-4"
          >
            <RiskDistributionChart />
          </motion.div> */}

          {/* Sensor Log Table */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="col-span-12"
          >
            <div className="glass-card rounded-xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Recent Sensor Logs
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Sensor ID
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Location
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Magnitude
                      </th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Timestamp
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {seismicLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-white/5 hover:bg-muted/20 transition-colors"
                      >
                        <td className="py-3 px-4 text-sm font-medium text-foreground">
                          {log.sensor}
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {log.location}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge status={log.status as any} size="sm" />
                        </td>
                        <td className="py-3 px-4 text-sm text-foreground">
                          {log.magnitude}g
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div> */}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
