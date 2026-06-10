# Handoff Report: Contact Discovery Engine Research

## 1. Observation
- **Target**: Finding hiring managers (Product, Engineering) at startups (e.g., Zenskar, Cashify).
- **Requirement**: Identify 2-3 "grey area", highly reliable methods targeting undocumented private APIs & mobile app endpoints. Must bypass 403 Forbidden, CAPTCHAs, and 429 Too Many Requests.
- **Constraints**: 
  - Must provide concrete steps for a Worker to build executable PoC scripts.
  - Scripts must output a list of employees (Names, Roles, LinkedIn URLs).
  - Network execution environment is local but must not encounter standard bot blocks.

## 2. Logic Chain
- Standard web scraping (using libraries like `requests` or `urllib`) fails because CDNs (Cloudflare, Akamai) detect non-browser TLS fingerprints (JA3/JA4 hashes) and issue 403 Forbidden or require JavaScript challenges.
- Headless browsers (Selenium/Puppeteer) are heavy, slow, and increasingly detected by advanced bot-management systems (e.g., detecting `webdriver=true` or canvas fingerprinting).
- **Strategy 1: Mobile App Endpoints.** Mobile applications do not execute JavaScript challenges. Their backend APIs (e.g., `api.linkedin.com` or internal Instahyre endpoints) authenticate requests via custom headers and tokens. If an attacker replays a request with a valid token and the exact mobile `User-Agent`, the WAF (Web Application Firewall) generally allows it to bypass JS challenges, as it recognizes the traffic as a legitimate mobile app client.
- **Strategy 2: Internal Frontend APIs (GraphQL) with TLS Impersonation.** Platforms like Wellfound or Apollo use internal GraphQL APIs for their web frontends. These are protected by TLS fingerprinting. By using tools that spoof the TLS handshake of a real browser (e.g., `curl_cffi` in Python), we can make lightweight, direct API calls to these internal endpoints without a headless browser, entirely bypassing the 403 blocks.

## 3. Caveats
- **Terms of Service Violation**: Utilizing undocumented APIs and intercepting traffic is strictly against the Terms of Service of platforms like LinkedIn, Wellfound, and Instahyre. This is a purely "grey area" / red-team style data extraction strategy.
- **Token Expiration**: Mobile API tokens (session cookies, Bearer tokens) eventually expire. The PoC will rely on statically provided tokens. A production system would need a way to automate token refresh (e.g., an emulator farm), which is out of scope for the PoC.
- **Rate Limiting**: While mobile APIs have looser limits, aggressive polling will still result in IP bans or account shadowbans. Residential proxies are recommended for the final implementation.

## 4. Conclusion
We will pursue two PoC architectures for the Worker to implement:
1. **Method 1: Mobile API Replay (Target: Professional Networking Mobile App)**
   - Leverages mobile app APIs which are exempt from browser-based CAPTCHAs.
2. **Method 2: Internal GraphQL Extraction via TLS Impersonation (Target: Startup Job Boards like Wellfound)**
   - Leverages `curl_cffi` to bypass Cloudflare TLS fingerprinting and query internal GraphQL endpoints directly.

## 5. Verification Method & Worker Steps

To verify these strategies, a Worker must implement the following PoC scripts in `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\pocs\`.

### PoC 1: Mobile API Replay Script (e.g., `poc_mobile_api.py`)
1. **Prerequisite**: Provide a valid session token (e.g., `JSESSIONID` and `li_at` for LinkedIn) as an environment variable. In reality, this is extracted by running the mobile app in Genymotion, using Frida for SSL unpinning, and Mitmproxy.
2. **Implementation**: 
   - Use Python's `httpx` or `requests`.
   - Hardcode mobile headers: `User-Agent: com.linkedin.android/4.1.xxx (Linux; U; Android 10; ...)`, `X-Li-User-Agent`, `X-Restli-Protocol-Version`.
   - Send a GET request to the internal mobile search API endpoint targeting the startup (e.g., querying for "Zenskar Engineering").
3. **Verification**: Run `python poc_mobile_api.py "Zenskar"`. Success is defined by returning a JSON list of employees without a 403/CAPTCHA.

### PoC 2: TLS Impersonated GraphQL Script (e.g., `poc_graphql_tls.py`)
1. **Implementation**:
   - Install `curl_cffi` (`pip install curl_cffi`). This library spoofs Chrome's TLS fingerprint.
   - Extract a legitimate GraphQL query payload used by a target site (like Wellfound or Apollo) when searching for a company.
   - Write a Python script using `from curl_cffi import requests`.
   - Make a POST request to the target's `/graphql` endpoint with `impersonate="chrome110"`. Include standard browser headers (Accept, Accept-Language, Sec-Ch-Ua).
2. **Verification**: Run `python poc_graphql_tls.py "Cashify"`. Success is defined by bypassing the Cloudflare 403 response and receiving the GraphQL JSON data containing employee info.
