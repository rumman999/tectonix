import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: "primary" | "accent" | "none";
}

export const GlassCard = ({
  children,
  className,
  hover = true,
  glow = "none",
}: GlassCardProps) => {
  const glowStyles = {
    primary: "hover:shadow-glow",
    accent: "hover:shadow-glow-accent",
    none: "",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      className={cn(
        "glass-card rounded-xl p-6",
        hover && "transition-all duration-300 hover:bg-card/80 hover:border-white/20",
        glowStyles[glow],
        className
      )}
    >
      {children}
    </motion.div>
  );
};
