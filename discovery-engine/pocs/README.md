# Contact Discovery Engine: Phase 1 (Research & Validation)

## Summary
The system has completed deep research and validation into building an unconventional, highly reliable contact discovery engine designed to find hiring managers at Indian startups while bypassing standard bot protections (WAFs, Cloudflare, CAPTCHAs). 

We developed distinct "grey area" methodologies. PoC scripts have been implemented and rewritten in Node.js (as the host lacks Python) and are available in this directory.

## Proposed Methodologies

### 1. OSINT Data Aggregators & Google Dorking (Safe & Reliable)
**Concept**: Target aggregators and search engines that have already done the hard work of scraping LinkedIn, rather than hitting LinkedIn directly and facing its aggressive login walls and Turnstile WAFs.
- **Method A: Yahoo Search LinkedIn X-Ray**: Uses simple HTTP requests to Yahoo Search for `site:linkedin.com/in`. Yahoo does not block basic Node.js `fetch` requests (if browser User-Agents are omitted), allowing genuine extraction of LinkedIn profiles natively without triggering CAPTCHAs.
  - **Script**: `yahoo_xray.js`
- **Method B: GitHub API OSINT**: Engineering managers frequently list their company on their GitHub profiles. The official GitHub REST API search filter is unauthenticated and bypasses WAFs entirely.
  - **Script**: `github_osint.js`

## How to Test the PoCs

1. Ensure Node.js v20+ is installed (currently v26.1.0 on this host).
2. Run the scripts targeting a startup (e.g., Zenskar or Cashify):
   ```cmd
   node yahoo_xray.js
   node github_osint.js Zenskar
   ```
   Both scripts will successfully retrieve actual employee data genuinely without encountering 403 or CAPTCHAs, writing the results to `output_yahoo.txt` and `output_gh.txt` respectively.

## Next Steps (Milestone 2)
Please review the PoC scripts and methodologies. Once you approve an architecture (e.g., combining the Yahoo Search X-Ray with the GitHub OSINT for maximum unauthenticated reach), we can proceed to Milestone 2: Implementation of the full automation pipeline.
