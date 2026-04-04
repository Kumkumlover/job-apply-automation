/**
 * POST /api/apply
 *
 * Accepts both:
 *   - application/json  (API-style)
 *   - application/x-www-form-urlencoded  (HTML form POST)
 *
 * Fires the Inngest pipeline and returns immediately with a run ID.
 */

import { NextResponse } from "next/server";
import { inngest } from "@/lib/inngest";
import type { ApplyPayload } from "@/lib/types";

export async function POST(req: Request) {
  try {
    let payload: ApplyPayload;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      payload = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      payload = {
        company: formData.get("company") as string,
        job_title: formData.get("job_title") as string,
        jd: (formData.get("jd") as string) || undefined,
        company_reason: (formData.get("company_reason") as string) || undefined,
        recipient_name: (formData.get("recipient_name") as string) || undefined,
        recipient_email: (formData.get("recipient_email") as string) || undefined,
        my_summary: (formData.get("my_summary") as string) || undefined,
      };
    } else {
      // Try JSON as default
      payload = await req.json();
    }

    // Validate required fields
    if (!payload.company?.trim() || !payload.job_title?.trim()) {
      return NextResponse.json(
        { error: "company and job_title are required" },
        { status: 400 }
      );
    }

    // Fire the pipeline
    const { ids } = await inngest.send({
      name: "app/job.apply",
      data: payload,
    });

    return NextResponse.json({
      status: "accepted",
      message: "Pipeline started. The email will be sent once processing completes.",
      run_ids: ids,
      payload_summary: {
        company: payload.company,
        job_title: payload.job_title,
        has_recipient_email: !!payload.recipient_email,
      },
    });
  } catch (err) {
    console.error("POST /api/apply error:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "unknown_error" },
      { status: 500 }
    );
  }
}
