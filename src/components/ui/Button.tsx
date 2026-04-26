"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { springPhysics } from "./GlassCard";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}

export function Button({ children, variant = "primary", className = "", style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    padding: "0.85rem 1.75rem",
    borderRadius: "16px",
    fontWeight: 600,
    cursor: "pointer",
    border: "none",
    color: "#fff",
    outline: "none",
    position: "relative",
    overflow: "hidden",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    letterSpacing: "0.02em",
  };

  const variants = {
    primary: {
      background: "linear-gradient(135deg, var(--primary), var(--secondary))",
      boxShadow: "0 4px 20px var(--primary-glow), inset 0 1px 0 rgba(255,255,255,0.3)",
    },
    secondary: {
      background: "var(--glass-bg)",
      border: "1px solid var(--glass-border)",
      backdropFilter: "var(--glass-blur)",
      boxShadow: "var(--glass-shadow)",
    },
    danger: {
      background: "linear-gradient(135deg, #ef4444, #b91c1c)",
      boxShadow: "0 4px 20px rgba(239, 68, 68, 0.4)",
    },
    ghost: {
      background: "transparent",
      border: "1px solid transparent",
      color: "rgba(255,255,255,0.7)",
    }
  };

  return (
    <motion.button
      style={{ ...baseStyle, ...variants[variant], ...style }}
      className={className}
      transition={springPhysics}
      whileHover={{ scale: 1.05, filter: "brightness(1.1)" }}
      whileTap={{ scale: 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
