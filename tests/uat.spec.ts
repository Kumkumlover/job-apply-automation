import { test, expect, chromium } from '@playwright/test';
import fs from 'fs';
import { ImapFlow } from 'imapflow';
import dotenv from 'dotenv';
import { extractDeptKeywords, deptRelevanceScore, detectWrongDept } from '../lib/pipeline/dept-utils';

dotenv.config({ path: '.env.local' });

function parseOpenings(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split('\n');
  const openings: {company: string, role: string, url: string, jd: string}[] = [];
  let currentOpening: {company: string, role: string, url: string, jd: string} | null = null;
  let jdLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+?),\s*(.+?),\s*(https?:\/\/.+)/);
    if (match) {
      if (currentOpening) {
        currentOpening.jd = jdLines.join('\n').trim();
        openings.push(currentOpening);
      }
      currentOpening = {
        company: match[1].trim(),
        role: match[2].trim(),
        url: match[3].trim(),
        jd: ""
      };
      jdLines = [];
    } else if (currentOpening) {
      jdLines.push(line);
    }
  }
  if (currentOpening) {
    currentOpening.jd = jdLines.join('\n').trim();
    openings.push(currentOpening);
  }
  return openings;
}

test.describe('Job Apply Automation UAT', () => {
  test.setTimeout(40 * 60 * 1000); 

  test('should process 11 jobs, draft emails, and verify LinkedIn profiles', async () => {
    const credentials = fs.readFileSync('credentials.txt', 'utf-8').split('\n');
    const linkedinEmail = credentials[0].split('Linkedin: ')[1].trim();
    const linkedinPass = credentials[1].split('Password: ')[1].trim();
    
    const smtpUser = process.env.SMTP_USER || linkedinEmail;
    const smtpPass = process.env.SMTP_PASS || 'vysn aibz pzix oknt'; 
    
    // Use Persistent Context OUTSIDE the next.js directory to avoid Turbopack crashing!
    const context = await chromium.launchPersistentContext('../playwright-data', { headless: false });
    const page = await context.newPage();
    page.setDefaultTimeout(15000); // Fail fast instead of hanging forever!

    // 1. Log into LinkedIn
    console.log("Checking LinkedIn session...");
    await page.goto("https://www.linkedin.com/feed/", { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    if (page.url().includes("linkedin.com/login") || page.url().includes("linkedin.com/signup")) {
      console.log("Not logged in. Performing login...");
      await page.goto("https://www.linkedin.com/login");
      await page.fill('#username', linkedinEmail);
      await page.fill('#password', linkedinPass);
      await page.click('[type="submit"]');
      
      console.log("Waiting for user to solve CAPTCHA if any... Waiting for feed to load...");
      await page.waitForURL('**/feed/**', { timeout: 120000 });
      console.log("Logged into LinkedIn successfully.");
    } else {
      console.log("Already logged in via persistent context!");
    }

    // 2. Parse openings
    const openings = parseOpenings('../Opening Details.txt');
    console.log(`Found ${openings.length} openings.`);

    const submittedSubjects: string[] = [];
    const testStartTime = new Date();

    for (let i = 0; i < openings.length; i++) {
      const opening = openings[i];
      console.log(`\nSubmitting [${i+1}/11]: ${opening.company} - ${opening.role}`);
      
      await page.goto('http://localhost:3000/outreach', { waitUntil: 'domcontentloaded' });
      
      // Clear persistent state from previous runs/jobs so we always start on Step 1!
      await page.evaluate(() => {
          Object.keys(localStorage).forEach(key => {
              if (key.startsWith('outreach_')) {
                  localStorage.removeItem(key);
              }
          });
      });
      // Reload to apply the cleared state
      await page.reload({ waitUntil: 'domcontentloaded' });
      
      // Step 1: Company & Job Title
      console.log(" -> Filling Form...");
      
      await page.locator('label:has-text("Company *")').locator('~ input').fill(opening.company);
      await page.locator('label:has-text("Job Title / Role *")').locator('~ input').fill(opening.role);
      await page.locator('label:has-text("Job Description")').locator('~ textarea').fill(opening.jd.substring(0, 1000));


      
      // Click "Find Decision Makers"
      await page.screenshot({ path: `debug_${i}.png` });
      console.log(` -> Took screenshot debug_${i}.png`);
      await page.getByRole('button', { name: 'Find Decision Makers', exact: true }).click();
      
      // Wait for Contacts phase to finish loading (Button will become "Find Emails for X Contacts")
      console.log(" -> Waiting for Decision Makers to load...");
      await expect(page.getByRole('button', { name: /Find Emails for/i })).toBeVisible({ timeout: 180000 });
      
      // Click "Find Emails for X Contacts"
      console.log(" -> Finding Emails...");
      await page.getByRole('button', { name: /Find Emails for/i }).click();
      
      // Wait for Emails phase to finish (Button will become "Generate Emails & Save")
      console.log(" -> Waiting for Emails to resolve...");
      await page.screenshot({ path: `debug_before_emails_${i}.png` });
      
      try {
          await expect(page.getByRole('button', { name: /Generate Outreach for/i })).toBeVisible({ timeout: 180000 });
      } catch (e) {
          await page.screenshot({ path: `debug_timeout_emails_${i}.png` });
          throw e;
      }
      
      // Click "Generate Outreach for X Contacts"
      console.log(" -> Submitting to Draft Generator...");
      await page.getByRole('button', { name: /Generate Outreach for/i }).click();
      
      // Wait for Step 4 "Review & Send" to load
      try {
        await expect(page.getByRole('button', { name: /Send Email/i }).first()).toBeVisible({ timeout: 180000 });
        console.log(" -> Review & Send loaded. Pushing to Drafts...");
        
        // Click all "Send Email" buttons to push drafts via IMAP
        const sendButtons = await page.getByRole('button', { name: /Send Email/i }).all();
        for (const btn of sendButtons) {
            await btn.click();
            await page.waitForTimeout(500); // small delay between clicks
        }
        
        // Wait for all of them to show "Sent ✓" (or fail gracefully)
        await expect(page.getByRole('button', { name: /Sent/i }).last()).toBeVisible({ timeout: 60000 });
        console.log(" -> Successfully pushed to Drafts.");
      } catch (e: any) {
        console.log(" -> Timeout waiting for drafts or sending, moving on.");
      }
      
      submittedSubjects.push(`Application: ${opening.role} — ${opening.company}`);
      await page.waitForTimeout(2000);
    }
    
    console.log("\nAll jobs submitted. Connecting to IMAP to monitor drafts and verify profiles...");

    // 4. Poll IMAP for Drafts
    const client = new ImapFlow({
      host: 'imap.gmail.com',
      port: 993,
      secure: true,
      auth: { user: smtpUser, pass: smtpPass },
      logger: false
    });
    
    await client.connect();
    const processedDrafts = new Set<string>();
    let waitLoops = 0;
    
    while (processedDrafts.size < openings.length && waitLoops < 60) {
      await page.waitForTimeout(10000); // Wait 10s between checks
      waitLoops++;
      console.log(`Checking drafts... (${waitLoops}/60) Found: ${processedDrafts.size}/${openings.length}`);
      
      const lock = await client.getMailboxLock('[Gmail]/Drafts');
      try {
        if (!client.mailbox || typeof client.mailbox === 'boolean' || client.mailbox.exists === 0) {
          continue;
        }

        const messages: any[] = [];
        for await (const msg of client.fetch('1:*', { uid: true, envelope: true })) {
          messages.push(msg);
        }
        
        for (const msg of messages) {
          const subject = msg.envelope?.subject;
          const msgDate = msg.envelope?.date;
          
          if (subject && submittedSubjects.includes(subject) && !processedDrafts.has(subject) && msgDate && msgDate >= testStartTime) {
            console.log(`\nFound draft for: ${subject}`);
            
            // Extract LinkedIn URL
            const sourceMsg = await client.fetchOne(msg.uid, { source: true });
            const sourceStr = (sourceMsg && typeof sourceMsg !== 'boolean') ? (sourceMsg.source?.toString() || '') : '';
            const urlMatch = sourceStr.match(/data-linkedin-url="([^"]+)"/);
            const linkedinUrl = urlMatch ? urlMatch[1] : null;
            
            if (linkedinUrl && linkedinUrl.includes('linkedin.com/in/')) {
              console.log(`Verifying profile: ${linkedinUrl}`);
              await page.goto(linkedinUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
              await page.waitForTimeout(3000); 
              const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
              
              const matchedOpening = openings.find(o => `Application: ${o.role} — ${o.company}` === subject);
              const companyLower = matchedOpening ? matchedOpening.company.toLowerCase() : '';

              if (bodyText.includes(companyLower)) {
                console.log(`✅ Verified ${companyLower} on profile.`);
              } else {
                throw new Error(`❌ Verification failed: Could not easily verify ${companyLower} on profile.`);
              }

              if (matchedOpening) {
                const deptKeywords = extractDeptKeywords(matchedOpening.role);
                const pageTitle = await page.title();
                const headline = pageTitle.split('-')[1]?.split('|')[0]?.trim().toLowerCase() || '';
                
                const combinedText = headline + " " + bodyText.substring(0, 2000);
                const isFounder = /\b(founder|co-founder|ceo|chief executive)\b/.test(combinedText);
                const wrongDept = detectWrongDept(combinedText);
                const score = deptRelevanceScore(combinedText, deptKeywords);
                
                if (wrongDept && score <= 0 && !isFounder) {
                   console.log(`⚠️ WRONG DEPARTMENT: Profile belongs to '${wrongDept}' instead of target keywords [${deptKeywords.join(', ')}].`);
                } else if (score > 0 || isFounder) {
                   console.log(`✅ Verified department relevance for role ${matchedOpening.role}`);
                } else {
                   console.log(`⚠️ Neutral department relevance. Keywords [${deptKeywords.join(', ')}] not strongly present.`);
                }
              }
            } else {
              throw new Error(`❌ No LinkedIn URL found in draft for ${subject}`);
            }
            
            processedDrafts.add(subject);
          }
        }
      } finally {
        lock.release();
      }
    }
    
    await client.logout();
    await context.close();
    
    expect(processedDrafts.size).toBe(openings.length);
    console.log("All 11 drafts verified in IMAP!");
  });
});
