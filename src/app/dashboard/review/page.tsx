import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import ReviewQueueClient from "./ReviewQueueClient";

export default async function ReviewQueuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const rawApplications = await prisma.application.findMany({
    where: { 
      userId: session.user.id, 
      status: { in: ['PENDING_REVIEW', 'QUEUED', 'APPLIED'] } 
    },
    include: { jobListing: true },
    orderBy: { id: 'desc' }
  });

  const pendingApplications = await Promise.all(
    rawApplications.map(async (app) => {
      let resumeVersion = null;
      if (app.resumeVersionId) {
        resumeVersion = await prisma.resume.findUnique({
          where: { id: app.resumeVersionId }
        });
      }
      return { ...app, resumeVersion };
    })
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 className="font-display" style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>Review Queue</h1>
        <p style={{ color: 'var(--muted-foreground)' }}>Tasks requiring your manual attention to unblock the agent.</p>
      </div>

      <ReviewQueueClient applications={pendingApplications} />
    </div>
  );
}
