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
      1. Tailor the original resume specifically for this job description by subtly enhancing bullet points with relevant keywords.
      
      CRITICAL INSTRUCTIONS TO PREVENT HALLUCINATIONS:
      - FIX CAPITALIZATION: The PDF parser often extracts Small Caps text with broken capitalization (e.g. "mICROSERVICE", "dATA aNALYSIS", "nEERING"). You MUST fix ALL such text to use standard professional capitalization (e.g. "Microservice", "Data Analysis", "Engineering"). Every single word in the output must have proper capitalization.
      - DO NOT DUPLICATE ENTRIES: You are strictly forbidden from listing the same experience or project twice. Each item must appear EXACTLY ONCE.
      - STRICT CATEGORIZATION: "PROFESSIONAL EXPERIENCE" is ONLY for employment at companies (e.g., Jyesta, MindMatrix, TCS/Ediquity Exam Centers). "KEY TECHNICAL PROJECTS" is ONLY for software applications you built (e.g., TCS iON Manpower, SSCA, Synaptic Cinema).
      - NEVER put projects under Professional Experience. If it is a software project or application, it belongs ONLY in KEY TECHNICAL PROJECTS.
      - EXACT NAMES: DO NOT change, invent, or genericize project names. Use the exact original names (e.g. do not rename "TCS iON Manpower" to "Workforce Management Platform").
      - NO DELETIONS: You MUST include EVERY SINGLE project and EVERY SINGLE job from the original resume. DO NOT summarize or truncate.
      - SPACING: You MUST put a blank line (double newline) after the bullet points of each job/project, before starting the next job/project.
      
      2. Format the tailored resume strictly in standard Markdown, but use HTML spans for right-aligned dates. You MUST use the following exact structure and headers:

      # [FULL NAME]
      
      **[Title 1] | [Title 2]**
      [Email] | [Phone] | [Location]
      [LinkedIn] | [GitHub]
      
      ## PROFESSIONAL SUMMARY
      [1 paragraph summary (fully justified)]
      
      ## TECHNICAL SKILLS
      - **[Category]:** [skills]
      - **[Category]:** [skills]
      
      ## PROFESSIONAL EXPERIENCE
      (List ALL existing jobs from the original resume in this exact format:)
      **[Job Title]** <span style="float:right">**[Month Year - Month Year]**</span>
      *[Company]* — [Location]
      - [Bullet point 1]
      - [Bullet point 2]
      
      ## KEY TECHNICAL PROJECTS
      (List ALL existing projects from the original resume in this exact format:)
      **[Project Name] | [Role]** <span style="float:right">**[Month Year - Month Year]**</span>
      *Technologies: [Tech stack]*
      - [Bullet point 1]
      
      ## EDUCATION
      (List ALL existing degrees from the original resume in this exact format:)
      **[Degree]** <span style="float:right">**[Month Year - Month Year]**</span>
      [University], [Location] | [CGPA]
      
      ## CERTIFICATIONS
      - [Certification 1]
      
      3. Extract an array of the most critical hard skills and keywords from the Job Description (max 15-20).
      4. Calculate an AI-estimated ATS match score (0-100) for the ORIGINAL resume. BE HARSH AND REALISTIC. Do not artificially inflate the score.
      5. Calculate an AI-estimated ATS match score (0-100) for the NEW TAILORED resume. BE REALISTIC. Even with tailoring, a resume rarely scores above 80-85% unless it's a 100% perfect match. Do not give fake 90%+ scores just to look good.

      You must return ONLY a JSON object exactly in this format:
      {
        "extractedKeywords": ["Python", "React", "AWS", "Machine Learning"],
        "originalAtsScore": 45,
        "tailoredAtsScore": 65,
        "tailoredResumeMarkdown": "# RAKSHIT AWATI\\n\\n## PROFESSIONAL SUMMARY\\n..."
      }
    `;

    const response = await ai.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const resultText = response.choices[0]?.message?.content;
    if (!resultText) throw new Error("No response from AI");

    const result = JSON.parse(resultText);
    
    // Deterministic algorithm for a true ATS score
    const calculateDeterministicScore = (text: string, keywords: string[]) => {
      if (!keywords || keywords.length === 0) return 0;
      const normalizedText = text.toLowerCase();
      let matches = 0;
      for (const kw of keywords) {
        if (normalizedText.includes(kw.toLowerCase())) {
          matches++;
        }
      }
      return Math.round((matches / keywords.length) * 100);
    };

    const keywords = result.extractedKeywords || [];
    const originalMathScore = calculateDeterministicScore(resumeText, keywords);
    const tailoredMathScore = calculateDeterministicScore(result.tailoredResumeMarkdown, keywords);

    // Blend the AI's semantic score with the deterministic math score for the most realistic result
    result.originalAtsScore = Math.round((result.originalAtsScore + originalMathScore) / 2);
    result.tailoredAtsScore = Math.round((result.tailoredAtsScore + tailoredMathScore) / 2);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Resume Builder Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process resume" }, { status: 500 });
  }
}
