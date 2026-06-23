import { Page } from 'playwright-core';
import { getCredential } from '../../../lib/vault';

export interface SearchParams {
  targetRoles: string[];
  locations: string[];
  remote: boolean;
  threshold?: number;
  experienceLevel?: string[];
  datePosted?: string | null;
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

export class CompanyPortalsStrategy {
  async login(page: Page, userId: string, vaultPath: string, statusCallback?: (msg: string) => void) {
    const report = (msg: string) => {
      console.log(msg);
      if (statusCallback) statusCallback(msg.replace('[CompanyPortalsStrategy] ', ''));
    };

    report(`[CompanyPortalsStrategy] Authenticating Google account for user ${userId}...`);
    
    if (!vaultPath) {
      throw new Error("No connected credentials found.");
    }
    
    const creds = await getCredential(userId, vaultPath);
    if (!creds || !creds.email || !creds.password) {
      throw new Error("Invalid or missing credentials from Vault.");
    }

    try {
      // Check if already logged in to Google
      await page.goto('https://myaccount.google.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      let isLoggedIn = false;
      try {
        await page.waitForSelector('text="Personal info"', { timeout: 5000 });
        isLoggedIn = true;
      } catch (e) {
        isLoggedIn = false;
      }
      
      if (isLoggedIn) {
        report(`[CompanyPortalsStrategy] Google Authenticated successfully (cached).`);
        return;
      }
      
      // Proceed to login
      await page.goto('https://accounts.google.com/signin', { waitUntil: 'domcontentloaded', timeout: 60000 });
      
      const emailInput = page.locator('input[type="email"]');
      await emailInput.waitFor({ state: 'visible', timeout: 15000 });
      await emailInput.fill(creds.email);
      await page.keyboard.press('Enter');
      
      const passInput = page.locator('input[type="password"]');
      await passInput.waitFor({ state: 'visible', timeout: 15000 });
      await passInput.fill(creds.password);
      await page.keyboard.press('Enter');
      
    } catch (e) {
      report("[CompanyPortalsStrategy] Automated login struggled or timed out. Please check the browser window.");
    }
    
    report('Waiting up to 3 minutes for you to complete any 2FA or manual login in the Chromium window...');
    
    // Wait for login success
    let loginSuccess = false;
    try {
      for (let i = 0; i < 180; i++) {
        if (page.url().includes('myaccount.google.com') || page.url().includes('myactivity.google.com') || (await page.locator('a[aria-label*="Google Account"]').count()) > 0) {
          loginSuccess = true;
          break;
        }
        await page.waitForTimeout(1000);
      }
      if (!loginSuccess) {
        // sometimes it redirects to Google homepage
        if (page.url() === 'https://www.google.com/' || page.url().includes('?hl=')) {
           const avatar = await page.locator('a[aria-label*="Google Account"]').count();
           if(avatar > 0) loginSuccess = true;
        }
      }
      
      if (!loginSuccess) throw new Error("Google login verification failed.");
      report(`[CompanyPortalsStrategy] Google Authenticated successfully.`);
    } catch (e) {
      throw new Error("Failed to authenticate Google account in time.");
    }
  }

  async *search(page: Page, params: SearchParams, statusCallback?: (msg: string) => void): AsyncGenerator<RawListing> {
    const report = (msg: string) => {
      console.log(msg);
      if (statusCallback) statusCallback(msg.replace('[CompanyPortalsStrategy] ', ''));
    };

    report(`[CompanyPortalsStrategy] Searching company portals via Google for: ${params.targetRoles.join(', ')}`);
    
    const randomRole = params.targetRoles[Math.floor(Math.random() * params.targetRoles.length)];
    const location = params.remote ? 'remote' : (params.locations[0] || '');
    
    // Construct Google search query specifically targeting well-known ATS subdomains
    // e.g., site:greenhouse.io OR site:jobs.lever.co OR site:myworkdayjobs.com
    const query = `"${randomRole}" ${location ? `"${location}" OR remote` : 'remote'} (site:greenhouse.io OR site:jobs.lever.co OR site:myworkdayjobs.com OR site:boards.greenhouse.io OR site:ashbyhq.com)`;
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    report(`Navigating to: ${searchUrl}`);
    
    try {
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch (e) {
      report(`Warning: Navigation to search timed out, proceeding anyway...`);
    }

    // Wait for search results
    await page.waitForSelector('#search', { timeout: 30000 }).catch(() => {});
    
    const searchResults = page.locator('#search .g');
    const count = await searchResults.count();
    
    if (count === 0) {
      report(`Found 0 search results on Google.`);
      return;
    }
    
    report(`Found ${count} search results. Extracting...`);

    for (let i = 0; i < count && i < 10; i++) {
      try {
        const result = searchResults.nth(i);
        const linkLocator = result.locator('a').first();
        const url = await linkLocator.getAttribute('href').catch(() => null);
        
        if (!url || !url.startsWith('http')) continue;
        
        const title = await result.locator('h3').first().innerText().catch(() => 'Unknown Title');
        const snippet = await result.locator('div[data-sncf="1"], .VwiC3b').first().innerText().catch(() => 'Unknown Description');
        
        // Basic extraction from snippet/url
        // Visit the page to get the body text to make ATS scoring realistic
        report(`Visiting ${url} to extract full job description...`);
        
        const newPage = await page.context().newPage();
        try {
          await newPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          // wait a bit for react apps
          await newPage.waitForTimeout(2000);
          
          // Get full body text, filtering out obvious noise
          const fullText = await newPage.evaluate(() => {
             return document.body.innerText;
          }).catch(() => snippet);
          
          let atsType = 'company_portal';
          if (url.includes('lever.co')) atsType = 'lever';
          if (url.includes('greenhouse.io')) atsType = 'greenhouse';
          if (url.includes('workday.com')) atsType = 'workday';
          if (url.includes('ashbyhq.com')) atsType = 'ashby';

          yield {
            platform: 'company_portal',
            title,
            company: new URL(url).hostname.replace('www.', ''), // basic company name extraction
            location: location || 'Unknown',
            description: fullText.length > 200 ? fullText.substring(0, 5000) : snippet,
            listingUrl: url,
            atsType
          };
        } finally {
          await newPage.close();
        }
      } catch (err) {
         console.warn(`[CompanyPortalsStrategy] Failed to extract data for result ${i}`, err);
      }
    }
  }
}
