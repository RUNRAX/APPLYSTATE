import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import { redirect } from "next/navigation";

export default async function DashboardOverview() {
  const session = await auth();
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Fetch real stats
  const totalApplied = await prisma.application.count({
    where: { userId, status: "SUBMITTED" }
  });

  const queuedApps = await prisma.application.count({
    where: { userId, status: "QUEUED" }
  });
  
  const allApps = await prisma.application.findMany({
    where: { userId },
    include: { jobListing: true }
  });
  
  const avgMatch = allApps.length > 0 
    ? Math.round(allApps.reduce((acc, app) => acc + (app.jobListing.matchScore || 0), 0) / allApps.length) 
    : 0;

  const profile = await prisma.profile.findUnique({
    where: { userId }
  });

  // Check if they need onboarding
  if (!profile) {
    redirect("/dashboard/onboarding");
  }

  return (
    <DashboardClient 
      stats={{
        totalApplied,
        queuedApps,
        matchRate: `${avgMatch}%`,
        activeBots: queuedApps > 0 ? 1 : 0
      }} 
    />
  );
}
