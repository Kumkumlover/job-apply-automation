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

import { prisma, getDefaultUserId } from "./db";

/** Get the best patterns for a domain, ranked by success rate */
async function getTopPatterns(domain: string, limit: number = 3): Promise<PatternRecord[]> {
  const userId = await getDefaultUserId();

  // Collect domain-specific and global patterns from DB
  const domainPatterns = await prisma.patternRecord.findMany({
    where: { userId, domain }
  });
  const globalPatterns = await prisma.patternRecord.findMany({
    where: { userId, domain: null }
  });

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
      merged.push({ pattern: p.pattern, domain: p.domain, successCount: p.successCount, usageCount: p.usageCount });
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
      merged.push({ pattern: p.pattern, domain: p.domain, successCount: p.successCount, usageCount: p.usageCount });
    }
  }

  // Fill the rest with defaults if we haven't reached the limit
  for (const p of DEFAULT_PATTERNS) {
    if (merged.length >= limit) break;
    if (!seen.has(p)) {
      seen.add(p);
      merged.push({
        pattern: p,
        domain: null,
        successCount: 1,
        usageCount: 2,
      });
    }
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
    const userId = await getDefaultUserId();
    // Gather feedback history for context
    const allPatterns = await prisma.patternRecord.findMany({
      where: { userId, usageCount: { gt: 0 } }
    });
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

// ─── Public Web Search ────────────────────────────────────────────

/** Scrape DuckDuckGo for publicly available emails (e.g. LinkedIn bios) */
async function searchPublicEmail(name: string, company: string, domain: string): Promise<string | null> {
  try {
    const query = encodeURIComponent(`"${name}" "${company}" "@${domain}"`);
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64 AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return null;
    const html = await res.text();
    const regex = new RegExp(`[a-zA-Z0-9._%+-]+@${domain.replace(/\./g, '\\.')}`, 'gi');
    const matches = html.match(regex);
    if (matches && matches.length > 0) {
      return matches[0].toLowerCase();
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Main Intelligence Engine ───────────────────────────────────

function extractDomain(input: string): string {
  if (!input) return "";
  try {
    let raw = input.toLowerCase().trim();
    if (!raw.startsWith("http")) raw = "https://" + raw;
    const url = new URL(raw);
    let hostname = url.hostname;
    if (hostname.startsWith("www.")) hostname = hostname.slice(4);
    return hostname;
  } catch {
    return input.toLowerCase().trim();
  }
}

async function processPerson(
  person: PersonInput,
  hunterKey: string,
  apolloKey: string
): Promise<PersonResult> {
  const { first, last } = parseName(person.name);
  let domain = extractDomain(person.domain ?? "");

  if (!domain) {
    const guesses = await llmGuessDomains(person.company, "");
    if (guesses.length > 0) {
      domain = guesses[0];
    } else {
      return formatOutput({ ...person, domain: "Unknown" }, []);
    }
  }

  // Ensure the person object reflects the resolved domain
  const resolvedPerson = { ...person, domain };

  // 1. Check cache first
  const cached = await store.getCachedEmails(resolvedPerson.name, domain);
  const hasVerified = cached.some((c) => c.verified);
  const apiCalls = store.getApiCalls(domain);

  // If we already have verified emails, or we maxed out API limits for this domain, return cache immediately
  if (cached.length > 0 && (hasVerified || apiCalls >= 2)) {
    return formatOutput(
      resolvedPerson,
      cached.map((c) => ({
        email: c.email,
        type: (c.verified
          ? "verified"
          : c.source === "Pattern Engine"
            ? "predicted"
            : "discovered") as "verified" | "discovered" | "predicted",
        confidence: c.confidence,
        source: c.source,
      }))
    );
  }

  const results: EmailResult[] = [];

  // 1.5 Public Web Search (Free)
  // If email is publicly available (e.g., LinkedIn bio, press release), skip Hunter.
  const publicEmail = await searchPublicEmail(resolvedPerson.name, resolvedPerson.company, domain);
  if (publicEmail) {
    const pattern = extractPattern(first, last, publicEmail.split("@")[0]);
    await store.saveEmail(publicEmail, resolvedPerson.name, domain, pattern, 0.90, "Public Web Search", true);
    await store.recordPatternSuccess(pattern, domain);

    return formatOutput(resolvedPerson, [
      { email: publicEmail, type: "verified", confidence: 0.90, source: "Public Web Search" },
    ]);
  }

  // 2. API Lookups (max 2 per domain)
  if (apiCalls < 2) {
    // Try Hunter first
    const hunterResult = await hunterLookup(domain, first, last, hunterKey);
    if (hunterResult) {
      store.incrementApiCall(domain);
      const pattern = extractPattern(first, last, hunterResult.email.split("@")[0]);
      await store.saveEmail(hunterResult.email, resolvedPerson.name, domain, pattern, 0.95, hunterResult.source, true);
      await store.recordPatternSuccess(pattern, domain);

      return formatOutput(resolvedPerson, [
        { email: hunterResult.email, type: "verified", confidence: 0.95, source: hunterResult.source },
      ]);
    }

    // Try Apollo
    if (apiCalls < 2) {
      const apolloResult = await apolloLookup(resolvedPerson.name, resolvedPerson.company, domain, apolloKey);
      if (apolloResult) {
        store.incrementApiCall(domain);
        const pattern = extractPattern(first, last, apolloResult.email.split("@")[0]);
        await store.saveEmail(apolloResult.email, resolvedPerson.name, domain, pattern, 0.85, apolloResult.source, false);
        await store.recordPatternSuccess(pattern, domain);

        return formatOutput(resolvedPerson, [
          { email: apolloResult.email, type: "discovered", confidence: 0.85, source: apolloResult.source },
        ]);
      }
    }
  }

  // If API lookups failed but we had cached predictions, return them now to avoid regenerating
  if (cached.length > 0) {
    return formatOutput(
      resolvedPerson,
      cached.map((c) => ({
        email: c.email,
        type: (c.verified
          ? "verified"
          : c.source === "Pattern Engine"
            ? "predicted"
            : "discovered") as "verified" | "discovered" | "predicted",
        confidence: c.confidence,
        source: c.source,
      }))
    );
  }

  // 3. LLM Deep Search
  if (results.length === 0) {
    const prompt = `Generate the 3 most likely professional email addresses for ${resolvedPerson.name} working at ${resolvedPerson.company} (domain: ${domain}). 
Common patterns: first.last, firstinitial+last, etc. Return ONLY a JSON array of strings. Example: ["f.last@domain.com"]`;
    const guesses = await askJSON<string[]>(prompt);

    for (const guess of guesses.slice(0, 3)) {
      if (!guess.includes("@")) continue;
      const validation = await validateEmail(guess);
      const isEmailValid = validation.mx_ok && validation.domain_ok;
      const pattern = extractPattern(first, last, guess.split("@")[0]);
      await store.saveEmail(guess, resolvedPerson.name, domain, pattern, isEmailValid ? 0.95 : 0.53, "LLM Deep Search", isEmailValid);

      results.push({
        email: guess,
        type: "predicted",
        confidence: isEmailValid ? 0.95 : (guess.endsWith(domain) ? 0.75 : 0.53),
        source: "LLM Deep Search",
      });
    }
  }

  // 4. Pattern-based prediction
  const topPatterns = await getTopPatterns(domain, 4);
  const llmPattern = await llmPredictPattern(resolvedPerson.company, domain);

  if (llmPattern && !topPatterns.some(p => p.pattern === llmPattern)) {
    topPatterns.unshift({ pattern: llmPattern, domain, successCount: 1, usageCount: 1 });
  }

  for (const pat of topPatterns) {
    const predicted = generateFromPattern(first, last, pat.pattern, domain);
    if (!predicted) continue;

    const validation = await validateEmail(predicted);
    if (validation.mx_ok && validation.domain_ok) {
      const baseRate = Math.max(pat.successCount / Math.max(pat.usageCount, 1), 0.3);
      const finalConfidence = Math.min(0.95, Math.round(baseRate * 100) / 100);
      results.push({ email: predicted, type: "predicted", confidence: finalConfidence, source: "Pattern Engine" });
      await store.saveEmail(predicted, resolvedPerson.name, domain, pat.pattern, finalConfidence, "Pattern Engine", false);
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
