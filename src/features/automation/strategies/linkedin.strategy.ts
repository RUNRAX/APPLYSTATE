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
  async login(page: Page, userId: string) {
    console.log(`[LinkedinStrategy] Authenticating for user ${userId}...`);
    
    const credRow = await prisma.platformCredential.findFirst({
      where: { userId, platform: 'linkedin', isActive: true }
    });
    
    if (!credRow || !credRow.vaultPath) {
      throw new Error("No connected LinkedIn credentials found.");
    }
    
    const creds = await getCredential(userId, credRow.vaultPath);
    if (!creds || !creds.email || !creds.password) {
      throw new Error("Invalid or missing credentials from Vault.");
    }

    await page.goto('https://www.linkedin.com/login', { waitUntil: 'domcontentloaded' });
    await page.fill('#username', creds.email);
    await page.fill('#password', creds.password);
    await page.click('[type="submit"]');
    
    // Wait for the feed or security challenge
    await page.waitForTimeout(3000);
    const isChallenge = await page.locator('.challenge-dialog').isVisible().catch(() => false);
    if (isChallenge) {
      console.log('[LinkedIn] Security challenge detected. Awaiting manual resolution...');
      await page.waitForTimeout(15000); // Wait for user to pass it manually since headless: false
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
