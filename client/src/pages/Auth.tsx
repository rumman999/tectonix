import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
  BadgeCheck,
  Award,
  Building2,
  Briefcase,
  Heart,
  ChevronDown,
  Droplet,
  UserCheck
} from "lucide-react";
import heroBackground from "@/assets/hero-bg.jpg";
import axios from "axios";
import { useToast } from "@/hooks/use-toast";

type UserRole = "citizen" | "specialist" | "owner" | "volunteer" | "responder";

const roleConfig = {
  citizen: {
    label: "Citizen",
    gradient: "from-primary to-cyan-400",
    accent: "bg-primary",
    shadow: "shadow-primary/25",
    icon: User,
  },
  specialist: {
    label: "Specialist",
    gradient: "from-blue-500 to-indigo-500",
    accent: "bg-blue-500",
    shadow: "shadow-blue-500/25",
    icon: BadgeCheck,
  },
  owner: {
    label: "Owner",
    gradient: "from-amber-500 to-yellow-500",
    accent: "bg-amber-500",
    shadow: "shadow-amber-500/25",
    icon: Building2,
  },
  volunteer: {
    label: "Volunteer",
    gradient: "from-emerald-500 to-green-400",
    accent: "bg-emerald-500",
    shadow: "shadow-emerald-500/25",
    icon: Heart,
  },
  responder: {
    label: "Responder",
    gradient: "from-destructive to-orange-500",
    accent: "bg-destructive",
    shadow: "shadow-destructive/25",
    icon: Award,
  },
};

const roles: UserRole[] = [
  "citizen",
  "specialist",
  "owner",
  "volunteer",
  "responder",
];

const specializations = [
  "Structural Engineering",
  "Geotechnical Engineering",
  "Seismic Analysis",
  "Building Assessment",
  "Emergency Planning",
];

const ownerTypes = ["Individual", "Corporate", "Government"];
const proficiencyLevels = ["Beginner", "Intermediate", "Expert"];

