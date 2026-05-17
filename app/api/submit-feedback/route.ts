/**
 * API Route: POST /api/submit-feedback
 *
 * Records user feedback on whether a predicted email was correct or not.
 * This feeds the intelligence store's pattern learning engine:
 *   - "correct"   → boosts pattern success rate, marks email verified
 *   - "incorrect"  → increments usage count, halves email confidence
 */

import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/intelligence-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, status } = body;

    if (!email || !status || !["correct", "incorrect"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid payload. Need { email: string, status: 'correct' | 'incorrect' }" },
        { status: 400 }
      );
    }

    store.logFeedback(email, status);

    return NextResponse.json({
      status: "success",
      message: `Feedback recorded for ${email}. System updated.`,
    });
  } catch (err) {
    console.error("submit-feedback error:", err);
    return NextResponse.json(
      { error: "Failed to record feedback." },
      { status: 500 }
    );
  }
}
