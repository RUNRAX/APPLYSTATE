"use client";
import { GlassCard } from "@/components/ui/GlassCard";
import { useSSE } from "@/features/dashboard/useSSE";
import { motion, AnimatePresence } from "framer-motion";

interface DashboardClientProps {
  stats: {
    totalApplied: number;
    queuedApps: number;
    matchRate: string;
    activeBots: number;
  };
}

export default function DashboardClient({ stats }: DashboardClientProps) {
  const events = useSSE();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Dashboard</h1>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>Your autonomous agent is active and applying.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[
          { label: 'Total Applied', val: stats.totalApplied.toString() },
          { label: 'Queued', val: stats.queuedApps.toString() },
          { label: 'Avg. Match Rate', val: stats.matchRate },
          { label: 'Active Bots', val: stats.activeBots.toString() }
        ].map(stat => (
          <GlassCard key={stat.label} style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.5rem' }}>{stat.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 700 }}>{stat.val}</div>
          </GlassCard>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1rem' }}>
        <GlassCard style={{ padding: '2rem', minHeight: '400px' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Application Activity</h3>
          <div style={{ width: '100%', height: '250px', border: '1px dashed rgba(255,255,255,0.2)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>
            Activity Visualization Coming Soon
          </div>
        </GlassCard>

        <GlassCard style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: '1.5rem' }}>Live Event Feed</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <AnimatePresence>
              {events.length === 0 ? (
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Waiting for events...</div>
              ) : (
                events.map((ev, i) => (
                  <motion.div 
                    key={i + ev.title} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', borderLeft: ev.type === 'needs_review' ? '4px solid #ef4444' : '4px solid var(--primary)' }}
                  >
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{ev.type.replace('_', ' ')}</div>
                    <div style={{ fontSize: '1rem', fontWeight: 500 }}>{ev.title}</div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
