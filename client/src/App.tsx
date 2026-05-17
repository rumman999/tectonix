import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from 'react-router-dom';
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import SeismicMode from "./pages/SeismicMode";
import AIScanner from "./pages/AIScanner";
import Auth from "./pages/Auth";
import RetrofitCalculator from "./pages/RetrofitCalculator";
import DamageReport from "./pages/DamageReport";
import RescueCoordinator from "./pages/RescueCoordinator";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute"; 
import { ResponderMissions } from "./pages/ResponderMissions";
import BeaconView from "@/components/dashboard/BeaconView";
import BuildingManager from "./pages/BuildingManager";
import Settings from "./pages/Settings";
import { ShowcaseBanner } from "./components/ShowcaseBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <ShowcaseBanner />
      <HashRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />

          {/* Routes Accessible by ALL Logged-in Users (Citizen, Owner, Volunteer, First_Responder, Specialist) */}
          <Route element={<ProtectedRoute />}>
             <Route path="/dashboard" element={<Dashboard />} />
             <Route path="/seismic" element={<SeismicMode />}/>
             <Route path="/settings" element={<Settings />} />
             <Route path="/beacon" element={<BeaconView />} />
          </Route>

          {/* Owner Only Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Owner"]} />}>
            <Route path="/retrofit" element={<RetrofitCalculator />} />
            <Route path="/report" element={<DamageReport />} />
            <Route path="/buildings" element={<BuildingManager />} />
          </Route>

          {/* Volunteer & First_Responder Routes */}
          <Route element={<ProtectedRoute allowedRoles={["Volunteer", "First_Responder", "Coordinator"]} />}>
             <Route path="/my-mission" element={<ResponderMissions />} />
          </Route>

          {/* Specialist & First_Responder Routes (Assumed for these specific pages based on context) */}
          <Route element={<ProtectedRoute allowedRoles={["Specialist", "First_Responder"]} />}>
            <Route path="/rescue" element={<RescueCoordinator />}/>
            <Route path="/scanner" element={<AIScanner />}/>
          </Route>
          
          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;