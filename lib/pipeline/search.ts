/**
 * Phase 2a: Google Custom Search → parse + score candidates
 *
 * Replaces 3 n8n nodes: Query, HTTP Request, Parse Search Results + Code in JavaScript
 */

import type { SearchResult } from "../types";
import { askJSON } from "../llm";

const CSE_KEY = process.env.GOOGLE_CSE_KEY ?? "";
const CSE_CX = process.env.GOOGLE_CSE_CX ?? "";

/** Build a dynamic LinkedIn search query based on company + job title */
function buildQuery(company: string, jobTitle: string): string {
  // Extract role keywords from job_title for broader matching
  const title = jobTitle.toLowerCase();
  const roleVariants: string[] = [];

  if (title.includes("product")) {
    roleVariants.push(
      '"product manager"','"product lead"','"head of product"',
      '"senior product"','"director of product"','"product owner"'
    );
  } else if (title.includes("engineer") || title.includes("developer")) {
    roleVariants.push(
      `"${jobTitle}"`,'"engineering manager"','"tech lead"',
      '"head of engineering"','"CTO"'
    );
  } else if (title.includes("design")) {
    roleVariants.push(
      `"${jobTitle}"`,'"design lead"','"head of design"',
      '"design manager"','"UX lead"'
    );
  } else if (title.includes("market")) {
    roleVariants.push(
      `"${jobTitle}"`,'"marketing manager"','"head of marketing"',
      '"CMO"','"growth lead"'
    );
  } else {
    // Generic: search for the exact title + manager/lead/head variants
    roleVariants.push(
      `"${jobTitle}"`,
      `"${jobTitle.replace(/\b(manager|lead|head)\b/gi, "").trim()} manager"`,
      `"head of ${jobTitle.replace(/\b(manager|lead|head|senior|junior)\b/gi, "").trim()}"`,
    );
  }

  return `site:linkedin.com "${company}" (${roleVariants.join(" OR ")})`;
}

/** Heuristic score: how likely is this result a relevant hiring-manager profile? */
function scoreResult(title: string, snippet: string, url: string): number {
  let score = 0;
  const t = title.toLowerCase();
  const s = snippet.toLowerCase();

  const keywords = [
    "manager","lead","head","senior","principal","director","vp","chief",
  ];
  for (const k of keywords) {
    if (t.includes(k)) score += 2;
    if (s.includes(k)) score += 1;
  }

  // LinkedIn profile pages are more valuable
  if (url.includes("linkedin.com/in/")) score += 3;
  if (url.includes("linkedin.com/company/")) score += 1;

  if (title.length > 0) score += 0.5;
  return score;
}

/** Extract name from a LinkedIn /in/ URL */
function nameFromUrl(url: string): string {
  const m = url.match(/\/in\/([^/?#]+)/i);
  if (!m?.[1]) return "";
  return decodeURIComponent(m[1])
    .replace(/[-_]/g, " ")
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")
    .trim();
}

export async function searchCandidates(
  company: string,
  jobTitle: string
): Promise<SearchResult[]> {
  const q = buildQuery(company, jobTitle);

  const params = new URLSearchParams({
    key: CSE_KEY,
    cx: CSE_CX,
    q,
  });

  const res = await fetch(
    `https://www.googleapis.com/customsearch/v1?${params}`
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google CSE error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const items: Array<{ link?: string; title?: string; snippet?: string; displayLink?: string }> =
    data.items ?? [];

  // Filter to candidate-relevant domains
  const candidateDomains = [
    "linkedin.com","foundit.in","naukri.com","angel.co",
    "glassdoor.com","indeed.com",
  ];

  const seen = new Set<string>();
  const results: SearchResult[] = [];

  for (const item of items) {
    const url = (item.link ?? "").replace(/\/$/, "");
    if (!url) continue;

    const lowerUrl = url.toLowerCase();
    const isCandidate =
      lowerUrl.includes("linkedin.com/in/") ||
      lowerUrl.includes("linkedin.com/company/") ||
      candidateDomains.some((d) => lowerUrl.includes(d));

    if (!isCandidate) continue;
    if (seen.has(url)) continue;
    seen.add(url);

    const title = (item.title ?? "").replace(/<[^>]*>/g, "").trim();
    const snippet = (item.snippet ?? "").replace(/<[^>]*>/g, "").trim();

    results.push({
      url,
      title,
      snippet,
      domain: item.displayLink ?? new URL(url).hostname,
      score: scoreResult(title, snippet, url),
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 8);
}

/**
 * LLM-only fallback for contact discovery.
 * Used when Google CSE keys are not available.
 */
export async function searchCandidatesLLM(
  company: string,
  jobTitle: string,
  jd?: string
): Promise<SearchResult[]> {
  interface LLMContact {
    name: string;
    title: string;
    role_type: string;
    linkedin_url?: string;
    confidence: number;
    reason: string;
  }

  const prompt = `You are a recruiter intelligence engine. I need to find the people most likely responsible for hiring a "${jobTitle}" at "${company}".

${jd ? `Job Description: ${jd.substring(0, 500)}` : ""}

Return the top 5 most likely decision-makers (hiring managers, team leads, HR/recruiters) at this company for this role.

For each person, provide:
- name: Their full name (your best guess based on your training data)
- title: Their current job title
- role_type: One of "hiring_manager", "team_lead", "recruiter_hr"
- linkedin_url: Their LinkedIn profile URL if you know it, otherwise null
- confidence: 0.0-1.0 how confident you are
- reason: Brief reason why they are relevant

Return ONLY a JSON array. No explanation. Example:
[{"name":"Jane Doe","title":"VP Product","role_type":"hiring_manager","linkedin_url":null,"confidence":0.7,"reason":"VP of product typically hires PMs"}]`;

  try {
    const contacts = await askJSON<LLMContact[]>(prompt);

    return contacts
      .filter((c) => c.name && c.name.trim())
      .map((c, idx) => ({
        url: c.linkedin_url || `https://linkedin.com/search/results/people/?keywords=${encodeURIComponent(c.name + " " + company)}`,
        title: `${c.name} — ${c.title}`,
        snippet: `${c.role_type}: ${c.reason} (Confidence: ${Math.round(c.confidence * 100)}%)`,
        domain: "linkedin.com",
        score: (contacts.length - idx) * 2 + (c.confidence * 5),
      }));
  } catch (err) {
    console.error("LLM contact search failed:", err);
    return [];
  }
}

/**
 * Auto-select: uses Google CSE if keys are available, falls back to LLM.
 */
export async function searchCandidatesAuto(
  company: string,
  jobTitle: string,
  jd?: string
): Promise<SearchResult[]> {
  if (CSE_KEY && CSE_CX) {
    try {
      return await searchCandidates(company, jobTitle);
    } catch (err) {
      console.warn("Google CSE failed, falling back to LLM:", err);
      return searchCandidatesLLM(company, jobTitle, jd);
    }
  }
  return searchCandidatesLLM(company, jobTitle, jd);
}
