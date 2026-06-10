import prisma from "@/lib/prisma";
import { tailorResume } from "../resume/tailor";
import { calculateAtsScore } from "../resume/actions";

export async function runAutoApplyAgent(userId: string, jobListingId: string) {
  // 1. Check user preferences
  const prefs = await prisma.jobPreference.findUnique({ where: { userId } });
  const isAutoApply = prefs?.autoApply || false;

  // 2. Generate a tailored resume (or fallback to original if API fails)
  let newResume;
  try {
    newResume = await tailorResume(userId, jobListingId);
    if (!newResume.tailoredContent) throw new Error("Tailored content empty");
  } catch (err) {
    console.error("Tailoring failed, falling back to base resume:", err);
    newResume = await prisma.resume.findFirst({
      where: { userId, isActive: true },
      orderBy: { id: "desc" }
    });
    if (!newResume) throw new Error("No resume found");
  }

  const job = await prisma.jobListing.findUnique({ where: { id: jobListingId } });
  if (!job) throw new Error("Job not found");

  // 3. Calculate ATS Score (fallback if it fails)
  let score = 50;
  try {
    const scoreResult = await calculateAtsScore(newResume.tailoredContent || newResume.originalContent, job.description);
    score = scoreResult.score;
  } catch (e) {
    console.error("ATS calculation failed:", e);
  }

  // 4. Update the generated resume with ATS score
  await prisma.resume.update({
    where: { id: newResume.id },
    data: { atsScore: score }
  });

  if (isAutoApply) {
    // Agent applies automatically
    const application = await prisma.application.create({
      data: {
        userId,
        jobListingId,
        resumeVersionId: newResume.id,
        status: "QUEUED",
      }
    });

    // Since we removed Redis for Vercel compatibility, the background worker 
    // will now simply poll the Postgres database for applications with status = "QUEUED".
    // We don't need to push anything to a message queue.

    return { applied: true, score };
  } else {
    // Generate HumanReviewItem for manual verification
    await prisma.application.create({
      data: {
        userId,
        jobListingId,
        resumeVersionId: newResume.id,
        status: "PENDING_REVIEW",
      }
    });

    return { applied: false, score, message: "Awaiting manual verification" };
  }
}
