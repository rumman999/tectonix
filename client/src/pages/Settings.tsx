import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, Shield, Bell, MapPin, LogOut, Award, Briefcase, Heart, Building2, 
  Menu, Mail, Phone, Settings as SettingsIcon, ChevronRight, Loader2, Key, Plus 
} from "lucide-react";

import { GlassCard } from "@/components/ui/GlassCard";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { API_BASE_URL, getHeaders } from "@/config";
import { useToast } from "@/hooks/use-toast";

const roleConfig: any = {
  specialist: { color: "bg-blue-500/20 text-blue-400 border-blue-500/50", icon: Award, label: "Specialist" },
  first_responder: { color: "bg-orange-500/20 text-orange-400 border-orange-500/50", icon: Shield, label: "First Responder" },
  volunteer: { color: "bg-green-500/20 text-green-400 border-green-500/50", icon: Heart, label: "Volunteer" },
  owner: { color: "bg-purple-500/20 text-purple-400 border-purple-500/50", icon: Building2, label: "Property Owner" },
  citizen: { color: "bg-slate-500/20 text-slate-400 border-slate-500/50", icon: User, label: "Citizen" },
};

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  phone_number: string;
  role_type: string;
  license_no?: string;
  specialization?: string;
  badge_no?: string;
  rank?: string;
  blood_type?: string;
  supervisor_id?: string;
  proficiency_level?: string;
  skills_verified?: boolean;
  total_properties?: number;
}

interface Skill {
  skill_id: number;
  skill_name: string;
  proficiency_level?: string;
}

