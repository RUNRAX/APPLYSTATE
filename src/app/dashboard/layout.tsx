"use client";
import { ReactNode } from "react";
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
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const navItems = [
    { label: 'Overview', href: '/dashboard', icon: LayoutDashboard, end: true },
    { label: 'Applications', href: '/dashboard/applications', icon: FileText },
    { label: 'Review Queue', href: '/dashboard/review', icon: Eye },
    { label: 'Insights', href: '/dashboard/insights', icon: BarChart3 },
    { label: 'Preferences', href: '/dashboard/preferences', icon: SlidersHorizontal },
    { label: 'Settings', href: '/dashboard/settings', icon: Lock },
  ];

  const currentPage = navItems.find(item =>
    item.end ? pathname === item.href : pathname.startsWith(item.href)
  );

  return (
    <div className={styles.dashboardOuter}>
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
        {/* Header — glass card */}
        <header className={`glass ${styles.header}`}>
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
            <button className={styles.notifBtn} aria-label="Notifications">
              <Bell style={{ width: '1rem', height: '1rem' }} />
            </button>
          </div>
        </header>

        <div className={styles.scrollArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
