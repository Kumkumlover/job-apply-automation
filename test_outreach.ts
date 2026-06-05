/**
 * End-to-end test: SalarySe APM outreach pipeline
 * 
 * 1. Find decision makers
 * 2. Find emails
 * 3. Generate personalized email
 * 4. Output Gmail draft link
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config(); // also load .env as fallback
import { searchCandidatesAuto } from "./lib/pipeline/search";
import { rankCandidates } from "./lib/pipeline/rank";
import { enrichAll } from "./lib/email-finder";
import { personalizeReason } from "./lib/pipeline/personalize";
import { composeEmail } from "./lib/pipeline/send";

const COMPANY = "SalarySe";
const JOB_TITLE = "Associate Product Manager - Platform and Card";
const JD = `We're hiring in product. Looking to bring on 2 Associate Product Managers to join our Platform and Card product team.

If you enjoy building from first principles, thinking deeply about user problems, and working closely with engineering, design, and business, this could be a great fit.

What you'll work on:
- Platform: Customer Lifecycle Management, Customer Experience, and internal tools that power everything we build
- Cards: Customer-facing financial product, user journeys, and growth levers

What we're looking for:
- 1-3 years of product experience (or strong problem-solving background)
- Strong Analytical Skills

Location: Gurgaon (Full Work from Office)
Experience: Early stage APM / 1-3 years`;

const COMPANY_REASON = "I have a bachelor's in finance degree and have strong interest in fintech and have also done a case study on SuperMoney.";

function buildGmailDraftUrl(to: string, subject: string, body: string): string {
  const plainBody = body
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li>/gi, "• ")
    .replace(/<\/ul>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const params = new URLSearchParams({
    view: "cm",
    to,
    su: subject,
    body: plainBody,
  });

  return `https://mail.google.com/mail/?${params.toString()}`;
}

async function run() {
  console.log("=== STEP 1: Finding Decision Makers at", COMPANY, "===\n");

  const { results: searchResults, jdContacts } = await searchCandidatesAuto(COMPANY, JOB_TITLE, JD);
  console.log(`Found ${searchResults.length} search results and ${jdContacts.length} JD contacts\n`);

  if (!searchResults.length && !jdContacts.length) {
    console.log("No candidates found.");
    return;
  }

  for (const r of searchResults) {
    console.log(`- ${r.title} (${r.domain})`);
    console.log(`  ${r.snippet}`);
    console.log(`  URL: ${r.url}`);
    console.log(`  Score: ${r.score}\n`);
  }

  console.log("\n=== STEP 2: Ranking Candidates ===\n");

  const ranked = await rankCandidates(searchResults, COMPANY, JOB_TITLE, JD);
  console.log(`Ranked ${ranked.length} candidates:\n`);

  for (const c of ranked) {
    console.log(`  ★ ${c.name} — ${c.current_title}`);
    console.log(`    Role: ${c.role_type} | Confidence: ${Math.round(c.confidence * 100)}%`);
    console.log(`    Reason: ${c.reason}`);
    console.log(`    URL: ${c.profile_url}\n`);
  }

  // Select top 3 candidates (or all if fewer)
  const selectedCandidates = ranked.slice(0, 3);
  console.log(`\nSelected top ${selectedCandidates.length} candidates for email discovery.\n`);

  console.log("=== STEP 3: Finding Emails ===\n");

  const people = selectedCandidates.map((c) => ({
    name: c.name,
    company: COMPANY,
    domain: "", // let the engine discover it
  }));

  const emailResults = await enrichAll(people, "", ""); // no Hunter/Apollo keys for now
  console.log(`Email results:\n`);

  for (const person of emailResults) {
    console.log(`  📧 ${person.name} @ ${person.domain}`);
    if (person.emails.length === 0) {
      console.log(`    No emails found`);
    } else {
      for (const em of person.emails) {
        console.log(`    ${em.email} [${em.type}] ${em.source} (${Math.round(em.confidence * 100)}%)`);
      }
      if (person.recommended) {
        console.log(`    ✅ Recommended: ${person.recommended}`);
      }
    }
    console.log();
  }

  // Pick best emails
  const targets: Array<{ name: string; email: string }> = [];
  for (const person of emailResults) {
    const bestEmail = person.recommended || (person.emails[0]?.email ?? null);
    if (bestEmail) {
      targets.push({ name: person.name, email: bestEmail });
    }
  }

  if (targets.length === 0) {
    console.error("No valid emails found for any candidate. Cannot generate outreach.");
    process.exit(1);
  }

  console.log("=== STEP 4: Generating Personalized Emails ===\n");

  for (const target of targets) {
    const firstName = target.name.split(" ")[0];

    console.log(`Generating email for ${target.name} (${target.email})...\n`);

    const reason = await personalizeReason(COMPANY, JOB_TITLE, JD, COMPANY_REASON);
    const htmlBody = composeEmail(firstName, reason, COMPANY, JOB_TITLE);
    const subject = `Application: ${JOB_TITLE} — ${COMPANY}`;

    console.log(`Subject: ${subject}`);
    console.log(`To: ${target.email}`);
    console.log(`\n--- Email Body (plain text) ---`);

    const plainBody = htmlBody
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<li>/gi, "• ")
      .replace(/<\/ul>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    console.log(plainBody);

    const gmailUrl = buildGmailDraftUrl(target.email, subject, htmlBody);
    console.log(`\n🔗 GMAIL DRAFT LINK:`);
    console.log(gmailUrl);
    console.log(`\n${"=".repeat(60)}\n`);
  }

  console.log("✅ Pipeline complete!");
}

run().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
