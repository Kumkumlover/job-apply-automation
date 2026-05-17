/**
 * API Route: POST /api/email-generator/research
 *
 * Executes the RAG research pipeline:
 *   1. Retrieves vault context
 *   2. Scrapes lead LinkedIn + company website
 *   3. Calls Gemini with Google Search grounding
 *   4. Returns 3 structured research hypotheses
 */

import { NextRequest, NextResponse } from "next/server";
import { executeResearch } from "@/lib/email-generator/research";
import type { ResearchInput } from "@/lib/email-generator/types";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ResearchInput & { geminiApiKey?: string };

    const apiKey = body.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is required. Set it in .env.local or pass it in the request." },
        { status: 400 }
      );
    }

    if (!body.companyName) {
      return NextResponse.json(
        { error: "Company name is required." },
        { status: 400 }
      );
    }

    const result = await executeResearch(
      {
        companyName: body.companyName,
        industry: body.industry || "Technology",
        role: body.role || "Product Manager",
        contactName: body.contactName,
        leadUrl: body.leadUrl,
        companyWebsite: body.companyWebsite,
        jobDescription: body.jobDescription,
      },
      apiKey
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("research error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Research pipeline failed." },
      { status: 500 }
    );
  }
}
