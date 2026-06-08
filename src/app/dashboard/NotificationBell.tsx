"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import styles from "./dashboard.module.css";

export function NotificationBell() {
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await fetch("/api/review/pending-count");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.count || 0);
        }
      } catch (e) {
        console.error("Failed to fetch pending count", e);
      }
    };
    checkPending();
    // Poll every 30 seconds
    const interval = setInterval(checkPending, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/dashboard/review" className={styles.notifBtn} aria-label="Notifications">
      <div style={{ position: 'relative' }}>
        <Bell style={{ width: '1rem', height: '1rem' }} />
        {pendingCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-4px',
            right: '-4px',
            background: 'var(--danger, #ef4444)',
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            borderRadius: '50%',
            width: '14px',
            height: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)'
          }}>
            {pendingCount}
          </span>
        )}
      </div>
    </Link>
  );
}
