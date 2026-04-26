import { GoogleGenAI } from '@google/genai';
import prisma from "../../lib/prisma";

const ai = new GoogleGenAI({});

export async function tailorResume(userId: string, jobListingId: string) {
  const user = await prisma.user.findUnique({ 
    where: { id: userId }, 
    include: { profile: true, resumes: { where: { isActive: true } } } 
  });
  const job = await prisma.jobListing.findUnique({ where: { id: jobListingId } });
  
  if (!user?.profile || !job || user.resumes.length === 0) throw new Error("Missing data for tailoring");

  const originalResume = user.resumes[0].originalContent;

  const prompt = `
    You are an expert ATS resume writer.
    Job Description: ${job.description}
    Original Resume: ${originalResume}
    
    Task: Rewrite the resume to maximize ATS matching for the given Job Description.
    Constraints:
    - Never add new skills, tools, companies, or degrees that are not in the original resume.
    - Rewrite bullet points using strong action verbs and quantified metrics from the original.
    - Include a targeted summary.
    - Output in plain text standard ATS format.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });

  const tailoredContent = response.text || "";

  // Save the new version
  const newResume = await prisma.resume.create({
    data: {
      userId,
      version: `Tailored for ${job.company}`,
      originalContent: originalResume,
      tailoredContent,
      tailoredForJobId: jobListingId,
      isActive: false, // keep original active as default
    }
  });

  return newResume;
}
