/**
 * API Route: /api/email-generator/vault
 *
 * CRUD for the evidence/inspiration vault.
 *   GET  → list all items (optional ?type=evidence|inspiration)
 *   POST → add a new item (with optional URL ingestion via Gemini)
 *   DELETE → remove an item by id
 */

import { NextRequest, NextResponse } from "next/server";
import { vaultStore } from "@/lib/email-generator/vault";
import { ingestUrl, ingestFile } from "@/lib/email-generator/research";
import mammoth from "mammoth";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const vaultType = req.nextUrl.searchParams.get("type") as
    | "evidence"
    | "inspiration"
    | null;

  const items = vaultType
    ? await vaultStore.getByType(vaultType)
    : await vaultStore.getAll();

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, type, vaultType, url, geminiApiKey, base64Data, mimeType } = body;

    if (!vaultType || !["evidence", "inspiration"].includes(vaultType)) {
      return NextResponse.json(
        { error: "vaultType must be 'evidence' or 'inspiration'" },
        { status: 400 }
      );
    }

    let finalContent = content || "";
    let finalType = type || "text";
    const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;

    if (base64Data && mimeType) {
      if (!apiKey) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY required for file ingestion." },
          { status: 400 }
        );
      }
      
      let processedBase64 = base64Data;
      let processedMime = mimeType;

      if (mimeType.includes("wordprocessingml") || mimeType.includes("msword")) {
        try {
          const buffer = Buffer.from(base64Data, "base64");
          const result = await mammoth.extractRawText({ buffer });
          const text = result.value;
          processedBase64 = Buffer.from(text, "utf-8").toString("base64");
          processedMime = "text/plain";
        } catch (error) {
          return NextResponse.json(
            { error: "Failed to parse Word document." },
            { status: 400 }
          );
        }
      }
      
      finalContent = await ingestFile(processedBase64, processedMime, apiKey);
      finalType = "file";
    } else if (url) {
      if (!apiKey) {
        return NextResponse.json(
          { error: "GEMINI_API_KEY required for URL ingestion." },
          { status: 400 }
        );
      }
      finalContent = await ingestUrl(url, apiKey);
      finalType = "link";
    }

    if (!finalContent) {
      return NextResponse.json(
        { error: "Content is required (or provide a url/file to ingest)." },
        { status: 400 }
      );
    }

    const item = await vaultStore.add({
      title: title || "Untitled",
      content: finalContent,
      type: finalType,
      vaultType,
    });

    return NextResponse.json(item);
  } catch (err) {
    console.error("vault POST error:", err);
    return NextResponse.json(
      { error: (err as Error).message || "Failed to add vault item." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Item id is required." },
        { status: 400 }
      );
    }

    const removed = await vaultStore.remove(id);
    return NextResponse.json({ success: removed });
  } catch (err) {
    console.error("vault DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove vault item." },
      { status: 500 }
    );
  }
}
