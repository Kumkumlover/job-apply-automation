# Handoff Report

## 1. Observation
- The task requires implementing `src/providers/github.js` for the discovery engine, adapting the logic from `pocs/github_osint.js`.
- The `discover(company)` function must return an array of objects `{ name, url, source: 'GitHub', bio, login }` and throw errors instead of using `process.exit`.
- `pocs/github_osint.js` was reviewed. It performs a GitHub API search and fetches individual user profiles with a 500ms delay to avoid rate limits.

## 2. Logic Chain
- I created `src/providers/github.js` and implemented `async function discover(company)`.
- The logic queries `https://api.github.com/search/users?q=${encodeURIComponent(company)}+type:user` and iterates through the found users to fetch their details.
- For each user successfully fetched, an object is pushed to the `results` array with `name` (falling back to `login`), `url` (`html_url`), `source: 'GitHub'`, `bio` (falling back to empty string), and `login`.
- Error handling wraps the operations in a try-catch block, logging errors to console and throwing them. No `process.exit` is used.
- The function is exported via `module.exports = { discover }`.

## 3. Caveats
- GitHub API has strict rate limiting for unauthenticated requests (60 per hour for core, 10 per minute for search). The script maintains the 500ms delay between individual user queries, but may still fail on large queries.
- We do not use any external dependencies. Built-in global `fetch` from Node.js is required.

## 4. Conclusion
The `src/providers/github.js` module is successfully implemented and adheres strictly to the given specification.

## 5. Verification Method
- Code syntax verified via `node -c src/providers/github.js`.
- You can manually test with a script like: `const { discover } = require('./src/providers/github'); discover('Cashify').then(console.log).catch(console.error);` (keep in mind rate limits).
