import { ReactNode } from "react";
import Link from "next/link";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(20px)' }}>
      {/* Sidebar */}
      <aside style={{ width: '250px', borderRight: '1px solid rgba(255,255,255,0.1)', padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Link href="/" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '2rem' }}>ApplyMate</Link>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {['Overview', 'Applications', 'Review Queue', 'Insights', 'Preferences', 'Settings'].map(item => (
            <div key={item} style={{ padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', background: item === 'Overview' ? 'rgba(255,255,255,0.1)' : 'transparent', color: item === 'Overview' ? '#fff' : 'rgba(255,255,255,0.6)', fontWeight: item === 'Overview' ? 600 : 400 }}>
              {item}
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '3rem', overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
