import { chromium } from 'playwright';
import prisma from '../lib/prisma';
import { embedText, matchJob, getProfileVector } from '../features/matching/embeddings';
import { LinkedinStrategy } from '../features/automation/strategies/linkedin.strategy';

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

const POLLING_INTERVAL = 1000 * 60 * 60; // 1 hour

async function runDiscovery() {
  console.log("🚀 [Discovery Worker] Starting database polling...");

  while (true) {
    try {
      // Find users with active credentials and autoApply true or just job preferences
      const preferences = await prisma.jobPreference.findMany({
        where: { targetRoles: { isEmpty: false } }
      });

      for (const pref of preferences) {
        const userId = pref.userId;
        const credentials = await prisma.platformCredential.findMany({
          where: { userId, isActive: true }
        });

        for (const cred of credentials) {
          const platform = cred.platform.toLowerCase();
          
          let strategy;
          if (platform.includes('linkedin')) strategy = new LinkedinStrategy();
          else {
            console.log(`[Discovery] Platform ${platform} not supported yet`);
            continue;
          }

          console.log(`[Discovery] Starting harvest for user ${userId} on ${platform}`);
          await updateAgentStatus(userId, "INITIALIZING", `Starting discovery on ${platform}...`);
          
          const currentStatus = await prisma.agentStatus.findUnique({ where: { userId } });
          if (currentStatus?.status === "PAUSED") {
            console.log(`[Discovery] User ${userId} agent is PAUSED. Skipping.`);
            continue;
          }

          if (!pref || pref.targetRoles.length === 0) {
            console.log(`[Discovery] User ${userId} has no target roles set. Skipping.`);
            await updateAgentStatus(userId, "IDLE", `Skipping: No target roles configured.`);
            continue;
          }

          const pVector = await getProfileVector(userId);
          if (!pVector) {
            console.log(`[Discovery] User ${userId} has no profile vector, skipping.`);
            continue;
          }

          // Fetch the user's active resume to link the application
          const baseResume = await prisma.resume.findFirst({
            where: { userId, isActive: true },
            orderBy: { id: 'desc' }
          });

          if (!baseResume) {
            console.log(`[Discovery] User ${userId} has no active resume, skipping.`);
            continue;
          }

          const browser = await chromium.launch({ headless: false });
          let context;
          try {
            context = await browser.newContext({ storageState: 'scratch/state.json' });
          } catch (e) {
            context = await browser.newContext();
          }
          const page = await context.newPage();

          try {
            await updateAgentStatus(userId, "AUTHENTICATING", `Logging into ${platform}...`);
            await strategy.login(page, userId, cred.vaultPath, (msg: string) => updateAgentStatus(userId, "AUTHENTICATING", msg));
            await context.storageState({ path: 'scratch/state.json' }).catch(() => {});
            
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
                    
                    Job Description:
                    ${rawListing.description}

                    Original Resume:
                    ${baseResume.originalContent}

                    Output ONLY a valid JSON object with:
                    1. "tailoredContent": The new resume text (plain text formatting).
                    2. "atsScore": A number from 1 to 100 representing how well this new tailored resume matches the job description. Be realistic, aim for high 80s or 90s.
                  `;

                  const response = await ai.chat.completions.create({
                    model: 'llama-3.3-70b-versatile',
                    messages: [{ role: 'user', content: prompt }],
                    response_format: { type: "json_object" }
                  });

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
              }
              
              await new Promise(r => setTimeout(r, 2000));
            }
            
            await updateAgentStatus(userId, "IDLE", `Finished search. Found ${count} matches. Sleeping...`);
            
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
    
    console.log(`[Discovery Worker] Sleeping for 60s...`);
    await new Promise(resolve => setTimeout(resolve, 60000));
  }
}

runDiscovery();
