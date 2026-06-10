# Research Report: Anti-detect Headless Browsers & Scraping

## 1. Observation
- `PROJECT.md` and `ORIGINAL_REQUEST.md` define the goal: finding hiring managers (Product, Engineering) at startups (e.g., Zenskar, Cashify).
- The solution must bypass bot protections (Cloudflare, CAPTCHAs, 429 Too Many Requests, 403 Forbidden).
- Directly scraping LinkedIn triggers strict rate limits and mandatory login walls (often prompting a login redirect or an immediate 999/403 error).
- Standard headless browsers (Puppeteer, Playwright) leak fingerprints (e.g., `navigator.webdriver = true`, predictable Canvas hashes) that are easily detected by Cloudflare, Datadome, and Google.

## 2. Logic Chain
- **Avoiding LinkedIn Login Walls**: Directly hitting LinkedIn profile URLs (`linkedin.com/in/...`) without authenticated session cookies usually leads to a block. However, Google Search index has these profiles. By scraping Google Search results using "Google Dorking" (e.g., `site:linkedin.com/in "Startup Name" "Engineering" OR "Product"`), we offload the scraping target to Google, which is easier to scrape than LinkedIn directly if the right anti-detect measures are taken. We can extract names and roles directly from the search snippets without ever touching LinkedIn's servers.
- **Evading Browser Fingerprinting**: To avoid Google's reCAPTCHA or Cloudflare Turnstile blocks, an anti-detect framework is mandatory.
  - *Node.js Option*: `puppeteer` with `puppeteer-extra-plugin-stealth` strips the `webdriver` flag and mocks standard browser variables.
  - *Python Option*: `undetected-chromedriver` or `DrissionPage` provides state-of-the-art Cloudflare bypass by handling Chrome DevTools Protocol (CDP) stealthily.
- **IP Rotation (Proxies)**: Even with stealth browsers, hitting Google or company pages rapidly from the same IP yields a 429 error or a CAPTCHA. Rotating residential proxies (e.g., BrightData, Webshare, or Smartproxy) distributes requests across real residential ISP IPs, making them indistinguishable from human traffic.
- **Handling CAPTCHAs**: Occasionally, a CAPTCHA will still trigger. Integrating an automated solver like `2captcha`, `capsolver`, or `Anti-Captcha` via browser extension or API ensures the flow isn't permanently halted.

## 3. Caveats
- Residential proxies and CAPTCHA solvers incur usage costs. For the local PoC, the Worker may have to omit the proxy (or use a free tier) and rely solely on stealth plugins, keeping request rates low to avoid triggering CAPTCHAs from their local IP.
- Google Search DOM structure changes occasionally; XPath or CSS selectors for parsing search snippets must be robust.
- Google Dorks rely on the target profiles being indexed; very recently hired managers might not be immediately visible.

## 4. Conclusion
The recommended PoC architecture is a Node.js or Python scraper that leverages Google Dorking via an anti-detect browser to discover LinkedIn profiles. 

**Implementation Strategy for the Worker:**
1. **Tech Stack Choice**: Node.js (`puppeteer-extra` + `puppeteer-extra-plugin-stealth`) OR Python (`undetected-chromedriver` + `BeautifulSoup`).
2. **Input**: Startup Name (e.g., "Zenskar").
3. **Execution Steps**:
   - Initialize the stealth browser.
   - Set up proxy configuration (if credentials exist; otherwise proceed with local IP but strict rate-limiting).
   - Navigate to `https://www.google.com/`.
   - Execute the search query: `site:linkedin.com/in "Zenskar" AND ("Product" OR "Engineering" OR "Hiring")`.
   - Parse the resulting Google Search result blocks (usually `<div class="g">`).
   - Extract the `href` (LinkedIn URL) and the text snippet (Title and Description).
   - Use simple Regex or text parsing on the title/snippet to extract the Person's Name and their exact Role.
4. **Output**: Print or save a JSON array in the format: `[ { "name": "...", "role": "...", "url": "..." } ]`.
5. **Anti-bot Fallback**: If a CAPTCHA is detected on the page, the script should either pass it to a CapSolver/2Captcha API (if keys are provided) or pause execution for 30 seconds to allow manual solving if running locally.

## 5. Verification Method
- **Command**: Run the PoC script (e.g., `node pocs/stealth_scraper.js "Zenskar"` or `python pocs/stealth_scraper.py Zenskar`).
- **Validation**: 
  - Ensure the browser successfully loads Google and performs the search without immediate IP blocks.
  - The script outputs a structured list of employees with names, roles, and LinkedIn URLs.
  - The script does NOT throw 403 Forbidden, 429 Too Many Requests, or fail silently due to undetected CAPTCHAs.
