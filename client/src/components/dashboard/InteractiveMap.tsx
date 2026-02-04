import { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Tooltip,
  ZoomControl,
  useMapEvents,
} from "react-leaflet";
import { Activity, MapPin, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { API_BASE_URL, getHeaders } from "@/config";

interface SensorData {
  id: number;
  sensor: string;
  lat: number;
  lng: number;
  status: string;
  magnitude: string;
}

// Custom pulsing icon logic
const createPulsingIcon = (status: string) => {
  let colorClass = "bg-gray-500";
  let glowClass = "shadow-gray-500/50";

  if (status === "safe") {
    colorClass = "bg-emerald-500";
    glowClass = "shadow-emerald-500/50";
  }
  if (status === "warning") {
    colorClass = "bg-amber-500";
    glowClass = "shadow-amber-500/50";
  }
  if (status === "danger") {
    colorClass = "bg-red-500";
    glowClass = "shadow-red-500/50";
  }

  return L.divIcon({
    className: "custom-icon-marker",
    html: `
      <div class="relative flex items-center justify-center w-8 h-8">
        <span class="absolute w-full h-full rounded-full opacity-40 animate-ping ${colorClass}"></span>
        <span class="relative w-3.5 h-3.5 border-2 border-[#020617] rounded-full shadow-[0_0_15px] ${glowClass} ${colorClass}"></span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const MapClickHandler = () => {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;

      // Show a loading toast
      const toastId = toast.loading("Identifying zone...");

      try {
        const response = await fetch(`${API_BASE_URL}/api/zones/identify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            latitude: lat,
            longitude: lng,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          // Success: Update toast with Zone Name
          toast.success(`Location Identified: ${data.zone_name}`, {
            id: toastId,
            description: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
          });
        } else {
          // Error or No Zone Found
          toast.error(data.message || "No zone found here", {
            id: toastId,
          });
        }
      } catch (error) {
        console.error("Zone check failed:", error);
        toast.error("Failed to connect to server", { id: toastId });
      }
    },
  });
  return null;
};

// FIX: Added interface for Props
interface InteractiveMapProps {
  showLegend?: boolean;
  className?: string; // Optional for custom sizing if needed
}

export const InteractiveMap = ({
  showLegend = true,
  className,
}: InteractiveMapProps) => {
  const [sensors, setSensors] = useState<SensorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/dashboard/logs`);
        const data = await res.json();
        if (res.ok) setSensors(data);
      } catch (err) {
        console.error("Map fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();

    const interval = setInterval(fetchSensors, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`relative w-full h-full min-h-[400px] rounded-xl overflow-hidden glass-card shadow-xl border border-white/5 z-0 ${className}`}
    >
      <MapContainer
        center={[23.78, 90.4]}
        zoom={12}
        scrollWheelZoom={true}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full z-0"
        style={{ background: "#020617" }}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />

        <ZoomControl position="bottomright" />

        {!loading &&
          sensors.map((sensor) => (
            <Marker
              key={sensor.id}
              position={[sensor.lat, sensor.lng]}
              icon={createPulsingIcon(sensor.status)}
            >
              <Tooltip>{sensor.sensor}</Tooltip>

              <Popup className="custom-white-popup">
                <div className="p-1 min-w-[180px]">
                  <div
                    className={`h-1.5 w-full rounded-full mb-3 shadow-sm ${
                      sensor.status === "safe"
                        ? "bg-emerald-600"
                        : sensor.status === "warning"
                          ? "bg-amber-500"
                          : "bg-red-600"
                    }`}
                  />

                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2 mb-1">
                    <MapPin className="h-4 w-4 text-primary fill-primary/10" />
                    {sensor.location}
                  </h3>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
                      <Activity className="h-3 w-3" />
                      {sensor.sensor}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="h-3 w-3 text-slate-500" />
                      <span className="text-slate-700 font-bold">
                        Intensity:
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-900 font-mono">
                        {sensor.magnitude} PGA
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-mono text-slate-600">
                      ID: #{sensor.id}
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                        sensor.status === "safe"
                          ? "text-emerald-700 bg-emerald-50 border-emerald-600"
                          : sensor.status === "warning"
                            ? "text-amber-700 bg-amber-50 border-amber-600"
                            : "text-red-700 bg-red-50 border-red-600 animate-pulse"
                      }`}
                    >
                      {sensor.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="glass-card px-4 py-2.5 rounded-lg border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black/50"></span>
            </span>
            Live Sensor Network
          </h3>
          <p className="text-[10px] text-slate-400 ml-5 mt-0.5">
            Real-time GPS Tracking
          </p>
        </div>
      </div>

      {showLegend && (
        <div className="absolute bottom-4 left-4 z-[400] pointer-events-auto">
          <div className="glass-card px-3 py-2 rounded-lg border border-white/10 shadow-xl bg-black/60 backdrop-blur-md flex gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                Safe
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                Warning
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">
                Critical
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
