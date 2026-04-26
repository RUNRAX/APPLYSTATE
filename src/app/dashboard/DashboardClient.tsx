"use client";
import { useSSE } from "@/features/dashboard/useSSE";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./dashboard.module.css";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

interface DashboardClientProps {
  stats: {
    totalApplied: number;
    queuedApps: number;
    matchRate: string;
    activeBots: number;
  };
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DashboardClient({ stats }: DashboardClientProps) {
  const events = useSSE();

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
    >
      <motion.div variants={itemVariants}>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          Overview
        </h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Your autonomous agent is active and scanning for opportunities.</p>
      </motion.div>

      <motion.div variants={itemVariants} className={styles.statsGrid}>
        <StatCard 
          label="Total Applied" 
          value={stats.totalApplied} 
          trend="up" 
          trendValue="+12 this week"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
        />
        <StatCard 
          label="Queued" 
          value={stats.queuedApps} 
          trend="neutral"
          trendValue="Ready for submission"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>}
        />
        <StatCard 
          label="Avg. Match Rate" 
          value={stats.matchRate} 
          trend="up"
          trendValue="Top 5%"
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>}
        />
        <StatCard 
          label="Active Bots" 
          value={stats.activeBots} 
          icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>}
        />
      </motion.div>

      <motion.div variants={itemVariants} style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Button variant="primary">
          Pause Agent
        </Button>
        <Link href="/dashboard/applications">
          <Button variant="glass">
            View Applications
          </Button>
        </Link>
        <Link href="/dashboard/review">
          <Button variant="ghost">
            Check Review Queue
          </Button>
        </Link>
      </motion.div>

      <motion.div variants={itemVariants} className={styles.bentoGrid}>
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Application Activity</h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)' }}>Last 7 days</span>
          </div>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '2rem', height: '200px' }}>
            {/* Pure CSS Bar Chart */}
            {[4, 7, 3, 8, 2, 9, 5].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <motion.div 
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / 10) * 100}%` }}
                  transition={{ type: "spring", damping: 20, stiffness: 100, delay: 0.2 + (i * 0.1) }}
                  style={{ 
                    width: '100%', 
                    background: i === 6 ? 'var(--gradient-vivid)' : 'rgba(255,255,255,0.1)', 
                    borderRadius: '4px 4px 0 0',
                    boxShadow: i === 6 ? 'var(--shadow-glow)' : 'none'
                  }} 
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Live Event Feed</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="pulse-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)', animation: 'pulse 2s infinite' }}></span>
              <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 500 }}>Live</span>
            </div>
          </div>
          
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '0.5rem' }}>
            <AnimatePresence>
              {events.length === 0 ? (
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  Waiting for events...
                </div>
              ) : (
                events.map((ev, i) => (
                  <motion.div 
                    key={i + ev.title} 
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    style={{ 
                      padding: '1rem', 
                      background: 'rgba(255,255,255,0.02)', 
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px', 
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <StatusBadge status={ev.type.replace('_', ' ')} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)' }}>
                        {ev.timestamp || 'Just now'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 500 }}>{ev.title}</div>
                    {ev.company && <div style={{ fontSize: '0.85rem', color: 'var(--muted-foreground)', marginTop: '0.25rem' }}>at {ev.company}</div>}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}
