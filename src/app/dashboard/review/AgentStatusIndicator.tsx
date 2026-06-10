"use client";

import { useEffect, useState } from "react";
import { getAgentStatus } from "@/app/actions/agent";
import { Bot, RefreshCcw, Search, Zap, UserX, AlertCircle } from "lucide-react";

export function AgentStatusIndicator() {
  const [status, setStatus] = useState<any>(null);

  useEffect(() => {
    // Initial fetch
    getAgentStatus().then(setStatus);

    // Poll every 3 seconds
    const interval = setInterval(() => {
      getAgentStatus().then(setStatus);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  // Determine styles and icon based on status string
  let icon = <Bot size={18} />;
  let color = "var(--primary)";
  let isPulsing = false;

  const s = status.status?.toUpperCase() || "IDLE";
  
  if (s === "IDLE") {
    color = "var(--muted-foreground)";
  } else if (s === "INITIALIZING" || s === "AUTHENTICATING") {
    icon = <RefreshCcw size={18} className="animate-spin" />;
    color = "#3b82f6"; // blue
    isPulsing = true;
  } else if (s === "SEARCHING") {
    icon = <Search size={18} />;
    color = "#8b5cf6"; // purple
    isPulsing = true;
  } else if (s === "EXTRACTING") {
    icon = <Zap size={18} />;
    color = "#eab308"; // yellow
    isPulsing = true;
  } else if (s.includes("WAITING")) {
    icon = <UserX size={18} />;
    color = "#f97316"; // orange
    isPulsing = true;
  } else if (s === "ERROR") {
    icon = <AlertCircle size={18} />;
    color = "#ef4444"; // red
  } else {
    isPulsing = true;
  }

  return (
    <div style={{
      background: `color-mix(in srgb, ${color} 10%, transparent)`,
      border: `1px solid color-mix(in srgb, ${color} 20%, transparent)`,
      borderRadius: '12px',
      padding: '1rem 1.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem',
      marginBottom: '1rem'
    }}>
      <div style={{ 
        color, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: `color-mix(in srgb, ${color} 20%, transparent)`,
        padding: '0.5rem',
        borderRadius: '50%',
        animation: isPulsing ? 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 'none'
      }}>
        {icon}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Discovery Agent: <span style={{ color }}>{status.status}</span>
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
          {status.message}
        </p>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}} />
    </div>
  );
}
