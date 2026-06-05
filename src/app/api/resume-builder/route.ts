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
      CRITICAL RULE 1: DO NOT delete ANY jobs, degrees, or projects. You MUST include EVERY SINGLE project and EVERY SINGLE job from the original resume. DO NOT summarize or truncate.
      CRITICAL RULE 2: ONLY rewrite the bullet point descriptions to better highlight skills matching the Job Description. DO NOT change company names, dates, or job titles.
      CRITICAL RULE 3: DO NOT MIX Experience and Projects. Put ONLY real work history/internships under PROFESSIONAL EXPERIENCE. Put ONLY software applications and technical projects under KEY TECHNICAL PROJECTS.
      CRITICAL RULE 4: You MAY reorder the items within the "PROFESSIONAL EXPERIENCE" and "KEY TECHNICAL PROJECTS" sections so that the most relevant ones to the Job Description appear at the top.
      CRITICAL RULE 5: You MUST put a blank line (double newline) after the bullet points of each job/project, before starting the next job/project, so they do not clump together.
      
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
      
      3. Calculate an ATS match score (0-100) for the ORIGINAL resume based strictly on keyword overlap and relevance to the JD.
      4. Calculate an ATS match score (0-100) for the NEW TAILORED resume.

      You must return ONLY a JSON object exactly in this format:
      {
        "originalAtsScore": 74,
        "tailoredAtsScore": 95,
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
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Resume Builder Error:", error);
    return NextResponse.json({ error: error.message || "Failed to process resume" }, { status: 500 });
  }
}
