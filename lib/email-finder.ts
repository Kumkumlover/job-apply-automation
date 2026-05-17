/**
 * Email Intelligence Engine — Full TypeScript port of the Python FastAPI backend.
 *
 * Combines:
 *   1. Hunter.io / Apollo.io API lookups (capped at 2 per domain)
 *   2. LLM-powered domain guessing and pattern prediction
 *   3. Pattern-based prediction with domain-specific learning
 *   4. DNS-based validation (real, not simulated)
 *   5. Caching and feedback loops
 *
 * Storage uses an in-memory store backed by a JSON file on disk.
 * On Vercel serverless the file won't persist between cold starts,
 * but the in-memory cache survives within a single invocation.
 */

import { validateEmail } from "./pipeline/validate";
import { store, type PatternRecord, type CachedEmail } from "./intelligence-store";
import { ask, askJSON } from "./llm";

// ─── Public Types ───────────────────────────────────────────────

export interface PersonInput {
  name: string;
  company: string;
  domain: string;
}

export interface EmailResult {
  email: string;
  type: "verified" | "discovered" | "predicted";
  confidence: number;
  source: string;
}

export interface PersonResult {
  name: string;
  company: string;
  domain: string;
  emails: EmailResult[];
  recommended: string | null;
}

// ─── Name Parser ────────────────────────────────────────────────

function parseName(fullName: string): { first: string; last: string; initial: string } {
  const clean = fullName.replace(/[^a-zA-Z\s\-]/g, "").trim().toLowerCase();
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return { first: "", last: "", initial: "" };

  const first = parts[0] ?? "";
  const initial = first[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1] : "";

  return { first, last, initial };
}

// ─── Pattern Engine ─────────────────────────────────────────────

const DEFAULT_PATTERNS = [
  "{first}.{last}",
  "{first}{last}",
  "{first}",
  "{f}{last}",
  "{first}{l}",
  "{last}.{first}",
];

/** Reverse-engineer which pattern was used for an email's local part */
function extractPattern(first: string, last: string, localPart: string): string {
  if (!first) return "unknown";
  if (localPart === first) return "{first}";
  if (localPart === `${first}.${last}`) return "{first}.{last}";
  if (localPart === `${first}${last}`) return "{first}{last}";
  if (first.length > 0 && localPart === `${first[0]}${last}`) return "{f}{last}";
  if (last.length > 0 && localPart === `${first}${last[0]}`) return "{first}{l}";
  if (localPart === `${last}.${first}`) return "{last}.{first}";
  return "unknown";
}

/** Generate an email from a pattern template */
function generateFromPattern(
  first: string,
  last: string,
  pattern: string,
  domain: string
): string | null {
  if (!first) return null;

  let local = "";
  switch (pattern) {
    case "{first}":
      local = first;
      break;
    case "{first}.{last}":
      if (!last) return null;
      local = `${first}.${last}`;
      break;
    case "{first}{last}":
      if (!last) return null;
      local = `${first}${last}`;
      break;
    case "{f}{last}":
      if (!last) return null;
      local = `${first[0]}${last}`;
      break;
    case "{first}{l}":
      if (!last) return null;
      local = `${first}${last[0]}`;
      break;
    case "{last}.{first}":
      if (!last) return null;
      local = `${last}.${first}`;
      break;
    default:
      return null;
  }

  return local ? `${local}@${domain}` : null;
}

/** Get the best patterns for a domain, ranked by success rate */
function getTopPatterns(domain: string, limit: number = 3): PatternRecord[] {
  const data = store.load();

  // Collect domain-specific and global patterns
  const domainPatterns = data.patterns.filter((p) => p.domain === domain);
  const globalPatterns = data.patterns.filter((p) => p.domain === null);

  // Merge: domain-specific patterns take priority
  const merged: PatternRecord[] = [];
  const seen = new Set<string>();

  // Domain-specific first, sorted by success rate
  for (const p of domainPatterns.sort(
    (a, b) =>
      b.successCount / Math.max(b.usageCount, 1) -
      a.successCount / Math.max(a.usageCount, 1)
  )) {
    if (!seen.has(p.pattern)) {
      seen.add(p.pattern);
      merged.push(p);
    }
  }

  // Then global patterns
  for (const p of globalPatterns.sort(
    (a, b) =>
      b.successCount / Math.max(b.usageCount, 1) -
      a.successCount / Math.max(a.usageCount, 1)
  )) {
    if (!seen.has(p.pattern)) {
      seen.add(p.pattern);
      merged.push(p);
    }
  }

  // If we have no patterns at all, use defaults
  if (merged.length === 0) {
    return DEFAULT_PATTERNS.slice(0, limit).map((p) => ({
      pattern: p,
      domain: null,
      successCount: 1,
      usageCount: 2,
    }));
  }

  return merged.slice(0, limit);
}

