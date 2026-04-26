import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { GlassCard } from "@/components/ui/GlassCard";
import styles from "../dashboard.module.css";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    include: { jobListing: true },
    orderBy: { submittedAt: 'desc' }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Applications</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Track and manage all your automated job applications.</p>
      </div>

      <GlassCard variant="strong" style={{ padding: 0, overflow: 'hidden' }}>
        {applications.length === 0 ? (
          <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📭</div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>No applications yet</h3>
            <p>Your agent will start applying soon. Check back later.</p>
          </div>
        ) : (
          <div className={styles.tableContainer}>
            <table className={styles.glassTable}>
              <thead>
                <tr>
                  <th>Job Title</th>
                  <th>Company</th>
                  <th>Platform</th>
                  <th>Status</th>
                  <th>Match Score</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 500 }}>{app.jobListing.title}</td>
                    <td style={{ color: 'rgba(255,255,255,0.8)' }}>{app.jobListing.company}</td>
                    <td style={{ color: 'rgba(255,255,255,0.6)' }}>{app.jobListing.platform}</td>
                    <td><StatusBadge status={app.status} /></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '100%', maxWidth: '60px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${app.jobListing.matchScore || 0}%`, background: 'var(--gradient-vivid)' }} />
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)' }}>
                          {Math.round(app.jobListing.matchScore || 0)}%
                        </span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem' }}>
                      {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : 'Pending'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
