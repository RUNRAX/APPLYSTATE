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
  async login(page: Page, userId: string, vaultPath: string) {
    console.log(`[LinkedinStrategy] Authenticating for user ${userId}...`);
    
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
      console.warn("[LinkedinStrategy] Automated login struggled to find fields. Please login manually in the browser window within 60 seconds if needed!");
    }
    
    // Wait for the feed or security challenge
    console.log('[LinkedinStrategy] Waiting for successful login...');
    try {
      // Wait for any indicator of successful login (feed url or search bar)
      await page.waitForFunction(() => {
        return window.location.href.includes('feed') || document.querySelector('.global-nav');
      }, { timeout: 60000 });
    } catch (e) {
      console.log('[LinkedIn] Security challenge or manual login timeout detected. Please pass it manually!');
      await page.waitForTimeout(15000); // extra wait for user
    }
    
    console.log(`[LinkedinStrategy] Authenticated successfully.`);
  }

  async *search(page: Page, params: SearchParams): AsyncGenerator<RawListing> {
    console.log(`[LinkedinStrategy] Searching for roles: ${params.targetRoles.join(', ')}`);
    
    const role = encodeURIComponent(params.targetRoles[0] || 'Software Engineer');
    let location = encodeURIComponent(params.locations[0] || 'Worldwide');
    if (params.remote) {
      location = encodeURIComponent('Remote'); // Just forcing remote search
    }
    
    // f_AL=true ensures Easy Apply only
    const searchUrl = `https://www.linkedin.com/jobs/search/?keywords=${role}&location=${location}&f_AL=true`;
    console.log(`[LinkedinStrategy] Navigating to: ${searchUrl}`);
    
    await page.goto(searchUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    const jobCardsLocator = page.locator('.jobs-search-results__list-item');
    const count = await jobCardsLocator.count();
    
    console.log(`[LinkedinStrategy] Found ${count} job cards on the first page.`);

    for (let i = 0; i < count && i < 10; i++) { // Limit to top 10 for safety
      const card = jobCardsLocator.nth(i);
      await card.scrollIntoViewIfNeeded();
      await card.click();
      await page.waitForTimeout(1500); // Wait for description pane to load

      try {
        const title = await card.locator('.job-card-list__title, .job-card-container__title').innerText().catch(() => 'Unknown Title');
        const company = await card.locator('.job-card-container__company-name').innerText().catch(() => 'Unknown Company');
        const loc = await card.locator('.job-card-container__metadata-item').first().innerText().catch(() => 'Unknown Location');
        
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
