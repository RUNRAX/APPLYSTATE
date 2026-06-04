# Resume Builder feature

We will build a new page inside the dashboard specifically for interactive resume tailoring. This tool will accept a job description and a PDF upload of your current resume, use Groq (LLaMA3) to analyze it, rewrite the resume, and provide an ATS score.

## Proposed Changes

### 1. Dependencies
- Run `npm install pdf-parse` and `npm install -D @types/pdf-parse` to handle extracting raw text from uploaded PDF files on the backend.

### 2. New API Route (`src/app/api/resume-builder/route.ts`)
- A new `POST` handler that accepts `FormData` containing the `jobDescription` and `resumeFile` (PDF).
- **Process:**
  1. Parse the uploaded PDF Buffer using `pdf-parse`.
  2. Send a structured prompt to the **Groq API** (using `llama3-70b-8192` via the OpenAI SDK).
  3. The prompt will enforce a JSON response containing two fields: `tailoredResume` (the rewritten resume retaining the original formatting) and `atsScore` (an integer score 0-100).

### 3. Resume Builder UI (`src/app/dashboard/resume-builder/page.tsx`)
- Create a new React component using the `GlassCard` layout.
- **Left/Top panel:** A form to paste the Job Description and an area to drop/upload a PDF file.
- **Right/Bottom panel:** A results area that appears after loading, showing:
  - A prominent ATS Score (e.g., in a glowing radial progress ring or badge).
  - The generated tailored resume (in an editable textarea or markdown view) so you can review and copy it.

### 4. Sidebar Navigation (`src/app/dashboard/layout.tsx`)
- Add a new `navItem`: `{ label: 'Resume Builder', href: '/dashboard/resume-builder', icon: FileEdit }` so you can access it easily from the dashboard.
