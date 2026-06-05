/**
 * Targeted outreach for SalarySe — Sudhanshu Sharma
 */

import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { enrichAll } from "./lib/email-finder";
import { personalizeReason } from "./lib/pipeline/personalize";

const COMPANY = "SalarySe";
const JOB_TITLE = "Associate Product Manager - Platform and Card";
const JD = `Looking to bring on 2 Associate Product Managers to join our Platform and Card product team. If you enjoy building from first principles, thinking deeply about user problems, and working closely with engineering, design, and business, this could be a great fit. What you'll work on: Platform: Customer Lifecycle Management, Customer Experience, and internal tools. Cards: Customer-facing financial product, user journeys, and growth levers. What we're looking for: 1-3 years of product experience (or strong problem-solving background). Strong Analytical Skills. Location: Gurgaon (Full Work from Office). Experience: Early stage APM / 1-3 years.`;
const COMPANY_REASON = "I have a bachelor's in finance degree and have strong interest in fintech and have also done a case study on SuperMoney.";

function buildGmailDraftUrl(to: string, subject: string, body: string): string {
  const params = new URLSearchParams({
    view: "cm",
    to,
    su: subject,
    body,
  });
  return `https://mail.google.com/mail/?${params.toString()}`;
}

async function run() {
  // Step 1: Find emails for the actual person mentioned in the JD
  console.log("=== Finding email for Sudhanshu Sharma @ SalarySe ===\n");

  const people = [
    { name: "Sudhanshu Sharma", company: COMPANY, domain: "salaryse.com" },
  ];

  const emailResults = await enrichAll(people, "", "");

  for (const person of emailResults) {
    console.log(`📧 ${person.name} @ ${person.domain}`);
    for (const em of person.emails) {
      console.log(`  ${em.email} [${em.type}] ${em.source} (${Math.round(em.confidence * 100)}%)`);
    }
    if (person.recommended) {
      console.log(`  ✅ Recommended: ${person.recommended}`);
    }
    console.log();
  }

  const bestEmail = emailResults[0]?.recommended || emailResults[0]?.emails[0]?.email;
  if (!bestEmail) {
    console.error("No email found!");
    process.exit(1);
  }

  // Step 2: Generate personalized reason
  console.log("=== Generating personalized reason ===\n");
  const reason = await personalizeReason(COMPANY, JOB_TITLE, JD, COMPANY_REASON);
  console.log("Reason:", reason, "\n");

  // Step 3: Build clean email body (plain text, no HTML)
  const subject = `Application: ${JOB_TITLE} | ${COMPANY}`;

  const emailBody = `Hi Sudhanshu,

I came across SalarySe's post about the Associate Product Manager roles for the Platform and Card team, and I'm very excited about this opportunity.

${reason}

A little bit about myself:

• I am Shikhar Gupta, an AI Product Intern at SuperAGI (AI CRM), currently owning end-to-end discovery and execution for Analytics, Chat, and Project Management modules — built them from 0-1 and replaced tools like Slack and Jira for internal usage, saving more than ₹150K in cost.
• I have led the development of multiple AI-agents including an AI onboarding agent that reduced customer success costs by 60% and a chat-native PM agent that automated task tracking and reduced project management overhead by 40%.
• I am a Top PM fellow at Nextleap (Top 10%), Ex Product Analyst at Digital Harbor, and have built automations like Job email outreach using N8N and a Job Tracker as a browser extension.

Why SalarySe?

I have a bachelor's in finance and a strong interest in fintech — I've also done a case study on SuperMoney. The opportunity to work on Platform (Customer Lifecycle Management, CX) and Cards (user journeys, growth levers) at an early-stage fintech is exactly the kind of 0-1 product work I thrive in.

I look forward to the opportunity to discuss how I can contribute to SalarySe's growth.

For your reference:
• Portfolio: https://shikharpmg.onhercules.app/ (Reachable at +91 7987177269)
• LinkedIn: https://www.linkedin.com/in/shikhar-gupta-505b0b21b/
• CV: https://assets.nextleap.app/user-resume/ShikharCV-a4a6863b-b8f8-4699-9370-db5da8104ad9.pdf

Best regards,
Shikhar Gupta`;

  console.log("=== FINAL EMAIL ===\n");
  console.log(`To: ${bestEmail}`);
  console.log(`Subject: ${subject}`);
  console.log(`\n${emailBody}`);

  const gmailUrl = buildGmailDraftUrl(bestEmail, subject, emailBody);
  console.log(`\n\n🔗 GMAIL DRAFT LINK:\n${gmailUrl}`);

  console.log("\n\n✅ Done!");
}

run().catch((err) => {
  console.error("Failed:", err);
  process.exit(1);
});
