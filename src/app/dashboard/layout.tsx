"use client";
import { ReactNode, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./dashboard.module.css";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  FileText,
  Eye,
  BarChart3,
  SlidersHorizontal,
  Lock,
  LogOut,
  Bell,
  Search,
  FileEdit,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
// Removed LiquidGlassFilter to fix clipping
import { NotificationBell } from "./NotificationBell";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const filterId = useId().replace(/:/g, "");

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Applications', href: '/dashboard/applications', icon: FileText },
    { label: 'Review Queue', href: '/dashboard/review', icon: Eye },
    { label: 'Resume Builder', href: '/dashboard/resume-builder', icon: FileEdit },
    { label: 'Resume Analysis', href: '/dashboard/resume-analysis', icon: Sparkles },
    { label: 'Insights', href: '/dashboard/insights', icon: BarChart3 },
    { label: 'Preferences', href: '/dashboard/preferences', icon: SlidersHorizontal },
    { label: 'Settings', href: '/dashboard/settings', icon: Lock },
  ];

  const currentPage = navItems.find(item =>
    item.end ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className={styles.dashboardOuter}>
      {/* Background Orbs for Glassmorphism Refraction */}
      <div style={{ position: 'fixed', top: '20%', left: '-5%', width: '30vw', height: '30vw', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '10%', left: '20%', width: '40vw', height: '40vw', background: 'radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-10%', right: '10%', width: '35vw', height: '35vw', background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '40%', right: '30%', width: '25vw', height: '25vw', background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(0,0,0,0) 70%)', borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
      
      {/* SVG filter removed to prevent header clipping */}
      
      {/* Sidebar — floating glass-strong card */}
      <aside className={`glass-strong ${styles.sidebar}`}>
        <div className={styles.sidebarHeader}>
          <Logo />
        </div>

        <nav className={styles.sidebarNav}>
          {navItems.map(item => {
            const isActive = item.end
              ? pathname === item.href
              : pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                <Icon className={styles.navIcon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className={styles.userName}>
                {session?.user?.name || 'User'}
              </div>
              <div className={styles.userEmail}>
                {session?.user?.email}
              </div>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className={styles.signOutBtn}
          >
            <LogOut style={{ width: '0.875rem', height: '0.875rem' }} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        <div className={styles.scrollArea}>
          {/* Header */}
          <header className={styles.header}>
            <div className={styles.headerGlow} />
            <div className={styles.headerLeft}>
              <div className={styles.headerLabel}>Dashboard</div>
              <div className={styles.headerTitle}>
                {currentPage?.label || 'Overview'}
              </div>
            </div>
            <div className={styles.headerActions}>
              {/* Search bar */}
              <div className={`glass-pill ${styles.searchBar}`}>
                <Search style={{ width: '0.875rem', height: '0.875rem', color: 'rgba(255,255,255,0.5)' }} />
                <input
                  placeholder="Search jobs, companies…"
                  className={styles.searchInput}
                />
              </div>

              {/* Agent Active badge */}
              <div className={`glass-pill ${styles.agentBadge}`}>
                <span className={styles.agentDot}>
                  <span className={styles.agentDotPing} />
                  <span className={styles.agentDotCore} />
                </span>
                <span style={{ fontWeight: 600, color: 'var(--success)' }}>Agent Active</span>
              </div>

              {/* Notification bell */}
              <NotificationBell />
            </div>
          </header>

          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              duration: 0.45, 
              ease: [0.22, 1, 0.36, 1],
              scale: { duration: 0.4 }
            }}
            style={{ padding: '0 1.5rem 2rem 1.5rem' }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
