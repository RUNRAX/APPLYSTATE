"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import React from "react";

export const springPhysics = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 };

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
      whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      {...props}
      style={{ 
        padding: '1.5rem', 
        ...props.style 
      }}
    >
      {children}
    </motion.div>
  );
}
