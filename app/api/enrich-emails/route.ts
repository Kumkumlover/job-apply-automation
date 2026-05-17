/**
 * API Route: POST /api/enrich-emails
 *
 * Accepts a JSON array of { name, company, domain } objects,
 * enriches them via Hunter/Apollo/permutation, and returns results.
 */

import { NextRequest, NextResponse } from "next/server";
import { enrichAll, type PersonInput } from "@/lib/email-finder";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Extract API keys from headers (or body fallback)
    const hunterKey =
      req.headers.get("x-hunter-key") ?? body.hunterKey ?? "";
    const apolloKey =
      req.headers.get("x-apollo-key") ?? body.apolloKey ?? "";

    // Validate input
    const people: PersonInput[] = Array.isArray(body.people)
      ? body.people
      : Array.isArray(body)
        ? body
        : [];

    if (people.length === 0) {
      return NextResponse.json(
        { error: "Please provide at least one person with name, company, and domain." },
        { status: 400 }
      );
    }

    // Validate each person
    for (const p of people) {
      if (!p.name || !p.company || !p.domain) {
        return NextResponse.json(
          { error: `Missing required fields for "${p.name || "unknown"}". Need name, company, and domain.` },
          { status: 400 }
        );
      }
    }

    // Cap at 10 people per request
    const capped = people.slice(0, 10);

    const results = await enrichAll(capped, hunterKey, apolloKey);

    return NextResponse.json(results);
  } catch (err) {
    console.error("enrich-emails error:", err);
    return NextResponse.json(
      { error: "Internal server error during email enrichment." },
      { status: 500 }
    );
  }
}
