import 'dotenv/config';
import { chromium } from 'playwright';
import prisma from '../lib/prisma';
import { applyToLinkedInEasyApply } from '../features/automation/platforms/linkedin';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { getCredential } from '../lib/vault';

async function processApplication(applicationId: string, userId: string, jobListingId: string, resumeId: string) {
  console.log(`[Application Worker] Processing Application ${applicationId} for user ${userId}, job ${jobListingId}`);

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

  const statePath = path.join(process.cwd(), 'scratch', 'state.json');
  const browser = await chromium.launch({ headless: false }); // Headless false to avoid immediate bot detection
  const context = await browser.newContext({
    storageState: require('fs').existsSync(statePath) ? statePath : undefined,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  // Create a temporary file for the resume
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'applymate-'));
  const tempResumePath = path.join(tempDir, 'Resume.txt');
  await fs.writeFile(tempResumePath, resume.tailoredContent || resume.originalContent);

  try {
    const isGreenhouse = jobListing.listingUrl.includes('boards.greenhouse.io');

    if (isGreenhouse) {
      console.log(`[Application Worker] Starting Greenhouse automation...`);
      // Extract contact info using AI
      console.log(`[Application Worker] Extracting contact info from resume...`);
      const { applyToGreenhouse, extractContactInfo } = await import('../features/automation/platforms/greenhouse');
      const candidateData = await extractContactInfo(resume.originalContent);
      
      await applyToGreenhouse(page, jobListing.listingUrl, candidateData, tempResumePath);
    } else {
      console.log(`[Application Worker] Starting LinkedIn automation...`);
      
      // Fetch and decrypt real credentials from the Vault service
      let creds: { email?: string; password?: string } = {};
      if (credential && credential.vaultPath) {
        try {
          const decrypted = await getCredential(userId, credential.vaultPath);
          if (decrypted && typeof decrypted === 'object') {
            creds = decrypted;
          }
        } catch (err) {
          console.error("[Application Worker] Failed to decrypt credentials:", err);
        }
      } else {
        console.log("[Application Worker] No Vault credentials found. Proceeding with saved session state...");
      }
      
      await applyToLinkedInEasyApply(page, jobListing.listingUrl, creds, tempResumePath);
    }
    
    // Take a screenshot of the success page
    const screenshotBuffer = await page.screenshot();
    const screenshotUrl = `data:image/png;base64,${screenshotBuffer.toString('base64')}`;

    await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: 'SUBMITTED',
        screenshotUrl,
        submittedAt: new Date()
      }
    });

    console.log(`[Application Worker] Submitted successfully!`);
  } catch (error) {
    console.error(`[Application Worker] Failed:`, error);
    
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
  } finally {
    await browser.close();
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

async function startWorker() {
  console.log("🚀 [Application Worker] Starting database polling...");
  
  // Simple infinite polling loop
  while (true) {
    try {
      // Find one queued application
      const app = await prisma.application.findFirst({
        where: { status: 'QUEUED' }
      });

      if (app && app.resumeVersionId) {
        // Mark as IN_PROGRESS to prevent double-processing if multiple workers run
        await prisma.application.update({
          where: { id: app.id },
          data: { status: 'IN_PROGRESS' }
        });

        await processApplication(app.id, app.userId, app.jobListingId, app.resumeVersionId);
      }
    } catch (e) {
      console.error("[Application Worker] Polling error:", e);
    }
    
    // Wait 5 seconds before checking again
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
}

// Start the polling
startWorker();
