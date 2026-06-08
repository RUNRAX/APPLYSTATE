import prisma from "@/lib/prisma";
import { tailorResume } from "../resume/tailor";
import { calculateAtsScore } from "../resume/actions";

export async function runAutoApplyAgent(userId: string, jobListingId: string) {
  // 1. Check user preferences
  const prefs = await prisma.jobPreference.findUnique({ where: { userId } });
  const isAutoApply = prefs?.autoApply || false;

  // 2. Generate a tailored resume
  const newResume = await tailorResume(userId, jobListingId);
  if (!newResume.tailoredContent) throw new Error("Resume tailoring failed");

  const job = await prisma.jobListing.findUnique({ where: { id: jobListingId } });
  if (!job) throw new Error("Job not found");

  // 3. Calculate ATS Score
  const { score } = await calculateAtsScore(newResume.tailoredContent, job.description);

  // 4. Update the generated resume with ATS score
  await prisma.resume.update({
    where: { id: newResume.id },
    data: { atsScore: score }
  });

  if (isAutoApply) {
    // Agent applies automatically
    // In a real app, this would use Puppeteer/Playwright to submit the application on the remote platform
    
    await prisma.application.create({
      data: {
        userId,
        jobListingId,
        resumeVersionId: newResume.id,
        status: "SUBMITTED",
        submittedAt: new Date(),
      }
    });

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
