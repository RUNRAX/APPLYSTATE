import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
});

export async function POST(req: Request) {
  try {
    const { messages, currentResume, jobDescription } = await req.json();

    // Truncate resume to avoid exceeding token limits
    const truncatedResume = (currentResume || "").substring(0, 10000);

    const systemMessage = `
      You are an expert ATS resume writer and interactive Copilot helping a user build their resume.
      The user will chat with you to request changes to their resume.
      
      Current Job Description:
      ${jobDescription}
      
      Current Resume Markdown:
      ${truncatedResume}
      
      CRITICAL INSTRUCTIONS:
      1. Always respond conversationally to the user's request FIRST (e.g. "I've moved TCS iON to the projects section for you!").
      2. If you make ANY changes to the resume, you MUST output the FULL, updated resume markdown wrapped in <RESUME_MARKDOWN>...</RESUME_MARKDOWN> tags at the very end of your message.
      3. Never wrap the markdown in \`\`\` backticks inside the tags. Just put the raw markdown inside the <RESUME_MARKDOWN> tags.
      4. If the user just asks a question without needing a resume update, just answer conversationally.
      5. NEVER use inline HTML styles, inline fonts, or font-variant tags (e.g., small-caps). Do not try to "change the font style" using CSS or HTML tags. ONLY use pure, standard Markdown formatting.
      6. ALWAYS FIX CAPITALIZATION: The resume may contain broken capitalization from PDF parsing (e.g. "mICROSERVICE", "dATA aNALYSIS", "nEERING", "GOOGle"). Whenever you output a resume, you MUST fix ALL such words to use standard professional capitalization (e.g. "Microservice", "Data Analysis", "Engineering", "Google"). Every word in the output must be properly capitalized. This applies to EVERY response, not just when the user asks.
    `;

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemMessage,
      messages: messages,
      maxOutputTokens: 4000,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Resume Copilot Error:", error);
    const status = error?.status || error?.statusCode || 500;
    const message = error?.message || "Failed to process request";
    // Forward rate limit errors as 429
    if (status === 429 || message.includes('rate_limit') || message.includes('Rate limit')) {
      return new Response(JSON.stringify({ error: message }), { status: 429 });
    }
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
}
