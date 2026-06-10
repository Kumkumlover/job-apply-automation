# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: uat.spec.ts >> Job Apply Automation UAT >> should process 11 jobs, draft emails, and verify LinkedIn profiles
- Location: tests\uat.spec.ts:43:7

# Error details

```
TimeoutError: locator.click: Timeout 15000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /Find Emails for/i })
    - locator resolved to <button disabled class="w-2/3 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-3">…</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    28 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Test source

```ts
  18  |       if (currentOpening) {
  19  |         currentOpening.jd = jdLines.join('\n').trim();
  20  |         openings.push(currentOpening);
  21  |       }
  22  |       currentOpening = {
  23  |         company: match[1].trim(),
  24  |         role: match[2].trim(),
  25  |         url: match[3].trim(),
  26  |         jd: ""
  27  |       };
  28  |       jdLines = [];
  29  |     } else if (currentOpening) {
  30  |       jdLines.push(line);
  31  |     }
  32  |   }
  33  |   if (currentOpening) {
  34  |     currentOpening.jd = jdLines.join('\n').trim();
  35  |     openings.push(currentOpening);
  36  |   }
  37  |   return openings;
  38  | }
  39  | 
  40  | test.describe('Job Apply Automation UAT', () => {
  41  |   test.setTimeout(40 * 60 * 1000); 
  42  | 
  43  |   test('should process 11 jobs, draft emails, and verify LinkedIn profiles', async () => {
  44  |     const credentials = fs.readFileSync('credentials.txt', 'utf-8').split('\n');
  45  |     const linkedinEmail = credentials[0].split('Linkedin: ')[1].trim();
  46  |     const linkedinPass = credentials[1].split('Password: ')[1].trim();
  47  |     
  48  |     const smtpUser = process.env.SMTP_USER || linkedinEmail;
  49  |     const smtpPass = process.env.SMTP_PASS || 'vysn aibz pzix oknt'; 
  50  |     
  51  |     // Use Persistent Context OUTSIDE the next.js directory to avoid Turbopack crashing!
  52  |     const context = await chromium.launchPersistentContext('../playwright-data', { headless: false });
  53  |     const page = await context.newPage();
  54  |     page.setDefaultTimeout(15000); // Fail fast instead of hanging forever!
  55  | 
  56  |     // 1. Log into LinkedIn
  57  |     console.log("Checking LinkedIn session...");
  58  |     await page.goto("https://www.linkedin.com/feed/", { waitUntil: 'domcontentloaded', timeout: 30000 });
  59  |     
  60  |     if (page.url().includes("linkedin.com/login") || page.url().includes("linkedin.com/signup")) {
  61  |       console.log("Not logged in. Performing login...");
  62  |       await page.goto("https://www.linkedin.com/login");
  63  |       await page.fill('#username', linkedinEmail);
  64  |       await page.fill('#password', linkedinPass);
  65  |       await page.click('[type="submit"]');
  66  |       
  67  |       console.log("Waiting for user to solve CAPTCHA if any... Waiting for feed to load...");
  68  |       await page.waitForURL('**/feed/**', { timeout: 120000 });
  69  |       console.log("Logged into LinkedIn successfully.");
  70  |     } else {
  71  |       console.log("Already logged in via persistent context!");
  72  |     }
  73  | 
  74  |     // 2. Parse openings
  75  |     const openings = parseOpenings('../Opening Details.txt');
  76  |     console.log(`Found ${openings.length} openings.`);
  77  | 
  78  |     const submittedSubjects: string[] = [];
  79  |     const testStartTime = new Date();
  80  | 
  81  |     for (let i = 0; i < openings.length; i++) {
  82  |       const opening = openings[i];
  83  |       console.log(`\nSubmitting [${i+1}/11]: ${opening.company} - ${opening.role}`);
  84  |       
  85  |       await page.goto('http://localhost:3000/outreach', { waitUntil: 'domcontentloaded' });
  86  |       
  87  |       // Clear persistent state from previous runs/jobs so we always start on Step 1!
  88  |       await page.evaluate(() => {
  89  |           Object.keys(localStorage).forEach(key => {
  90  |               if (key.startsWith('outreach_')) {
  91  |                   localStorage.removeItem(key);
  92  |               }
  93  |           });
  94  |       });
  95  |       // Reload to apply the cleared state
  96  |       await page.reload({ waitUntil: 'domcontentloaded' });
  97  |       
  98  |       // Step 1: Company & Job Title
  99  |       console.log(" -> Filling Form...");
  100 |       
  101 |       await page.locator('label:has-text("Company *")').locator('~ input').fill(opening.company);
  102 |       await page.locator('label:has-text("Job Title / Role *")').locator('~ input').fill(opening.role);
  103 |       await page.locator('label:has-text("Job Description")').locator('~ textarea').fill(opening.jd.substring(0, 1000));
  104 | 
  105 | 
  106 |       
  107 |       // Click "Find Decision Makers"
  108 |       await page.screenshot({ path: `debug_${i}.png` });
  109 |       console.log(` -> Took screenshot debug_${i}.png`);
  110 |       await page.getByRole('button', { name: 'Find Decision Makers', exact: true }).click();
  111 |       
  112 |       // Wait for Contacts phase to finish loading (Button will become "Find Emails for X Contacts")
  113 |       console.log(" -> Waiting for Decision Makers to load...");
  114 |       await expect(page.getByRole('button', { name: /Find Emails for/i })).toBeVisible({ timeout: 180000 });
  115 |       
  116 |       // Click "Find Emails for X Contacts"
  117 |       console.log(" -> Finding Emails...");
> 118 |       await page.getByRole('button', { name: /Find Emails for/i }).click();
      |                                                                    ^ TimeoutError: locator.click: Timeout 15000ms exceeded.
  119 |       
  120 |       // Wait for Emails phase to finish (Button will become "Generate Emails & Save")
  121 |       console.log(" -> Waiting for Emails to resolve...");
  122 |       await page.screenshot({ path: `debug_before_emails_${i}.png` });
  123 |       
  124 |       try {
  125 |           await expect(page.getByRole('button', { name: /Generate Outreach for/i })).toBeVisible({ timeout: 180000 });
  126 |       } catch (e) {
  127 |           await page.screenshot({ path: `debug_timeout_emails_${i}.png` });
  128 |           throw e;
  129 |       }
  130 |       
  131 |       // Click "Generate Outreach for X Contacts"
  132 |       console.log(" -> Submitting to Draft Generator...");
  133 |       await page.getByRole('button', { name: /Generate Outreach for/i }).click();
  134 |       
  135 |       // Wait for Step 4 "Review & Send" to load
  136 |       try {
  137 |         await expect(page.getByRole('button', { name: /Send Email/i }).first()).toBeVisible({ timeout: 180000 });
  138 |         console.log(" -> Review & Send loaded. Pushing to Drafts...");
  139 |         
  140 |         // Click all "Send Email" buttons to push drafts via IMAP
  141 |         const sendButtons = await page.getByRole('button', { name: /Send Email/i }).all();
  142 |         for (const btn of sendButtons) {
  143 |             await btn.click();
  144 |             await page.waitForTimeout(500); // small delay between clicks
  145 |         }
  146 |         
  147 |         // Wait for all of them to show "Sent ✓" (or fail gracefully)
  148 |         await expect(page.getByRole('button', { name: /Sent/i }).last()).toBeVisible({ timeout: 60000 });
  149 |         console.log(" -> Successfully pushed to Drafts.");
  150 |       } catch (e: any) {
  151 |         console.log(" -> Timeout waiting for drafts or sending, moving on.");
  152 |       }
  153 |       
  154 |       submittedSubjects.push(`Application: ${opening.role} — ${opening.company}`);
  155 |       await page.waitForTimeout(2000);
  156 |     }
  157 |     
  158 |     console.log("\nAll jobs submitted. Connecting to IMAP to monitor drafts and verify profiles...");
  159 | 
  160 |     // 4. Poll IMAP for Drafts
  161 |     const client = new ImapFlow({
  162 |       host: 'imap.gmail.com',
  163 |       port: 993,
  164 |       secure: true,
  165 |       auth: { user: smtpUser, pass: smtpPass },
  166 |       logger: false
  167 |     });
  168 |     
  169 |     await client.connect();
  170 |     const processedDrafts = new Set<string>();
  171 |     let waitLoops = 0;
  172 |     
  173 |     while (processedDrafts.size < openings.length && waitLoops < 60) {
  174 |       await page.waitForTimeout(10000); // Wait 10s between checks
  175 |       waitLoops++;
  176 |       console.log(`Checking drafts... (${waitLoops}/60) Found: ${processedDrafts.size}/${openings.length}`);
  177 |       
  178 |       const lock = await client.getMailboxLock('[Gmail]/Drafts');
  179 |       try {
  180 |         if (!client.mailbox || typeof client.mailbox === 'boolean' || client.mailbox.exists === 0) {
  181 |           continue;
  182 |         }
  183 | 
  184 |         const messages: any[] = [];
  185 |         for await (const msg of client.fetch('1:*', { uid: true, envelope: true })) {
  186 |           messages.push(msg);
  187 |         }
  188 |         
  189 |         for (const msg of messages) {
  190 |           const subject = msg.envelope?.subject;
  191 |           const msgDate = msg.envelope?.date;
  192 |           
  193 |           if (subject && submittedSubjects.includes(subject) && !processedDrafts.has(subject) && msgDate && msgDate >= testStartTime) {
  194 |             console.log(`\nFound draft for: ${subject}`);
  195 |             
  196 |             // Extract LinkedIn URL
  197 |             const sourceMsg = await client.fetchOne(msg.uid, { source: true });
  198 |             const sourceStr = (sourceMsg && typeof sourceMsg !== 'boolean') ? (sourceMsg.source?.toString() || '') : '';
  199 |             const urlMatch = sourceStr.match(/data-linkedin-url="([^"]+)"/);
  200 |             const linkedinUrl = urlMatch ? urlMatch[1] : null;
  201 |             
  202 |             if (linkedinUrl && linkedinUrl.includes('linkedin.com/in/')) {
  203 |               console.log(`Verifying profile: ${linkedinUrl}`);
  204 |               await page.goto(linkedinUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
  205 |               await page.waitForTimeout(3000); 
  206 |               const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
  207 |               
  208 |               const matchedOpening = openings.find(o => `Application: ${o.role} — ${o.company}` === subject);
  209 |               const companyLower = matchedOpening ? matchedOpening.company.toLowerCase() : '';
  210 | 
  211 |               if (bodyText.includes(companyLower)) {
  212 |                 console.log(`✅ Verified ${companyLower} on profile.`);
  213 |               } else {
  214 |                 throw new Error(`❌ Verification failed: Could not easily verify ${companyLower} on profile.`);
  215 |               }
  216 |             } else {
  217 |               console.log(`⚠️ No LinkedIn URL found in draft for ${subject}`);
  218 |             }
```