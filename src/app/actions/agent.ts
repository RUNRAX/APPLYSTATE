"use server";

import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";

export async function getAgentStatus() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const status = await prisma.agentStatus.findUnique({
    where: { userId: session.user.id }
  });

  return status;
}
