"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { runAutoApplyAgent } from "@/features/automation/apply-agent";
import { revalidatePath } from "next/cache";

export async function testAutoApply(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const jobUrl = formData.get("jobUrl") as string;
  if (!jobUrl) throw new Error("Job URL is required");

  // Create a dummy job listing to test the bot
  const job = await prisma.jobListing.create({
    data: {
      listingUrl: jobUrl,
      title: "Test Engineering Role",
      company: "Test Company Inc.",
      description: "This is a dummy job description generated for testing the Playwright application bot.",
      platform: jobUrl.includes("linkedin.com") ? "LinkedIn" : "Other",
    }
  });

  // Ensure the user has a base resume for the agent to use
  const existingResume = await prisma.resume.findFirst({
    where: { userId: session.user.id, isActive: true }
  });

  if (!existingResume) {
    await prisma.resume.create({
      data: {
        userId: session.user.id,
        version: "Dummy Base Resume",
        originalContent: "Jane Doe\nSoftware Engineer\nSkills: React, TypeScript, Node.js, Playwright\nExperience: 5 years building autonomous web agents.",
        isActive: true
      }
    });
  }

  // Ensure the user has a profile
  const existingProfile = await prisma.profile.findUnique({
    where: { userId: session.user.id }
  });

  if (!existingProfile) {
    await prisma.profile.create({
      data: {
        userId: session.user.id,
        skills: ["React", "TypeScript"],
        education: {},
        experience: {},
        certifications: {},
        projects: {}
      }
    });
  }

  // Manually invoke the Auto Apply Agent
  await runAutoApplyAgent(session.user.id, job.id);

  revalidatePath("/dashboard");
}
