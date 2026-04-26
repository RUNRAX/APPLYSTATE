"use client";
import React, { useEffect, useRef } from "react";
import "./aurora.css";

export default function AuroraBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    let tx = 0, ty = 0, cx = 0, cy = 0;
    const onMove = (e: MouseEvent) => {
      tx = (e.clientX / window.innerWidth - 0.5) * 30;
      ty = (e.clientY / window.innerHeight - 0.5) * 30;
    };
    const tick = () => {
      cx += (tx - cx) * 0.05;
      cy += (ty - cy) * 0.05;
      el.style.setProperty("--mx", `${cx}px`);
      el.style.setProperty("--my", `${cy}px`);
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      className="aurora-container"
      style={{ contain: "strict" }}
    >
      {/* Deep gradient base */}
      <div className="aurora-base" />

      {/* Sphere 1 — coral / magenta marble (top-left) — sharp, no blur */}
      <div
        className="aurora-blob aurora-blob-1"
        style={{
          transform: "translate3d(var(--mx,0), var(--my,0), 0)",
          willChange: "transform",
        }}
      />

      {/* Sphere 2 — teal / blue marble (right) */}
      <div
        className="aurora-blob aurora-blob-2"
        style={{
          transform: "translate3d(calc(var(--mx,0)*-1), calc(var(--my,0)*-1), 0)",
          willChange: "transform",
        }}
      />

      {/* Sphere 3 — orange/red bottom-center */}
      <div
        className="aurora-blob aurora-blob-3"
        style={{
          transform: "translate3d(calc(var(--mx,0)*0.5), calc(var(--my,0)*0.5), 0)",
          willChange: "transform",
        }}
      />

      {/* Sphere 4 — small accent magenta */}
      <div className="aurora-blob aurora-blob-4" />

      {/* Subtle film grain overlay for premium feel */}
      <div
        className="aurora-grain"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
        }}
      />

      {/* Vignette for content readability */}
      <div className="aurora-overlay" />
    </div>
  );
}
