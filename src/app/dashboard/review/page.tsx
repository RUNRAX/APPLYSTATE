import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { GlassCard } from "@/components/ui/GlassCard";
import styles from "../dashboard.module.css";

export default async function ReviewQueuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const reviewItems = await prisma.humanReviewItem.findMany({
    where: { userId: session.user.id, status: 'PENDING' },
    orderBy: { id: 'desc' }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Review Queue</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Tasks requiring your manual attention to unblock the agent.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {reviewItems.length === 0 ? (
          <GlassCard variant="strong" style={{ gridColumn: '1 / -1', padding: '4rem 2rem', textAlign: 'center', color: 'var(--muted-foreground)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', color: 'var(--foreground)', marginBottom: '0.5rem' }}>Queue is empty</h3>
            <p>Your agent is running smoothly without interruptions.</p>
          </GlassCard>
        ) : (
          reviewItems.map((item) => (
            <GlassCard key={item.id} variant="strong" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <StatusBadge status={item.type} />
                <span style={{ fontSize: '0.8rem', color: 'var(--muted-foreground)' }}>Just now</span>
              </div>
              <div>
                <h3 className="font-display" style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                  {item.type === 'CAPTCHA' ? 'Verify you are human' : 'Manual Input Required'}
                </h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)' }}>
                  The agent encountered an obstacle while applying to Job ID: {item.applicationId.slice(0, 8)}...
                </p>
              </div>
              
              {item.screenshotUrl ? (
                 <div style={{ width: '100%', height: '120px', background: 'rgba(0,0,0,0.5)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>Screenshot Placeholder</span>
                 </div>
              ) : (
                 <div style={{ width: '100%', height: '120px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px dashed rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.3)' }}>No screenshot available</span>
                 </div>
              )}

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', paddingTop: '1rem' }}>
                <Button variant="primary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>Resolve</Button>
                <Button variant="glass" style={{ flex: 1, padding: '0.5rem', fontSize: '0.85rem' }}>Skip Job</Button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
