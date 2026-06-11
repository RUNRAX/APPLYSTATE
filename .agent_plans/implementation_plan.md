# Greenhouse Automated Application Worker

The goal is to expand the application worker to automatically fill out and submit job applications on Greenhouse job boards (`boards.greenhouse.io`). 

## Open Questions
> [!IMPORTANT]  
> Greenhouse forms require a First Name, Last Name, Email, and Phone Number. Since our database `Profile` table does not explicitly store your Phone Number or LinkedIn URL, I plan to **extract these details automatically from your base Resume** using AI right before applying. 
> 
> Does this approach sound good to you? Or would you prefer we add a dedicated "Contact Info" settings page to the dashboard?

## Proposed Changes

### Database & Types
No database schema changes are strictly required since we will extract contact info from the resume on-the-fly.

### Platform Automations

#### [NEW] [src/features/automation/platforms/greenhouse.ts](file:///d:/APPLYSTATE/src/features/automation/platforms/greenhouse.ts)
- Create `applyToGreenhouse(page, url, resumePath, candidateData)`
- Use Playwright to:
  - Navigate to the Greenhouse job URL.
  - Wait for `#first_name`, `#last_name`, `#email`, `#phone`.
  - Fill in the candidate's details.
  - Upload the tailored PDF resume via `input[type="file"]`.
  - Check for common custom questions (e.g. LinkedIn Profile URL) and fill them if `candidateData.linkedinUrl` is available.
  - Click the Submit button (`#submit_app`).
  - Wait for the success confirmation page and return a screenshot.

### Worker Updates

#### [MODIFY] [src/workers/application.worker.ts](file:///d:/APPLYSTATE/src/workers/application.worker.ts)
- Modify the `processApplication` flow to detect if the `jobListing.listingUrl` is a Greenhouse link (`boards.greenhouse.io`).
- If it is Greenhouse:
  1. Use the AI to quickly extract `{ firstName, lastName, phone, linkedinUrl, githubUrl }` from `resume.originalContent` (or we can just split `user.name` and use `user.email`).
  2. Call `applyToGreenhouse(...)`.
- If it is LinkedIn:
  1. Continue using `applyToLinkedInEasyApply`.

## Verification Plan
1. Find a live Greenhouse job link.
2. Manually trigger the application worker or add the job to the database queue.
3. Verify that the Playwright browser successfully fills out the form, uploads the generated PDF resume, and submits the application.
