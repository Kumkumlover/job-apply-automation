# Original User Request

## Initial Request — 2026-06-08T10:40:40Z

# Teamwork Project Prompt — Draft

> Status: Step 4 — Drafting Requirements
> Goal: Craft prompt → get user approval → delegate to teamwork_preview

Build a highly reliable, unconventional, and robust contact discovery engine that finds hiring managers (e.g., Product, Engineering) at startups (especially Indian startups). The system should bypass typical API limitations and bot-protections to guarantee reliable results, embracing outside-the-box data gathering strategies.

Working directory: `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine` (or let team decide)
Integrity mode: development

## Requirements

### R1. Deep Research & Solution Proposal Phase
Before writing any production code, the team must deeply research, test, and propose 2-3 specific, highly reliable "grey area" or unconventional methods for contact discovery. These methods must demonstrably bypass standard bot protections (e.g., Cloudflare) and API limits. Examples might include anti-detect headless browsers with residential proxies, leveraging undocumented private mobile APIs, or scraping massive OSINT data aggregators. 

### R2. Proof of Concept (PoC) Validation
The team must build small, executable scripts to prove that their proposed methods actually work against real targets (e.g., finding the Product team at Zenskar or Cashify) without getting blocked. The results of these PoCs must be presented to the user for a final decision on which architecture to fully build out.

### R3. Unrestricted Architecture & Execution
The team has full autonomy to choose the tech stack (e.g., Python for scraping/OSINT, Node.js, etc.) and architecture. They are permitted to use any open-source tools, pre-built frameworks, or external scripts necessary to achieve maximum reliability.

## Acceptance Criteria

### Research & Proposals
- [ ] The team presents at least 2 distinct, highly reliable methods for contact discovery.
- [ ] Each proposal clearly explains *how* it bypasses standard bot protections or API limitations.

### Validation
- [ ] The team provides runnable PoC scripts for their proposed methods.
- [ ] The PoCs successfully retrieve actual employee data (names, roles, or LinkedIn URLs) for a given startup (e.g., Zenskar) without encountering 403 Forbidden, CAPTCHAs, or 429 Too Many Requests errors.
