"use client";
import { motion, HTMLMotionProps } from "framer-motion";

export const springPhysics = { type: "spring" as const, damping: 30, stiffness: 200, mass: 0.8 };

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  interactive?: boolean;
  variant?: "default" | "strong";
  glow?: boolean;
}

export function GlassCard({ children, className = "", interactive = false, variant = "default", glow = false, ...props }: GlassCardProps) {
  const baseClass = variant === "strong" ? "glass-strong" : "glass";
  const glowClass = glow ? "shadow-glow" : "";
  const interactiveClass = interactive ? "liquid-shine" : "";

  return (
    <motion.div
      className={`${baseClass} ${glowClass} ${interactiveClass} ${className}`}
      transition={springPhysics}
      whileHover={interactive ? { y: -4, boxShadow: "var(--shadow-elev), 0 0 30px rgba(80, 140, 255, 0.4)" } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      style={{ padding: '1.5rem', ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
