/**
 * API Route: GET /api/debug/health
 *
 * System health check — tests all external API connections,
 * env var presence, and store status in one shot.
 */

import { NextResponse } from "next/server";
import { store } from "@/lib/intelligence-store";
import { vaultStore } from "@/lib/email-generator/vault";

export const dynamic = 'force-dynamic';

interface HealthCheck {
  name: string;
  status: "ok" | "error" | "missing";
  latencyMs?: number;
  detail?: string;
}

async function checkEnvVar(name: string): Promise<HealthCheck> {
  const val = process.env[name];
  return {
    name: `ENV: ${name}`,
    status: val ? "ok" : "missing",
    detail: val ? `Set (${val.length} chars, ends ...${val.slice(-4)})` : "Not configured",
  };
}

async function checkApiEndpoint(name: string, url: string, method: string = "GET"): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const res = await fetch(url, { method, signal: AbortSignal.timeout(8000) });
    return {
      name,
      status: res.ok || res.status === 401 || res.status === 403 ? "ok" : "error",
      latencyMs: Date.now() - start,
      detail: `HTTP ${res.status} (${res.statusText})`,
    };
  } catch (err) {
    return {
      name,
      status: "error",
      latencyMs: Date.now() - start,
      detail: (err as Error).message,
    };
  }
}

async function checkGroq(): Promise<HealthCheck> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return { name: "Groq LLM", status: "missing", detail: "GROQ_API_KEY not set" };

  const start = Date.now();
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(5000),
    });
    return {
      name: "Groq LLM",
      status: res.ok ? "ok" : "error",
      latencyMs: Date.now() - start,
      detail: res.ok ? "Connected" : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { name: "Groq LLM", status: "error", latencyMs: Date.now() - start, detail: (err as Error).message };
  }
}

async function checkGemini(): Promise<HealthCheck> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return { name: "Gemini API", status: "missing", detail: "GEMINI_API_KEY not set" };

  const start = Date.now();
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      { signal: AbortSignal.timeout(5000) }
    );
    return {
      name: "Gemini API",
      status: res.ok ? "ok" : "error",
      latencyMs: Date.now() - start,
      detail: res.ok ? "Connected" : `HTTP ${res.status}`,
    };
  } catch (err) {
    return { name: "Gemini API", status: "error", latencyMs: Date.now() - start, detail: (err as Error).message };
  }
}

export async function GET() {
  const [
    groq, gemini, jina, smtp,
    envGroq, envGemini, envCse, envSmtp, envLlm,
  ] = await Promise.all([
    checkGroq(),
    checkGemini(),
    checkApiEndpoint("Jina Scraper", "https://r.jina.ai/https://example.com"),
    checkApiEndpoint("SMTP (Gmail)", "https://smtp.gmail.com:587").catch(() => ({
      name: "SMTP (Gmail)", status: "ok" as const, detail: "SMTP configured via env vars"
    })),
    checkEnvVar("GROQ_API_KEY"),
    checkEnvVar("GEMINI_API_KEY"),
    checkEnvVar("GOOGLE_CSE_KEY"),
    checkEnvVar("SMTP_USER"),
    checkEnvVar("LLM_PROVIDER"),
  ]);

  // Store stats
  const [storeStats, vaultData, recentFeedback, topPatternsRaw] = await Promise.all([
    store.getStoreStats(),
    vaultStore.getAll(),
    store.getRecentFeedback(),
    store.getTopPatterns(),
  ]);
  const fullStoreStats = {
    ...storeStats,
    vaultItems: vaultData.length,
    vaultEvidence: vaultData.filter((v: any) => v.vaultType === "evidence").length,
    vaultInspiration: vaultData.filter((v: any) => v.vaultType === "inspiration").length,
  };

  const checks: HealthCheck[] = [groq, gemini, jina, smtp, envGroq, envGemini, envCse, envSmtp, envLlm];
  const allOk = checks.every(c => c.status === "ok");

  return NextResponse.json({
    status: allOk ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    checks,
    storeStats: fullStoreStats,
    recentFeedback: recentFeedback,
    topPatterns: topPatternsRaw
      .filter((p: any) => p.usageCount > 0)
      .map((p: any) => ({
        pattern: p.pattern,
        domain: p.domain ?? "global",
        successRate: `${Math.round((p.successCount / Math.max(p.usageCount, 1)) * 100)}%`,
        uses: p.usageCount,
      })),
  });
}
