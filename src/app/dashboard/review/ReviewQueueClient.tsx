"use client";
import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import { approveApplication, rejectApplication } from "@/app/actions/review";
import { X } from "lucide-react";

interface ReviewQueueClientProps {
  applications: any[];
}

export default function ReviewQueueClient({ applications }: ReviewQueueClientProps) {
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleApprove = (appId: string) => {
    startTransition(() => {
      approveApplication(appId).then(() => {
        setSelectedApp(null);
      });
    });
  };

  const handleReject = (appId: string) => {
    startTransition(() => {
      rejectApplication(appId).then(() => {
        setSelectedApp(null);
      });
    });
  };

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {applications.length === 0 ? (
          <GlassCard variant="strong" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Queue is empty</h3>
            <p>Your agent is running smoothly without interruptions.</p>
          </GlassCard>
        ) : (
          applications.map((app) => (
            <GlassCard key={app.id} variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <StatusBadge status="Pending Review" />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Waiting for you</span>
              </div>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {app.jobListing.title} at {app.jobListing.company}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                  A resume has been tailored for this job. Please review and approve to apply.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <Button 
                  variant="primary" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                  onClick={() => setSelectedApp(app)}
                >
                  Review Resume
                </Button>
                <Button 
                  variant="danger" 
                  style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}
                  onClick={() => handleReject(app.id)}
                  disabled={isPending}
                >
                  Reject
                </Button>
              </div>
            </GlassCard>
          ))
        )}
      </div>

      <AnimatePresence>
        {selectedApp && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedApp(null)}
              style={{
                position: 'fixed',
                top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)',
                zIndex: 40,
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              style={{
                position: 'fixed',
                top: '5vh',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '90vw',
                maxWidth: '800px',
                height: '90vh',
                background: 'var(--card)',
                borderRadius: '16px',
                boxShadow: 'var(--shadow-elev)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                <div>
                  <h2 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Tailored Resume</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>For {selectedApp.jobListing.title} at {selectedApp.jobListing.company}</p>
                </div>
                <button 
                  onClick={() => setSelectedApp(null)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--muted-foreground)', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', background: '#0a0a0a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center' }}>
                  <div style={{ padding: '0.5rem 1rem', background: 'rgba(74, 222, 128, 0.1)', border: '1px solid rgba(74, 222, 128, 0.2)', borderRadius: '8px', color: '#4ade80', fontSize: '0.9rem', fontWeight: 600 }}>
                    ATS Score: {selectedApp.resumeVersion?.atsScore || "Pending"} / 100
                  </div>
                </div>
                <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'var(--font-sans)', fontSize: '0.95rem', lineHeight: 1.6, color: 'rgba(255,255,255,0.9)' }}>
                  {selectedApp.resumeVersion?.tailoredContent || selectedApp.resumeVersion?.originalContent || "No resume content available."}
                </div>
              </div>

              <div style={{ padding: '1.5rem', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'flex-end', gap: '1rem', background: 'rgba(255,255,255,0.02)' }}>
                <Button variant="outline" onClick={() => setSelectedApp(null)} disabled={isPending}>
                  Cancel
                </Button>
                <Button variant="primary" onClick={() => handleApprove(selectedApp.id)} disabled={isPending}>
                  {isPending ? <><span className="spinner"></span> Approving...</> : "Approve & Queue Agent"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
