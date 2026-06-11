import { Page } from 'playwright';
import OpenAI from 'openai';

const ai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
  baseURL: 'https://api.groq.com/openai/v1',
});

export interface CandidateData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  linkedinUrl?: string;
  githubUrl?: string;
}

export async function extractContactInfo(resumeContent: string): Promise<CandidateData> {
  const prompt = `
    Extract the contact information from the following resume text.
    Return ONLY a raw JSON object with these keys: firstName, lastName, email, phone, linkedinUrl, githubUrl.
    If a field is missing, set it to an empty string. 
    Ensure phone numbers are strings.
    Do NOT wrap in markdown \`\`\`json blocks.
    
    Resume:
    ${resumeContent.substring(0, 1000)}
  `;

  const response = await ai.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
    response_format: { type: "json_object" }
  });

  const content = response.choices[0].message.content || "{}";
  try {
    return JSON.parse(content) as CandidateData;
  } catch (e) {
    console.error("Failed to parse extracted contact info", e);
    return { firstName: "Candidate", lastName: "", email: "", phone: "" };
  }
}

export async function applyToGreenhouse(
  page: Page,
  jobUrl: string,
  candidate: CandidateData,
  resumeFilePath: string,
  updateStatus?: (status: string, message: string) => void
) {
  updateStatus?.('NAVIGATING', `Navigating to Greenhouse job URL: ${jobUrl}`);
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });

  updateStatus?.('EXTRACTING', 'Filling standard candidate information...');
  
  // Fill basic fields
  await page.fill('#first_name', candidate.firstName).catch(() => {});
  await page.fill('#last_name', candidate.lastName).catch(() => {});
  await page.fill('#email', candidate.email).catch(() => {});
  await page.fill('#phone', candidate.phone).catch(() => {});

  // Upload Resume
  updateStatus?.('EXTRACTING', 'Uploading tailored resume...');
  try {
    // Greenhouse uses a standard file input usually hidden behind an "Attach" button
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumeFilePath);
    await page.waitForTimeout(2000); // Wait for upload to process
  } catch (err) {
    console.error("[Greenhouse] Failed to upload resume:", err);
    throw new Error("Could not find or upload to the resume file input");
  }

  // Handle custom questions (LinkedIn, GitHub, Website, etc.)
  updateStatus?.('EXTRACTING', 'Handling custom questions...');
  
  if (candidate.linkedinUrl) {
    const linkedinInput = page.locator('label:has-text("LinkedIn") input, label:has-text("Linked In") input').first();
    if (await linkedinInput.count() > 0) {
      await linkedinInput.fill(candidate.linkedinUrl);
    }
  }

  if (candidate.githubUrl) {
    const githubInput = page.locator('label:has-text("GitHub") input, label:has-text("Git Hub") input').first();
    if (await githubInput.count() > 0) {
      await githubInput.fill(candidate.githubUrl);
    }
  }

  const websiteInput = page.locator('label:has-text("Website") input, label:has-text("Portfolio") input').first();
  if (await websiteInput.count() > 0 && candidate.githubUrl) {
    await websiteInput.fill(candidate.githubUrl);
  }

  // Click Submit
  updateStatus?.('EXTRACTING', 'Submitting application...');
  const submitBtn = page.locator('#submit_app');
  if (await submitBtn.count() > 0) {
    await submitBtn.click();
    
    // Wait for success page
    updateStatus?.('WAITING', 'Waiting for success confirmation...');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    
    // Check if there are validation errors on the page
    const errors = page.locator('.field_with_errors, .error-message');
    if (await errors.count() > 0) {
      throw new Error("Application submitted but validation errors were found on the page.");
    }
  } else {
    throw new Error("Could not find the submit button (#submit_app)");
  }

  updateStatus?.('IDLE', 'Application submitted successfully');
}
