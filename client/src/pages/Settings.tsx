import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { 
  User, 
  Shield, 
  Bell, 
  MapPin, 
  LogOut,
  Award,
  Briefcase,
  Heart,
  Building2,
  Menu,
  Mail,
  Phone,
  Settings as SettingsIcon,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

// FIX: Imports for Mobile Menu
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

type RoleType = "specialist" | "first_responder" | "volunteer" | "owner" | "citizen";

// Mock user data
const mockUserData = {
  user_id: "usr_001",
  full_name: "Dr. Anika Rahman",
  email: "anika.rahman@tectonix.bd",
  phone: "+880-1712-345678",
  role_type: "specialist" as RoleType, // Change this to test other roles
  
  // Role Specific Fields
  license_no: "ENG-2024-88",
  specialization: "Structural Engineering",
  badge_no: "FR-991",
  rank: "Senior Captain",
  proficiency_level: "Expert",
  skills_verified: true,
  total_properties: 12,
};

const roleConfig = {
  specialist: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: Award, label: "Specialist" },
  first_responder: { color: "bg-orange-500/20 text-orange-400 border-orange-500/50", icon: Shield, label: "First Responder" },
  volunteer: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: Heart, label: "Volunteer" },
  owner: { color: "bg-purple-500/20 text-purple-400 border-purple-500/50", icon: Building2, label: "Property Owner" },
  citizen: { color: "bg-slate-500/20 text-slate-400 border-slate-500/50", icon: User, label: "Citizen" },
};

const Settings = () => {
  const navigate = useNavigate();
  const [push_notifications, setPushNotifications] = useState(true);
  const [location_tracking, setLocationTracking] = useState(false);
  
  const user = mockUserData;
  const roleInfo = roleConfig[user.role_type];
  const RoleIcon = roleInfo.icon;

  const handleLogout = () => {
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background">
      
      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <SettingsIcon className="text-primary h-6 w-6" />
            <span>Settings</span>
        </div>
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon"><Menu /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
                <SheetTitle className="hidden">Navigation</SheetTitle>
                <DashboardSidebar />
            </SheetContent>
        </Sheet>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
         <DashboardSidebar />
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Page Title (Desktop only) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden md:block mb-8"
          >
            <h1 className="text-3xl font-bold text-foreground">Settings & Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and role status.</p>
          </motion.div>

          {/* Profile Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="relative overflow-hidden p-0" hover={false}>
                {/* Decorative Background Banner */}
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-background" />
                
                <div className="relative pt-12 px-6 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </div>
                        </div>
                        <div className="absolute bottom-1 right-1 bg-background rounded-full p-1">
                            <div className="w-4 h-4 bg-green-500 rounded-full border-2 border-background animate-pulse" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{user.full_name}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-muted-foreground text-sm mt-1">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {user.phone}</span>
                        </div>
                    </div>

                    {/* Role Badge */}
                    <div className="mb-2">
                        <Badge variant="outline" className={`px-4 py-2 text-sm font-medium border ${roleInfo.color}`}>
                            <RoleIcon className="w-4 h-4 mr-2" />
                            {roleInfo.label}
                        </Badge>
                    </div>
                </div>
            </GlassCard>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Role Details */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Professional Info */}
                {user.role_type !== "citizen" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <GlassCard>
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Professional Credentials</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {user.role_type === "specialist" && (
                                    <>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">License Number</p>
                                            <p className="font-mono text-foreground">{user.license_no}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Specialization</p>
                                            <p className="font-medium text-foreground">{user.specialization}</p>
                                        </div>
                                    </>
                                )}

                                {user.role_type === "first_responder" && (
                                    <>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Badge Number</p>
                                            <p className="font-mono text-foreground">{user.badge_no}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Rank</p>
                                            <p className="font-medium text-foreground">{user.rank}</p>
                                        </div>
                                    </>
                                )}

                                {user.role_type === "volunteer" && (
                                    <>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Proficiency Level</p>
                                            <p className="font-medium text-green-400">{user.proficiency_level}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Status</p>
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${user.skills_verified ? "bg-green-500" : "bg-red-500"}`} />
                                                <span className="font-medium text-foreground">{user.skills_verified ? "Verified" : "Pending"}</span>
                                            </div>
                                        </div>
                                    </>
                                )}

                                {user.role_type === "owner" && (
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 md:col-span-2">
                                        <p className="text-xs text-muted-foreground mb-1">Registered Properties</p>
                                        <p className="text-2xl font-bold text-foreground">{user.total_properties}</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* General Settings */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GlassCard>
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                            <SettingsIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">App Preferences</h3>
                        </div>
                        
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">Push Notifications</p>
                                        <p className="text-xs text-muted-foreground">Get alerts about nearby disasters</p>
                                    </div>
                                </div>
                                <Switch checked={push_notifications} onCheckedChange={setPushNotifications} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-foreground font-medium">Location Services</p>
                                        <p className="text-xs text-muted-foreground">Allow GPS for emergency response</p>
                                    </div>
                                </div>
                                <Switch checked={location_tracking} onCheckedChange={setLocationTracking} />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Right Column: Account Actions */}
            <div className="lg:col-span-1 space-y-6">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <GlassCard className="h-full">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>
                        <div className="space-y-2">
                            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-sm text-foreground group-hover:text-primary transition-colors">Change Password</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-sm text-foreground group-hover:text-primary transition-colors">Two-Factor Auth</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group">
                                <span className="text-sm text-foreground group-hover:text-primary transition-colors">Data Privacy</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-white/10">
                            <Button 
                                variant="outline" 
                                className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all hover:border-red-500"
                                onClick={handleLogout}
                            >
                                <LogOut className="w-4 h-4 mr-2" />
                                Sign Out
                            </Button>
                            <p className="text-center text-xs text-muted-foreground mt-4">
                                Version 2.1.0 (Build 405)
                            </p>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default Settings;