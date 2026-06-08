import { Page } from 'playwright';

export async function applyToLinkedInEasyApply(
  page: Page, 
  jobUrl: string, 
  credentials: { email?: string; password?: string }, 
  resumeFilePath: string
) {
  // 1. Navigate to LinkedIn Login
  console.log('[LinkedIn] Navigating to login...');
  await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });
  
  if (credentials.email && credentials.password) {
    await page.fill('#username', credentials.email);
    await page.fill('#password', credentials.password);
    await page.click('[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'domcontentloaded' }).catch(() => {});
    
    // Check if security challenge is present
    const isChallenge = await page.locator('.challenge-dialog').isVisible().catch(() => false);
    if (isChallenge) {
      console.log('[LinkedIn] Security challenge detected. Awaiting manual resolution...');
      // In a real scenario, we might wait here for the user, or use 2FA bypass strategies.
      await page.waitForTimeout(15000); 
    }
  }

  // 2. Navigate to Job Listing
  console.log(`[LinkedIn] Navigating to job URL: ${jobUrl}`);
  await page.goto(jobUrl, { waitUntil: 'domcontentloaded' });

  // 3. Click Easy Apply
  console.log('[LinkedIn] Looking for Easy Apply button...');
  const easyApplyBtn = page.locator('button:has-text("Easy Apply"), button[aria-label*="Easy Apply"]');
  
  if (await easyApplyBtn.count() === 0) {
    throw new Error("Easy Apply button not found. This job might not support Easy Apply or the selector changed.");
  }
  
  await easyApplyBtn.first().click();
  console.log('[LinkedIn] Easy Apply modal opened.');

  // 4. Iterate through modal steps
  let hasSubmitted = false;
  let attempts = 0;
  
  while (!hasSubmitted && attempts < 10) {
    attempts++;
    await page.waitForTimeout(2000); // Wait for modal transitions
    
    // Check for submission
    const submitBtn = page.locator('button:has-text("Submit application")');
    if (await submitBtn.isVisible()) {
      console.log('[LinkedIn] Found Submit Application button. Clicking...');
      await submitBtn.click();
      hasSubmitted = true;
      break;
    }

    const reviewBtn = page.locator('button:has-text("Review")');
    if (await reviewBtn.isVisible()) {
      console.log('[LinkedIn] Clicking Review...');
      await reviewBtn.click();
      continue;
    }

    // Handle resume upload
    const uploadInput = page.locator('input[type="file"][name="file"]');
    if (await uploadInput.isVisible()) {
      console.log('[LinkedIn] Uploading resume...');
      await uploadInput.setInputFiles(resumeFilePath);
    }

    // Handle next step
    const nextBtn = page.locator('button:has-text("Next")');
    if (await nextBtn.isVisible()) {
      console.log('[LinkedIn] Clicking Next...');
      await nextBtn.click();
    } else {
      // If we can't find Submit, Review, or Next, we might be stuck
      console.log('[LinkedIn] Could not find Next/Review/Submit buttons. Breaking loop.');
      break;
    }
  }

  if (!hasSubmitted) {
    throw new Error("Failed to complete the Easy Apply flow.");
  }

  console.log('[LinkedIn] Application submitted! Waiting for success modal...');
  await page.waitForTimeout(3000);
  
  return true;
}