// ─── LLM Intelligence Layer ─────────────────────────────────────

/**
 * Use LLM to guess the email domains a company uses.
 * Companies often use abbreviations (e.g., "Digital Harbor" → dharbor.com).
 */
async function llmGuessDomains(company: string, knownDomain: string): Promise<string[]> {
  try {
    const prompt = `You are an email domain expert. Given a company name, predict the email domains their employees likely use.

Company: "${company}"
Known domain: ${knownDomain}

Many companies use shorter abbreviations for emails (e.g., "Digital Harbor" uses "dharbor.com", "McKinsey & Company" uses "mckinsey.com").

Return a JSON array of up to 3 likely email domains, ordered by probability.
Include the known domain if it seems correct.
Return ONLY the JSON array, no explanation. Example: ["dharbor.com", "digitalharbor.com"]`;

    const domains = await askJSON<string[]>(prompt);
    return domains.filter((d: string) => d.includes(".") && d.length > 3);
  } catch {
    return [knownDomain];
  }
}

/**
 * Use LLM to predict the most likely email pattern for a company,
 * incorporating feedback history from similar companies.
 */
async function llmPredictPattern(
  company: string,
  domain: string
): Promise<string | null> {
  try {
    // Gather feedback history for context
    const data = store.load();
    const allPatterns = data.patterns.filter(p => p.usageCount > 0);
    const feedbackSummary = allPatterns
      .map(p => {
        const rate = p.successCount / Math.max(p.usageCount, 1);
        const scope = p.domain ? `domain:${p.domain}` : "global";
        return `${p.pattern} (${scope}, ${Math.round(rate * 100)}% success, ${p.usageCount} uses)`;
      })
      .join("\n");

    const prompt = `You are an email pattern prediction engine. Based on historical data, predict the most likely email format for employees at "${company}" (domain: ${domain}).

HISTORICAL PATTERN DATA:
${feedbackSummary || "No historical data yet."}

Common patterns: {first}.{last}, {first}{last}, {first}, {f}{last}, {first}{l}, {last}.{first}

Based on:
1. The company name and domain style
2. Historical success rates from similar domains
3. Industry conventions

Return ONLY the pattern string (e.g., "{first}.{last}"). No explanation.`;

    const raw = await ask(prompt);
    const cleaned = raw.trim().replace(/^["']+|["']+$/g, "");

    // Validate it's a known pattern
    if (DEFAULT_PATTERNS.includes(cleaned)) return cleaned;
    return null;
  } catch {
    return null;
  }
}

// ─── API Layer (Hunter.io + Apollo.io) ──────────────────────────

async function hunterLookup(
  domain: string,
  firstName: string,
  lastName: string,
  apiKey: string
): Promise<{ email: string; source: string } | null> {
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      domain,
      first_name: firstName,
      last_name: lastName,
      api_key: apiKey,
    });

    const res = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.data?.email) return null;

    return { email: data.data.email, source: "Hunter.io" };
  } catch {
    return null;
  }
}

async function apolloLookup(
  name: string,
  company: string,
  domain: string,
  apiKey: string
): Promise<{ email: string; source: string } | null> {
  if (!apiKey) return null;

  try {
    const res = await fetch("https://api.apollo.io/v1/people/match", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Cache-Control": "no-cache" },
      body: JSON.stringify({
        api_key: apiKey,
        name,
        organization_name: company,
        domain,
      }),
    });

    if (!res.ok) return null;

    const data = await res.json();
    if (!data?.person?.email) return null;

    return { email: data.person.email, source: "Apollo.io" };
  } catch {
    return null;
  }
}

// ─── Main Intelligence Engine ───────────────────────────────────

