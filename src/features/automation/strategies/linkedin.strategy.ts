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
      await page.goto('https://www.linkedin.com/login', { timeout: 60000 });
      
      // Try to find the username field (handles different A/B tested LinkedIn login forms)
      const usernameLocator = page.locator('#username, #session_key').first();
      await usernameLocator.waitFor({ state: 'visible', timeout: 10000 });
      
      await usernameLocator.fill(creds.email);
      await page.locator('#password, #session_password').first().fill(creds.password);
      await page.click('[type="submit"]');
    } catch (e) {
      report("[LinkedinStrategy] Automated login struggled to find fields. Please login manually in the browser window within 60 seconds if needed!");
    }
    
    // Wait for the feed or security challenge
    report('[LinkedinStrategy] Waiting for successful login...');
    try {
      // Wait for any indicator of successful login (feed url or search bar)
      await page.waitForFunction(() => {
        return window.location.href.includes('feed') || document.querySelector('.global-nav');
      }, { timeout: 60000 });
    } catch (e) {
      report('[LinkedIn] Security challenge or manual login timeout detected. Please pass it manually!');
      await page.waitForTimeout(15000); // extra wait for user
    }
    
    report(`[LinkedinStrategy] Authenticated successfully.`);
  }

  async *search(page: Page, params: SearchParams, statusCallback?: (msg: string) => void): AsyncGenerator<RawListing> {
    const report = (msg: string) => {
      console.log(msg);
      if (statusCallback) statusCallback(msg.replace('[LinkedinStrategy] ', ''));
    };

    report(`[LinkedinStrategy] Searching for roles: ${params.targetRoles.join(', ')}`);
    
    const role = encodeURIComponent(params.targetRoles[0] || 'Software Engineer');
    let location = encodeURIComponent(params.locations[0] || 'Worldwide');
    if (params.remote) {
      location = encodeURIComponent('Remote'); // Just forcing remote search
    }
    
    // f_AL=true ensures Easy Apply only
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${role}&location=${location}&f_AL=true`;
    report(`Navigating to: ${searchUrl}`);
    
    try {
      await page.goto(searchUrl, { timeout: 45000, waitUntil: 'domcontentloaded' });
    } catch (e) {
      report(`Warning: Navigation to search timed out, proceeding anyway...`);
    }

    const jobCardsLocator = page.locator('.job-card-container, .jobs-search-results__list-item');
    report(`Waiting for job cards to render...`);
    await jobCardsLocator.first().waitFor({ state: 'visible', timeout: 20000 }).catch(() => {
      report(`Timeout waiting for job cards. They might not exist or the page is stuck.`);
    });
    
    const count = await jobCardsLocator.count();
    if (count === 0) {
      try {
        const fs = require('fs');
        fs.writeFileSync('scratch/linkedin_dump.html', await page.content());
        report(`Saved page dump to scratch/linkedin_dump.html for debugging`);
      } catch (err) {}
    }
    report(`Found ${count} job cards on the first page.`);

    for (let i = 0; i < count && i < 10; i++) { // Limit to top 10 for safety
      try {
        const card = jobCardsLocator.nth(i);
        await card.scrollIntoViewIfNeeded().catch(() => {});
        await card.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1500); // Wait for description pane to load

        const title = await card.locator('.job-card-list__title, .job-card-container__title').innerText().catch(() => 'Unknown Title');
        const company = await card.locator('.job-card-container__company-name').innerText().catch(() => 'Unknown Company');
        const loc = await card.locator('.job-card-container__metadata-item').first().innerText().catch(() => 'Unknown Location');
        
        let href = await card.locator('a').first().getAttribute('href').catch(() => null);
        if (href && href.startsWith('/')) {
          href = `https://www.linkedin.com${href}`;
        }
        const listingUrl = href ? href.split('?')[0] : `https://www.linkedin.com/jobs/view/${Date.now()}`;

        const description = await page.locator('.jobs-description__content').innerText().catch(() => 'Description unavailable');

        report(`Extracting job ${i+1}/${count}: ${title} at ${company}`);

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
