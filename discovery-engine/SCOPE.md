# Scope: Milestone 3 - Implementation

## Architecture
- **Goal**: Build a combined Contact Discovery Engine using Yahoo Search X-Ray and GitHub OSINT methods.
- **Entry point**: `src/index.js` (CLI command: `node src/index.js <CompanyName>`)
- **Modules**:
  - `src/providers/yahoo.js` - Exports `async function discover(company)` returning array of `{ name, url, source: 'Yahoo' }`.
  - `src/providers/github.js` - Exports `async function discover(company)` returning array of `{ name, url, role/bio, source: 'GitHub' }`.
  - `src/utils/dedupe.js` - Exports `function dedupe(results)` to normalize and remove duplicates.
- **Output**: Writes aggregated results to `output.json` and prints summary to stdout.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 3.1 | Setup & Utils | Scaffold `src` dir, build `dedupe.js`. | none | IN_PROGRESS |
| 3.2 | Providers | Implement `yahoo.js` and `github.js` modules. | none | IN_PROGRESS |
| 3.3 | Core Engine | Implement `index.js` CLI logic and concurrency. | 3.1, 3.2 | IN_PROGRESS |

## Interface Contracts
### Provider Interface
- Input: `companyName` (string)
- Output Promise resolving to: `[{ name: 'John Doe', url: 'https://...', source: 'ProviderName', title: 'optional' }]`