async function processPerson(
  person: PersonInput,
  hunterKey: string,
  apolloKey: string
): Promise<PersonResult> {
  const { first, last } = parseName(person.name);
  const domain = person.domain.toLowerCase().trim();

  // 1. Check cache first
  const cached = store.getCachedEmails(person.name, domain);
  if (cached.length > 0) {
    return formatOutput(person, cached.map((c) => ({
      email: c.email,
      type: (c.verified ? "verified" : c.source === "Pattern Engine" ? "predicted" : "discovered") as "verified" | "discovered" | "predicted",
      confidence: c.confidence,
      source: c.source,
    })));
  }

  const results: EmailResult[] = [];

  // 2. API Lookups (max 2 per domain)
  const apiCalls = store.getApiCalls(domain);

  if (apiCalls < 2) {
    // Try Hunter first
    const hunterResult = await hunterLookup(domain, first, last, hunterKey);
    if (hunterResult) {
      store.incrementApiCall(domain);
      const pattern = extractPattern(first, last, hunterResult.email.split("@")[0]);
      store.saveEmail(hunterResult.email, person.name, domain, pattern, 0.95, hunterResult.source, true);
      store.recordPatternSuccess(pattern, domain);

      return formatOutput(person, [
        { email: hunterResult.email, type: "verified", confidence: 0.95, source: hunterResult.source },
      ]);
    }

    // Try Apollo
    if (apiCalls < 1) {
      const apolloResult = await apolloLookup(person.name, person.company, domain, apolloKey);
      if (apolloResult) {
        store.incrementApiCall(domain);
        const pattern = extractPattern(first, last, apolloResult.email.split("@")[0]);
        store.saveEmail(apolloResult.email, person.name, domain, pattern, 0.85, apolloResult.source, false);
        store.recordPatternSuccess(pattern, domain);

        return formatOutput(person, [
          { email: apolloResult.email, type: "discovered", confidence: 0.85, source: apolloResult.source },
        ]);
      }
    }
  }

  // 3. LLM Deep Search — guess alternate domains & predict best pattern
  const allDomains = await llmGuessDomains(person.company, domain);
  const llmPattern = await llmPredictPattern(person.company, domain);

  // 4. Pattern-based prediction with DNS validation
  const topPatterns = getTopPatterns(domain, 4);
  const seenEmails = new Set<string>();

  // If LLM predicted a specific pattern, try it first
  if (llmPattern && !topPatterns.some(p => p.pattern === llmPattern)) {
    topPatterns.unshift({
      pattern: llmPattern,
      domain,
      successCount: 1,
      usageCount: 1,
    });
  }

  // Try all domains (original + LLM-guessed) × all patterns
  for (const tryDomain of allDomains) {
    for (const pat of topPatterns) {
      const predicted = generateFromPattern(first, last, pat.pattern, tryDomain);
      if (!predicted || seenEmails.has(predicted)) continue;
      seenEmails.add(predicted);

      // Real DNS validation
      const validation = await validateEmail(predicted);

      if (validation.mx_ok && validation.domain_ok && !validation.disposable) {
        const baseRate = Math.max(
          pat.successCount / Math.max(pat.usageCount, 1),
          0.3
        );
        const validationModifier = Math.max(validation.recruiting_score, 0.5);
        // Boost confidence slightly if LLM suggested this domain/pattern
        const llmBoost = (tryDomain !== domain || pat.pattern === llmPattern) ? 1.1 : 1.0;
        const finalConfidence = Math.min(0.95, Math.round(baseRate * validationModifier * 0.8 * llmBoost * 100) / 100);

        const source = tryDomain !== domain ? "LLM Deep Search" : "Pattern Engine";
        results.push({
          email: predicted,
          type: "predicted",
          confidence: finalConfidence,
          source,
        });

        store.saveEmail(predicted, person.name, tryDomain, pat.pattern, finalConfidence, source, false);
      }

      if (results.length >= 5) break;
    }
    if (results.length >= 5) break;
  }

  return formatOutput(person, results);
}

/** Format output with recommended email */
function formatOutput(person: PersonInput, emails: EmailResult[]): PersonResult {
  // Sort by confidence descending
  emails.sort((a, b) => b.confidence - a.confidence);

  // Determine recommendation: prefer verified > discovered > highest predicted
  let recommended: string | null = null;
  if (emails.length > 0) {
    const typePriority: Record<string, number> = { verified: 3, discovered: 2, predicted: 1 };
    const sorted = [...emails].sort((a, b) => {
      const pDiff = (typePriority[b.type] ?? 0) - (typePriority[a.type] ?? 0);
      if (pDiff !== 0) return pDiff;
      return b.confidence - a.confidence;
    });
    recommended = sorted[0].email;
  }

  return {
    name: person.name,
    company: person.company,
    domain: person.domain,
    emails,
    recommended,
  };
}

// ─── Public API ─────────────────────────────────────────────────

/** Enrich a list of people sequentially (to respect API rate limits) */
export async function enrichAll(
  people: PersonInput[],
  hunterKey: string,
  apolloKey: string
): Promise<PersonResult[]> {
  const results: PersonResult[] = [];
  for (const person of people) {
    const result = await processPerson(person, hunterKey, apolloKey);
    results.push(result);
  }
  return results;
}

export { type PersonInput as PersonInputType };
