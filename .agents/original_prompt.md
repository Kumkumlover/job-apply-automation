
## Follow-up — 2026-06-06T14:42:22+05:30

# Teamwork Project Prompt

Run the job outreach automation pipeline exactly like an end-user would, navigating the UI (via Playwright) or executing backend scripts, to ensure 11 specific job outreach emails are correctly drafted and appear in the target Gmail inbox.

Working directory: `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation`
Integrity mode: development

## Requirements

### R1. Adhere to the Protocol
The team MUST strictly adhere to the rules outlined in `C:\Users\Lenovo\.gemini\antigravity\brain\f7c2a5f2-3e51-427b-9e30-21910d0721c6\guidelines.md`. Specifically:
- You must divide the labor across the 5 specific agent roles.
- You must NEVER kill a task, process, or browser session.
- You must pause and report to Antigravity if you encounter insurmountable problems.

### R2. Verify Data and Emails
The Contact Verifier must ensure that the discovered contacts are from the correct company and correct department. The Email Verifier must ensure the system generates at least two API-verified emails (Hunter/Apollo) before utilizing the Pattern Engine.

### R3. Record All Runs
You must document every execution run, step taken, contacts found, and any anomalies inside `C:\Users\Lenovo\.gemini\antigravity\brain\f7c2a5f2-3e51-427b-9e30-21910d0721c6\run_log.md`.

## Acceptance Criteria

### Execution & Verification
- [ ] All 11 job openings are processed completely through the pipeline.
- [ ] `run_log.md` contains detailed logs for each opening proving the 5-agent verification steps occurred.
- [ ] A final verification script confirms that exactly 11 drafted emails matching the openings exist in the Gmail IMAP server, complete with a valid "To:" address and correctly customized HTML bodies.
