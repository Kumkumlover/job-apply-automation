## 2026-06-08T17:02:36Z
Read `c:\Users\Lenovo\Downloads\n8n-data-20260510T162446Z-3-001\n8n-data\job-apply-automation\discovery-engine\SCOPE.md`.
Your task is to implement `src/index.js` and `src/utils/dedupe.js`.
`dedupe.js` should export a function `dedupe(results)` that takes an array of employee objects and removes duplicates based on `url` (or name fuzzy match if you like).
`index.js` is the CLI entry point. It takes the company name from `process.argv[2]`, calls `require('./providers/yahoo').discover(company)` and `require('./providers/github').discover(company)` concurrently using `Promise.allSettled`, aggregates the arrays, calls `dedupe`, writes the final JSON to `output.json`, and prints a summary.
Save the files. When done, send me a message.
