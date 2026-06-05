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
import { executeResearch } from "@/lib/email-generator/research";
import { generateCopy } from "@/lib/email-generator/templates";
import { sendOutboundEmail } from "@/lib/pipeline/send";
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
  excludeNames?: string[];
}) {
  const { company, jobTitle, jd, excludeNames = [] } = body;

  if (!company?.trim() || !jobTitle?.trim()) {
    return NextResponse.json(
      { error: "Company and job title are required." },
      { status: 400 }
    );
  }

  // Step 1: Search for candidates (Google CSE or LLM fallback)
  // This also extracts any contacts mentioned in the JD
  const { results: searchResults, jdContacts, localApiUsage } = await searchCandidatesAuto(
    company,
    jobTitle,
    jd,
    excludeNames
  );

  if (!searchResults.length && !jdContacts.length) {
    return NextResponse.json(
      { error: "No candidates found. Try a different company or role." },
      { status: 404 }
    );
  }

  // Step 2: Rank LLM-discovered contacts
  const ranked = searchResults.length
    ? await rankCandidates(searchResults, company, jobTitle, jd)
    : [];

  // Step 3: Prepend JD-extracted contacts at top (they're confirmed)
  const jdRanked = jdContacts.map((c) => ({
    name: c.name,
    profile_url: "",
    current_title: c.context,
    role_type: "recruiter_hr" as const,
    confidence: 1.0,
    reason: "Explicitly mentioned in the job description as a contact person",
    email: c.email || undefined,
  }));

  const allCandidates = [...jdRanked, ...ranked];

  return NextResponse.json({
    searchResults,
    jdContacts,
    rankedCandidates: allCandidates,
    localApiUsage,
  });
}

// ─── Phase 2: Find Emails ───────────────────────────────────────

async function handleFindEmails(
  body: {
    contacts: Array<{
      name: string;
      company: string;
      domain?: string;
      email?: string;
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
    email: c.email,
  }));

  const { results, localApiUsage } = await enrichAll(people, hunterKey, apolloKey);

  return NextResponse.json({ emailResults: results, localApiUsage });
}

// ─── Phase 3: Generate Email ────────────────────────────────────

async function handleGenerateEmail(body: {
  recipientName: string;
  company: string;
  jobTitle: string;
  jd?: string;
}) {
  const { recipientName, company, jobTitle, jd } = body;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const userId = await getDefaultUserId();
  const profile = await prisma.profileContext.findUnique({ where: { userId } });

  // Step 1: Run the ACTUAL Email Generator Research Pipeline (RAG + Jina + Search)
  const research = await executeResearch({
    companyName: company,
    industry: "Technology", // Default or extract if possible
    role: jobTitle,
    contactName: recipientName,
    jobDescription: jd,
  }, apiKey, profile);

  if (!research.problems || research.problems.length === 0) {
    throw new Error("Research pipeline failed to generate hypotheses.");
  }

  const problem = research.problems[0]; // Pick the highest confidence hypothesis

  if (!problem) {
    throw new Error("Research pipeline failed to generate hypotheses.");
  }

  // Step 2: Use the exact templates the user built
  const rawText = generateCopy(
    problem,
    "Cold Email", // default format
    recipientName,
    company,
    jobTitle,
    profile || undefined
  );

  // Step 3: Parse the raw text template into beautifully formatted HTML
  // We will replace the default links at the bottom with the clean inline sentence requested earlier.
  let htmlBody = `<body style="font-family: Arial, Helvetica, sans-serif; color: #000; line-height: 1.5; font-size: 14px;">\n`;
  
  const sections = rawText.split("For your reference:");
  const mainBody = sections[0].trim();
  
  const paragraphs = mainBody.split("\n\n");
  for (const para of paragraphs) {
    if (para.includes("• ")) {
      htmlBody += `  <ul style="margin: 0; padding-left: 20px;">\n`;
      const lines = para.split("\n").filter(l => l.trim());
      for (const line of lines) {
        htmlBody += `    <li style="margin-bottom: 8px; margin-left: 15px;">${line.replace("• ", "")}</li>\n`;
      }
      htmlBody += `  </ul>\n`;
    } else {
      const formattedPara = para.split("\n").join("<br>");
      htmlBody += `  <p>${formattedPara}</p>\n`;
    }
  }

  // Inject the clean inline reference links
  htmlBody += `  <p>For your reference, you can view my <a href="https://shikharpmg.onhercules.app/" style="color:#0366d6; text-decoration:underline;">Portfolio</a> (reachable at +91 7987177269), connect with me on <a href="https://www.linkedin.com/in/shikhar-gupta-505b0b21b/" style="color:#0366d6; text-decoration:underline;">LinkedIn</a>, or review my <a href="https://assets.nextleap.app/user-resume/ShikharCV-a4a6863b-b8f8-4699-9370-db5da8104ad9.pdf" style="color:#0366d6; text-decoration:underline;">CV</a>.</p>\n</body>`;

  // Generate subject
  const subject = `Application: ${jobTitle} — ${company}`;

  return NextResponse.json({
    subject,
    htmlBody,
    reason: problem.hypothesis, // Pass back hypothesis as context
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
