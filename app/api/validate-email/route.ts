/**
 * POST /api/validate-email
 *
 * Standalone email validator API (replaces the n8n Email Validator flow).
 * Accepts: { "email": "..." } or { "emails": ["...", "..."] }
 */

import { NextResponse } from "next/server";
import { validateEmail } from "@/lib/pipeline/validate";

export const maxDuration = 30; // seconds — enough for batch validation

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support single email or array
    let emails: string[] = [];

    if (body.email) {
      emails = [String(body.email).trim()];
    } else if (body.emails) {
      emails = (Array.isArray(body.emails) ? body.emails : [body.emails])
        .map((e: unknown) => String(e).trim())
        .filter(Boolean);
    }

    if (!emails.length) {
      return NextResponse.json(
        { error: "Provide 'email' or 'emails' in the request body" },
        { status: 400 }
      );
    }

    // Validate all emails (in parallel, batches of 5)
    const BATCH_SIZE = 5;
    const results = [];

    for (let i = 0; i < emails.length; i += BATCH_SIZE) {
      const batch = emails.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.all(
        batch.map((e) =>
          validateEmail(e).catch((err) => ({
            email: e,
            error: (err as Error).message,
            confidence: 0,
            recruiting_score: 0,
            reason: "validation_error",
          }))
        )
      );
      results.push(...batchResults);
    }

    // Return single result for single email, array for batch
    if (emails.length === 1) {
      return NextResponse.json(results[0]);
    }
    return NextResponse.json({ results });
  } catch (err) {
    console.error("POST /api/validate-email error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
