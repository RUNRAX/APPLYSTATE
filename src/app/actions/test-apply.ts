"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { runAutoApplyAgent } from "@/features/automation/apply-agent";
import { revalidatePath } from "next/cache";

async function scrapeLinkedInGuest(jobUrl: string) {
  // Extract job ID from URL formats like view/1234 or currentJobId=1234
  const jobIdMatch = jobUrl.match(/currentJobId=(\d+)/) || jobUrl.match(/view\/(\d+)/);
  if (!jobIdMatch) return null;

  const jobId = jobIdMatch[1];
  try {
    const res = await fetch(`https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });
    if (!res.ok) return null;
    const text = await res.text();
    
    const title = text.match(/<h2[^>]*top-card-layout__title[^>]*>([\s\S]*?)<\/h2>/i)?.[1]?.trim();
    const company = text.match(/<a[^>]*topcard__org-name-link[^>]*>([\s\S]*?)<\/a>/i)?.[1]?.trim();
    
    // Attempt to strip basic HTML tags from description for ATS readability
    const rawDesc = text.match(/<div[^>]*show-more-less-html__markup[^>]*>([\s\S]*?)<\/div>/i)?.[1]?.trim();
    const desc = rawDesc ? rawDesc.replace(/<[^>]+>/g, '\n').replace(/\n\s*\n/g, '\n').trim() : null;

    if (title && company && desc) {
      return { title, company, description: desc };
    }
  } catch (e) {
    console.error("Failed to scrape LinkedIn guest API", e);
  }
  return null;
}

export async function testAutoApply(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const jobUrl = formData.get("jobUrl") as string;
  if (!jobUrl) throw new Error("Job URL is required");

  // Attempt to fetch real data
  const scrapedData = await scrapeLinkedInGuest(jobUrl);

  const title = scrapedData?.title || "Test Engineering Role";
  const company = scrapedData?.company || "Test Company Inc.";
  const description = scrapedData?.description || "This is a dummy job description generated for testing the Playwright application bot.";

  // Upsert a job listing to test the bot (prevents unique constraint errors on duplicate tests)
  const job = await prisma.jobListing.upsert({
    where: { listingUrl: jobUrl },
    update: {
      title,
      company,
      description
    },
    create: {
      listingUrl: jobUrl,
      title,
      company,
      description,
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
