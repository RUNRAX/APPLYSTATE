"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { redirect } from "next/navigation";

export async function savePlatformCredential(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const platform = formData.get("platform") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string; // In production, encrypt this!

  if (!platform || !username || !password) {
    throw new Error("All fields are required");
  }

  // Create or update credential
  await prisma.platformCredential.upsert({
    where: { 
      userId_platform: { userId: session.user.id, platform: platform }
    },
    update: {
      vaultPath: password, // Simulated encryption
      isActive: true
    },
    create: {
      userId: session.user.id,
      platform: platform,
      vaultPath: password, // Simulated encryption
      isActive: true
    }
  });

  redirect("/dashboard");
}
