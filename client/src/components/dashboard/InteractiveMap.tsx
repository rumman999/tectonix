import { MapContainer, TileLayer, Marker, Popup, Tooltip, ZoomControl } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Real GPS coordinates for Dhaka sensors
const sensorLocations = [
  { id: 1, name: "Gulshan HQ", lat: 23.7925, lng: 90.4078, status: "safe" },
  { id: 2, name: "Motijheel Hub", lat: 23.7330, lng: 90.4172, status: "warning" },
  { id: 3, name: "Mirpur Station", lat: 23.8223, lng: 90.3654, status: "safe" },
  { id: 4, name: "Dhanmondi Unit", lat: 23.7461, lng: 90.3742, status: "danger" },
  { id: 5, name: "Uttara North", lat: 23.8728, lng: 90.3984, status: "safe" },
];

// Custom pulsing icon logic
const createPulsingIcon = (status: string) => {
  let colorClass = "bg-gray-500";
  let glowClass = "shadow-gray-500/50";
  
  if (status === "safe") { colorClass = "bg-emerald-500"; glowClass = "shadow-emerald-500/50"; }
  if (status === "warning") { colorClass = "bg-amber-500"; glowClass = "shadow-amber-500/50"; }
  if (status === "danger") { colorClass = "bg-red-500"; glowClass = "shadow-red-500/50"; }

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

export const InteractiveMap = () => {
  return (
    <div className="relative w-full h-full min-h-[400px] rounded-xl overflow-hidden glass-card shadow-xl border border-white/5 z-0">
      
      <MapContainer 
        center={[23.78, 90.40]} 
        zoom={12} 
        scrollWheelZoom={true} 
        zoomControl={false} // Disable default top-left zoom
        attributionControl={false} // Remove watermark
        className="w-full h-full z-0"
        style={{ background: '#020617' }} 
      >
        {/* Dark Matter Tiles */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* FIX: Correct position name is "bottomright" (no hyphen) */}
        <ZoomControl position="bottomright" />

        {sensorLocations.map((sensor) => (
          <Marker
            key={sensor.id}
            position={[sensor.lat, sensor.lng]}
            icon={createPulsingIcon(sensor.status)}
          >
            <Tooltip 
              direction="top" 
              offset={[0, -20]} 
              opacity={1} 
              className="!bg-[#0f172a] !text-white !border !border-white/10 !rounded-md !px-3 !py-1 !shadow-xl font-sans text-xs"
            >
              {sensor.name}
            </Tooltip>

            <Popup className="glass-popup">
              <div className="p-1 min-w-[160px]">
                <div className={`h-1 w-full rounded-full mb-3 ${
                  sensor.status === 'safe' ? 'bg-emerald-500' : 
                  sensor.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                <h3 className="font-bold text-slate-800 text-lg mb-1">{sensor.name}</h3>
                <div className="flex justify-between items-center text-sm text-slate-500 mt-2">
                  <span>ID: <span className="font-mono text-slate-700">#{sensor.id}</span></span>
                  <span className={`font-bold text-xs px-2 py-0.5 rounded-full uppercase tracking-wider ${
                    sensor.status === 'safe' ? 'bg-emerald-100 text-emerald-700' : 
                    sensor.status === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {sensor.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Title Card */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-none">
        <div className="glass-card px-4 py-2.5 rounded-lg border border-white/10 shadow-2xl bg-black/40 backdrop-blur-md">
          <h3 className="text-sm font-bold text-white flex items-center gap-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-black/50"></span>
            </span>
            Live Sensor Network
          </h3>
          <p className="text-[10px] text-slate-400 ml-5 mt-0.5">Real-time GPS Tracking</p>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-[400] pointer-events-auto">
        <div className="glass-card px-3 py-2 rounded-lg border border-white/10 shadow-xl bg-black/60 backdrop-blur-md flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Safe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Warning</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <span className="text-[10px] font-bold text-slate-200 uppercase tracking-wider">Critical</span>
          </div>
        </div>
      </div>
    </div>
  );
};