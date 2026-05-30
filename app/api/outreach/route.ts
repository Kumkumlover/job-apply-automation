/**
 * API Route: POST /api/outreach
 *
 * Unified orchestration endpoint for the outreach automation.
 * Actions: find-contacts | find-emails | generate-email | send-email
 */

import { NextRequest, NextResponse } from "next/server";
import { searchCandidatesAuto } from "@/lib/pipeline/search";
import { rankCandidates } from "@/lib/pipeline/rank";
import { enrichAll, type PersonInput } from "@/lib/email-finder";
import { personalizeReason } from "@/lib/pipeline/personalize";
import { composeEmail, sendOutboundEmail } from "@/lib/pipeline/send";
import { prisma, getDefaultUserId } from "@/lib/db";

export const maxDuration = 60; // Allow up to 60s on Vercel Pro

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case "find-contacts":
        return handleFindContacts(body);
      case "find-emails":
        return handleFindEmails(body, req);
      case "generate-email":
        return handleGenerateEmail(body);
      case "send-email":
        return handleSendEmail(body);
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (err) {
    console.error("Outreach API error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Internal server error" },
      { status: 500 }
    );
  }
}

// ─── Phase 1: Find Decision Makers ──────────────────────────────

async function handleFindContacts(body: {
  company: string;
  jobTitle: string;
  jd?: string;
}) {
  const { company, jobTitle, jd } = body;

  if (!company?.trim() || !jobTitle?.trim()) {
    return NextResponse.json(
      { error: "Company and job title are required." },
      { status: 400 }
    );
  }

  // Step 1: Search for candidates (Google CSE or LLM fallback)
  const searchResults = await searchCandidatesAuto(company, jobTitle, jd);

  if (!searchResults.length) {
    return NextResponse.json(
      { error: "No candidates found. Try a different company or role." },
      { status: 404 }
    );
  }

  // Step 2: Rank with LLM
  const ranked = await rankCandidates(searchResults, company, jobTitle, jd);

  return NextResponse.json({
    searchResults,
    rankedCandidates: ranked,
  });
}

// ─── Phase 2: Find Emails ───────────────────────────────────────

async function handleFindEmails(
  body: {
    contacts: Array<{
      name: string;
      company: string;
      domain?: string;
    }>;
    hunterKey?: string;
    apolloKey?: string;
  },
  req: NextRequest
) {
  const { contacts } = body;

  if (!contacts?.length) {
    return NextResponse.json(
      { error: "No contacts provided." },
      { status: 400 }
    );
  }

  const hunterKey =
    (req.headers.get("x-hunter-key") ?? body.hunterKey ?? "").trim();
  const apolloKey =
    (req.headers.get("x-apollo-key") ?? body.apolloKey ?? "").trim();

  const people: PersonInput[] = contacts.map((c) => ({
    name: c.name,
    company: c.company,
    domain: c.domain ?? "",
  }));

  const results = await enrichAll(people, hunterKey, apolloKey);

  return NextResponse.json({ emailResults: results });
}

// ─── Phase 3: Generate Email ────────────────────────────────────

async function handleGenerateEmail(body: {
  recipientName: string;
  company: string;
  jobTitle: string;
  jd?: string;
  companyReason?: string;
}) {
  const { recipientName, company, jobTitle, jd, companyReason } = body;

  // Generate personalized reason
  const reason = await personalizeReason(
    company,
    jobTitle,
    jd,
    companyReason
  );

  // Compose HTML email
  const htmlBody = composeEmail(recipientName, reason, company, jobTitle);

  // Generate subject
  const subject = `Application: ${jobTitle} — ${company}`;

  return NextResponse.json({
    subject,
    htmlBody,
    reason,
    recipientName,
  });
}

// ─── Phase 4: Send Email ────────────────────────────────────────

async function handleSendEmail(body: {
  toEmail: string;
  toName: string;
  subject: string;
  htmlBody: string;
  company: string;
  jobTitle: string;
  saveToTracker?: boolean;
}) {
  const { toEmail, toName, subject, htmlBody, company, jobTitle } = body;

  if (!toEmail?.trim()) {
    return NextResponse.json(
      { error: "Recipient email is required." },
      { status: 400 }
    );
  }

  // Send the email
  const result = await sendOutboundEmail({
    to_email: toEmail,
    to_name: toName || "",
    subject,
    html_body: htmlBody,
    company,
    job_title: jobTitle,
  });

  // Save to OutreachCampaign
  try {
    const userId = await getDefaultUserId();
    await prisma.outreachCampaign.create({
      data: {
        userId,
        company,
        role: jobTitle,
        hiringManager: toName || null,
        emails: [toEmail],
        subject,
        body: htmlBody,
        status: "sent",
        sentAt: new Date(),
      },
    });
  } catch (dbErr) {
    console.warn("Failed to save outreach campaign to DB:", dbErr);
    // Don't fail the send if DB save fails
  }

  return NextResponse.json({
    status: "sent",
    messageId: result.messageId,
    email: toEmail,
  });
}
