"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import React, { useId } from "react";
import { LiquidGlassFilter } from "./LiquidGlassFilter";

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
  const uniqueId = useId().replace(/:/g, "");
  const filterId = `liquid-filter-${uniqueId}`;
  const targetId = `glass-card-${uniqueId}`;
  const blurAmount = variant === "strong" ? 8 : 4;

  return (
    <>
      <LiquidGlassFilter id={filterId} targetId={targetId} blur={blurAmount} />
      <motion.div
        id={targetId}
        className={`${baseClass} ${glowClass} ${interactiveClass} ${className}`}
        transition={springPhysics}
        whileHover={interactive ? { y: -4, scale: 1.01 } : undefined}
        whileTap={interactive ? { scale: 0.98 } : undefined}
        {...props}
        style={{ 
          padding: '1.5rem', 
          backdropFilter: `url(#${filterId}) saturate(200%) contrast(150%) brightness(1.1)`,
          WebkitBackdropFilter: `url(#${filterId}) saturate(200%) contrast(150%) brightness(1.1)`,
          ...props.style 
        }}
      >
        {children}
      </motion.div>
    </>
  );
}