export const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // UI State
  const [pushNotifications, setPushNotifications] = useState(true);
  const [locationTracking, setLocationTracking] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Data State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<Skill[]>([]);

  // Password Modal State
  const [isPassOpen, setIsPassOpen] = useState(false);
  const [passForm, setPassForm] = useState({ old: "", new: "", confirm: "" });
  const [passLoading, setPassLoading] = useState(false);

  // Skill Add State
  const [newSkillId, setNewSkillId] = useState("");
  const [newProficiency, setNewProficiency] = useState("");

  // 1. Fetch Profile
  useEffect(() => {
    fetchProfile();
  }, []);

  // 2. Fetch Skills if Volunteer
  useEffect(() => {
    if (user && (user.role_type === "Volunteer" || user.role_type === "volunteer")) {
      fetchSkills();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/profile`, { headers: getHeaders() });
      setUser(res.data);
    } catch (err) {
      console.error("Failed to load profile", err);
      toast({ variant: "destructive", title: "Error", description: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  const fetchSkills = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/auth/skills`, { headers: getHeaders() });
      setAllSkills(res.data.all_skills);
      setMySkills(res.data.my_skills);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const handleChangePassword = async () => {
    if (passForm.new !== passForm.confirm) {
      toast({ variant: "destructive", title: "Error", description: "New passwords do not match." });
      return;
    }
    setPassLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/change-password`, 
        { old_password: passForm.old, new_password: passForm.new },
        { headers: getHeaders() }
      );
      toast({ title: "Success", description: "Password updated successfully." });
      setIsPassOpen(false);
      setPassForm({ old: "", new: "", confirm: "" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.response?.data?.message || "Failed to update password." });
    } finally {
      setPassLoading(false);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkillId || !newProficiency) return;
    try {
      await axios.post(`${API_BASE_URL}/api/auth/skills`, 
        { skill_id: newSkillId, proficiency_level: newProficiency },
        { headers: getHeaders() }
      );
      toast({ title: "Skill Added", description: "Your skills profile has been updated." });
      fetchSkills(); // Refresh list
      setNewSkillId("");
      setNewProficiency("");
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add skill." });
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;
  if (!user) return null;

  // Normalize role
  let normalizedRole = user.role_type?.toLowerCase() || "citizen";
  if (normalizedRole.includes("responder")) normalizedRole = "first_responder";
  const roleInfo = roleConfig[normalizedRole] || roleConfig.citizen;
  const RoleIcon = roleInfo.icon;

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
            <SettingsIcon className="text-primary h-6 w-6" />
            <span>Settings</span>
        </div>
        <Sheet>
            <SheetTrigger asChild><Button variant="ghost" size="icon"><Menu /></Button></SheetTrigger>
            <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
                <DashboardSidebar />
            </SheetContent>
        </Sheet>
      </div>

      <div className="hidden md:block fixed left-0 top-0 bottom-0 z-50 w-64">
         <DashboardSidebar />
      </div>

      <main className="md:ml-64 p-4 md:p-8 transition-all duration-300">
        <div className="max-w-4xl mx-auto space-y-6">
          
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="hidden md:block mb-8">
            <h1 className="text-3xl font-bold text-foreground">Settings & Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account preferences and role status.</p>
          </motion.div>

          {/* Profile Card */}
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
            <GlassCard className="relative overflow-hidden p-0" hover={false}>
                <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 via-accent/10 to-background" />
                <div className="relative pt-12 px-6 pb-6 flex flex-col md:flex-row items-center md:items-end gap-6">
                    <div className="relative">
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-background border-4 border-background shadow-xl flex items-center justify-center overflow-hidden">
                            <div className="w-full h-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                <User className="w-10 h-10 md:w-12 md:h-12 text-white" />
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left mb-2">
                        <h2 className="text-2xl font-bold text-foreground">{user.full_name}</h2>
                        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 text-muted-foreground text-sm mt-1">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {user.email}</span>
                            <span className="hidden md:inline">•</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {user.phone_number || "No phone"}</span>
                        </div>
                    </div>
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
            <div className="lg:col-span-2 space-y-6">
                
                {/* Role Specific Details */}
                {normalizedRole !== "citizen" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                        <GlassCard>
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                                <Briefcase className="w-5 h-5 text-primary" />
                                <h3 className="text-lg font-semibold text-foreground">Professional Credentials</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {normalizedRole === "specialist" && (
                                    <>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">License Number</p>
                                            <p className="font-mono text-foreground">{user.license_no || "N/A"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Specialization</p>
                                            <p className="font-medium text-foreground">{user.specialization || "General"}</p>
                                        </div>
                                    </>
                                )}
                                {normalizedRole === "first_responder" && (
                                    <>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Badge Number</p>
                                            <p className="font-mono text-foreground">{user.badge_no || "N/A"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Rank</p>
                                            <p className="font-medium text-foreground">{user.rank || "N/A"}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-white/5 border border-white/5">
                                            <p className="text-xs text-muted-foreground mb-1">Blood Type</p>
                                            <p className="font-medium text-red-400">{user.blood_type || "Unknown"}</p>
                                        </div>
                                    </>
                                )}
                                {normalizedRole === "owner" && (
                                    <div className="p-3 rounded-lg bg-white/5 border border-white/5 md:col-span-2">
                                        <p className="text-xs text-muted-foreground mb-1">Registered Properties</p>
                                        <p className="text-2xl font-bold text-foreground">{user.total_properties}</p>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* VOLUNTEER SKILLS MANAGER */}
                {normalizedRole === "volunteer" && (
                     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                        <GlassCard>
                            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                                <Award className="w-5 h-5 text-green-400" />
                                <h3 className="text-lg font-semibold text-foreground">Skills & Certifications</h3>
                            </div>

                            {/* Add New Skill Form */}
                            <div className="flex flex-col md:flex-row gap-3 mb-6 p-4 bg-white/5 rounded-xl border border-white/5">
                                <div className="flex-1">
                                    <Select value={newSkillId} onValueChange={setNewSkillId}>
                                        <SelectTrigger className="bg-background/50 border-white/10 text-foreground">
                                            <SelectValue placeholder="Select Skill" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {allSkills.map(skill => (
                                                <SelectItem key={skill.skill_id} value={skill.skill_id.toString()}>
                                                    {skill.skill_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="w-full md:w-40">
                                    <Select value={newProficiency} onValueChange={setNewProficiency}>
                                        <SelectTrigger className="bg-background/50 border-white/10 text-foreground">
                                            <SelectValue placeholder="Level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Beginner">Beginner</SelectItem>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Expert">Expert</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <Button onClick={handleAddSkill} className="bg-green-600 hover:bg-green-700">
                                    <Plus className="w-4 h-4 mr-2" /> Add
                                </Button>
                            </div>

                            {/* Skills List */}
                            <div className="space-y-2">
                                {mySkills.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">No skills added yet.</p>}
                                {mySkills.map((skill) => (
                                    <div key={skill.skill_id} className="flex justify-between items-center p-3 rounded-lg bg-black/20 border border-white/5">
                                        <span className="font-medium text-foreground">{skill.skill_name}</span>
                                        <Badge variant="outline" className={
                                            skill.proficiency_level === 'Expert' ? 'border-green-500 text-green-400' : 
                                            skill.proficiency_level === 'Intermediate' ? 'border-yellow-500 text-yellow-400' : 
                                            'border-blue-500 text-blue-400'
                                        }>
                                            {skill.proficiency_level}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </motion.div>
                )}

                {/* App Preferences */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <GlassCard>
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-white/5">
                            <SettingsIcon className="w-5 h-5 text-primary" />
                            <h3 className="text-lg font-semibold text-foreground">App Preferences</h3>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary"><Bell className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-foreground font-medium">Push Notifications</p>
                                        <p className="text-xs text-muted-foreground">Get alerts about nearby disasters</p>
                                    </div>
                                </div>
                                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex gap-3">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary"><MapPin className="w-5 h-5" /></div>
                                    <div>
                                        <p className="text-foreground font-medium">Location Services</p>
                                        <p className="text-xs text-muted-foreground">Allow GPS for emergency response</p>
                                    </div>
                                </div>
                                <Switch checked={locationTracking} onCheckedChange={setLocationTracking} />
                            </div>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>

            {/* Right Column */}
            <div className="lg:col-span-1 space-y-6">
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
                    <GlassCard className="h-full">
                        <h3 className="text-lg font-semibold text-foreground mb-4">Account</h3>
                        <div className="space-y-2">
                            <button 
                                onClick={() => setIsPassOpen(true)}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group"
                            >
                                <span className="text-sm text-foreground group-hover:text-primary transition-colors">Change Password</span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                            </button>
                            {/* Placeholders for other features */}
                            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-not-allowed opacity-50">
                                <span className="text-sm text-foreground">Two-Factor Auth</span>
                                <Badge variant="secondary" className="text-[10px] h-5">Coming Soon</Badge>
                            </button>
                        </div>
                        <div className="mt-8 pt-6 border-t border-white/10">
                            <Button variant="outline" className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10" onClick={handleLogout}>
                                <LogOut className="w-4 h-4 mr-2" /> Sign Out
                            </Button>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Change Password Dialog */}
      <Dialog open={isPassOpen} onOpenChange={setIsPassOpen}>
        <DialogContent className="bg-slate-900 border-white/10 text-white">
            <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>Enter your current password and a new one to update.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Current Password</Label>
                    <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="password" 
                            className="pl-9 bg-black/20 border-white/10" 
                            value={passForm.old}
                            onChange={e => setPassForm({...passForm, old: e.target.value})}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>New Password</Label>
                    <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="password" 
                            className="pl-9 bg-black/20 border-white/10" 
                            value={passForm.new}
                            onChange={e => setPassForm({...passForm, new: e.target.value})}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Confirm New Password</Label>
                    <div className="relative">
                        <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input 
                            type="password" 
                            className="pl-9 bg-black/20 border-white/10" 
                            value={passForm.confirm}
                            onChange={e => setPassForm({...passForm, confirm: e.target.value})}
                        />
                    </div>
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsPassOpen(false)}>Cancel</Button>
                <Button onClick={handleChangePassword} disabled={passLoading}>
                    {passLoading ? "Updating..." : "Update Password"}
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;