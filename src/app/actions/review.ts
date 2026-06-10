"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { revalidatePath } from "next/cache";

export async function approveApplication(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const app = await prisma.application.findUnique({
    where: { id: applicationId, userId: session.user.id }
  });

  if (!app) throw new Error("Application not found");

  // Move status to QUEUED so the bot picks it up
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "QUEUED" }
  });

  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectApplication(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const app = await prisma.application.findUnique({
    where: { id: applicationId, userId: session.user.id }
  });

  if (!app) throw new Error("Application not found");

  // Move status to REJECTED or just delete it. We'll mark it REJECTED to keep history.
  await prisma.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED" }
  });

  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard");
  return { success: true };
}
