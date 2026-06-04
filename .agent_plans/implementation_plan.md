# Resume Builder Improvements

The current implementation extracts raw text from your PDF, which destroys your original formatting. Furthermore, it only shows a single ATS score without showing the improvement.

To solve this, we will upgrade the Resume Builder with the following architecture:

## Proposed Changes

### 1. Dependencies
- Install `react-markdown` to safely render markdown to HTML.
- Install `html2canvas` to take a high-quality visual snapshot of the rendered HTML to convert into a beautifully formatted PDF.

### 2. API Route Upgrade (`src/app/api/resume-builder/route.ts`)
- Update the prompt to the Groq AI (`llama-3.3-70b-versatile`) to explicitly output three fields in its JSON response:
  - `originalAtsScore`: The ATS match score of the *uploaded* resume.
  - `tailoredAtsScore`: The improved ATS match score of the *newly tailored* resume (aiming for 90%+).
  - `tailoredResumeMarkdown`: The tailored resume formatted in **Markdown** (using `#` for headers, `**` for bold text, and `-` for bullet points) to mimic the visual hierarchy of your original resume.

### 3. UI and PDF Generation (`src/app/dashboard/resume-builder/page.tsx`)
- **Dual Score Display**: Update the UI to show both the `Original ATS Score` (e.g., 74%) and the `Improved ATS Score` (e.g., 95%) side-by-side.
- **Rich Text Preview**: Instead of a raw `<textarea>`, we will render the `tailoredResumeMarkdown` using `react-markdown` inside a styled preview container that closely resembles a real, physical paper resume (white background, black text, proper margins, bold headers).
- **Formatted PDF Download**: Rewrite the `handleDownload` function. Instead of blindly writing text to `jsPDF`, we will use `html2canvas` to capture the perfectly formatted React Markdown component and embed that high-resolution image into `jsPDF`. This ensures the downloaded PDF looks exactly like a real resume, preserving all bolding and bullet points.
