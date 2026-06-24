"use server";

import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getAgentStatus() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return await prisma.agentStatus.findUnique({
    where: { userId: session.user.id }
  });
}

export async function stopAgent() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  await prisma.agentStatus.upsert({
    where: { userId: session.user.id },
    update: { status: "PAUSED", message: "Agent stopped by user" },
    create: { userId: session.user.id, status: "PAUSED", message: "Agent stopped by user" }
  });
  revalidatePath("/dashboard/review");
  return { success: true };
}

export async function startAgent() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };
  await prisma.agentStatus.upsert({
    where: { userId: session.user.id },
    update: { status: "PENDING", message: "Agent triggered — starting immediately...", updatedAt: new Date() },
    create: { userId: session.user.id, status: "PENDING", message: "Agent triggered — starting immediately..." }
  });
  revalidatePath("/dashboard/review");
  return { success: true };
}
