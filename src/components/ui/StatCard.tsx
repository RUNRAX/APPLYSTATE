"use client";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { springPhysics } from "./GlassCard";

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
}

export function StatCard({ label, value, trend, trendValue, icon }: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const isNumber = typeof value === "number";
  const numValue = isNumber ? (value as number) : parseFloat((value as string).replace(/[^0-9.-]+/g,""));
  const isPercent = typeof value === "string" && value.includes("%");

  useEffect(() => {
    if (!isNumber && isNaN(numValue)) return;
    
    let startTimestamp: number | null = null;
    const duration = 1500; // ms
    
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Easing out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      setDisplayValue(Math.floor(easeOut * numValue));
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(numValue);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [numValue, isNumber]);

  return (
    <motion.div
      transition={springPhysics}
      whileHover={{ y: -4, scale: 1.01 }}
      style={{
        background: "rgba(255, 255, 255, 0.04)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.12)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        borderRadius: "20px",
        padding: "1.5rem",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Accent glow on top edge */}
      <div style={{ position: "absolute", top: 0, left: "10%", right: "10%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(139, 92, 246, 0.5), transparent)" }} />
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
        <div style={{ fontSize: "0.9rem", color: "rgba(255, 255, 255, 0.6)", fontWeight: 500 }}>
          {label}
        </div>
        {icon && (
          <div style={{ color: "var(--primary)", opacity: 0.8 }}>
            {icon}
          </div>
        )}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem" }}>
        <div style={{ fontSize: "2.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
          {!isNumber && isNaN(numValue) ? value : displayValue}
          {isPercent && "%"}
        </div>
        
        {trend && (
          <div style={{ 
            fontSize: "0.85rem", 
            fontWeight: 500,
            display: "flex", 
            alignItems: "center", 
            gap: "0.25rem",
            color: trend === "up" ? "#34d399" : trend === "down" ? "#f87171" : "rgba(255,255,255,0.5)"
          }}>
            {trend === "up" && "↑"}
            {trend === "down" && "↓"}
            {trend === "neutral" && "—"}
            {trendValue && <span>{trendValue}</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}
