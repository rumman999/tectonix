import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, Popup, useMap, Marker, ZoomControl } from "react-leaflet";
import { ShieldAlert, X, MapPin } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";

// --- HAVERSINE HELPER ---
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// --- ROUTING MACHINE INJECTOR ---
// This connects the raw Leaflet routing plugin to React-Leaflet
const RoutingWrapper = ({ userLat, userLng, destLat, destLng }: { userLat: number, userLng: number, destLat: number, destLng: number }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const routingControl = L.Routing.control({
      waypoints: [L.latLng(userLat, userLng), L.latLng(destLat, destLng)],
      lineOptions: {
        styles: [{ color: '#3b82f6', weight: 6, opacity: 0.8 }] // Thick Blue Line
      },
      addWaypoints: true,       // Let user bend the line
      draggableWaypoints: true, // Let user drag to avoid red zones
      routeWhileDragging: true,
      show: false,              // Hides the bulky text directions box
      createMarker: function() { return null; } // Hides default ugly markers so we can use our own
    }).addTo(map);

    // Cleanup when component unmounts
    return () => {
      map.removeControl(routingControl);
    };
  }, [map, userLat, userLng, destLat, destLng]);

  return null;
};

// --- CUSTOM DESTINATION PIN ---
const destinationPin = L.divIcon({
  className: "bg-transparent",
  // Reduced width and height from 36 to 28
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="#ef4444" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0px 4px 4px rgba(0,0,0,0.5));"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`,
  iconSize: [28, 28],    // Match the new SVG size
  iconAnchor: [14, 28],  // Half of width (14), full height (28) so the tip points perfectly
});

// --- MAIN COMPONENT ---
interface NavigationMapProps {
  destLat: number;
  destLng: number;
  onClose: () => void;
}

export const NavigationMap = ({ destLat, destLng, onClose }: NavigationMapProps) => {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);
  const [riskZones, setRiskZones] = useState<any[]>([]);

  // 1. Get User's Real-Time GPS Location
  useEffect(() => {
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error("GPS Error:", err);
        // Fallback to a default Dhaka location if the browser blocks it so the app doesn't crash
        setUserPos({ lat: 23.8103, lng: 90.4125 }); 
      },
      { 
        enableHighAccuracy: true, 
        timeout: 3000       // <--- ADD THIS: Give it 10 seconds to find the satellite
      }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Fetch & Cluster Red Zones (Same logic as InteractiveMap)
  useEffect(() => {
    const fetchRiskZones = async () => {
      try {
        const res = await fetch(`/api/buildings/map-data`);
        if (res.ok) {
          const buildings = await res.json();
          const highRisk = buildings.filter((b: any) => b.risk_score >= 75);
          
          let zones = highRisk.map((b: any) => ({ lat: b.lat, lng: b.lng, count: 1, radius: 400 }));
          let merged = true;
          
          while (merged) {
            merged = false;
            for (let i = 0; i < zones.length; i++) {
              for (let j = i + 1; j < zones.length; j++) {
                const distance = getDistance(zones[i].lat, zones[i].lng, zones[j].lat, zones[j].lng);
                if (distance < zones[i].radius + zones[j].radius) {
                  const totalCount = zones[i].count + zones[j].count;
                  const newLat = (zones[i].lat * zones[i].count + zones[j].lat * zones[j].count) / totalCount;
                  const newLng = (zones[i].lng * zones[i].count + zones[j].lng * zones[j].count) / totalCount;
                  const newRadius = Math.max(zones[i].radius, zones[j].radius) + (distance / 2);

                  zones[i] = { lat: newLat, lng: newLng, count: totalCount, radius: newRadius };
                  zones.splice(j, 1);
                  merged = true;
                  break;
                }
              }
              if (merged) break;
            }
          }
          setRiskZones(zones);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchRiskZones();
  }, []);

  if (!userPos) {
    return (
      <div className="fixed inset-0 z-[999] bg-background/90 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
          <p className="text-foreground font-medium">Acquiring GPS Signal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[999] bg-background">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-[1000] p-4 bg-background/80 backdrop-blur-md border-b border-white/10 flex justify-between items-center shadow-lg">
        <div>
          <h2 className="text-lg font-bold text-foreground">Mission Navigation</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Live GPS Tracking
          </p>
        </div>
        <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
          <X className="w-6 h-6 text-foreground" />
        </button>
      </div>

      <MapContainer
        center={[userPos.lat, userPos.lng]}
        zoom={14}
        className="w-full h-full"
        style={{ background: "#020617" }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer 
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains={['a', 'b', 'c', 'd']} // Splits downloads across 4 different Carto servers
          keepBuffer={4}                    // Keeps surrounding tiles loaded in memory so they don't reload
          updateWhenIdle={true}             // Pauses downloading while the user is dragging the map
          updateWhenZooming={false}         // Pauses downloading during zoom animations
        />

        <ZoomControl position="bottomright" />
        <style>{`.leaflet-routing-container { display: none !important; }`}</style>

        {/* 1. Draw Red Zones */}
        {riskZones.map((zone, i) => (
          <Circle
            key={i}
            center={[zone.lat, zone.lng]}
            radius={zone.radius}
            pathOptions={{ color: "#ef4444", fillColor: "#ef4444", fillOpacity: 0.2, weight: 1}}
          >
             <Popup className="custom-dark-popup">
               <div className="text-red-500 font-bold flex items-center gap-2"><ShieldAlert className="h-4 w-4"/> DANGER ZONE</div>
             </Popup>
          </Circle>
        ))}

        {/* 2. Draw My Location (Blue Dot) */}
        <Circle 
          center={[userPos.lat, userPos.lng]} 
          radius={50} 
          pathOptions={{ color: "white", fillColor: "#3b82f6", fillOpacity: 1, weight: 3 }} 
        />

        {/* 3. Draw Destination (Red Dot) */}
        <Marker 
          position={[destLat, destLng]} 
          icon={destinationPin} 
        />

        {/* 4. Inject the Route Line */}
        <RoutingWrapper userLat={userPos.lat} userLng={userPos.lng} destLat={destLat} destLng={destLng} />

      </MapContainer>

      {/* Helper Toast at the bottom */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 shadow-2xl pointer-events-none">
        <p className="text-sm font-medium text-white flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary" />
          Drag the blue line to route around Red Zones.
        </p>
      </div>
    </div>
  );
};