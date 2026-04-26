"use client";
import { useSSE } from "@/features/dashboard/useSSE";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./dashboard.module.css";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TrendingUp, Clock, ArrowUpRight } from "lucide-react";

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
      staggerChildren: 0.08,
      delayChildren: 0.1,
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } }
};

export default function DashboardClient({ stats }: DashboardClientProps) {
  const events = useSSE();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
    >
      {/* Welcome Hero Banner */}
      <motion.div variants={itemVariants}>
        <GlassCard variant="strong" className={styles.welcomeHero} style={{ padding: 0 }}>
          <div className={styles.heroContent} style={{ padding: '2.5rem 2rem' }}>
            <div className={styles.heroLabel}>Welcome back</div>
            <h1 className={styles.heroTitle}>
              Hello, <span className="text-gradient-vivid" style={{ fontStyle: 'italic' }}>{firstName}.</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Your autonomous agent is scanning <strong>{stats.activeBots > 0 ? '42 boards' : '0 boards'}</strong> right now.
              {stats.queuedApps > 0 ? ` ${stats.queuedApps} high-fit roles need your review.` : ' No pending reviews.'}
            </p>
            <div className={styles.heroActions}>
              <Link href="/dashboard/review">
                <Button variant="primary" size="md">
                  Review Queue <ArrowUpRight size={16} />
                </Button>
              </Link>
              <Button variant="glass" size="md">
                Pause Agent
              </Button>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stat Cards — 2 column layout */}
      <motion.div variants={itemVariants} className={styles.statsGrid}>
        <StatCard
          label="Total Applied"
          value={stats.totalApplied}
          trend="up"
          trendValue="+12 this week"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Queued"
          value={stats.queuedApps}
          trend="neutral"
          trendValue="Ready to ship"
          icon={<Clock size={20} />}
        />
      </motion.div>

      {/* Bento Grid — Activity + Live Feed */}
      <motion.div variants={itemVariants} className={styles.bentoGrid}>
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Application Activity</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Last 7 days</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '8px', paddingTop: '2rem', minHeight: '200px' }}>
            {[4, 7, 3, 8, 2, 9, 5].map((val, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${(val / 10) * 100}%` }}
                  transition={{ type: "spring", damping: 25, stiffness: 100, delay: 0.3 + (i * 0.08) }}
                  style={{
                    width: '100%',
                    background: i === 5 ? 'var(--gradient-vivid)' : 'rgba(255,255,255,0.08)',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: i === 5 ? 'var(--shadow-glow)' : 'none'
                  }}
                />
                <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                </span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Live Event Feed</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)', animation: 'pulse 2s infinite' }}></span>
              <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 600 }}>Live</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingRight: '0.5rem', maxHeight: '300px' }}>
            <AnimatePresence>
              {events.length === 0 ? (
                <div style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', textAlign: 'center', padding: '2rem 0' }}>
                  Waiting for events...
                </div>
              ) : (
                events.map((ev, i) => (
                  <motion.div
                    key={i + ev.title}
                    initial={{ opacity: 0, x: -16, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
                    style={{
                      padding: '0.85rem',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <StatusBadge status={ev.type.replace('_', ' ')} />
                      <span style={{ fontSize: '0.7rem', color: 'var(--muted-foreground)' }}>
                        {ev.timestamp || 'Just now'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 500 }}>{ev.title}</div>
                    {ev.company && <div style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)', marginTop: '0.2rem' }}>at {ev.company}</div>}
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
