import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

if (typeof globalThis.DOMMatrix === "undefined") {
  (globalThis as any).DOMMatrix = class DOMMatrix {};
}
if (typeof globalThis.Path2D === "undefined") {
  (globalThis as any).Path2D = class Path2D {};
}

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function POST(req: NextRequest) {
  try {
    const pdfParse = require("pdf-parse");
    const formData = await req.formData();
    const pdfFile = formData.get("pdf") as File | null;
    const jobDescription = formData.get("jobDescription") as string | null;

    if (!pdfFile || !jobDescription) {
      return NextResponse.json({ error: "Missing PDF or Job Description" }, { status: 400 });
    }

    // Convert file to Buffer for pdf-parse
    const arrayBuffer = await pdfFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text
    const parsedPdf = await pdfParse(buffer);
    const resumeText = parsedPdf.text;

    // Build Prompt
    const prompt = `
      You are an expert ATS resume writer and recruiter. 
      Analyze the following Job Description and the candidate's current Resume.
      
      Job Description:
      ${jobDescription}

      Original Resume:
      ${resumeText}
      
      Tasks:
      1. Tailor the original resume specifically for this job description. Optimize keywords while retaining the original formatting structure as plain text. Do not hallucinate or invent experience.
      2. Calculate an ATS match score (0-100) based on how well the new tailored resume matches the job description.

      You must return ONLY a JSON object exactly in this format:
      {
        "tailoredResume": "The full tailored resume text...",
        "atsScore": 95
      }
    `;

    const response = await ai.chat.completions.create({
      model: "llama3-70b-8192",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content;
    if (!resultText) throw new Error("No response from AI");

    const result = JSON.parse(resultText);
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Resume Builder Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process resume" }, { status: 500 });
  }
}
