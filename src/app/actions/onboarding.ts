"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { redirect } from "next/navigation";
import pdfParse from "pdf-parse";
import { updateProfileVector } from "@/features/matching/embeddings";

export async function submitOnboarding(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const targetRolesRaw = formData.get("targetRoles") as string;
  const locationsRaw = formData.get("locations") as string;
  const remoteOnly = formData.get("remoteOnly") === "on";
  
  const targetRoles = targetRolesRaw ? targetRolesRaw.split(",").map(s => s.trim()) : [];
  const locations = locationsRaw ? locationsRaw.split(",").map(s => s.trim()) : [];

  try {
    // Create or Update JobPreference
    await prisma.jobPreference.upsert({
      where: { userId: session.user.id },
      update: {
        targetRoles,
        locations,
        remote: remoteOnly,
      },
      create: {
        userId: session.user.id,
        targetRoles,
        locations,
        remote: remoteOnly,
      }
    });

    // Create a base Profile if it doesn't exist
    const existingProfile = await prisma.profile.findUnique({
      where: { userId: session.user.id }
    });

    if (!existingProfile) {
      await prisma.profile.create({
        data: {
          userId: session.user.id,
          skills: targetRoles, // rough default
          education: {},
          experience: {},
          certifications: {},
          projects: {}
        }
      });
    }

    // Handle Resume Upload
    const file = formData.get("resumeFile") as File;
    if (file && file.size > 0) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      try {
        const data = await pdfParse(buffer);
        
        await prisma.resume.create({
          data: {
            userId: session.user.id,
            version: "Base Resume",
            originalContent: data.text,
            isActive: true
          }
        });
        
        // Also update the profile vector with the resume contents
        try {
          await updateProfileVector(session.user.id, data.text);
        } catch (embedErr) {
          console.error("Failed to generate profile vector:", embedErr);
        }
      } catch (pdfErr) {
        console.error("Failed to parse PDF:", pdfErr);
        // Fallback or warning could go here
      }
    }
  } catch (e) {
    console.error("Onboarding error:", e);
    // Since this is called via form action without a try-catch wrapper in the client,
    // we could throw an error, but next.js will just show the error boundary.
    // For now, let's just log it and redirect anyway, or throw an error.
    throw new Error("Failed to save onboarding preferences.");
  }

  redirect("/dashboard");
}
