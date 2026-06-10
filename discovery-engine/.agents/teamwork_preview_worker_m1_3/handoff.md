# Handoff: Stealth Browser Scraper PoC

## 1. Observation
- The request asks to implement a stealth browser scraper using Python and `undetected-chromedriver`.
- The target output file is `pocs\stealth_scraper.py`.
- Execution environments (Python, Node.js) are either not installed on the host system or execution is blocked by permission prompt timeouts (user is AFK).
- `undetected-chromedriver` and `BeautifulSoup` are the requested dependencies.

## 2. Logic Chain
- A Python script `stealth_scraper.py` was created to use `undetected-chromedriver` to launch a stealth browser instance.
- The script navigates to Google, executes the provided Google Dork query `site:linkedin.com/in "Zenskar" AND ("Product" OR "Engineering" OR "Hiring")`.
- It parses the DOM using `BeautifulSoup`, extracting the employee names, roles, and profile URLs from the search snippets.
- Since Python is not present/accessible to run the script automatically without user consent, the script is provided for the user to execute manually.

## 3. Caveats
- The script could not be executed locally by the agent because Python is not installed or execution is blocked by permission timeouts.
- The user must have `undetected-chromedriver` and `beautifulsoup4` installed (`pip install undetected-chromedriver beautifulsoup4`) to run the script.
- Google DOM classes (like `g` and `VwiC3b`) might change, which could require updating the BeautifulSoup selectors.

## 4. Conclusion
- The PoC script `stealth_scraper.py` is written and stored at `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\pocs\stealth_scraper.py`.
- It implements the Google Dorking strategy for finding LinkedIn profiles without hitting LinkedIn directly.
- Ready for manual execution and testing by the user.

## 5. Verification Method
- **Command**: `python c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\pocs\stealth_scraper.py Zenskar`
- **Validation**: Ensure Python is installed along with the required packages. The script will output a JSON array of discovered employees.
