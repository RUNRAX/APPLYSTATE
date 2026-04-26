"use client";
import React from "react";
import "./aurora.css"; // We'll add this next

export default function AuroraBackground() {
  return (
    <div className="aurora-container">
      <div className="aurora-blob aurora-blob-1"></div>
      <div className="aurora-blob aurora-blob-2"></div>
      <div className="aurora-blob aurora-blob-3"></div>
      <div className="aurora-blob aurora-blob-4"></div>
      <div className="aurora-overlay"></div>
    </div>
  );
}
