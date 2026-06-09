"use client";
import { useTransition } from "react";
import { useSSE } from "@/features/dashboard/useSSE";
import { motion, AnimatePresence } from "framer-motion";
import styles from "./dashboard.module.css";
import { StatCard } from "@/components/ui/StatCard";
import { GlassCard } from "@/components/ui/GlassCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { TrendingUp, Clock, ArrowUpRight, PlayCircle, FileText, Link as LinkIcon } from "lucide-react";
import { testAutoApply } from "@/app/actions/test-apply";

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
  const [isPending, startTransition] = useTransition();
  const events = useSSE();
  const { data: session } = useSession();
  const firstName = session?.user?.name?.split(' ')[0] || 'there';

  const handleTestApply = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const form = e.currentTarget;
    startTransition(() => {
      testAutoApply(formData).then(() => {
        form.reset();
      });
    });
  };

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
          
          <div style={{ padding: '1rem 2rem', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <form onSubmit={handleTestApply} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input name="jobUrl" placeholder="Paste a LinkedIn Job URL to test the bot..." style={{ marginBottom: 0 }} disabled={isPending} required />
              </div>
              <Button variant="primary" type="submit" size="md" disabled={isPending}>
                {isPending ? (
                  <><span style={{ display: 'inline-block', animation: 'spin 1s linear infinite', marginRight: '8px' }}>⏳</span> Queuing...</>
                ) : (
                  <><PlayCircle size={16} /> Test Auto-Apply</>
                )}
              </Button>
            </form>
          </div>
        </GlassCard>
      </motion.div>

      {/* Quick Setup Actions */}
      <motion.div variants={itemVariants} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
        <GlassCard variant="strong" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
              <LinkIcon size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Connect Platform</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Save your LinkedIn credentials securely</p>
            </div>
          </div>
          <Link href="/dashboard/connect/linkedin" style={{ marginTop: 'auto' }}>
            <Button variant="outline" style={{ width: '100%' }}>Connect LinkedIn</Button>
          </Link>
        </GlassCard>

        <GlassCard variant="strong" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <FileText size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Add Base Resume</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>The agent uses this to tailor a new resume for each job</p>
            </div>
          </div>
          <Link href="/dashboard/resume" style={{ marginTop: 'auto' }}>
            <Button variant="primary" style={{ width: '100%' }}>Upload Resume</Button>
          </Link>
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
        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', fontWeight: 600 }}>Application Activity</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Last 7 days</span>
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted-foreground)' }}>
            <p>Gathering application analytics...</p>
          </div>
        </GlassCard>

        <GlassCard variant="strong" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '1.5rem' }}>
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
                  Waiting for live agent events...
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
