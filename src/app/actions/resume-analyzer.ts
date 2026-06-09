"use server";
import prisma from "@/lib/prisma";
import { auth } from "@/features/auth/auth";
import pdfParse from "pdf-parse";
import { createOpenAI } from '@ai-sdk/openai';
import { generateText } from 'ai';

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
    const { text } = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      prompt: `
        You are an expert ATS (Applicant Tracking System) Analyzer.
        Evaluate the following resume text against the target role: "${targetRole}".
        Provide a highly realistic, strict ATS match score (0-100). Do not be overly generous.
        Provide a concise analysis of strengths and gaps, and list key missing skills.

        OUTPUT FORMAT:
        You MUST output ONLY a valid JSON object matching this exact structure:
        {
          "score": 85,
          "analysis": "2-3 sentence analysis of why this score was given, highlighting strengths and missing key skills.",
          "missingSkills": ["Skill 1", "Skill 2", "Skill 3"],
          "recommendations": ["Recommendation 1 on how to fix formatting or wording", "Recommendation 2"]
        }
        DO NOT wrap the JSON in markdown code blocks. DO NOT include any other text. Output strictly raw JSON.

        RESUME TEXT:
        ${resumeText.substring(0, 15000)}
      `
    });

    let object;
    try {
      const cleanText = text.replace(/```json/g, "").replace(/```/g, "").trim();
      object = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error("Failed to parse LLM JSON:", text);
      throw new Error("AI returned malformed data. Please try again.");
    }

    // Optionally update the ATS score in DB
    await prisma.resume.update({
      where: { id: savedResume.id },
      data: { atsScore: object.score }
    });

    return {
      success: true,
      score: object.score,
      analysis: object.analysis,
      missingSkills: object.missingSkills || [],
      recommendations: object.recommendations || [],
      resumeText: resumeText
    };
  } catch (error: any) {
    console.error("LLM Analysis Error:", error);
    // Explicitly return the error message
    const errorMessage = error.message || "Unknown API error occurred.";
    throw new Error(`AI Analysis Failed: ${errorMessage}`);
  }
}
