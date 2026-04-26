"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { springPhysics } from "./GlassCard";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "glass" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
}

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
    transition: "all 0.3s ease",
  };

  const sizes = {
    sm: { padding: "0.5rem 1rem", fontSize: "0.85rem", borderRadius: "999px" },
    md: { padding: "0.85rem 1.75rem", fontSize: "0.95rem", borderRadius: "999px" },
    lg: { padding: "1rem 2rem", fontSize: "1.05rem", borderRadius: "999px" },
    icon: { width: "44px", height: "44px", borderRadius: "999px", padding: 0 }
  };

  let customClass = "";
  let variantStyle: React.CSSProperties = {};

  if (variant === "primary") {
    customClass = "liquid-shine shadow-glow";
    variantStyle = {
      background: "var(--gradient-vivid)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      color: "var(--primary-foreground)",
    };
  } else if (variant === "glass") {
    customClass = "glass-pill";
    variantStyle = { color: "var(--foreground)" };
  } else if (variant === "ghost") {
    variantStyle = {
      background: "transparent",
      border: "1px solid transparent",
      color: "rgba(255,255,255,0.8)",
    };
  } else if (variant === "outline") {
    customClass = "glass-pill";
    variantStyle = {
      background: "transparent",
      color: "var(--foreground)",
    };
  } else if (variant === "danger") {
    customClass = "liquid-shine";
    variantStyle = {
      background: "var(--error)",
      boxShadow: "0 4px 20px rgba(239, 68, 68, 0.4)",
      border: "1px solid rgba(255, 255, 255, 0.2)",
      color: "#fff",
    };
  }

  return (
    <motion.button
      style={{ ...baseStyle, ...sizes[size], ...variantStyle, ...style }}
      className={`${customClass} ${className}`}
      transition={springPhysics}
      whileHover={{ scale: 1.02, filter: "brightness(1.1)" }}
      whileTap={{ scale: 0.96 }}
      {...props}
    >
      {children}
    </motion.button>
  );
}
