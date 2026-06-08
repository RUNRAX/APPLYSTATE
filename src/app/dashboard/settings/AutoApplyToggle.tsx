"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

interface AutoApplyToggleProps {
  initialValue: boolean;
}

export function AutoApplyToggle({ initialValue }: AutoApplyToggleProps) {
  const [isAuto, setIsAuto] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  const toggleAction = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/auto-apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoApply: !isAuto }),
      });
      if (res.ok) {
        setIsAuto(!isAuto);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
      <div 
        onClick={!loading ? toggleAction : undefined}
        style={{
          width: '50px',
          height: '26px',
          borderRadius: '13px',
          background: isAuto ? 'var(--primary-glow)' : 'rgba(255, 255, 255, 0.1)',
          position: 'relative',
          cursor: loading ? 'wait' : 'pointer',
          transition: 'background 0.3s ease'
        }}
      >
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: '2px',
          left: isAuto ? '26px' : '2px',
          transition: 'left 0.3s ease'
        }} />
      </div>
      <span style={{ fontSize: '0.9rem', color: isAuto ? '#fff' : 'var(--muted-foreground)' }}>
        {isAuto ? "Auto Apply (No Human Review)" : "Manual Verification"}
      </span>
    </div>
  );
}
