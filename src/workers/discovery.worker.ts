import { chromium } from 'playwright';
import prisma from '../lib/prisma';
import { embedText, matchJob, getProfileVector } from '../features/matching/embeddings';
import { LinkedinStrategy } from '../features/automation/strategies/linkedin.strategy';

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

          // Launch browser visible for testing/local
          const browser = await chromium.launch({ headless: false });
          const context = await browser.newContext();
          const page = await context.newPage();

          try {
            await strategy.login(page, userId);
            const listingsGenerator = strategy.search(page, pref);
            
            for await (const rawListing of listingsGenerator) {
              const existing = await prisma.jobListing.findUnique({ where: { listingUrl: rawListing.listingUrl } });
              if (existing) {
                console.log(`[Discovery] Job already exists: ${rawListing.listingUrl}`);
                continue;
              }

              const jdVector = await embedText(rawListing.description);
              const match = matchJob(pVector, jdVector, pref.threshold || 0.5);

              if (match.isMatch || true) { // For prototype, saving all found jobs
                // Save to DB
                const savedJob = await prisma.jobListing.create({
                  data: {
                    ...rawListing,
                    matchScore: match.score * 100,
                  }
                });

                // Add to application queue
                await prisma.application.create({
                  data: {
                    userId,
                    jobListingId: savedJob.id,
                    resumeVersionId: baseResume.id,
                    status: 'PENDING_REVIEW'
                  }
                });

                console.log(`[Discovery] Match found! Queued job ${savedJob.id} (${(match.score * 100).toFixed(1)}%)`);
              }
              
              await new Promise(r => setTimeout(r, 2000));
            }

          } catch (error) {
            console.error(`[Discovery Error]`, error);
          } finally {
            await browser.close();
          }
        }
      }
    } catch (err) {
      console.error("[Discovery Worker] Error in polling loop:", err);
    }
    
    console.log(`[Discovery Worker] Sleeping for ${POLLING_INTERVAL / 1000}s...`);
    await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
  }
}

runDiscovery();
