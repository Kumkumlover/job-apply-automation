# Project: Job Apply Automation UAT & IMAP Integration

## Architecture
- **Frontend App**: Next.js running locally on `localhost:3000`. Exposes an automation/search UI that triggers the data gathering and LLM email generation.
- **IMAP Module**: Node.js script/module that takes the generated drafts, connects to Gmail via IMAP (using `SMTP_USER` and `SMTP_PASS`), and saves to the `[Gmail]/Drafts` folder.
- **E2E UAT Script**: Playwright runner that inputs 11 jobs from `../Opening Details.txt` to `localhost:3000` and validates the resulting emails.
- **LinkedIn Handling**: Use Serper/Groq data, skip strictly attempting to scrape linkedin.com.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | IMAP Drafts Integration | Implement IMAP appending to `[Gmail]/Drafts` using env credentials, and hook it up to the generation pipeline so generated emails are saved. | none | DONE |
| 2 | LinkedIn Verification | REVISED: Use Playwright script and `credentials.txt` to physically log into LinkedIn and verify candidate profiles. | none | IN_PROGRESS |
| 3 | UAT Runner Script | Create a Playwright test script that iterates over `../Opening Details.txt`, interacts with `http://localhost:3000`, and triggers the generation. | M1, M2 | IN_PROGRESS |
| 4 | Execution & Stabilization | Run the UAT script, fix any API limits/errors, until all 11 opening drafts are in Gmail Drafts. | M3 | IN_PROGRESS |

## Interface Contracts
### E2E Runner ↔ Frontend App
- Playwright will fill out fields derived from `../Opening Details.txt` and trigger the application flow.

### Pipeline ↔ IMAP Server
- Pipeline output must include an email subject and body. The IMAP integration uses `SMTP_USER` and `SMTP_PASS` from `.env.local` to log in via IMAP and APPEND an RFC822 formatted message to the `[Gmail]/Drafts` mailbox.
