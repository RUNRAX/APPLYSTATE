# ApplyMate Implementation Plan

This is a comprehensive plan to fully build and wire up the ApplyMate project. Currently, the project is a structural skeleton with some initial UI and a Prisma schema, but lacks functionality, routing, authentication, and the core automation engine.

## Goal Description
Build a fully functioning end-to-end "autonomous AI job application agent". This includes a stunning landing page, secure authentication, a user dashboard to manage profiles/preferences, a backend to score jobs and tailor resumes using OpenAI, and a background worker system using Playwright to apply to jobs.

## User Review Required
> [!IMPORTANT]
> **OpenAI / API Keys**: You will need to ensure a valid OpenAI API key and potentially Playwright environment settings are added to the `.env` file before the tailoring/embeddings features can be tested.
> 
> **Database Credentials**: Ensure the PostgreSQL database configured in your `.env` supports `pgvector` (as defined in Prisma schema). Supabase is recommended for this.
> 
> **Redis**: BullMQ requires a Redis instance. You will need a Redis URL (e.g., Upstash) in your `.env`.

## Open Questions
> [!NOTE]
> 1. Do you want to start with a specific job board platform (e.g., LinkedIn) for the initial Playwright automation script?
> 2. Are we using purely Credentials for auth, or do you want OAuth (Google/GitHub) set up in NextAuth?

## Proposed Changes

### 1. Design System & Landing Page UI
Currently, `page.tsx` uses inline styles. We will migrate to a cleaner, maintainable CSS approach (CSS Modules or Tailwind if you prefer, but sticking to standard CSS as per Web App Guidelines).
#### [MODIFY] src/app/page.tsx
- Add working navigation links for "Get Started" and "View Demo".
- Implement responsive design adjustments.
#### [MODIFY] src/components/ui/
- Clean up `Button.tsx`, `GlassCard.tsx`, and `Input.tsx`.
- Add interactive micro-animations using Framer Motion.

### 2. Authentication (NextAuth)
#### [NEW] src/app/api/auth/[...nextauth]/route.ts
- Configure NextAuth with Credentials provider backed by Prisma.
#### [MODIFY] src/app/(auth)/login/page.tsx & register/page.tsx
- Build the UI for registration and login.
- Connect forms to NextAuth.

### 3. User Dashboard & Onboarding
#### [MODIFY] src/app/(dashboard)/layout.tsx & page.tsx
- Build the main authenticated layout (Sidebar, Header).
- Create dashboard data fetching to display user's current applications, job listings, and match scores.
#### [NEW] src/app/(dashboard)/onboarding/page.tsx
- Multi-step form for user to input their skills, experience, and upload a base resume.

### 4. AI Core (Matching & Tailoring)
#### [MODIFY] src/features/matching/embeddings.ts
- Use OpenAI `text-embedding-ada-002` (or v3) to generate vector embeddings for user profiles and job descriptions.
#### [MODIFY] src/features/resume/tailor.ts
- Implement OpenAI prompt to rewrite user's original resume to highlight keywords from the target job description.

### 5. Automation Engine (BullMQ & Playwright)
#### [MODIFY] src/workers/application.worker.ts
- Configure BullMQ worker to pick up `QUEUED` applications.
- Implement Playwright script to navigate to job URL, fill out forms based on user profile, upload the tailored PDF resume, and submit.
#### [MODIFY] src/workers/discovery.worker.ts
- Background job to find new job listings and calculate cosine similarity with the user's profile vector.

## Verification Plan
### Automated Tests
- N/A for now.

### Manual Verification
- **Auth Flow**: Register a new user, log in, log out.
- **Onboarding Flow**: Fill out profile, ensure it saves to database.
- **AI Tailoring**: Trigger a resume tailoring request and verify the output contains the job description keywords.
- **Worker Execution**: Enqueue a dummy job application and verify the Playwright worker picks it up and successfully navigates.
