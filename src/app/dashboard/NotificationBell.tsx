"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import styles from "./dashboard.module.css";
import { AnimatePresence, motion } from "framer-motion";

export function NotificationBell() {
  const [pendingCount, setPendingCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkPending = async () => {
      try {
        const res = await fetch("/api/review/pending-count");
        if (res.ok) {
          const data = await res.json();
          setPendingCount(data.pendingCount || 0);
          setNewCount(data.newJobsCount || 0);
        }
      } catch (e) {
        console.error("Failed to fetch counts", e);
      }
    };
    checkPending();
    const interval = setInterval(checkPending, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const totalNotifications = pendingCount + newCount;

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={styles.notifBtn} 
        aria-label="Notifications"
      >
        <div style={{ position: 'relative' }}>
          <Bell style={{ width: '1rem', height: '1rem' }} />
          {totalNotifications > 0 && (
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
              {totalNotifications}
            </span>
          )}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{
              position: 'absolute',
              top: '100%',
              right: 0,
              marginTop: '0.5rem',
              width: '300px',
              background: 'rgba(20, 20, 20, 0.85)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
              padding: '1rem',
              zIndex: 50,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'rgba(255,255,255,0.9)', marginBottom: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>
              Notifications
            </h4>
            
            {totalNotifications === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textAlign: 'center', padding: '1rem 0' }}>
                You're all caught up!
              </p>
            ) : (
              <>
                {newCount > 0 && (
                  <div style={{ padding: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                    <p style={{ fontSize: '0.85rem', color: '#93c5fd', margin: 0 }}>
                      <strong style={{ color: '#60a5fa' }}>{newCount} New Jobs</strong> discovered by the agent! They are currently being analyzed and applied to.
                    </p>
                  </div>
                )}
                
                {pendingCount > 0 && (
                  <Link href="/dashboard/review" onClick={() => setIsOpen(false)} style={{ textDecoration: 'none' }}>
                    <div style={{ padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.2)', transition: 'background 0.2s', cursor: 'pointer' }}>
                      <p style={{ fontSize: '0.85rem', color: '#fcd34d', margin: 0 }}>
                        <strong style={{ color: '#fbbf24' }}>{pendingCount} Applications</strong> require your manual review. Click here to approve them.
                      </p>
                    </div>
                  </Link>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
