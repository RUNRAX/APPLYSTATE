"use client";
import { motion, HTMLMotionProps } from "framer-motion";

export const springPhysics = { type: "spring", damping: 25, stiffness: 300, mass: 0.8 };

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
}

export function GlassCard({ children, className = "", ...props }: GlassCardProps) {
  return (
    <motion.div
      className={`glass-panel ${className}`}
      transition={springPhysics}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      style={{ padding: '1.5rem', ...props.style }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
