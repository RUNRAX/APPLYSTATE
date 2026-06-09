"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import pdfParse from "pdf-parse";
import { createOpenAI } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
});

export async function analyzeResumeAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const file = formData.get("resumeFile") as File;
  const targetRole = formData.get("targetRole") as string;

  if (!file || file.size === 0) throw new Error("No file uploaded");
  if (!targetRole) throw new Error("Target role is required");

  // Parse PDF
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  let resumeText = "";
  try {
    const data = await pdfParse(buffer);
    resumeText = data.text;
  } catch (error) {
    throw new Error("Failed to parse PDF file.");
  }

  // Deactivate old resumes and save new one
  await prisma.resume.updateMany({
    where: { userId: session.user.id, isActive: true },
    data: { isActive: false }
  });

  const savedResume = await prisma.resume.create({
    data: {
      userId: session.user.id,
      version: "Base Resume",
      originalContent: resumeText,
      isActive: true
    }
  });

  // Analyze with LLM
  try {
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      schema: z.object({
        score: z.number().describe('The realistic ATS match score from 0 to 100.'),
        analysis: z.string().describe('A 2-3 sentence analysis of why this score was given, highlighting strengths and missing key skills for the target role.'),
        missingSkills: z.array(z.string()).describe('An array of 3-5 important skills missing from the resume for this role.'),
      }),
      prompt: `
        You are an expert ATS (Applicant Tracking System) Analyzer.
        Evaluate the following resume text against the target role: "${targetRole}".
        Provide a highly realistic, strict ATS match score (0-100). Do not be overly generous.
        Provide a concise analysis of strengths and gaps, and list key missing skills.

        RESUME TEXT:
        ${resumeText.substring(0, 15000)}
      `
    });

    // Optionally update the ATS score in DB
    await prisma.resume.update({
      where: { id: savedResume.id },
      data: { atsScore: object.score }
    });

    return {
      success: true,
      score: object.score,
      analysis: object.analysis,
      missingSkills: object.missingSkills,
      resumeText: resumeText
    };
  } catch (error: any) {
    console.error("LLM Analysis Error:", error);
    // If LLM fails, still return the saved resume
    return {
      success: true,
      score: null,
      analysis: "Resume saved, but AI analysis failed due to an API error.",
      missingSkills: [],
      resumeText: resumeText
    };
  }
}
