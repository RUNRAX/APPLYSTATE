"use client";
import { motion, type HTMLMotionProps } from "framer-motion";
import { springPhysics } from "./GlassCard";

interface InputProps extends HTMLMotionProps<"input"> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", style, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
      {label && (
        <label style={{ fontSize: "0.9rem", fontWeight: 500, color: "rgba(255,255,255,0.9)", marginLeft: "0.25rem" }}>
          {label}
        </label>
      )}
      <motion.input
        className={className}
        transition={springPhysics}
        whileFocus={{ scale: 1.01, borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary-glow)" }}
        style={{
          background: "rgba(10, 10, 15, 0.4)",
          border: error ? "1px solid var(--error)" : "1px solid var(--glass-border)",
          padding: "0.85rem 1.25rem",
          borderRadius: "16px",
          color: "#fff",
          outline: "none",
          backdropFilter: "blur(12px)",
          width: "100%",
          fontSize: "1rem",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          ...style
        }}
        {...props}
      />
      {error && (
        <span style={{ color: "var(--error)", fontSize: "0.85rem", marginLeft: "0.25rem" }}>
          {error}
        </span>
      )}
    </div>
  );
}
