import { Worker, Job } from 'bullmq';
import { chromium } from 'playwright';
import prisma from '../lib/prisma';
import { applyToLinkedInEasyApply } from '../features/automation/platforms/linkedin';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';

import IORedis from 'ioredis';

const connection = process.env.REDIS_URL 
  ? new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
  : new IORedis({
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      maxRetriesPerRequest: null
    });

export const applicationWorker = new Worker('application-queue', async (job: Job) => {
  const { applicationId, userId, jobListingId, resumeId, clId } = job.data;
  console.log(`[Application] Submitting for user ${userId}, job ${jobListingId}`);

  // Fetch the job listing and resume
  const jobListing = await prisma.jobListing.findUnique({ where: { id: jobListingId } });
  const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
  
  if (!jobListing || !resume) {
    throw new Error("Job or Resume not found");
  }

  // Find user credentials for LinkedIn
  const credential = await prisma.platformCredential.findFirst({
    where: { userId, platform: 'LinkedIn', isActive: true }
  });

  const browser = await chromium.launch({ headless: false }); // Headless false to avoid immediate bot detection
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Create a temporary file for the resume
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'applymate-'));
  const tempResumePath = path.join(tempDir, 'Resume.txt');
  await fs.writeFile(tempResumePath, resume.tailoredContent || resume.originalContent);

  try {
    console.log(`[Application] Starting LinkedIn automation...`);
    
    // Decrypt credentials in a real app; using stub here
    // const password = await decryptVault(credential.vaultPath);
    const creds = credential ? { email: 'dummy@example.com', password: 'dummy' } : {};
    
    // Note: If creds are empty, the script will skip login and try to apply directly
    // which might work if session is maintained or it fails gracefully.

    await applyToLinkedInEasyApply(page, jobListing.listingUrl, creds, tempResumePath);
    
    // Take a screenshot of the success page
    const screenshotBuffer = await page.screenshot();
    // Simulate uploading screenshot
    const screenshotUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'SUBMITTED',
        screenshotUrl,
        submittedAt: new Date()
      }
    });

    console.log(`[Application] Submitted successfully!`);
  } catch (error) {
    console.error(`[Application] Failed:`, error);
    
    // Take a failure screenshot
    const failureBuffer = await page.screenshot();
    const screenshotUrl = `data:image/png;base64,${failureBuffer.toString('base64')}`;

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'FAILED',
        screenshotUrl,
        errorMessage: String(error)
      }
    });
    throw error;
  } finally {
    await browser.close();
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}, { connection });
