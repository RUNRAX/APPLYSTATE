"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { springPhysics } from "./GlassCard";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "glass" | "ghost" | "outline" | "danger" | "secondary";
  size?: "sm" | "md" | "lg" | "icon";
}

const smoothSpring = { type: "spring" as const, damping: 30, stiffness: 200, mass: 0.8 };

export function Button({ children, variant = "primary", size = "md", className = "", style, ...props }: ButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontWeight: 600,
    cursor: "pointer",
    outline: "none",
    position: "relative",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    letterSpacing: "0.02em",
    border: "none",
  };

  const sizes = {
    sm: { padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "999px" },
    md: { padding: "0.85rem 1.75rem", fontSize: "0.95rem", borderRadius: "999px" },
    lg: { padding: "1rem 2rem", fontSize: "1.05rem", borderRadius: "999px" },
    icon: { width: "44px", height: "44px", borderRadius: "999px", padding: "0" }
  };

  let customClass = "";
  let variantStyle: React.CSSProperties = {};
  let hoverStyle: { scale?: number; filter?: string; boxShadow?: string; background?: string; color?: string } = { scale: 1.02, filter: "brightness(1.08)" };

  if (variant === "primary") {
    customClass = "liquid-shine";
    variantStyle = {
      background: "var(--gradient-vivid)",
      boxShadow: "0 8px 32px -8px hsla(350, 96%, 60%, 0.5), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.25)",
      color: "var(--primary-foreground)",
    };
    hoverStyle = {
      scale: 1.03,
      boxShadow: "0 12px 48px -8px hsla(350, 96%, 60%, 0.7), inset 0 1px 0 0 hsla(0, 0%, 100%, 0.35)",
      filter: "brightness(1.08)"
    };
  } else if (variant === "glass" || variant === "secondary") {
    customClass = "glass-pill";
    variantStyle = { color: "var(--foreground)" };
    hoverStyle = { scale: 1.02, background: "rgba(100, 160, 255, 0.12)", boxShadow: "0 8px 24px -8px rgba(80, 140, 255, 0.4)" };
  } else if (variant === "ghost") {
    variantStyle = {
      background: "transparent",
      border: "1px solid transparent",
      color: "rgba(255,255,255,0.8)",
    };
    hoverStyle = { scale: 1.02, background: "rgba(100, 160, 255, 0.08)", border: "1px solid rgba(120, 180, 255, 0.15)", color: "var(--foreground)" };
  } else if (variant === "outline") {
    variantStyle = {
      background: "transparent",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      color: "var(--foreground)",
    };
    hoverStyle = { scale: 1.02, background: "rgba(255, 255, 255, 0.05)" };
  } else if (variant === "danger") {
    customClass = "liquid-shine";
    variantStyle = {
      background: "hsla(0, 84%, 60%, 0.9)",
      boxShadow: "0 4px 20px rgba(239, 68, 68, 0.4)",
      color: "#fff",
    };
    hoverStyle = { scale: 1.02, background: "var(--error)" };
  }

  return (
    <motion.button
      style={{ ...baseStyle, ...sizes[size], ...variantStyle, ...style }}
      className={`${customClass} ${className}`}
      transition={smoothSpring}
      whileHover={hoverStyle}
      whileTap={{ scale: 0.97 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
