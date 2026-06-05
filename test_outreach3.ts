/**
 * Full outreach test: SalarySe APM — targets 5+ people
 * 1. Extracts known contacts from JD (Sudhanshu Sharma)
 * 2. LLM finds 5+ additional decision makers
 * 3. Finds emails for all
 * 4. Generates personalized drafts for all
 * 5. Outputs Gmail draft links for each
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import { searchCandidatesAuto, extractContactsFromJD } from "./lib/pipeline/search";
import { rankCandidates } from "./lib/pipeline/rank";
import { enrichAll } from "./lib/email-finder";
import { personalizeReason } from "./lib/pipeline/personalize";

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
Experience: Early stage APM / 1-3 years

If this sounds interesting, or if you know someone who'd be a good fit, please fill out the form here so we don't miss your application.

You can still drop me or Sudhanshu Sharma a message if you have questions.
Happy to share more details.`;

const COMPANY_REASON = "I have a bachelor's in finance degree and have strong interest in fintech and have also done a case study on SuperMoney.";

function buildGmailDraftUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({ view: "cm", to, su: subject, body });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

function buildEmailBody(firstName: string, reason: string): string {
  return `Hi ${firstName},

I came across your post about SalarySe's search for a Product Manager, and I couldn't be more excited! Your vision of building a seamless financial health and credit ecosystem that empowers India's salaried workforce resonates deeply with me. Given my background in data-driven checkout optimization, user segmentation research, and unit economics profiling, I'd love to explore how I can contribute to this journey.

A little bit about myself:

• I am Shikhar Gupta, an AI Product Intern at SuperAGI (AI CRM), currently owning end-to-end discovery and execution for Analytics, Chat, and Project Management modules — built them from 0-1 and replaced tools like Slack and Jira for internal usage, saving more than ₹150K in cost.
• I have led the development of multiple AI-agents including an AI onboarding agent that reduced customer success costs by 60% and a chat-native PM agent that automated task tracking and reduced project management overhead by 40%.
• I am a Top PM fellow at Nextleap (Top 10%), Ex Product Analyst at Digital Harbor, and have built automations like Job email outreach using N8N and a Job Tracker as a browser extension.

Why SalarySe?

${reason}

I look forward to the opportunity to discuss how I can contribute to SalarySe's growth.

For your reference:
• Portfolio: https://shikharpmg.onhercules.app/ (Reachable at +91 7987177269)
• LinkedIn: https://www.linkedin.com/in/shikhar-gupta-505b0b21b/
• CV: https://assets.nextleap.app/user-resume/ShikharCV-a4a6863b-b8f8-4699-9370-db5da8104ad9.pdf

Best regards,
Shikhar Gupta`;
}

function buildRichEmailBody(firstName: string, reason: string): string {
  return `<p>Hi ${firstName},</p>
<p>I came across your post about SalarySe's search for a Product Manager, and I couldn't be more excited! Your vision of building a seamless financial health and credit ecosystem that empowers India's salaried workforce resonates deeply with me. Given my background in data-driven checkout optimization, user segmentation research, and unit economics profiling, I'd love to explore how I can contribute to this journey.</p>
<p>A little bit about myself:</p>
<ul style="margin-left: 20px;">
  <li>I am Shikhar Gupta, an AI Product Intern at SuperAGI (AI CRM), currently owning end-to-end discovery and execution for Analytics, Chat, and Project Management modules — built them from 0-1 and replaced tools like Slack and Jira for internal usage, saving more than ₹150K in cost.</li>
  <li>I have led the development of multiple AI-agents including an AI onboarding agent that reduced customer success costs by 60% and a chat-native PM agent that automated task tracking and reduced project management overhead by 40%.</li>
  <li>I am a Top PM fellow at Nextleap (Top 10%), Ex Product Analyst at Digital Harbor, and have built automations like Job email outreach using N8N and a Job Tracker as a browser extension.</li>
</ul>
<p>Why SalarySe?</p>
<p>${reason.replace(/\n/g, '<br>')}</p>
<p>I look forward to the opportunity to discuss how I can contribute to SalarySe's growth.</p>
<p>For your reference:</p>
<ul style="margin-left: 20px;">
  <li><a href="https://shikharpmg.onhercules.app/">Portfolio</a> (Reachable at +91 7987177269)</li>
  <li><a href="https://www.linkedin.com/in/shikhar-gupta-505b0b21b/">LinkedIn</a></li>
  <li><a href="https://assets.nextleap.app/user-resume/ShikharCV-a4a6863b-b8f8-4699-9370-db5da8104ad9.pdf">CV</a></li>
</ul>
<p>Best regards,<br>Shikhar Gupta</p>`;
}

async function run() {
  console.log("════════════════════════════════════════════════════════");
  console.log("  OUTREACH PIPELINE: SalarySe — APM (Platform & Card)");
  console.log("════════════════════════════════════════════════════════\n");

  // ── PHASE 1: Find all decision makers ──
  console.log("▶ PHASE 1: Finding Decision Makers...\n");

  const { results: searchResults, jdContacts } = await searchCandidatesAuto(
    COMPANY, JOB_TITLE, JD
  );

  console.log(`  JD-Extracted contacts: ${jdContacts.length}`);
  for (const c of jdContacts) {
    console.log(`    ✓ ${c.name} — ${c.context}`);
  }

  console.log(`  LLM-discovered contacts: ${searchResults.length}`);
  for (const r of searchResults) {
    console.log(`    • ${r.title} (score: ${r.score})`);
  }

  // ── PHASE 2: Rank discovered contacts ──
  console.log("\n▶ PHASE 2: Ranking Candidates...\n");

  const ranked = searchResults.length
    ? await rankCandidates(searchResults, COMPANY, JOB_TITLE, JD)
    : [];

  // Merge: JD contacts first, then ranked
  const allContacts = [
    ...jdContacts.map((c) => ({
      name: c.name,
      role: "From JD" as const,
      title: c.context,
      confidence: 1.0,
    })),
    ...ranked.map((r) => ({
      name: r.name,
      role: r.role_type,
      title: r.current_title,
      confidence: r.confidence,
    })),
  ];

  console.log(`  Total targets: ${allContacts.length}\n`);
  for (const c of allContacts) {
    console.log(`  ★ ${c.name} — ${c.title} [${c.role}] (${Math.round(c.confidence * 100)}%)`);
  }

  // ── PHASE 3: Find emails for ALL contacts ──
  console.log("\n▶ PHASE 3: Finding Emails for All Contacts...\n");

  const people = allContacts.map((c) => ({
    name: c.name,
    company: COMPANY,
    domain: "salaryse.com",
  }));

  const emailResults = await enrichAll(
    people,
    process.env.HUNTER_API_KEY || "",
    process.env.APOLLO_API_KEY || ""
  );

  for (const person of emailResults) {
    console.log(`  📧 ${person.name} @ ${person.domain}`);
    if (person.emails.length === 0) {
      console.log(`    ✕ No emails found`);
    } else {
      for (const em of person.emails.slice(0, 3)) {
        console.log(`    ${em.email} [${em.type}] ${em.source} (${Math.round(em.confidence * 100)}%)`);
      }
      if (person.recommended) {
        console.log(`    ✅ Best: ${person.recommended}`);
      }
    }
    console.log();
  }

  // ── PHASE 4: Generate drafts for all ──
  console.log("▶ PHASE 4: Generating Personalized Emails...\n");

  const reason = await personalizeReason(COMPANY, JOB_TITLE, JD, COMPANY_REASON);
  const subject = `Application: ${JOB_TITLE} | ${COMPANY}`;

  console.log("════════════════════════════════════════════════════════");
  console.log("  GMAIL DRAFT LINKS — Click to open in Gmail");
  console.log("════════════════════════════════════════════════════════\n");

  let draftCount = 0;
  let htmlOutput = `<html><body><h2>Drafts for ${COMPANY}</h2><ul>`;

  for (const person of emailResults) {
    const bestEmail = person.recommended || person.emails[0]?.email;
    if (!bestEmail) {
      console.log(`⚠ ${person.name}: No email found, skipping.\n`);
      continue;
    }

    draftCount++;
    const firstName = person.name.split(" ")[0];
    const body = buildEmailBody(firstName, reason);
    const gmailUrl = buildGmailDraftUrl(bestEmail, subject, body);

    // Find original person object to extract linkedin url
    const searchResult = searchResults.find(r => r.title.includes(person.name) || person.name.includes(r.title));
    const linkedInUrl = searchResult?.url || `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(person.name + ' SalarySe')}`;

    console.log(`─── Draft ${draftCount}: ${person.name} ───`);
    console.log(`To: ${bestEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`👤 LinkedIn: ${linkedInUrl}`);
    console.log(`\n🔗 ${gmailUrl}\n`);

    htmlOutput += `<li style="margin-bottom: 40px; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h3 style="margin-top: 0;">${person.name}</h3>
      <p>LinkedIn: <a href="${linkedInUrl}">${linkedInUrl}</a></p>
      <p><a href="${gmailUrl}" target="_blank" style="display: inline-block; padding: 10px 15px; background: #1a73e8; color: white; text-decoration: none; border-radius: 4px; margin-bottom: 15px;">1. Open Blank Draft in Gmail</a></p>
      <p style="font-size: 14px; color: #555; margin-bottom: 5px;">2. Copy and paste the rich text below into your Gmail compose window to preserve formatting:</p>
      <div style="padding: 15px; border: 1px solid #ccc; background: #f9f9f9; border-radius: 4px; font-family: sans-serif; font-size: 14px; line-height: 1.5; color: #222;">
        ${buildRichEmailBody(firstName, reason)}
      </div>
    </li>`;
  }

  htmlOutput += `</ul></body></html>`;
  fs.writeFileSync("drafts.html", htmlOutput);

  console.log("════════════════════════════════════════════════════════");
  console.log(`  ✅ ${draftCount} drafts generated! They have also been saved to drafts.html in this folder.`);
  console.log("════════════════════════════════════════════════════════");
}

run().catch((err) => {
  console.error("Pipeline failed:", err);
  process.exit(1);
});
