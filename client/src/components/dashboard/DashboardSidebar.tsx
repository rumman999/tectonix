import { motion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Radio,
  ScanLine,
  Calculator,
  FileWarning,
  Shield,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Radio, label: "Seismic Mode", href: "/seismic" },
  { icon: ScanLine, label: "AI Scanner", href: "/scanner" },
  { icon: Calculator, label: "Retrofit Calc", href: "/retrofit" },
  { icon: FileWarning, label: "Report Damage", href: "/report" },
  { icon: Shield, label: "Rescue Ops", href: "/rescue" },
  { icon: Settings, label: "Settings", href: "/settings", roles: ["Citizen", "Specialist", "Owner", "Volunteer", "First_Responder"] },
  { icon: Radio, label: "Emergency Beacon", href: "/beacon" },
  { icon: Building2, label: "Building Asset Manager", href: "/buildings" },
];

interface DashboardSidebarProps {
  className?: string;
  onLinkClick?: () => void; // New prop to close mobile menu
}

export const DashboardSidebar = ({ className, onLinkClick }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/auth");
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      // REMOVED 'fixed' so the parent layout controls positioning
      className={cn(
        "h-full bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 flex flex-col",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border shrink-0">
        <Link to="/" className="flex items-center gap-3" onClick={onLinkClick}>
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-lg" />
            <Activity className="relative h-8 w-8 text-primary" />
          </div>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold text-sidebar-foreground"
            >
              Tectonix
            </motion.span>
          )}
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href + item.label}
              to={item.href}
              onClick={onLinkClick} // Close menu on click
              className={cn(
                "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 transition-transform duration-200 group-hover:scale-110",
                  isActive && "text-primary"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
              {isActive && !collapsed && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-primary"
                />
              )}
            </Link>
          );
        })}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
            "text-red-500 hover:bg-red-50/10 hover:text-red-600"
          )}
        >
          <LogOut className="h-5 w-5 transition-transform duration-200 group-hover:scale-110" />
          {!collapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <>
              <ChevronLeft className="h-5 w-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
};