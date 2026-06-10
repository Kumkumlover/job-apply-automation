# BRIEFING — 2026-06-06T15:10:13+05:30

## Mission
Ensure 11 specific job outreach emails are correctly drafted and appear in the target Gmail inbox following a 5-agent pipeline protocol.

## 🔒 My Identity
- Archetype: Project Orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\.agents\orchestrator\
- Original parent: top-level
- Original parent conversation ID: 20d92ce0-a32a-4ac5-8f67-ba934623a6bf

## 🔒 My Workflow
- **Pattern**: Project Orchestrator
- **Scope document**: c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\.agents\orchestrator\PROJECT.md
1. **Decompose**: We have 11 jobs to process. Each job requires passing through 5 specific agents sequentially.
2. **Dispatch & Execute**:
   - I will spawn sub-orchestrators or workers to handle each job, or process jobs sequentially mimicking the 5 agent roles.
3. **On failure**: Retry -> Replace -> Skip -> Redistribute -> Degrade -> Escalate. NEVER KILL PROCESSES.
4. **Succession**: At 16 spawns, write handoff.md, spawn successor.

## 🔒 Key Constraints
- NEVER kill a task, process, or browser session.
- Document every run, step, and anomaly in `C:\Users\Lenovo\.gemini\antigravity\brain\f7c2a5f2-3e51-427b-9e30-21910d0721c6\run_log.md`.
- Contact Verifier must check company/department. Email Verifier must ensure 2 API-verified emails before Pattern Engine.
- Final verification script must confirm exactly 11 drafted emails in IMAP.

## Current Parent
- Conversation ID: 20d92ce0-a32a-4ac5-8f67-ba934623a6bf
- Updated: not yet

## Key Decisions Made
- Proceeding to analyze the workspace to understand how to execute the pipeline.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|

## Succession Status
- Succession required: no
- Spawn count: 0 / 16
- Pending subagents: none

## Active Timers
- Heartbeat cron: task-5
