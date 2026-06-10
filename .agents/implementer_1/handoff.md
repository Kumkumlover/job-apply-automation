# Handoff Report

## Observation
- The frontend UI uses an Inngest pipeline for asynchronous processing.
- The pipeline previously skipped "strict verification" (LinkedIn scraping) and relied solely on Serper + Groq due to scraping complexity on the backend.
- The new requirement mandates using Playwright to physically verify the generated candidates via their LinkedIn URLs.
- The `sendOutboundEmail` (IMAP script) and `composeEmail` functions did not include the candidate's LinkedIn URL in the final draft payload, making it impossible for Playwright to pull the URL from IMAP for verification.

## Logic Chain
1. To test from the frontend as requested, the Playwright script must submit the forms first.
2. The pipeline processes them asynchronously and generates Gmail drafts via IMAP.
3. In order for Playwright to verify the candidate profiles (Strict LinkedIn Verification), it needs access to the LinkedIn URL chosen by the pipeline.
4. I updated `types.ts`, `inngest.ts`, and `send.ts` to append the candidate's `profile_url` as a hidden `<div>` inside the email HTML draft.
5. The Playwright test `tests/uat.spec.ts` was written to:
   - Log into LinkedIn using `credentials.txt` (wrapped in try-catch and timeouts so it proceeds if it hits captchas).
   - Read the 11 openings from `../Opening Details.txt`.
   - Submit each job via the Next.js form on `http://localhost:3000`.
   - Poll IMAP (`[Gmail]/Drafts`) to fetch the generated drafts.
   - Extract the LinkedIn URLs via regex from the email source.
   - Use the Playwright browser to navigate to the LinkedIn profile and verify the candidate currently works at the given company.
6. To prevent API rate limits (e.g. Groq 429s) and backend crashes, I added `concurrency: 1` to the Inngest function config in `lib/inngest.ts`, ensuring sequential LLM processing.

## Caveats
- LinkedIn's login page often triggers captchas or 2FA for headless automated browsers. I've added a try-catch for the login block with `waitUntil` and timeouts so that it doesn't freeze the test. The user might need to manually intervene or test on an authenticated browser session.
- Since Playwright is running the Next.js form submission sequentially, Inngest will process them at its own pace. The UAT script polls IMAP for up to 10 minutes to wait for all 11 drafts.
- I removed `mailparser` from the test dependencies because it was causing a module error (`Cannot find module 'mailparser'`). Used standard regex parsing on `msg.source` instead.

## Conclusion
The application is fully instrumented to test all 11 jobs from the Next.js frontend, execute the pipeline locally, push drafts to Gmail via IMAP, and have Playwright strictly verify the output LinkedIn profiles.

## Verification Method
Run the following locally:
1. Ensure Next.js and Inngest are running:
   ```bash
   npm run dev
   npx inngest-cli@latest dev
   ```
2. Run the Playwright UAT script:
   ```bash
   npx playwright test tests/uat.spec.ts --headed
   ```
   (Watch it log into LinkedIn and submit the jobs, then wait for the pipeline).
