# BRIEFING — 2026-06-08T11:32:42Z

## Mission
Implement `src/providers/github.js` for the discovery engine based on `pocs/github_osint.js`.

## 🔒 My Identity
- Archetype: Implementer
- Roles: implementer, qa, specialist
- Working directory: c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\.agents\implementer_1
- Original parent: 0c32937d-4415-4cb3-9d79-70c2dd1df62f
- Milestone: Implement GitHub provider

## 🔒 Key Constraints
- Export async function `discover(company)` returning array of objects: `{ name, url, source: 'GitHub', bio, login }`
- Adapt logic from `pocs/github_osint.js`
- No `process.exit`
- Return array or throw errors

## Current Parent
- Conversation ID: 0c32937d-4415-4cb3-9d79-70c2dd1df62f
- Updated: 2026-06-08T11:32:42Z

## Task Summary
- **What to build**: `src/providers/github.js`
- **Success criteria**: Exports `discover` function, returns correct object array, no process.exit.
- **Interface contracts**: SCOPE.md
- **Code layout**: src/providers/github.js

## Key Decisions Made
- Initializing.

## Artifact Index
- handoff.md — Final report
