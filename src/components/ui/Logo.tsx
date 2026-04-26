import Link from "next/link";
import React from "react";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={className} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{
        width: "36px", height: "36px",
        borderRadius: "10px",
        background: "var(--gradient-vivid)",
        boxShadow: "var(--shadow-glow)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 800, fontSize: "1.2rem"
      }}>
        A
      </div>
      <span className="font-display text-gradient" style={{ fontSize: "1.5rem", fontWeight: 700, letterSpacing: "-0.02em" }}>
        ApplyMate
      </span>
    </Link>
  );
}
