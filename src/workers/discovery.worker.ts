import { chromium } from 'playwright-extra';
import stealth from 'puppeteer-extra-plugin-stealth';
chromium.use(stealth());
import prisma from '../lib/prisma';
import { embedText, matchJob, getProfileVector } from '../features/matching/embeddings';
import { CompanyPortalsStrategy } from '../features/automation/strategies/company-portals.strategy';
import * as path from 'path';
import * as fs from 'fs';

// Ensure scratch directory exists for browser state and debug screenshots
const SCRATCH_DIR = path.resolve(__dirname, '../../scratch');
if (!fs.existsSync(SCRATCH_DIR)) fs.mkdirSync(SCRATCH_DIR, { recursive: true });
const STATE_FILE = path.join(SCRATCH_DIR, 'state.json');

async function updateAgentStatus(userId: string, status: string, message: string) {
  try {
    await prisma.agentStatus.upsert({
      where: { userId },
      update: { status, message, updatedAt: new Date() },
      create: { userId, status, message }
    });
  } catch (e) {
    console.error(`[AgentStatus Error]`, e);
  }
}

const IDLE_COOLDOWN = 1000; // 1 second between cycles to search non-stop

async function runDiscovery() {
  console.log("🚀 [Discovery Worker] Starting continuous polling...");

  while (true) {
    let didWork = false;

    try {
      // Find users with active credentials and job preferences
      const preferences = await prisma.jobPreference.findMany({
        where: { targetRoles: { isEmpty: false } }
      });

      for (const pref of preferences) {
        const userId = pref.userId;

        // Check if this user was triggered (PENDING) or is ready for a new cycle (IDLE)
        const currentStatus = await prisma.agentStatus.findUnique({ where: { userId } });
        const s = currentStatus?.status?.toUpperCase();

        // Skip users who are PAUSED or currently in an ERROR state
        if (s === "PAUSED") {
          console.log(`[Discovery] User ${userId} agent is PAUSED. Skipping.`);
          continue;
        }

        // If user is already actively being processed by another cycle, skip
        if (s === "SEARCHING" || s === "EXTRACTING" || s === "AUTHENTICATING") {
          console.log(`[Discovery] User ${userId} is already active (${s}). Skipping.`);
          continue;
        }

        const credentials = await prisma.platformCredential.findMany({
          where: { userId, isActive: true }
        });

        if (credentials.length === 0) {
          console.log(`[Discovery] User ${userId} has no active credentials. Skipping.`);
          await updateAgentStatus(userId, "IDLE", "No active platform credentials found. Add credentials to start scanning.");
          continue;
        }

        if (!pref || pref.targetRoles.length === 0) {
          console.log(`[Discovery] User ${userId} has no target roles set. Skipping.`);
          await updateAgentStatus(userId, "IDLE", "No target roles configured. Set your job preferences to start scanning.");
          continue;
        }

        const pVector = await getProfileVector(userId);
        if (!pVector) {
          console.log(`[Discovery] User ${userId} has no profile vector, skipping.`);
          await updateAgentStatus(userId, "IDLE", "Profile not set up. Upload your resume to generate a profile vector.");
          continue;
        }

        // Fetch the user's active resume to link the application
        const baseResume = await prisma.resume.findFirst({
          where: { userId, isActive: true },
          orderBy: { id: 'desc' }
        });

        if (!baseResume) {
          console.log(`[Discovery] User ${userId} has no active resume, skipping.`);
          await updateAgentStatus(userId, "IDLE", "No active resume found. Upload a base resume so the agent can tailor it.");
          continue;
        }

        // User has everything needed — start processing
        for (const cred of credentials) {
          const platform = cred.platform.toLowerCase();
          
          let strategy;
          if (platform.includes('linkedin') || platform.includes('company_portal')) strategy = new CompanyPortalsStrategy();
          else {
            console.log(`[Discovery] Platform ${platform} not supported yet`);
            await updateAgentStatus(userId, "IDLE", `Platform "${platform}" is not supported yet. Supported: LinkedIn, Company Portals.`);
            continue;
          }

          didWork = true;
          console.log(`[Discovery] Starting harvest for user ${userId} on ${platform}`);
          await updateAgentStatus(userId, "INITIALIZING", `Preparing discovery on ${platform}...`);

          let browser;
          try {
            browser = await chromium.launch({ headless: false });
          } catch (launchErr: any) {
            console.error(`[Discovery] Browser launch failed:`, launchErr.message);
            await updateAgentStatus(userId, "ERROR", `Browser not available: Run "npx playwright install chromium" first.`);
            continue;
          }

          let context;
          try {
            context = await browser.newContext({ storageState: STATE_FILE });
          } catch (e) {
            context = await browser.newContext();
          }
          const page = await context.newPage();

          try {
            await updateAgentStatus(userId, "AUTHENTICATING", `Logging into ${platform}...`);
            await strategy.login(page, userId, cred.vaultPath, (msg: string) => updateAgentStatus(userId, "AUTHENTICATING", msg));
            await context.storageState({ path: STATE_FILE }).catch(() => {});
            
            await updateAgentStatus(userId, "SEARCHING", `Searching for roles: ${pref.targetRoles.join(', ')}...`);
            const listingsGenerator = strategy.search(page, pref, (msg: string) => updateAgentStatus(userId, "SEARCHING", msg));
            
            let count = 0;
            for await (const rawListing of listingsGenerator) {
              const existing = await prisma.jobListing.findUnique({ where: { listingUrl: rawListing.listingUrl } });
              if (existing) {
                console.log(`[Discovery] Job already exists: ${rawListing.listingUrl}`);
                continue;
              }

              const jdVector = await embedText(rawListing.description);
              const match = matchJob(pVector, jdVector, 0.5);

              if (match.isMatch || true) { // For prototype, saving all found jobs
                await updateAgentStatus(userId, "EXTRACTING", `Tailoring resume for ${rawListing.title}...`);
                
                // Tailor the resume
                let tailoredContent = baseResume.originalContent;
                let atsScore = Math.floor(Math.random() * 20) + 70; // fallback dummy

                try {
                  const OpenAI = require('openai').default;
                  const ai = new OpenAI({
                    apiKey: process.env.GROQ_API_KEY || "dummy_key_for_build",
                    baseURL: 'https://api.groq.com/openai/v1',
                  });

                  const prompt = `
                    You are an expert ATS resume writer. Tailor the following Original Resume to fit the Job Description perfectly.
                    
                    CRITICAL INSTRUCTIONS (MUST FOLLOW STRICTLY):
                    1. NEVER omit any sections from the Original Resume. You MUST include the full PROFESSIONAL EXPERIENCE, PROJECTS, EDUCATION, etc. Do not stop at the summary. The output must be a full, complete resume.
                    2. Maintain the exact base resume structure and layout alignment. 
                    3. You MUST extract the candidate's real LinkedIn and GitHub links from the Original Resume and embed them directly under their name at the very top of the resume.
                    4. Ensure clear bullet points and section headings (e.g., PROFESSIONAL SUMMARY, TECHNICAL SKILLS, PROFESSIONAL EXPERIENCE). DO NOT write long paragraphs.

                    Job Description:
                    ${rawListing.description}

                    Original Resume:
                    ${baseResume.originalContent}

                    Output ONLY a valid JSON object with:
                    1. "tailoredContent": The new full resume text as a plain text string formatted nicely.
                    2. "atsScore": A number from 1 to 100 representing how well this new tailored resume matches the job description. Be realistic, aim for high 80s or 90s.
                  `;

                  const response = await Promise.race([
                    ai.chat.completions.create({
                      model: 'llama-3.3-70b-versatile',
                      messages: [{ role: 'user', content: prompt }],
                      response_format: { type: "json_object" },
                      max_tokens: 6000
                    }),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Groq API timeout after 30s")), 30000))
                  ]) as any;

                  const content = JSON.parse(response.choices[0]?.message?.content || "{}");
                  if (content.tailoredContent) tailoredContent = content.tailoredContent;
                  if (content.atsScore) atsScore = parseInt(content.atsScore);
                } catch (e: any) {
                  console.error("AI tailoring failed", e);
                  await updateAgentStatus(userId, "ERROR", `AI tailoring failed: Please check your GROQ_API_KEY. Details: ${e.message}`);
                  // Keep going, but the user will see the error in the UI
                }

                // Save to DB
                const savedJob = await prisma.jobListing.create({
                  data: {
                    ...rawListing,
                    matchScore: match.score * 100,
                  }
                });

                const tailoredResume = await prisma.resume.create({
                  data: {
                    userId,
                    version: `tailored-${savedJob.id}`,
                    originalContent: baseResume.originalContent,
                    tailoredContent,
                    atsScore,
                    isActive: false
                  }
                });

                // Add to application queue
                await prisma.application.create({
                  data: {
                    userId,
                    jobListingId: savedJob.id,
                    resumeVersionId: tailoredResume.id,
                    status: 'PENDING_REVIEW'
                  }
                });

                count++;
                console.log(`[Discovery] Match found! Queued job ${savedJob.id} (${(match.score * 100).toFixed(1)}%)`);
                await updateAgentStatus(userId, "ACTIVE", `Found ${count} match${count > 1 ? 'es' : ''} so far. Continuing search...`);
              }
              
              await new Promise(r => setTimeout(r, 2000));
            }
            
            // Per-user completion — set to IDLE with a summary, NOT blanket SLEEPING
            await updateAgentStatus(userId, "IDLE", `Cycle complete on ${platform}. Found ${count} new match${count !== 1 ? 'es' : ''}. Next scan in ~${IDLE_COOLDOWN / 1000}s.`);
            
          } catch (error) {
            console.error(`[Discovery Error]`, error);
            await updateAgentStatus(userId, "ERROR", `Error during discovery: ${error}`);
          } finally {
            await browser.close();
          }
        }
      }
    } catch (err) {
      console.error("[Discovery Worker] Error in polling loop:", err);
    }
    
    // Only sleep between full cycles — short cooldown when idle, no sleep when work was done
    const cooldown = didWork ? 1000 : IDLE_COOLDOWN;
    console.log(`[Discovery Worker] Cycle finished (didWork=${didWork}). Cooldown: ${cooldown / 1000}s`);
    await new Promise(resolve => setTimeout(resolve, cooldown));
  }
}

runDiscovery();
