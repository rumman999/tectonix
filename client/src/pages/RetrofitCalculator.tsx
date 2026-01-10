import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import {
  Building2,
  Home,
  ChevronRight,
  ChevronLeft,
  Package,
  Users,
  Wrench,
  Calculator,
} from "lucide-react";

type BuildingType = "commercial" | "residential" | null;

interface MaterialCost {
  name: string;
  unit: string;
  pricePerUnit: number;
  quantity: number;
}

const baseMaterials: MaterialCost[] = [
  { name: "Portland Cement", unit: "bags", pricePerUnit: 12, quantity: 0 },
  { name: "Steel Rebar (12mm)", unit: "kg", pricePerUnit: 1.2, quantity: 0 },
  { name: "Structural Steel", unit: "kg", pricePerUnit: 2.5, quantity: 0 },
  { name: "Concrete (Ready-Mix)", unit: "m³", pricePerUnit: 120, quantity: 0 },
  { name: "Labor (Skilled)", unit: "days", pricePerUnit: 45, quantity: 0 },
  { name: "Equipment Rental", unit: "days", pricePerUnit: 200, quantity: 0 },
];

export const RetrofitCalculator = () => {
  const [step, setStep] = useState(1);
  const [buildingType, setBuildingType] = useState<BuildingType>(null);
  const [sqFootage, setSqFootage] = useState(2000);
  const [floors, setFloors] = useState(3);
  const [materials, setMaterials] = useState<MaterialCost[]>(baseMaterials);
  const [totalCost, setTotalCost] = useState(0);
  const [displayedCost, setDisplayedCost] = useState(0);

  // Calculate materials based on inputs
  useEffect(() => {
    if (buildingType && sqFootage && floors) {
      const multiplier = buildingType === "commercial" ? 1.4 : 1;
      const baseArea = sqFootage * floors;

      const newMaterials = baseMaterials.map((m) => {
        let qty = 0;
        switch (m.name) {
          case "Portland Cement":
            qty = Math.ceil((baseArea / 100) * 8 * multiplier);
            break;
          case "Steel Rebar (12mm)":
            qty = Math.ceil((baseArea / 10) * 2.5 * multiplier);
            break;
          case "Structural Steel":
            qty = Math.ceil((baseArea / 10) * 1.2 * multiplier);
            break;
          case "Concrete (Ready-Mix)":
            qty = Math.ceil((baseArea / 1000) * 12 * multiplier);
            break;
          case "Labor (Skilled)":
            qty = Math.ceil((baseArea / 500) * 10 * multiplier);
            break;
          case "Equipment Rental":
            qty = Math.ceil((baseArea / 2000) * 15 * multiplier);
            break;
        }
        return { ...m, quantity: qty };
      });

      setMaterials(newMaterials);
      const total = newMaterials.reduce(
        (sum, m) => sum + m.quantity * m.pricePerUnit,
        0
      );
      setTotalCost(total);
    }
  }, [buildingType, sqFootage, floors]);

  // Animate cost counter
  useEffect(() => {
    const duration = 1000;
    const startTime = Date.now();
    const startValue = displayedCost;
    const endValue = totalCost;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedCost(Math.floor(startValue + (endValue - startValue) * eased));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [totalCost]);

  const canProceed = () => {
    if (step === 1) return buildingType !== null;
    if (step === 2) return sqFootage > 0 && floors > 0;
    return true;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />

      <main className="ml-64 p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">
              Retrofit Cost Calculator
            </h1>
          </div>
          <p className="text-muted-foreground">
            Estimate earthquake retrofitting costs for your building
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <motion.div
                animate={{
                  scale: step === s ? 1.1 : 1,
                  backgroundColor:
                    step >= s ? "hsl(var(--primary))" : "hsl(var(--muted))",
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                  step >= s ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {s}
              </motion.div>
              {s < 3 && (
                <div
                  className={`w-20 h-1 mx-2 rounded-full transition-colors ${
                    step > s ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Building Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-center text-foreground mb-8">
                  Select Building Type
                </h2>
                <div className="grid grid-cols-2 gap-6">
                  {[
                    {
                      type: "commercial" as BuildingType,
                      icon: Building2,
                      label: "Commercial",
                      desc: "Office buildings, retail spaces, warehouses",
                    },
                    {
                      type: "residential" as BuildingType,
                      icon: Home,
                      label: "Residential",
                      desc: "Houses, apartments, condominiums",
                    },
                  ].map((option) => (
                    <motion.button
                      key={option.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBuildingType(option.type)}
                      className={`relative p-8 rounded-2xl border-2 transition-all ${
                        buildingType === option.type
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-white/10 bg-muted/20 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                          buildingType === option.type
                            ? "bg-primary/20 shadow-lg shadow-primary/30"
                            : "bg-muted/30"
                        }`}
                      >
                        <option.icon
                          className={`h-10 w-10 transition-colors ${
                            buildingType === option.type
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">
                        {option.label}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {option.desc}
                      </p>
                      {buildingType === option.type && (
                        <motion.div
                          layoutId="selectedType"
                          className="absolute inset-0 rounded-2xl border-2 border-primary"
                          initial={false}
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Dimensions */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <h2 className="text-xl font-semibold text-center text-foreground mb-8">
                  Building Dimensions
                </h2>

                <GlassCard className="p-8">
                  <div className="space-y-8">
                    {/* Square Footage */}
                    <div>
                      <div className="flex justify-between mb-3">
                        <label className="text-sm font-medium text-foreground">
                          Total Square Footage
                        </label>
                        <span className="text-lg font-bold text-primary">
                          {sqFootage.toLocaleString()} sq ft
                        </span>
                      </div>
                      <input
                        type="range"
                        min="500"
                        max="50000"
                        step="100"
                        value={sqFootage}
                        onChange={(e) => setSqFootage(Number(e.target.value))}
                        className="w-full h-3 bg-muted/30 rounded-full appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            ((sqFootage - 500) / 49500) * 100
                          }%, hsl(var(--muted)) ${
                            ((sqFootage - 500) / 49500) * 100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>500 sq ft</span>
                        <span>50,000 sq ft</span>
                      </div>
                    </div>

                    {/* Number of Floors */}
                    <div>
                      <div className="flex justify-between mb-3">
                        <label className="text-sm font-medium text-foreground">
                          Number of Floors
                        </label>
                        <span className="text-lg font-bold text-primary">
                          {floors} floors
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        value={floors}
                        onChange={(e) => setFloors(Number(e.target.value))}
                        className="w-full h-3 bg-muted/30 rounded-full appearance-none cursor-pointer accent-primary"
                        style={{
                          background: `linear-gradient(to right, hsl(var(--primary)) 0%, hsl(var(--primary)) ${
                            ((floors - 1) / 19) * 100
                          }%, hsl(var(--muted)) ${
                            ((floors - 1) / 19) * 100
                          }%, hsl(var(--muted)) 100%)`,
                        }}
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>1 floor</span>
                        <span>20 floors</span>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 3: Material Estimator */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-xl font-semibold text-center text-foreground mb-8">
                  Material & Cost Estimate
                </h2>

                <GlassCard className="p-6">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                          Material
                        </th>
                        <th className="text-center py-3 text-sm font-medium text-muted-foreground">
                          Quantity
                        </th>
                        <th className="text-center py-3 text-sm font-medium text-muted-foreground">
                          Unit Price
                        </th>
                        <th className="text-right py-3 text-sm font-medium text-muted-foreground">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {materials.map((material, index) => (
                        <motion.tr
                          key={material.name}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-white/5"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                {index < 4 ? (
                                  <Package className="h-4 w-4 text-primary" />
                                ) : index === 4 ? (
                                  <Users className="h-4 w-4 text-primary" />
                                ) : (
                                  <Wrench className="h-4 w-4 text-primary" />
                                )}
                              </div>
                              <span className="text-foreground font-medium">
                                {material.name}
                              </span>
                            </div>
                          </td>
                          <td className="text-center text-foreground">
                            {material.quantity.toLocaleString()} {material.unit}
                          </td>
                          <td className="text-center text-muted-foreground">
                            ${material.pricePerUnit.toFixed(2)}
                          </td>
                          <td className="text-right text-foreground font-medium">
                            $
                            {(
                              material.quantity * material.pricePerUnit
                            ).toLocaleString()}
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </GlassCard>

                {/* Total Cost Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
                >
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">
                      Total Estimated Retrofit Cost
                    </p>
                    <motion.div
                      key={displayedCost}
                      className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
                    >
                      ${displayedCost.toLocaleString()}
                    </motion.div>
                    <p className="text-sm text-muted-foreground mt-4">
                      *Estimate based on current market rates. Actual costs may
                      vary.
                    </p>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-12">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                step === 1
                  ? "opacity-50 cursor-not-allowed text-muted-foreground"
                  : "bg-muted/30 text-foreground hover:bg-muted/50"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              Previous
            </motion.button>

            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  canProceed()
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Next Step
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium bg-gradient-to-r from-primary to-accent text-white shadow-lg shadow-primary/25"
              >
                Download Report
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RetrofitCalculator;
