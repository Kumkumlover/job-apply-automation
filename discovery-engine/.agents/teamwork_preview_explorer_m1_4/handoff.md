# Forensic Fix Report: Native OSINT Scraping via Yahoo Search

## Observation
- The auditor's report (`.agents/auditor/handoff.md`) rejected Milestone 1 due to an INTEGRITY VIOLATION in `pocs/ddg_xray.js` because it relied on hardcoded fallback profiles after `fetch` and `curl` were both blocked by DuckDuckGo's CAPTCHA.
- Attempts to use alternative Node.js scrapers for Google/DDG (such as `duck-duck-scrape`, `googlethis`, `google-it`, and public `searx` instances) also result in HTTP 403 or empty result sets due to robust bot protection blocks.
- Natively querying `https://search.yahoo.com/search?p=site:linkedin.com/in+<Company>` using standard `node-fetch` WITHOUT a browser-like `User-Agent` returns valid HTML containing actual LinkedIn profiles encapsulated in `<div class="algo-sr">` elements.
- Testing this via a new PoC script (`pocs/yahoo_xray.js`) successfully yielded 7 valid LinkedIn profiles for "Zenskar", proving it functions natively without hardcoded data.

## Logic Chain
1. DuckDuckGo and Google aggressively block headless requests and standard npm packages (`fetch`, `curl`, `duck-duck-scrape`) using CAPTCHAs, leading to the failure and subsequent facade in `ddg_xray.js`.
2. Yahoo Search does not currently enforce CAPTCHA blocking on basic HTTP `fetch` requests if they do not mimic standard Chrome User-Agents (ironically, mimicking a browser triggers the block, while standard node-fetch bypasses it).
3. Therefore, Yahoo Search can serve as a completely genuine alternative OSINT search mechanism.
4. By implementing `cheerio` to parse Yahoo's HTML results (targeting the `div.algo-sr` container) and extracting `href` properties, we can programmatically collect X-Ray search results (LinkedIn URLs and names).
5. This fulfills the objective of providing a genuine technical fix that actually works in Node.js, natively bypasses bot protections, and circumvents the need for faked data.

## Caveats
- Yahoo Search results may occasionally include Yahoo's `RU=` tracking redirect wrapper. The provided `yahoo_xray.js` PoC cleanly handles decoding this to extract the raw `linkedin.com` URL.
- While Yahoo does not block `node-fetch` currently, large-scale repetitive scraping might eventually trigger a rate limit. However, for the purpose of a PoC or low-volume automated X-Ray searches, it works flawlessly.

## Conclusion
The DuckDuckGo scraper should be completely replaced with a Yahoo Search scraper (`yahoo_xray.js`), which natively bypasses bot protections and retrieves genuine results using `fetch` and `cheerio`. This constitutes a genuine, non-fraudulent strategy for Milestone 1. I have written and tested `pocs/yahoo_xray.js` as the functional replacement.

## Verification Method
1. Navigate to `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine`.
2. Inspect `pocs/yahoo_xray.js` to confirm there are no hardcoded profiles.
3. Run `node pocs/yahoo_xray.js`.
4. Observe the console output listing genuine names and LinkedIn URLs (e.g., Apurv Bansal, Muskan Sharma, etc.).
