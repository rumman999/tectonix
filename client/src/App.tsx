import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import SeismicMode from "./pages/SeismicMode";
import AIScanner from "./pages/AIScanner";
import Auth from "./pages/Auth";
import RetrofitCalculator from "./pages/RetrofitCalculator";
import DamageReport from "./pages/DamageReport";
import RescueCoordinator from "./pages/RescueCoordinator";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/seismic" element={<SeismicMode />} />
          <Route path="/scanner" element={<AIScanner />} />
          <Route path="/retrofit" element={<RetrofitCalculator />} />
          <Route path="/report" element={<DamageReport />} />
          <Route path="/rescue" element={<RescueCoordinator />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
