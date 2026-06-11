import { chromium } from 'playwright';
import { applyToGreenhouse, extractContactInfo } from './src/features/automation/platforms/greenhouse';
import fs from 'fs/promises';

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Create dummy resume
  await fs.writeFile('dummy.txt', 'Rakshit Awati\nrakshitawati5@gmail.com\n8431958814\nSoftware Engineer\nGitHub: https://github.com/rakshit');
  
  try {
    const candidateData = await extractContactInfo('Rakshit Awati\nrakshitawati5@gmail.com\n8431958814\nSoftware Engineer\nGitHub: https://github.com/rakshit');
    console.log("Extracted Candidate:", candidateData);
    
    await applyToGreenhouse(page, 'https://boards.greenhouse.io/spacex/jobs/7438459002', candidateData, 'dummy.txt');
    console.log("Finished running applyToGreenhouse test");
  } catch (e) {
    console.error(e);
  } finally {
    // await browser.close();
  }
}
run();
