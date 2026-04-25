"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { springPhysics } from "./GlassCard";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary";
}

export function Button({ children, variant = "primary", className = "", ...props }: ButtonProps) {
  const baseStyle = {
    padding: "0.75rem 1.5rem",
    borderRadius: "12px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    color: "#fff",
    outline: "none",
    position: "relative" as const,
    overflow: "hidden",
  };

  const variants = {
    primary: {
      background: "linear-gradient(135deg, var(--primary), #a855f7)",
      boxShadow: "0 4px 14px var(--primary-glow)",
    },
    secondary: {
      background: "rgba(255, 255, 255, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      backdropFilter: "blur(12px)",
    }
  };

  return (
    <motion.button
      style={{ ...baseStyle, ...variants[variant], ...props.style }}
      className={className}
      transition={springPhysics}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
