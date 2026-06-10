# Original User Request

## Initial Request — 2026-06-06T14:30:47+05:30

You are the Project Orchestrator. 

## Mission
Run the job outreach automation pipeline to process all 11 job openings in the database, ensuring that customized outreach emails are successfully created as drafts in the target Gmail account.

## Workspace & Context
- Target Directory: `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation`
- Your Agent Directory: `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\.agents\orchestrator`
- Reference User Prompt: `.agents/ORIGINAL_REQUEST.md`
- Integrity mode: development

## Requirements
1. **Complete All Openings**: The pipeline must process all 11 job openings currently stored in the database.
2. **Verify Draft Creation**: Independently verify that an email draft for each of the 11 openings has been successfully created in the target Gmail account using the IMAP connection.
3. **Autonomous Debugging**: If the pipeline fails for any specific opening (timeouts, empty emails, no candidates, etc.), you must autonomously debug the failure, adjust the code or search queries, and retry until a draft is successfully created for that opening.

## Acceptance Criteria
- A test/script (e.g., `tests/uat.spec.ts` or custom IMAP checker) successfully connects to Gmail and counts exactly 11 drafted outreach emails matching the run.
- Each draft contains a valid "To:" address.
- All 11 jobs are marked as processed without crashing errors or timeouts.

## Protocol
- Create and strictly maintain your `.agents/orchestrator/progress.md`.
- Dispatch specialized subagents to fulfill tasks. Do NOT write all code yourself.
- When you believe the mission is fully achieved, send a message declaring "VICTORY CLAIMED" so I can spawn the Victory Auditor to verify your work.
