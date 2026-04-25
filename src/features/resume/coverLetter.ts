import OpenAI from "openai";
import prisma from "../../lib/prisma";

const openai = new OpenAI({
  apiKey: process.env.GROK_API_KEY,
  baseURL: "https://api.x.ai/v1",
});

export async function generateCoverLetter(userId: string, jobListingId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  const job = await prisma.jobListing.findUnique({ where: { id: jobListingId } });
  
  if (!user?.profile || !job) throw new Error("Missing data for cover letter");

  const prompt = `
    Write a 300-word cover letter for the role of ${job.title} at ${job.company}.
    Job Description: ${job.description}
    Candidate Profile: ${JSON.stringify(user.profile.skills)} ${JSON.stringify(user.profile.experience)}
    
    Constraints:
    - Connect one concrete candidate achievement to a specific job requirement.
    - Confident, non-presumptuous call to action.
    - Professional, modern tone.
  `;

  const response = await openai.chat.completions.create({
    model: "grok-2-latest",
    messages: [{ role: "user", content: prompt }],
  });

  const content = response.choices[0].message.content || "";

  const cl = await prisma.coverLetter.create({
    data: {
      userId,
      jobListingId,
      content,
      wordCount: content.split(/\s+/).length
    }
  });

  return cl;
}
