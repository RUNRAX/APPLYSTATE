import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
});

export async function POST(req: Request) {
  try {
    const { prompt, currentResume, jobDescription } = await req.json();

    const systemMessage = `
      You are an expert ATS resume writer and interactive Copilot. 
      The user is trying to format their resume in Markdown based on a specific Job Description.
      
      Current Job Description:
      ${jobDescription}
      
      Current Resume Markdown:
      ${currentResume}
      
      The user will request changes to their resume.
      You must respond with the FULL REVISED MARKDOWN of the resume, incorporating their requested changes.
      
      CRITICAL RULES:
      - Always return ONLY the raw markdown of the resume. 
      - DO NOT wrap it in \`\`\`markdown backticks. 
      - DO NOT output any conversational text, greetings, or explanations (e.g. do not say "Here is the updated resume"). 
      - ONLY output the raw markdown text starting with "# [Name]" so it can be directly rendered.
      - Apply the requested change cleanly to the markdown.
    `;

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemMessage,
      prompt: prompt,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Resume Copilot Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
