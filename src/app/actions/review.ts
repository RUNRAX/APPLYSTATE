"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import { revalidatePath } from "next/cache";
import OpenAI from 'openai';

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

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
  revalidatePath("/dashboard/review");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function tweakTailoredResume(applicationId: string, instruction: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const app = await prisma.application.findUnique({
    where: { id: applicationId, userId: session.user.id },
    include: { jobListing: true }
  });

  if (!app || !app.resumeVersionId) throw new Error("Application or resume not found");

  const resume = await prisma.resume.findUnique({
    where: { id: app.resumeVersionId }
  });

  if (!resume) throw new Error("Resume not found");

  const currentContent = resume.tailoredContent || resume.originalContent;
  const jobDescription = app.jobListing.description;

  const prompt = `
    You are an expert ATS resume writer. I need you to edit the following resume based on specific instructions.
    
    Job Description context:
    ${jobDescription}

    Current Tailored Resume:
    ${currentContent}

    USER INSTRUCTION:
    "${instruction}"

    Rewrite the resume applying the user's instruction. 
    
    CRITICAL INSTRUCTIONS (MUST FOLLOW STRICTLY):
    1. NEVER omit any sections from the Original Resume. You MUST include the full PROFESSIONAL EXPERIENCE, PROJECTS, EDUCATION, etc. Do not stop at the summary. The output must be a full, complete resume.
    2. Maintain the exact base resume structure and layout alignment. 
    3. You MUST ensure the candidate's real LinkedIn and GitHub links from the Original Resume are embedded directly under their name at the very top of the resume.
    4. Ensure clear bullet points and section headings (e.g., PROFESSIONAL SUMMARY, TECHNICAL SKILLS, PROFESSIONAL EXPERIENCE). DO NOT write long paragraphs.
    5. Do not add extra conversational text or preambles.

    Output ONLY a valid JSON object with:
    1. "newContent": The fully updated resume text.
    2. "newAtsScore": A number from 1 to 100 representing how well the new tailored resume matches the job description after your edits.
  `;

  try {
    const response = await ai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 6000
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || "{}");
    const newContent = parsed.newContent || "";
    const newAtsScore = parsed.newAtsScore ? parseInt(parsed.newAtsScore) : resume.atsScore;

    if (newContent) {
      await prisma.resume.update({
        where: { id: resume.id },
        data: { 
          tailoredContent: newContent,
          atsScore: newAtsScore 
        }
      });
      revalidatePath("/dashboard/review");
      return { success: true, newContent, newAtsScore };
    }
    return { success: false, error: "Failed to generate content" };
  } catch (error) {
    console.error("Failed to tweak resume", error);
    return { success: false, error: "AI error" };
  }
}
