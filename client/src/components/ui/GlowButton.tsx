import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface GlowButtonProps {
  children: ReactNode;
  variant?: "primary" | "accent" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
}

export const GlowButton = ({
  children,
  variant = "primary",
  size = "md",
  className,
  onClick,
}: GlowButtonProps) => {
  const baseStyles = "relative inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-300 overflow-hidden";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:shadow-glow-lg border border-primary/50",
    accent: "bg-accent text-accent-foreground hover:shadow-glow-accent-lg border border-accent/50",
    ghost: "bg-transparent text-foreground border border-white/20 hover:bg-white/10 hover:border-white/40",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      onClick={onClick}
    >
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      <motion.div
        className={cn(
          "absolute inset-0 opacity-0 transition-opacity duration-300",
          variant === "primary" && "bg-gradient-to-r from-primary via-cyan-400 to-primary",
          variant === "accent" && "bg-gradient-to-r from-accent via-orange-400 to-accent"
        )}
        whileHover={{ opacity: 0.2 }}
      />
    </motion.button>
  );
};
