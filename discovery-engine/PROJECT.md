# Project: Contact Discovery Engine
# Scope: Global

## Architecture
- Phase 1: Research and PoC development. We need to identify 2-3 "grey area" or unconventional methods to find hiring managers at startups (e.g., Zenskar, Cashify).
- Scripts will be small executables to prove feasibility.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Research & PoC | Propose 2-3 methods, build runnable PoC scripts. | none | DONE |
| 2 | Solution Selection | User review of PoCs and decision on architecture. | M1 | DONE |
| 3 | Implementation | Build the robust discovery engine. | M2 | DONE |

## Interface Contracts
### PoC Scripts
- Input: Startup Name/Domain (e.g., "Zenskar", "Cashify").
- Output: List of Employees (Names, Roles, LinkedIn URLs).
- Environment: Local execution without blockages (no 403, CAPTCHAs, or 429 errors).

## Code Layout
- `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\pocs\` - Directory for PoC scripts.
