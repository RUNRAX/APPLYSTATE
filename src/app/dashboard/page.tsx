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
        matchRate: "86%", // Still mocked until embeddings run
        activeBots: queuedApps > 0 ? 1 : 0
      }} 
    />
  );
}
