"use client";
import React, { forwardRef } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", label, error, icon, style, ...props }, ref) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
        {label && (
          <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--muted-foreground)", textTransform: "uppercase", letterSpacing: "0.05em", marginLeft: "0.25rem" }}>
            {label}
          </label>
        )}
        <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
          {icon && (
            <div style={{ position: "absolute", left: "1rem", color: "var(--muted-foreground)" }}>
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`glass-input ${className}`}
            style={{
              width: "100%",
              padding: icon ? "0.85rem 1rem 0.85rem 2.5rem" : "0.85rem 1rem",
              fontSize: "0.95rem",
              outline: "none",
              borderColor: error ? "var(--error)" : undefined,
              ...style
            }}
            {...props}
          />
        </div>
        {error && (
          <span style={{ color: "var(--error)", fontSize: "0.85rem", marginLeft: "0.25rem" }}>
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
