import { Worker, Job } from 'bullmq';
import { chromium } from 'playwright';
import prisma from '../../lib/prisma';
import { embedText, matchJob } from '../../features/matching/embeddings';
import { LinkedinStrategy } from '../../features/automation/strategies/linkedin.strategy';

const connection = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

export const discoveryWorker = new Worker('discovery-queue', async (job: Job) => {
  const { userId, platform, preferences } = job.data;
  console.log(`[Discovery] Starting harvest for user ${userId} on ${platform}`);

  const userProfile = await prisma.profile.findUnique({ where: { userId } });
  if (!userProfile) {
    throw new Error('User profile missing');
  }

  // Determine strategy
  let strategy;
  if (platform === 'linkedin') strategy = new LinkedinStrategy();
  else throw new Error(`Platform ${platform} not supported yet`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login using Vault credentials
    await strategy.login(page, userId);

    // 2. Search
    const listingsGenerator = strategy.search(page, preferences);
    
    for await (const rawListing of listingsGenerator) {
      // Deduplicate via URL
      const existing = await prisma.jobListing.findUnique({ where: { listingUrl: rawListing.listingUrl } });
      if (existing) continue;

      // Embed JD and score
      const jdVector = await embedText(rawListing.description);
      
      // We assume profileVector is extracted to number[] via pgvector casting in real app
      // For now, mocking profile vector retrieval
      const pVector: number[] = new Array(1536).fill(0.1); 
      const match = matchJob(pVector, jdVector, preferences.threshold || 0.72);

      if (match.isMatch) {
        // Save to DB
        const savedJob = await prisma.jobListing.create({
          data: {
            ...rawListing,
            matchScore: match.score,
            // descriptionVector skipped because it requires raw query
          }
        });

        // Add to application queue
        console.log(`[Discovery] Match found! Queued job ${savedJob.id} (${match.score})`);
      }
      
      // Respect rate limits (90s inter-request delay in real implementation)
      await new Promise(r => setTimeout(r, 2000));
    }

  } catch (error) {
    console.error(`[Discovery Error]`, error);
    throw error;
  } finally {
    await browser.close();
  }
}, { connection });

discoveryWorker.on('completed', job => console.log(`[Discovery] Job ${job.id} finished.`));
discoveryWorker.on('failed', (job, err) => console.log(`[Discovery] Job ${job?.id} failed:`, err));
