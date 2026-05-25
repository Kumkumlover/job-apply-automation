import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    databaseUrlExists: !!process.env.DATABASE_URL,
    directUrlExists: !!process.env.DIRECT_URL,
    geminiKeyExists: !!process.env.GEMINI_API_KEY,
    databaseUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 10) + "..." : null,
    nodeEnv: process.env.NODE_ENV,
  });
}
