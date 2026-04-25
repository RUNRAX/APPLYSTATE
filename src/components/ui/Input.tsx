"use client";
import { motion } from "framer-motion";
import { springPhysics } from "./GlassCard";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, className = "", ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {label && <label style={{ fontSize: "0.9rem", color: "rgba(255,255,255,0.8)" }}>{label}</label>}
      <motion.input
        className={className}
        transition={springPhysics}
        whileFocus={{ scale: 1.02, borderColor: "var(--primary)" }}
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          padding: "0.75rem 1rem",
          borderRadius: "12px",
          color: "#fff",
          outline: "none",
          backdropFilter: "blur(12px)",
          width: "100%",
          ...props.style
        }}
        {...props}
      />
    </div>
  );
}
