"use server";
import OpenAI from 'openai';
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function generateResumeAnalysis(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const app = await prisma.application.findUnique({
    where: { id: applicationId, userId: session.user.id },
    include: { jobListing: true }
  });

  if (!app || !app.resumeVersionId) throw new Error("Missing application data");

  const resume = await prisma.resume.findUnique({
    where: { id: app.resumeVersionId }
  });

  if (!resume) throw new Error("Missing resume");

  const originalContent = resume.originalContent || "";
  const tailoredContent = resume.tailoredContent || originalContent;
  const jobDescription = app.jobListing.description || "";

  const prompt = `
    You are an expert HR analyst. Analyze the provided Original Resume, Tailored Resume, and Job Description.
    Provide a JSON object with two fields:
    1. "changesMade": An array of strings explaining exactly what you modified, added, or emphasized in the tailored resume compared to the original to fit the job description better. Be specific and concise. (e.g. "Reordered skills to prioritize Python and Django", "Added a strong executive summary matching the job title").
    2. "missingSkills": An array of strings listing skills or qualifications requested in the job description that are NOT present in the tailored resume (i.e., skills the candidate lacks). If none are missing, return an empty array.

    Output ONLY valid JSON. No markdown formatting or extra text.

    Job Description:
    ${jobDescription}

    Original Resume:
    ${originalContent}

    Tailored Resume:
    ${tailoredContent}
  `;

  try {
    const response = await ai.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    const data = JSON.parse(content);
    
    return {
      success: true,
      changesMade: data.changesMade || [],
      missingSkills: data.missingSkills || []
    };
  } catch (error) {
    console.error("Analysis generation failed", error);
    return { success: false, changesMade: [], missingSkills: [] };
  }
}
