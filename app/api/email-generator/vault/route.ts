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
import { ingestUrl } from "@/lib/email-generator/research";

export async function GET(req: NextRequest) {
  const vaultType = req.nextUrl.searchParams.get("type") as
    | "evidence"
    | "inspiration"
    | null;

  const items = vaultType
    ? vaultStore.getByType(vaultType)
    : vaultStore.getAll();

  return NextResponse.json({ items, count: items.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content, type, vaultType, url, geminiApiKey } = body;

    if (!vaultType || !["evidence", "inspiration"].includes(vaultType)) {
      return NextResponse.json(
        { error: "vaultType must be 'evidence' or 'inspiration'" },
        { status: 400 }
      );
    }

    let finalContent = content || "";
    let finalType = type || "text";

    // If a URL is provided, ingest it via Gemini
    if (url) {
      const apiKey = geminiApiKey || process.env.GEMINI_API_KEY;
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
        { error: "Content is required (or provide a url to ingest)." },
        { status: 400 }
      );
    }

    const item = vaultStore.add({
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

    const removed = vaultStore.remove(id);
    return NextResponse.json({ success: removed });
  } catch (err) {
    console.error("vault DELETE error:", err);
    return NextResponse.json(
      { error: "Failed to remove vault item." },
      { status: 500 }
    );
  }
}
