/**
 * Email Generator — Server-side RAG Research Pipeline
 *
 * Port of the client-side Gemini API calls to server-side.
 * Uses Gemini's native features:
 *   - Google Search grounding
 *   - Structured JSON output via responseSchema
 *   - URL scraping via Jina.ai
 */

import type { ResearchInput, ResearchResult, VaultItem } from "./types";
import { vaultStore } from "./vault";

const USER_PERSONA =
  "Shikhar Gupta: APM specializing in AI Agents, CRM automation, and Q-Commerce. Expert in 0-1 product delivery and metrics-driven optimization. Focus on quantitative outcomes.";

// ─── URL Scraping ───────────────────────────────────────────────

async function scrapeUrl(url: string): Promise<string | null> {
  if (!url) return null;
  try {
    const cleanUrl = url.replace(/^(https?:\/\/)?/, "https://");
    const res = await fetch(`https://r.jina.ai/${cleanUrl}`);
    if (!res.ok) return null;
    const text = await res.text();
    if (
      text.includes("Sign in to LinkedIn") ||
      text.includes("authwall") ||
      text.length < 150
    )
      return null;
    return text.substring(0, 3500);
  } catch {
    return null;
  }
}

// ─── Gemini API ─────────────────────────────────────────────────

const GEMINI_MODEL = "gemini-2.0-flash";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    problems: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING" },
          title: { type: "STRING" },
          problem: { type: "STRING" },
          hypothesis: { type: "STRING" },
          pmGoal: { type: "STRING" },
          hook: { type: "STRING" },
          citation: { type: "STRING" },
          companyMission: { type: "STRING" },
          matchedStrengths: { type: "STRING" },
          linkedinHook: { type: "STRING" },
          speculativePitch: { type: "STRING" },
        },
        required: [
          "id", "title", "problem", "hypothesis", "pmGoal",
          "hook", "citation", "companyMission", "matchedStrengths",
          "linkedinHook", "speculativePitch",
        ],
      },
    },
  },
};

async function callGemini(
  prompt: string,
  apiKey: string,
  useSearch: boolean = false,
  useSchema: boolean = false
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

  const body: Record<string, unknown> = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  if (useSearch) {
    body.tools = [{ google_search: {} }];
  }

  if (useSchema) {
    body.generationConfig = {
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    };
  }

  // Retry with longer backoff for 429 rate limits
  const delays = [2000, 5000, 10000, 20000, 30000];
  let lastStatus = 0;

  for (let i = 0; i <= delays.length; i++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      lastStatus = res.status;

      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      }

      // For non-retryable errors, fail immediately
      if (res.status !== 429 && res.status !== 503 && res.status !== 500) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`Gemini API error ${res.status}: ${errBody.slice(0, 200)}`);
      }
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("Gemini API error")) throw err;
      if (i === delays.length) throw err;
    }

    if (i < delays.length) {
      console.log(`[Gemini] Rate limited (${lastStatus}), retrying in ${delays[i] / 1000}s...`);
      await new Promise((r) => setTimeout(r, delays[i]));
    }
  }

  // If Gemini is completely rate-limited, try Groq as fallback (without Gemini-specific features)
  if (lastStatus === 429) {
    console.log("[Gemini] Exhausted retries, falling back to Groq...");
    try {
      const { ask } = await import("../llm");
      const appendix = useSchema
        ? "\n\nYou MUST return valid JSON matching this structure: { problems: [{ id, title, problem, hypothesis, pmGoal, hook, citation, companyMission, matchedStrengths, linkedinHook, speculativePitch }] }. Return ONLY the JSON, no markdown."
        : "";
      return await ask(prompt + appendix);
    } catch (fallbackErr) {
      throw new Error(
        "Gemini API rate-limited (429) and Groq fallback also failed. Please wait a minute and try again."
      );
    }
  }

  throw new Error(`Gemini API failed after ${delays.length} retries (last status: ${lastStatus}).`);
}

// ─── Research Prompt Builder ────────────────────────────────────

