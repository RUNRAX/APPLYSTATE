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

  // Manually invoke the Auto Apply Agent
  // Note: we can't await this fully if it blocks, but runAutoApplyAgent queues the task in BullMQ now
  await runAutoApplyAgent(session.user.id, job.id);

  revalidatePath("/dashboard");
  return { success: true };
}
