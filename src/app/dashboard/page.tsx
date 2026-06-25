import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function DashboardOverview() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  let totalApplied = 0;
  let queuedApps = 0;
  let pendingReviews = 0;
  let avgMatch = 0;
  let resume = null;
  let connectedPlatforms: string[] = [];

  try {
    totalApplied = await prisma.application.count({ where: { userId, status: "SUBMITTED" } });
    queuedApps = await prisma.application.count({ where: { userId, status: "QUEUED" } });
    pendingReviews = await prisma.application.count({ where: { userId, status: "PENDING_REVIEW" } });
    
    const allApps = await prisma.application.findMany({ where: { userId }, include: { jobListing: true } });
    avgMatch = allApps.length > 0 
      ? Math.round(allApps.reduce((acc, app) => acc + (app.jobListing.matchScore || 0), 0) / allApps.length) 
      : 0;

    resume = await prisma.resume.findFirst({ where: { userId, isActive: true }, orderBy: { id: "desc" } });

    const platforms = await prisma.platformCredential.findMany({ where: { userId }, select: { platform: true } });
    connectedPlatforms = platforms.map(p => p.platform);

    const agentStatus = await prisma.agentStatus.findUnique({ where: { userId } });
    const isActive = agentStatus && agentStatus.status !== "IDLE" && agentStatus.status !== "PAUSED" && agentStatus.status !== "SLEEPING" && agentStatus.status !== "ERROR";

  } catch (error) {
    console.error("Database connection failed on dashboard:", error);
  }

  // Check if they need onboarding
  // We removed the forced redirect so users can explore the dashboard first.
  // if (!profile) {
  //   redirect("/dashboard/onboarding");
  // }

  // Use the queried agent status to determine active bots
  // (IDLE and SLEEPING just mean the worker is between jobs but still running)
  const activeBotsCount = await prisma.agentStatus.count({ 
    where: { 
      userId, 
      status: { notIn: ["PAUSED", "ERROR"] } 
    } 
  }).catch(() => 0);

  return (
    <DashboardClient 
      stats={{
        totalApplied,
        queuedApps,
        pendingReviews,
        matchRate: `${avgMatch}%`,
        activeBots: activeBotsCount
      }} 
      initialResume={resume}
      connectedPlatforms={connectedPlatforms}
    />
  );
}
