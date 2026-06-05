import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
});

export async function POST(req: Request) {
  try {
    const { messages, currentResume, jobDescription } = await req.json();

    const systemMessage = `
      You are an expert ATS resume writer and interactive Copilot helping a user build their resume.
      The user will chat with you to request changes to their resume.
      
      Current Job Description:
      ${jobDescription}
      
      Current Resume Markdown:
      ${currentResume}
      
      CRITICAL INSTRUCTIONS:
      1. Always respond conversationally to the user's request (e.g. "I've moved TCS iON to the projects section for you!").
      2. If you make ANY changes to the resume, you MUST output the FULL, updated resume markdown wrapped in <RESUME_MARKDOWN>...</RESUME_MARKDOWN> tags at the very end of your message.
      3. Never wrap the markdown in \`\`\` backticks inside the tags. Just put the raw markdown inside the <RESUME_MARKDOWN> tags.
      4. If the user just asks a question without needing a resume update, just answer conversationally.
    `;

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: systemMessage,
      messages: messages,
    });

    return result.toTextStreamResponse();
  } catch (error: any) {
    console.error("Resume Copilot Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
