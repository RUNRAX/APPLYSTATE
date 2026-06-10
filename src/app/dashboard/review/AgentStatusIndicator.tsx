"use client";

import { useEffect, useState } from "react";
import { getAgentStatus } from "@/app/actions/agent";
import { Bot, RefreshCcw, Search, Zap, UserX, AlertCircle } from "lucide-react";

export function AgentStatusIndicator() {
  const [status, setStatus] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

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
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Discovery Agent: <span style={{ color }}>{status.status}</span>
        </h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>
          {status.message}
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', position: 'relative' }}>
        <button 
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onClick={async () => {
            const { stopAgent, startAgent } = await import("@/app/actions/agent");
            if (s === "PAUSED") {
              await startAgent();
              setStatus({ ...status, status: "IDLE", message: "Agent started, waiting for next cycle" });
              showToast("Agent started successfully!");
            } else {
              await stopAgent();
              setStatus({ ...status, status: "PAUSED", message: "Agent stopped by user" });
              showToast("Agent stopped and paused.");
            }
          }}
          style={{
            padding: '0.5rem 1rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            fontSize: '0.8rem',
            fontWeight: 500,
            transition: 'all 0.2s ease',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {s === "PAUSED" ? "Start Agent" : "Stop Agent"}
        </button>
        <button 
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          onClick={() => {
            getAgentStatus().then(setStatus);
            showToast("Agent status refreshed!");
          }}
          style={{
            padding: '0.5rem',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
        >
          <RefreshCcw size={16} />
        </button>

        {toastMessage && (
          <div style={{
            position: 'absolute',
            bottom: '-40px',
            right: 0,
            background: '#10b981',
            color: 'white',
            padding: '0.4rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.75rem',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            animation: 'fadeInOut 2s forwards'
          }}>
            {toastMessage}
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translateY(-5px); }
          15% { opacity: 1; transform: translateY(0); }
          85% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(-5px); }
        }
      `}} />
    </div>
  );
}
