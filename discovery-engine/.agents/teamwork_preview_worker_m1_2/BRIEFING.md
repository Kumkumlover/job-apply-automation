# BRIEFING — 2026-06-08T16:15:00Z

## Mission
Implement a TLS Impersonated GraphQL script (`graphql_tls.py`) using `curl_cffi` to query employee info for "Cashify" bypassing Cloudflare, and save it to the `pocs` directory.

## 🔒 My Identity
- Archetype: Implementer
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\.agents\teamwork_preview_worker_m1_2
- Original parent: 0c32937d-4415-4cb3-9d79-70c2dd1df62f
- Milestone: Implement TLS Impersonated GraphQL PoC

## 🔒 Key Constraints
- Must use `curl_cffi` with TLS impersonation (e.g. `impersonate="chrome110"`).
- Skip the mobile API replay if no tokens exist.
- Output a list of employees for "Cashify" from a public/internal GraphQL endpoint.
- Provide results and handoff.md, then send a message to the parent agent.
- Code should be saved in `...\pocs\`.

## Current Parent
- Conversation ID: 0c32937d-4415-4cb3-9d79-70c2dd1df62f
- Updated: not yet

## Task Summary
- **What to build**: `graphql_tls.py` utilizing `curl_cffi`.
- **Success criteria**: Successfully bypassed 403 blocks and retrieved employee info via GraphQL.
- **Interface contracts**: N/A
- **Code layout**: `pocs/graphql_tls.py`

## Key Decisions Made
- [TBD]

## Artifact Index
- [TBD]