export const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>("citizen");
  const [showPassword, setShowPassword] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Form fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");

  // Role-specific fields
  const [licenseNumber, setLicenseNumber] = useState("");
  const [specialization, setSpecialization] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ownerType, setOwnerType] = useState("");
  const [badgeNumber, setBadgeNumber] = useState("");
  const [rank, setRank] = useState("");
  const [proficiency, setProficiency] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [supervisorId, setSupervisorId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); // Disable button

    // 1. Determine URL
    const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";

    // 2. Map Frontend State -> Backend Database Columns
    // Backend expects: "Specialist" (Capitalized), Frontend has: "specialist" (lowercase)
    const formattedRole =
      role === "responder"
        ? "First_Responder" // DB expects "First_Responder"
        : role.charAt(0).toUpperCase() + role.slice(1); // "citizen" -> "Citizen"

    const payload = {
      email,
      password,
      full_name: fullName,
      phone_number: phone,
      role_type: formattedRole,

      license_no: licenseNumber,
      specialization: specialization,
      badge_no: badgeNumber,
      rank: rank,
      legal_name: companyName,
      owner_type: ownerType,
      proficiency_level: proficiency,
      blood_type: bloodType,
      supervisor_id: supervisorId.trim() === "" ? null : supervisorId,
    };

    try {
      // 3. Send Request
      const response = await axios.post(endpoint, payload);

      // 4. Handle Success
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      toast({ title: "Success", description: `Welcome ${user.full_name}` });

      // 5. Navigate based on role (Keep your original logic here)
      if (user.role_type === "First_Responder") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (error: any) {
      // 6. Handle Error
      console.error(error);
      const message = error.response?.data?.message || "Login failed";
      toast({ variant: "destructive", title: "Error", description: message });
    } finally {
      setLoading(false); // Re-enable button
    }
  };

  const currentRoleConfig = roleConfig[role];
  const RoleIcon = currentRoleConfig.icon;

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-8">
      {/* Blurred Background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBackground})` }}
      >
        <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
      </div>

      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(6, 182, 212, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(6, 182, 212, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <motion.div
          layout
          className="glass-card p-8 rounded-2xl border border-white/10"
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          {/* Logo */}
          <Link to="/" className="flex items-center justify-center gap-3 mb-8">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/30 blur-lg" />
              <Activity className="relative h-10 w-10 text-primary" />
            </div>
            <span className="text-2xl font-bold text-foreground">Tectonix</span>
          </Link>

          {/* Role Dropdown */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground text-center mb-3">
              Select your role
            </p>
            <div className="relative">
              <motion.button
                type="button"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl bg-gradient-to-r ${currentRoleConfig.gradient} text-white font-medium transition-all`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center gap-3">
                  <RoleIcon className="h-5 w-5" />
                  <span>{currentRoleConfig.label}</span>
                </div>
                <motion.div
                  animate={{ rotate: isRoleDropdownOpen ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="h-5 w-5" />
                </motion.div>
              </motion.button>

              <AnimatePresence>
                {isRoleDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden z-50 shadow-xl"
                  >
                    {roles.map((r) => {
                      const config = roleConfig[r];
                      const Icon = config.icon;
                      return (
                        <motion.button
                          key={r}
                          type="button"
                          onClick={() => {
                            setRole(r);
                            setIsRoleDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors ${
                            role === r ? "bg-white/5" : ""
                          }`}
                          whileHover={{ x: 4 }}
                        >
                          <div
                            className={`p-1.5 rounded-lg bg-gradient-to-r ${config.gradient}`}
                          >
                            <Icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-foreground font-medium">
                            {config.label}
                          </span>
                          {role === r && (
                            <motion.div
                              layoutId="selectedCheck"
                              className="ml-auto"
                            >
                              <BadgeCheck className="h-5 w-5 text-primary" />
                            </motion.div>
                          )}
                        </motion.button>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Login/Signup Toggle */}
          <div className="flex justify-center gap-8 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`text-sm font-medium transition-colors relative ${
                isLogin ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Sign In
              {isLogin && (
                <motion.div
                  layoutId="authIndicator"
                  className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r ${currentRoleConfig.gradient}`}
                />
              )}
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`text-sm font-medium transition-colors relative ${
                !isLogin ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              Create Account
              {!isLogin && (
                <motion.div
                  layoutId="authIndicator"
                  className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r ${currentRoleConfig.gradient}`}
                />
              )}
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full bg-muted/30 border border-white/10 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Email"
                required
              />
              <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                Email Address
              </label>
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            </div>

            {/* Password Field */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="peer w-full bg-muted/30 border border-white/10 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                placeholder="Password"
                required
              />
              <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                Password
              </label>
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Dynamic Create Account Fields */}
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="space-y-4 overflow-hidden"
                >
                  {/* Global Fields */}
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="relative"
                  >
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="peer w-full bg-muted/30 border border-white/10 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Full Name"
                    />
                    <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                      Full Name
                    </label>
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="relative"
                  >
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="peer w-full bg-muted/30 border border-white/10 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all"
                      placeholder="Phone Number"
                    />
                    <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-primary peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                      Phone Number
                    </label>
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  </motion.div>

                  {/* Specialist Fields */}
                  <AnimatePresence mode="wait">
                    {role === "specialist" && (
                      <motion.div
                        key="specialist-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="relative"
                        >
                          <input
                            type="text"
                            value={licenseNumber}
                            onChange={(e) => setLicenseNumber(e.target.value)}
                            className="peer w-full bg-muted/30 border border-blue-500/30 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all"
                            placeholder="License Number"
                          />
                          <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-blue-400 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                            License Number
                          </label>
                          <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="relative"
                        >
                          <select
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="w-full bg-muted/30 border border-blue-500/30 rounded-xl px-12 py-4 text-foreground focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 transition-all appearance-none"
                          >
                            <option value="" className="bg-card">
                              Select Specialization
                            </option>
                            {specializations.map((s) => (
                              <option key={s} value={s} className="bg-card">
                                {s}
                              </option>
                            ))}
                          </select>
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-blue-400" />
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Owner Fields */}
                    {role === "owner" && (
                      <motion.div
                        key="owner-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="relative"
                        >
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="peer w-full bg-muted/30 border border-amber-500/30 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all"
                            placeholder="Legal/Company Name"
                          />
                          <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-amber-400 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
                            Legal/Company Name
                          </label>
                          <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                        </motion.div>

                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.15 }}
                          className="relative"
                        >
                          <select
                            value={ownerType}
                            onChange={(e) => setOwnerType(e.target.value)}
                            className="w-full bg-muted/30 border border-amber-500/30 rounded-xl px-12 py-4 text-foreground focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20 transition-all appearance-none"
                          >
                            <option value="" className="bg-card">
                              Select Owner Type
                            </option>
                            {ownerTypes.map((t) => (
                              <option key={t} value={t} className="bg-card">
                                {t}
                              </option>
                            ))}
                          </select>
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-400" />
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </motion.div>
                      </motion.div>
                    )}

                    {/* Responder Fields */}
{role === "responder" && (
  <motion.div
    key="responder-fields"
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: "auto" }}
    exit={{ opacity: 0, height: 0 }}
    transition={{ duration: 0.25 }}
    className="space-y-4 overflow-hidden"
  >
    {/* 1. Badge Number (Existing) */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 }}
      className="relative"
    >
      <input
        type="text"
        value={badgeNumber}
        onChange={(e) => setBadgeNumber(e.target.value)}
        className="peer w-full bg-muted/30 border border-destructive/30 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-destructive/50 focus:ring-2 focus:ring-destructive/20 transition-all"
        placeholder="Badge Number"
      />
      <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-orange-400 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
        Badge Number
      </label>
      <Award className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
    </motion.div>

    {/* 2. Rank (Existing) */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="relative"
    >
      <input
        type="text"
        value={rank}
        onChange={(e) => setRank(e.target.value)}
        className="peer w-full bg-muted/30 border border-destructive/30 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-destructive/50 focus:ring-2 focus:ring-destructive/20 transition-all"
        placeholder="Rank"
      />
      <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-orange-400 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
        Rank
      </label>
      <BadgeCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
    </motion.div>

    {/* --- INSERT YOUR NEW CODE HERE --- */}

    {/* 3. Blood Type (New) */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="relative"
    >
      <select
        value={bloodType}
        onChange={(e) => setBloodType(e.target.value)}
        className="w-full bg-muted/30 border border-destructive/30 rounded-xl px-12 py-4 text-foreground focus:outline-none focus:border-destructive/50 focus:ring-2 focus:ring-destructive/20 transition-all appearance-none"
      >
        <option value="" className="bg-card">
          Select Blood Type
        </option>
        {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((t) => (
          <option key={t} value={t} className="bg-card">
            {t}
          </option>
        ))}
      </select>
      <Droplet className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
    </motion.div>

    {/* 4. Supervisor ID (New) */}
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.25 }}
      className="relative"
    >
      <input
        type="text"
        value={supervisorId}
        onChange={(e) => setSupervisorId(e.target.value)}
        className="peer w-full bg-muted/30 border border-destructive/30 rounded-xl px-12 py-4 text-foreground placeholder-transparent focus:outline-none focus:border-destructive/50 focus:ring-2 focus:ring-destructive/20 transition-all"
        placeholder="Supervisor ID (Optional)"
      />
      <label className="absolute left-12 top-4 text-muted-foreground text-sm transition-all peer-placeholder-shown:top-4 peer-placeholder-shown:text-base peer-focus:top-1 peer-focus:text-xs peer-focus:text-orange-400 peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-xs">
        Supervisor ID (Optional)
      </label>
      <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-400" />
    </motion.div>
    
    {/* --- END OF INSERTION --- */}

  </motion.div>
)}

                    {/* Volunteer Fields */}
                    {role === "volunteer" && (
                      <motion.div
                        key="volunteer-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 }}
                          className="relative"
                        >
                          <select
                            value={proficiency}
                            onChange={(e) => setProficiency(e.target.value)}
                            className="w-full bg-muted/30 border border-emerald-500/30 rounded-xl px-12 py-4 text-foreground focus:outline-none focus:border-emerald-500/50 focus:ring-2 focus:ring-emerald-500/20 transition-all appearance-none"
                          >
                            <option value="" className="bg-card">
                              Select Proficiency Level
                            </option>
                            {proficiencyLevels.map((p) => (
                              <option key={p} value={p} className="bg-card">
                                {p}
                              </option>
                            ))}
                          </select>
                          <Heart className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        </motion.div>
                        
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`w-full py-4 rounded-xl font-semibold text-white bg-gradient-to-r ${currentRoleConfig.gradient} shadow-lg ${currentRoleConfig.shadow} flex items-center justify-center gap-2 transition-all mt-2 ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading
                ? "Processing..."
                : isLogin
                  ? "Sign In"
                  : "Create Account"}
              {!loading && <ArrowRight className="h-5 w-5" />}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-muted-foreground">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Social Auth */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3.5 rounded-xl bg-white/5 border border-white/10 text-foreground font-medium flex items-center justify-center gap-3 hover:bg-white/10 transition-all"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </motion.button>

          {/* Footer Links */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline"
            >
              {isLogin ? "Sign up" : "Sign in"}
            </button>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Auth;
