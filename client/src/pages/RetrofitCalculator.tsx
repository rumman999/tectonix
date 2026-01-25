import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlowButton } from "@/components/ui/GlowButton";
import { API_BASE_URL, getHeaders } from "@/config";
import {
  Building2,
  Home,
  ChevronRight,
  ChevronLeft,
  Plus,
  Trash2,
  Calculator,
  Save,
  Menu,
  Package,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

type BuildingType = "commercial" | "residential" | null;


interface MaterialRate {
  material_id: number;
  item_name: string;
  unit_price: number; // Came as string from decimal type in DB usually
}

interface Building {
  building_id: number;
  building_name: string;
}

interface EstimateLineItem {
  temp_id: string; // Front-end only ID
  material_id: string; // Store as string for Select value, convert to int for logic
  quantity: number;
  subtotal: number;
}

export const RetrofitCalculator = () => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const [materials, setMaterials] = useState<MaterialRate[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);


  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [buildingType, setBuildingType] = useState<BuildingType>(null);
  const [sqFootage, setSqFootage] = useState(2000);
  const [floors, setFloors] = useState(3);

  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([
    { temp_id: `li-${Date.now()}`, material_id: "", quantity: 0, subtotal: 0 },
  ]);

  const [displayedCost, setDisplayedCost] = useState(0);


  useEffect(() => {
    const initData = async () => {
      try {
        const [matRes, buildRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/estimates/materials`, {
            headers: getHeaders(),
          }),
          axios.get(`${API_BASE_URL}/api/buildings/list`, {
            headers: getHeaders(),
          }),
        ]);

        // Ensure unit_price is treated as number
        const formattedMaterials = matRes.data.map((m: any) => ({
          ...m,
          unit_price: parseFloat(m.unit_price),
        }));

        setMaterials(formattedMaterials);
        setBuildings(buildRes.data);
      } catch (err) {
        console.error("Failed to load calculator data", err);
        toast({
          title: "Error",
          description: "Failed to load data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []);


  const totalCost = useMemo(() => {
    return lineItems.reduce((sum, item) => sum + item.subtotal, 0);
  }, [lineItems]);

  useEffect(() => {
    const duration = 800;
    const startTime = Date.now();
    const startValue = displayedCost;
    const endValue = totalCost;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayedCost(
        Math.floor(startValue + (endValue - startValue) * eased),
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [totalCost]);

  const getMaterialPrice = (materialIdStr: string): number => {
    const material = materials.find(
      (m) => String(m.material_id) === materialIdStr,
    );
    return material ? material.unit_price : 0;
  };

  const handleMaterialChange = (tempId: string, materialId: string) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.temp_id === tempId) {
          const unitPrice = getMaterialPrice(materialId);
          return {
            ...item,
            material_id: materialId,
            subtotal: item.quantity * unitPrice,
          };
        }
        return item;
      }),
    );
  };

  const handleQuantityChange = (tempId: string, quantity: number) => {
    setLineItems((items) =>
      items.map((item) => {
        if (item.temp_id === tempId) {
          const unitPrice = getMaterialPrice(item.material_id);
          return {
            ...item,
            quantity,
            subtotal: quantity * unitPrice,
          };
        }
        return item;
      }),
    );
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        temp_id: `li-${Date.now()}`,
        material_id: "",
        quantity: 0,
        subtotal: 0,
      },
    ]);
  };

  const removeLineItem = (tempId: string) => {
    if (lineItems.length > 1) {
      setLineItems((items) => items.filter((item) => item.temp_id !== tempId));
    }
  };

const handleSaveEstimate = async () => {
    if (!selectedBuildingId) {
      toast({ title: "Building Required", description: "Please select a building in Step 1.", variant: "destructive" });
      setStep(1);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        // FIX: Do NOT use parseInt(). Pass as string for UUID compatibility.
        building_id: selectedBuildingId, 
        total_cost: totalCost,
        // Optional context
        building_type: buildingType, 
        line_items: lineItems.map(item => ({
          material_id: parseInt(item.material_id), // Materials are INT, so parseInt is correct here
          quantity: item.quantity,
          subtotal: item.subtotal,
        })),
      };

      await axios.post(`${API_BASE_URL}/api/estimates`, payload, { headers: getHeaders() });
      
      toast({ 
        title: "Estimate Saved!", 
        description: "Your retrofit estimate has been saved to the database.",
        className: "bg-green-600 text-white border-none"
      });

    } catch (err) {
      console.error("Save failed", err);
      toast({ title: "Save Failed", description: "Could not save the estimate.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return buildingType !== null && selectedBuildingId !== "";
    if (step === 2) return sqFootage > 0 && floors > 0;
    return true;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* --- MOBILE HEADER --- */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b bg-background sticky top-0 z-50">
        <div className="flex items-center gap-2 font-bold text-lg">
          <Calculator className="text-primary h-6 w-6" />
          <span>Estimator</span>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-64 border-r [&>button]:hidden"
          >
            <SheetTitle className="hidden">Navigation</SheetTitle>
            <DashboardSidebar />
          </SheetContent>
        </Sheet>
      </div>

      {/* --- DESKTOP SIDEBAR --- */}
      <div className="hidden lg:block fixed left-0 top-0 bottom-0 z-50 w-64">
        <DashboardSidebar />
      </div>

      {/* --- MAIN CONTENT --- */}
      <main className="lg:ml-64 p-4 lg:p-8 transition-all duration-300">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Calculator className="h-7 w-7 lg:h-8 lg:w-8 text-primary" />
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              Retrofit Cost Estimator
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Estimate earthquake retrofitting costs based on live material rates.
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 lg:gap-4 mb-8 lg:mb-12 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { num: 1, label: "Building Profile" },
            { num: 2, label: "Dimensions" },
            { num: 3, label: "Materials & Cost" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center shrink-0">
              <div className="flex flex-col items-center">
                <motion.div
                  animate={{
                    scale: step === s.num ? 1.1 : 1,
                    backgroundColor:
                      step >= s.num
                        ? "hsl(var(--primary))"
                        : "hsl(var(--muted))",
                  }}
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                    step >= s.num
                      ? "text-primary-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {s.num}
                </motion.div>
                <span
                  className={`text-xs mt-1 hidden sm:block ${
                    step >= s.num ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div
                  className={`w-8 lg:w-20 h-1 mx-1 lg:mx-2 rounded-full transition-colors ${
                    step > s.num ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {/* Step 1: Building Selection & Type */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="space-y-4">
                  <h2 className="text-lg lg:text-xl font-semibold text-foreground text-center">
                    Select Target Building
                  </h2>
                  <div className="max-w-md mx-auto">
                    <Select
                      value={selectedBuildingId}
                      onValueChange={setSelectedBuildingId}
                    >
                      <SelectTrigger className="bg-muted/20 border-white/10 h-12">
                        <SelectValue placeholder="Select a building from database" />
                      </SelectTrigger>
                      <SelectContent>
                        {buildings.map((b) => (
                          <SelectItem
                            key={b.building_id}
                            value={String(b.building_id)}
                          >
                            {b.building_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                      Can't find your building? Add it in the Building Manager
                      first.
                    </p>
                  </div>
                </div>

                <div className="h-px bg-white/5 my-8" />

                <h2 className="text-lg lg:text-xl font-semibold text-center text-foreground mb-6">
                  Building Type Classification
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                  {[
                    {
                      type: "commercial" as BuildingType,
                      icon: Building2,
                      label: "Commercial",
                      desc: "Offices, retail, warehouses",
                    },
                    {
                      type: "residential" as BuildingType,
                      icon: Home,
                      label: "Residential",
                      desc: "Houses, apartments, condos",
                    },
                  ].map((option) => (
                    <motion.button
                      key={option.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setBuildingType(option.type)}
                      className={`relative p-6 lg:p-8 rounded-2xl border-2 transition-all ${
                        buildingType === option.type
                          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                          : "border-white/10 bg-muted/20 hover:border-white/20"
                      }`}
                    >
                      <div
                        className={`mx-auto w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center mb-4 transition-all ${
                          buildingType === option.type
                            ? "bg-primary/20 shadow-lg shadow-primary/30"
                            : "bg-muted/30"
                        }`}
                      >
                        <option.icon
                          className={`h-8 w-8 lg:h-10 lg:w-10 transition-colors ${
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
                className="space-y-6 lg:space-y-8"
              >
                <h2 className="text-lg lg:text-xl font-semibold text-center text-foreground mb-6 lg:mb-8">
                  Building Dimensions
                </h2>

                <GlassCard className="p-6 lg:p-8" hover={false}>
                  <div className="space-y-6 lg:space-y-8">
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
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            )}

            {/* Step 3: Dynamic Line Items */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <h2 className="text-lg lg:text-xl font-semibold text-foreground">
                    Material Line Items
                  </h2>
                  <button
                    onClick={addLineItem}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-medium rounded-lg hover:bg-primary/20 transition-colors w-full sm:w-auto justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Add Row
                  </button>
                </div>

                <GlassCard className="p-4 lg:p-6" hover={false}>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full min-w-[600px]">
                      <thead>
                        <tr className="border-b border-white/10">
                          <th className="text-left py-3 text-sm font-medium text-muted-foreground">
                            Material
                          </th>
                          <th className="text-center py-3 text-sm font-medium text-muted-foreground w-32">
                            Quantity
                          </th>
                          <th className="text-center py-3 text-sm font-medium text-muted-foreground w-32">
                            Unit Price
                          </th>
                          <th className="text-right py-3 text-sm font-medium text-muted-foreground w-32">
                            Subtotal
                          </th>
                          <th className="w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {lineItems.map((item, index) => (
                          <motion.tr
                            key={item.temp_id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border-b border-white/5"
                          >
                            <td className="py-3">
                              <Select
                                value={item.material_id}
                                onValueChange={(value) =>
                                  handleMaterialChange(item.temp_id, value)
                                }
                              >
                                <SelectTrigger className="bg-muted/30 border-white/10">
                                  <SelectValue placeholder="Select material" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-white/10">
                                  {materials.map((material) => (
                                    <SelectItem
                                      key={material.material_id}
                                      value={String(material.material_id)}
                                    >
                                      <div className="flex items-center gap-2">
                                        <Package className="h-3 w-3 text-primary" />
                                        {material.item_name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </td>
                            <td className="py-3 text-center">
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.temp_id,
                                    Number(e.target.value),
                                  )
                                }
                                className="w-24 mx-auto bg-muted/30 border-white/10 text-center"
                              />
                            </td>
                            <td className="py-3 text-center text-muted-foreground">
                              ${getMaterialPrice(item.material_id).toFixed(2)}
                            </td>
                            <td className="py-3 text-right font-medium text-foreground">
                              $
                              {item.subtotal.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => removeLineItem(item.temp_id)}
                                disabled={lineItems.length === 1}
                                className="p-1.5 text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="md:hidden space-y-4">
                    {lineItems.map((item, index) => (
                      <motion.div
                        key={item.temp_id}
                        className="p-4 bg-muted/20 rounded-xl border border-white/5"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <span className="text-xs text-muted-foreground">
                            Item #{index + 1}
                          </span>
                          <button
                            onClick={() => removeLineItem(item.temp_id)}
                            disabled={lineItems.length === 1}
                            className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <Label className="text-xs text-muted-foreground">
                              Material
                            </Label>
                            <Select
                              value={item.material_id}
                              onValueChange={(value) =>
                                handleMaterialChange(item.temp_id, value)
                              }
                            >
                              <SelectTrigger className="mt-1 bg-muted/30 border-white/10">
                                <SelectValue placeholder="Select material" />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-white/10">
                                {materials.map((material) => (
                                  <SelectItem
                                    key={material.material_id}
                                    value={String(material.material_id)}
                                  >
                                    {material.item_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Quantity
                              </Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    item.temp_id,
                                    Number(e.target.value),
                                  )
                                }
                                className="mt-1 bg-muted/30 border-white/10"
                              />
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">
                                Unit Price
                              </Label>
                              <div className="mt-1 px-3 py-2 bg-muted/10 rounded-md text-muted-foreground text-sm border border-white/5 h-10 flex items-center">
                                ${getMaterialPrice(item.material_id).toFixed(2)}
                              </div>
                            </div>
                          </div>

                          <div className="pt-2 border-t border-white/5">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-muted-foreground">
                                Subtotal
                              </span>
                              <span className="text-lg font-bold text-primary">
                                $
                                {item.subtotal.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </GlassCard>

                {/* Total Cost Display */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 lg:p-8 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30"
                >
                  <div className="text-center">
                    <p className="text-muted-foreground mb-2">
                      Total Estimated Cost
                    </p>
                    <motion.div
                      key={displayedCost}
                      className="text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent"
                    >
                      ${displayedCost.toLocaleString()}
                    </motion.div>
                    <p className="text-sm text-muted-foreground mt-4">
                      *Based on current market rates. Actual costs may vary.
                    </p>
                  </div>
                </motion.div>

                {/* Save Estimate Button */}
                <div className="flex justify-center pt-4">
                  <GlowButton
                    onClick={handleSaveEstimate}
                    size="lg"
                    className="w-full sm:w-auto"
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="animate-spin h-5 w-5" />
                    ) : (
                      <Save className="h-5 w-5" />
                    )}
                    Save Estimate
                  </GlowButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 lg:mt-12 pb-10">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setStep(step - 1)}
              disabled={step === 1}
              className={`flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-medium transition-all ${
                step === 1
                  ? "opacity-50 cursor-not-allowed text-muted-foreground"
                  : "bg-muted/30 text-foreground hover:bg-muted/50"
              }`}
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline">Previous</span>
            </motion.button>

            {step < 3 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setStep(step + 1)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-medium transition-all ${
                  !canProceed()
                    ? "opacity-50 cursor-not-allowed bg-muted/30 text-muted-foreground"
                    : "bg-primary text-primary-foreground hover:shadow-glow"
                }`}
              >
                <span className="hidden sm:inline">Next Step</span>
                <span className="sm:hidden">Next</span>
                <ChevronRight className="h-5 w-5" />
              </motion.button>
            ) : null}
          </div>
        </div>
      </main>
    </div>
  );
};

export default RetrofitCalculator;
