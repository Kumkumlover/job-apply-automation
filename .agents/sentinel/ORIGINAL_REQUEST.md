# Original User Request

## Initial Request — 2026-06-05T15:10:35Z

# Teamwork Project Prompt — Draft

> Status: Launched
> Goal: Automate UAT from the frontend and push to Gmail Drafts

Automate the User Acceptance Testing (UAT) for 11 job openings by running the outreach automation from the frontend web application (running locally on port 3000), fixing any pipeline errors, and pushing all resulting emails to the user's Gmail Drafts using IMAP.

Working directory: c:/Users/Lenovo/Downloads/n8n-data-20260510T162446Z-3-001/n8n-data/job-apply-automation
Integrity mode: development

## Requirements

### R1. Frontend Automation Execution
The agent team must write and run a test runner (e.g., using Playwright) that navigates to `http://localhost:3000` and physically simulates entering the 11 job openings specified in `../Opening Details.txt` to trigger the search and generation pipelines.

### R2. Error Resolution and Pipeline Fixing
If any errors are encountered during the execution (e.g., API rate limits, frontend crashes, Groq LLM failures, or search timeouts), the team must diagnose and fix the underlying code in the codebase, then re-run the verification until it succeeds.

### R3. Gmail IMAP Integration
The user strictly requires the final drafts to be placed directly into their Gmail inbox as drafts. The team must use the `SMTP_USER` and `SMTP_PASS` credentials found in `.env.local` to securely authenticate with Gmail via IMAP (e.g., using `imapflow` or `nodemailer` or writing an IMAP helper script) and append the generated personalized emails to the `[Gmail]/Drafts` folder. 

### R4. Skip Strict LinkedIn Profile Verification
Since headless browsers run by the agents will hit the LinkedIn login wall without the user's session cookie, the agents should rely on the Groq/Serper search results to find and verify the candidates instead of trying to scrape `linkedin.com` profiles directly.

## Acceptance Criteria

### Execution & Verification
- [ ] A test runner script successfully drives the local `localhost:3000` frontend UI for all 11 job openings.
- [ ] All code or rate-limit errors encountered are identified and fixed in the repository.
- [ ] The system successfully authenticates with the user's Gmail account using the `.env.local` credentials and pushes at least one personalized email draft per opening to the Gmail Drafts folder.

## Follow-up � 2026-06-05T15:13:25Z

CRITICAL UPDATE FROM USER:
The user has provided their LinkedIn credentials so that you can properly navigate past the LinkedIn login wall!
Credentials are saved in `credentials.txt` in the workspace root.

NEW REQUIREMENT: 
You MUST use these credentials in your Playwright script to physically log into LinkedIn so you can verify the candidate profiles by visiting their actual LinkedIn URLs, instead of skipping the strict verification. 

Also, the user reiterated: "I want the agents to test from frontend because that is how they will come across problems to solve". Ensure your test runner actively uses the frontend UI!
