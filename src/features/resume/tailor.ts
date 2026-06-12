import OpenAI from 'openai';
import prisma from "../../lib/prisma";

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

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
    - CRITICAL: DO NOT remove any projects, internships, or education from the original resume. You MUST include ALL of them.
    - CRITICAL FORMATTING: You MUST preserve all original section headings (e.g. "PROFESSIONAL EXPERIENCE", "PROJECTS"). 
    - CRITICAL FORMATTING: You MUST keep every job title, company name, and date on its own separate line. NEVER merge a project title into a bullet point.
    - Just rewrite the bullet points of those experiences to highlight skills relevant to the Job Description using strong action verbs and quantified metrics.
    - Never add new skills, tools, companies, or degrees that are not in the original resume.
    - Include a targeted summary.
    - DO NOT output any conversational text like "Here is your resume". Output ONLY the plain text ATS format resume.
    - Ensure clear empty lines between different jobs and projects.
  `;

  const response = await ai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 6000
  });

  const tailoredContent = response.choices[0]?.message?.content || "";

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
