import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/Button";

export default async function ResumePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const resume = await prisma.resume.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { id: "desc" }
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Resume Management</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>View and update the base resume the AI agent uses to apply for jobs.</p>
      </div>

      <GlassCard variant="strong" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--foreground)' }}>Current Active Resume</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Version: {resume?.version || "Unknown"}</p>
          </div>
          <Button variant="primary">Upload New Resume</Button>
        </div>

        {resume ? (
          <div style={{ 
            background: 'rgba(0,0,0,0.2)', 
            padding: '1.5rem', 
            borderRadius: '8px', 
            fontFamily: 'monospace', 
            fontSize: '0.85rem', 
            color: 'var(--muted-foreground)',
            whiteSpace: 'pre-wrap',
            maxHeight: '400px',
            overflowY: 'auto',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {resume.originalContent}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--muted-foreground)' }}>
            <p>No resume uploaded yet.</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
