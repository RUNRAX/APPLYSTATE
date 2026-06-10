"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import { encryptCredential } from "@/lib/vault";

export async function savePlatformCredential(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  let platform = formData.get("platform") as string;
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const loginMethod = formData.get("loginMethod") as string;

  if (loginMethod && loginMethod !== "direct") {
    platform = `${platform} (${loginMethod})`;
  }

  if (!platform || !username || !password) {
    throw new Error("All fields are required");
  }

  // Encrypt both email and password
  const encryptedPayload = encryptCredential({ email: username, password });

  // Check if credential exists
  const existing = await prisma.platformCredential.findFirst({
    where: { userId: session.user.id, platform: platform }
  });

  if (existing) {
    await prisma.platformCredential.update({
      where: { id: existing.id },
      data: {
        vaultPath: encryptedPayload,
        isActive: true
      }
    });
  } else {
    await prisma.platformCredential.create({
      data: {
        userId: session.user.id,
        platform: platform,
        vaultPath: encryptedPayload,
        isActive: true
      }
    });
  }

  redirect("/dashboard");
}