function buildResearchPrompt(
  input: ResearchInput,
  leadContext: string | null,
  companyContext: string | null,
  evidenceDocs: VaultItem[],
  inspirationDocs: VaultItem[]
): string {
  return `You are a strict RAG-enabled Product Strategy Analyst.
TARGET COMPANY: ${input.companyName} (${input.industry}).
TARGET ROLE: ${input.role || "Product Manager"}
LEAD LINKEDIN URL: ${input.leadUrl || "None provided"}
COMPANY WEBSITE URL: ${input.companyWebsite || "None provided"}

[JOB DESCRIPTION]:
${input.jobDescription || "None provided. Infer standard requirements for the target role."}

[LEAD SCRAPED CONTEXT]: ${leadContext || "Direct scrape failed. Use google_search."}
[COMPANY WEBSITE CONTEXT]: ${companyContext || "Direct scrape failed. Use google_search."}

USER PROFILE: ${USER_PERSONA}

[EVIDENCE LIBRARY - My verified past work]:
${evidenceDocs.length ? evidenceDocs.map((d) => `TITLE: ${d.title}\nCONTENT: ${d.content}`).join("\n\n") : "None provided."}

[INSPIRATION LIBRARY - Industry best practices/theories]:
${inspirationDocs.length ? inspirationDocs.map((d) => `TITLE: ${d.title}\nCONTENT: ${d.content}`).join("\n\n") : "None provided."}

TASK:
1. Identify 3 critical UX or product friction points for the target company.
2. Cross-reference the EVIDENCE LIBRARY to solve the problem.
3. 'hook': MUST cite the exact TITLE of the document you used from the Evidence Library to prove you can solve the problem.
4. 'companyMission': Write a short noun phrase completing the sentence "Your vision of building...". DO NOT repeat "Your vision of building" or write a full sentence. Example: "an intuitive clinical AI ecosystem".
5. 'matchedStrengths': Analyze the [JOB DESCRIPTION]. Select 2 hard skills/metrics from my EVIDENCE LIBRARY that align perfectly with the JD. Write a short phrase completing "Given my background in...". DO NOT write a full sentence. DO NOT repeat "Given my background in". Example: "0-1 product delivery and scaling AI agents".
6. 'linkedinHook': If a LEAD LINKEDIN URL is provided, formulate a personalized, warm 1-2 sentence opening hook using the [LEAD SCRAPED CONTEXT]. If context is missing, use Google Search. DO NOT return an empty string if a URL is provided. ONLY return "" if LEAD LINKEDIN URL is 'None provided'.
7. 'speculativePitch': Analyze the [COMPANY WEBSITE CONTEXT]. Write a 1-2 sentence observation identifying their core product value proposition and 1-2 likely competitors/alternatives in their space. Frame this as an exciting challenge for a 0-1 Product Manager to tackle.

OUTPUT REQUIREMENTS: Return valid JSON strictly adhering to the requested schema. Do not include markdown formatting.`;
}

// ─── Ingestion: Extract text from URLs via Gemini + Search ──────

export async function ingestUrl(
  url: string,
  apiKey: string
): Promise<string> {
  const prompt = `SCRAPE URL: ${url}. Extract PM evidence or industry insights. Ignore generic boilerplate. Return only the extracted text.`;

  return await callGemini(prompt, apiKey, true);
}

// ─── Main Research Pipeline ─────────────────────────────────────

export async function executeResearch(
  input: ResearchInput,
  apiKey: string
): Promise<ResearchResult> {
  // 1. Retrieve top vault items (recency-based)
  const topEvidence = vaultStore.getTopByRecency("evidence", 3);
  const topInspiration = vaultStore.getTopByRecency("inspiration", 2);

  // 2. Scrape target contexts
  const [leadContext, companyContext] = await Promise.all([
    scrapeUrl(input.leadUrl ?? ""),
    scrapeUrl(input.companyWebsite ?? ""),
  ]);

  // 3. Build prompt and call Gemini with structured output
  const prompt = buildResearchPrompt(
    input,
    leadContext,
    companyContext,
    topEvidence,
    topInspiration
  );

  const rawText = await callGemini(prompt, apiKey, true, true);

  if (!rawText) {
    throw new Error("LLM returned an empty payload.");
  }

  // 4. Parse and return
  const data = JSON.parse(rawText) as ResearchResult;
  return data;
}
