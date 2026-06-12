import { Page } from 'playwright';
import { getCredential } from '../../../lib/vault';
import prisma from '../../../lib/prisma';

export interface SearchParams {
  targetRoles: string[];
  locations: string[];
  remote: boolean;
  threshold?: number;
}

export interface RawListing {
  platform: string;
  title: string;
  company: string;
  location: string;
  description: string;
  listingUrl: string;
  atsType: string;
}

export class LinkedinStrategy {
  async login(page: Page, userId: string, vaultPath: string, statusCallback?: (msg: string) => void) {
    const report = (msg: string) => {
      console.log(msg);
      if (statusCallback) statusCallback(msg.replace('[LinkedinStrategy] ', ''));
    };

    report(`[LinkedinStrategy] Authenticating for user ${userId}...`);
    
    if (!vaultPath) {
      throw new Error("No connected LinkedIn credentials found.");
    }
    
    const creds = await getCredential(userId, vaultPath);
    if (!creds || !creds.email || !creds.password) {
      throw new Error("Invalid or missing credentials from Vault.");
    }

    try {
      // First, try going directly to feed to see if state.json cookie is valid
      await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      let isLoggedIn = false;
      try {
        await page.waitForSelector('.global-nav__me-photo', { timeout: 15000 });
        isLoggedIn = true;
      } catch (e) {
        isLoggedIn = false;
      }
      
      if (isLoggedIn) {
        report(`[LinkedinStrategy] Authenticated successfully.`);
        return;
      }
      
      // If not logged in, proceed to login page
      await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      // Try to find the username field (handles different A/B tested LinkedIn login forms)
      const usernameLocator = page.locator('#username, #session_key').first();
      await usernameLocator.waitFor({ state: 'visible', timeout: 15000 });
      
      await usernameLocator.fill(creds.email);
      await page.locator('#password, #session_password').first().fill(creds.password);
      await page.click('[type="submit"]');
    } catch (e) {
      report("[LinkedinStrategy] Automated login struggled or timed out. Please check the browser window.");
    }
    
    // Wait for the feed or security challenge
    report('Waiting for successful login or security challenge...');
    
    // Give the page a moment to process the login or load the challenge
    await page.waitForTimeout(5000);
    
    // Check for captcha explicitly
    let hasCaptcha = await page.evaluate(() => {
      return !!document.querySelector('iframe[src*="captcha"]') || !!document.querySelector('iframe[src*="challenge"]') || !!document.querySelector('#captcha-internal') || window.location.href.includes('checkpoint');
    }).catch(() => false);


    if (hasCaptcha) {
      report('Security Challenge Detected! Please solve the puzzle in the Chromium window. You have 3 minutes!');
      await page.waitForTimeout(180000);
    } else {
      // It might be an OTP screen or manual login required
      report('Waiting up to 3 minutes for you to complete any OTP or manual login in the Chromium window...');
    }
    
    // Verify login success before proceeding
    try {
      // Wait up to 3 minutes for the photo to appear (indicating successful login)
      await page.waitForSelector('.global-nav__me-photo', { timeout: 180000 });
      report(`[LinkedinStrategy] Authenticated successfully.`);
    } catch (e) {
      throw new Error("Failed to authenticate or solve captcha in time.");
    }
  }

  async *search(page: Page, params: SearchParams, statusCallback?: (msg: string) => void): AsyncGenerator<RawListing> {
    const report = (msg: string) => {
      console.log(msg);
      if (statusCallback) statusCallback(msg.replace('[LinkedinStrategy] ', ''));
    };

    report(`[LinkedinStrategy] Searching for roles: ${params.targetRoles.join(', ')}`);
    
    const role = encodeURIComponent(params.targetRoles[0] || 'Software Engineer');
    const roles = params.targetRoles;
    const locations = params.locations;

    if (params.remote) {
      params.locations = ['Remote']; // Just forcing remote search
    }
    
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(randomRole)}&location=${encodeURIComponent(locations[0] || 'Worldwide')}&f_AL=true`;
    report(`Navigating to: ${searchUrl}`);
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      report(`Warning: Navigation to search timed out, proceeding anyway...`);
    }
    
    // Wait for at least one job card to appear
    try {
      await page.waitForSelector('.job-card-container, .scaffold-layout__list-item, .base-card, .base-search-card', { timeout: 60000 });
    } catch (e) {
      report(`Still loading or 0 jobs. Reloading page to bypass SPA loader...`);
      try {
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
        await page.waitForSelector('.job-card-container, .scaffold-layout__list-item, .base-card, .base-search-card', { timeout: 45000 });
      } catch (err) {
        report(`Warning: Reload timed out or cards still not visible.`);
      }
    }
    
    const jobCardsLocator = page.locator('.job-card-container, .jobs-search-results__list-item, .base-search-card, .base-card');
    report(`Waiting for job cards to fully render...`);
    await jobCardsLocator.first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {
      report(`Timeout waiting for job cards. They might not exist or the page is stuck.`);
    });
    
    const count = await jobCardsLocator.count();
    if (count === 0) {
      report(`Found 0 job cards on the first page.`);
      try {
        await page.screenshot({ path: 'scratch/linkedin_dump.png', fullPage: true, timeout: 15000 });
        const fs = require('fs');
        fs.writeFileSync('scratch/linkedin_dump.html', await page.content());
        report(`Saved page dump to scratch/linkedin_dump.html for debugging`);
      } catch (err) {
        report(`Failed to save debugging dump: ${err instanceof Error ? err.message : String(err)}`);
      }
      return; // yield nothing
    }
    report(`Found ${count} job cards on the first page.`);

    for (let i = 0; i < count && i < 10; i++) { // Limit to top 10 for safety
      try {
        if (i === 0) report(`Finding the first job...`);
        else report(`Extracting job ${i+1} of ${count}...`);
        
        const card = jobCardsLocator.nth(i);
        await card.scrollIntoViewIfNeeded().catch(() => {});
        await card.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500); // Wait for description pane to load

        const title = await card.locator('.job-card-list__title, .job-card-container__title, [data-test-job-card-title] > * > *, .artdeco-entity-lockup__title, strong, h3').first().innerText().catch(() => 'Unknown Title');
        const company = await card.locator('.job-card-container__company-name, .job-card-container__primary-description, .artdeco-entity-lockup__subtitle, [data-test-job-card-company-name]').first().innerText().catch(() => 'Unknown Company');
        const loc = await card.locator('.job-card-container__metadata-item, .job-card-container__metadata-wrapper, .artdeco-entity-lockup__caption').first().innerText().catch(() => 'Unknown Location');
        
        let href = await card.locator('a').first().getAttribute('href').catch(() => null);
        if (href && href.startsWith('/')) {
          href = `https://www.linkedin.com${href}`;
        }
        const listingUrl = href ? href.split('?')[0] : `https://www.linkedin.com/jobs/view/${Date.now()}`;

        const description = await page.locator('.jobs-description__content').innerText().catch(() => 'Description unavailable');

        yield {
          platform: 'linkedin',
          title,
          company,
          location: loc,
          description,
          listingUrl,
          atsType: 'native_easy_apply'
        };
      } catch (err) {
        console.warn(`[LinkedinStrategy] Failed to extract data for card ${i}`, err);
      }
    }
  }
}
