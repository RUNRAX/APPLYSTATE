"use client";
import { motion, HTMLMotionProps } from "framer-motion";

export const springPhysics = { type: "spring" as const, damping: 25, stiffness: 300, mass: 0.8 };

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  interactive?: boolean;
}

export function GlassCard({ children, className = "", interactive = false, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-panel ${className}`}
      transition={springPhysics}
      whileHover={interactive ? { scale: 1.02, y: -4 } : undefined}
      whileTap={interactive ? { scale: 0.98 } : undefined}
      style={{ padding: '2rem', ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
