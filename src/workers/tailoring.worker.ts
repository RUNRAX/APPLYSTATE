import { Worker, Job } from 'bullmq';
import { tailorResume } from '../features/resume/tailor';
import { generateCoverLetter } from '../features/resume/coverLetter';

import IORedis from 'ioredis';

const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null
    });

export const tailoringWorker = new Worker('tailoring-queue', async (job: Job) => {
  const { userId, jobListingId } = job.data;
  console.log(`[Tailoring] Generating materials for user ${userId}, job ${jobListingId}`);

  try {
    const resume = await tailorResume(userId, jobListingId);
    const coverLetter = await generateCoverLetter(userId, jobListingId);

    // Queue application submission
    // applicationQueue.add('apply', { userId, jobListingId, resumeId: resume.id, clId: coverLetter.id })

    console.log(`[Tailoring] Success. Resume ID: ${resume.id}, CL ID: ${coverLetter.id}`);
  } catch (error) {
    console.error(`[Tailoring] Failed:`, error);
    throw error;
  }
}, { connection });
