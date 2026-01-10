import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { Activity, AlertTriangle, Gauge, Radio, Waves } from "lucide-react";
import { cn } from "@/lib/utils";

const SeismicMode = () => {
  const [pgaValue, setPgaValue] = useState(0.12);
  const [isElevated, setIsElevated] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);

  // Simulate PGA value changes
  useEffect(() => {
    const interval = setInterval(() => {
      const newValue = 0.1 + Math.random() * 0.6;
      setPgaValue(parseFloat(newValue.toFixed(2)));
      setIsElevated(newValue > 0.4);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Animate wave phase
  useEffect(() => {
    const interval = setInterval(() => {
      setWavePhase((prev) => (prev + 1) % 360);
    }, 50);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (pgaValue >= 0.5) return { bg: "bg-destructive", text: "text-destructive", glow: "shadow-[0_0_60px_rgba(239,68,68,0.5)]" };
    if (pgaValue >= 0.3) return { bg: "bg-warning", text: "text-warning", glow: "shadow-[0_0_60px_rgba(234,179,8,0.5)]" };
    return { bg: "bg-success", text: "text-success", glow: "shadow-[0_0_60px_rgba(34,197,94,0.5)]" };
  };

  const status = getStatusColor();

  // Generate seismograph wave path
  const generateWavePath = () => {
    const points: string[] = [];
    const width = 800;
    const height = 200;
    const centerY = height / 2;
    
    for (let x = 0; x <= width; x += 2) {
      const normalWave = Math.sin((x + wavePhase * 2) / 30) * 10;
      const spike = Math.sin((x + wavePhase * 3) / 15) * (isElevated ? 60 : 20);
      const noise = (Math.random() - 0.5) * (isElevated ? 20 : 5);
      const y = centerY + normalWave + spike + noise;
      points.push(`${x === 0 ? "M" : "L"} ${x} ${y}`);
    }
    return points.join(" ");
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-6 min-h-screen flex flex-col">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Waves className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Seismic Mode
            </h1>
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="ml-4 px-3 py-1 rounded-full bg-destructive/20 text-destructive text-sm font-medium flex items-center gap-2"
            >
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              LIVE
            </motion.div>
          </div>
          <p className="text-muted-foreground">
            Real-time seismograph visualization and ground acceleration monitoring
          </p>
        </motion.div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col gap-6">
          {/* PGA Display */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-2xl p-8 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gauge className="h-6 w-6 text-muted-foreground" />
              <span className="text-lg text-muted-foreground font-medium">
                Peak Ground Acceleration
              </span>
            </div>

            <motion.div
              key={pgaValue}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
              className={cn(
                "inline-block px-12 py-6 rounded-2xl transition-all duration-500",
                status.glow
              )}
            >
              <span className={cn("text-8xl font-bold tabular-nums", status.text)}>
                {pgaValue.toFixed(2)}
              </span>
              <span className={cn("text-4xl font-bold ml-2", status.text)}>g</span>
            </motion.div>

            <div className="mt-6 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-success" />
                <span className="text-sm text-muted-foreground">Safe (&lt;0.3g)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-warning" />
                <span className="text-sm text-muted-foreground">Moderate (0.3-0.5g)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-destructive" />
                <span className="text-sm text-muted-foreground">Critical (&gt;0.5g)</span>
              </div>
            </div>
          </motion.div>

          {/* Seismograph */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-2xl p-6 flex-1"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">
                  Live Seismograph
                </h3>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm text-muted-foreground">SEN-287 Active</span>
                </div>
                {isElevated && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20"
                  >
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    <span className="text-sm text-accent font-medium">Elevated Activity</span>
                  </motion.div>
                )}
              </div>
            </div>

            <div className="relative h-[250px] bg-muted/20 rounded-xl overflow-hidden">
              {/* Grid Lines */}
              <div className="absolute inset-0">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`h-${i}`}
                    className="absolute w-full border-t border-primary/10"
                    style={{ top: `${(i + 1) * 10}%` }}
                  />
                ))}
                {[...Array(20)].map((_, i) => (
                  <div
                    key={`v-${i}`}
                    className="absolute h-full border-l border-primary/10"
                    style={{ left: `${(i + 1) * 5}%` }}
                  />
                ))}
              </div>

              {/* Center Line */}
              <div className="absolute top-1/2 left-0 right-0 border-t border-primary/30" />

              {/* Wave */}
              <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                <path
                  d={generateWavePath()}
                  fill="none"
                  stroke={isElevated ? "hsl(24, 95%, 53%)" : "hsl(187, 92%, 50%)"}
                  strokeWidth="2"
                  className="drop-shadow-[0_0_8px_currentColor]"
                />
              </svg>

              {/* Glow Effect */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-radial-primary opacity-30 transition-opacity duration-500",
                  isElevated && "opacity-50 bg-gradient-radial-accent"
                )}
              />
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-4 mt-6">
              {[
                { label: "Frequency", value: "2.4 Hz" },
                { label: "Amplitude", value: `${(pgaValue * 100).toFixed(0)} mm/s²` },
                { label: "Duration", value: "00:45:32" },
                { label: "Depth", value: "15 km" },
              ].map((stat) => (
                <div key={stat.label} className="text-center p-3 rounded-lg bg-muted/20">
                  <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
                  <div className="text-lg font-semibold text-foreground">{stat.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default SeismicMode;
