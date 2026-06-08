"use server";

import OpenAI from 'openai';
import prisma from "@/lib/prisma";

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function calculateAtsScore(resumeContent: string, jobDescription: string) {
  const prompt = `
    You are an expert ATS (Applicant Tracking System).
    Analyze the following resume against the job description.
    
    Job Description: ${jobDescription}
    Resume: ${resumeContent}
    
    Provide a score from 0 to 100 representing how well the resume matches the job description.
    Consider keyword density, section completion, and overall relevance.
    Output ONLY a JSON object in this exact format:
    {"score": 85}
  `;

  const response = await ai.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [{ role: 'user', content: prompt }],
    response_format: { type: "json_object" }
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return { score: 0 };
  
  try {
    const data = JSON.parse(content);
    return { score: data.score || 0 };
  } catch (e) {
    return { score: 0 };
  }
}
