"use server";

import { auth } from "@/features/auth/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateJobPreferences(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const targetRoles = formData.get("targetRoles")?.toString().split(",").map(s => s.trim()).filter(Boolean) || [];
  const locations = formData.get("locations")?.toString().split(",").map(s => s.trim()).filter(Boolean) || [];
  const experienceLevel = formData.getAll("experienceLevel").map(s => s.toString());
  const datePosted = formData.get("datePosted")?.toString() || null;

  await prisma.jobPreference.upsert({
    where: { userId: session.user.id },
    update: {
      targetRoles,
      locations,
      experienceLevel,
      datePosted,
    },
    create: {
      userId: session.user.id,
      targetRoles,
      locations,
      experienceLevel,
      datePosted,
    }
  });

  revalidatePath("/dashboard/settings");
}
