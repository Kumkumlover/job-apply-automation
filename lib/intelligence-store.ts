/**
 * Intelligence Store — TypeScript port of the Python DatabaseService.
 *
 * Replaces SQLite with a JSON file + in-memory cache.
 * Tables ported:
 *   - companies   → tracks API calls used per domain (max 2)
 *   - patterns    → tracks pattern success/failure rates (domain + global)
 *   - emails      → caches discovered/predicted emails
 *   - feedback    → logs user feedback
 *
 * On Vercel serverless the JSON file won't persist between cold starts,
 * but the in-memory cache survives within a warm function invocation.
 * This can be upgraded to Supabase later for full persistence.
 */

import { promises as fs } from "fs";
import path from "path";

// ─── Data Types ─────────────────────────────────────────────────

export interface PatternRecord {
  pattern: string;
  domain: string | null; // null = global
  successCount: number;
  usageCount: number;
}

export interface CachedEmail {
  email: string;
  name: string;
  domain: string;
  pattern: string;
  confidence: number;
  source: string;
  verified: boolean;
}

export interface FeedbackRecord {
  email: string;
  status: "correct" | "incorrect";
  timestamp: string;
}

export interface CompanyRecord {
  domain: string;
  apiCallsUsed: number;
}

interface StoreData {
  companies: CompanyRecord[];
  patterns: PatternRecord[];
  emails: CachedEmail[];
  feedback: FeedbackRecord[];
}

// ─── Default Seed Data ──────────────────────────────────────────

const DEFAULT_PATTERNS: PatternRecord[] = [
  { pattern: "{first}.{last}", domain: null, successCount: 1, usageCount: 2 },
  { pattern: "{first}{last}", domain: null, successCount: 1, usageCount: 2 },
  { pattern: "{first}", domain: null, successCount: 1, usageCount: 2 },
  { pattern: "{f}{last}", domain: null, successCount: 1, usageCount: 2 },
  { pattern: "{first}{l}", domain: null, successCount: 1, usageCount: 2 },
  { pattern: "{last}.{first}", domain: null, successCount: 1, usageCount: 2 },
];

function createEmptyStore(): StoreData {
  return {
    companies: [],
    patterns: [...DEFAULT_PATTERNS],
    emails: [],
    feedback: [],
  };
}

// ─── Store Implementation ───────────────────────────────────────

const STORE_FILE = path.join(process.cwd(), "data", "intelligence-store.json");

let _cache: StoreData | null = null;

async function ensureDir() {
  const dir = path.dirname(STORE_FILE);
  await fs.mkdir(dir, { recursive: true });
}

class IntelligenceStore {
  /** Load the store from disk (or create fresh) */
  load(): StoreData {
    if (_cache) return _cache;

    // Try synchronous load for speed (initial cold start)
    try {
      const raw = require("fs").readFileSync(STORE_FILE, "utf-8");
      _cache = JSON.parse(raw) as StoreData;
    } catch {
      _cache = createEmptyStore();
    }

    return _cache;
  }

  /** Persist the store to disk (best-effort, fails silently on Vercel) */
  async save(): Promise<void> {
    if (!_cache) return;
    try {
      await ensureDir();
      await fs.writeFile(STORE_FILE, JSON.stringify(_cache, null, 2));
    } catch {
      // Silently fail on read-only filesystems (Vercel prod)
    }
  }

  // ── Companies ──

  getApiCalls(domain: string): number {
    const data = this.load();
    const company = data.companies.find(
      (c) => c.domain.toLowerCase() === domain.toLowerCase()
    );
    return company?.apiCallsUsed ?? 0;
  }

  incrementApiCall(domain: string): void {
    const data = this.load();
    const existing = data.companies.find(
      (c) => c.domain.toLowerCase() === domain.toLowerCase()
    );
    if (existing) {
      existing.apiCallsUsed += 1;
    } else {
      data.companies.push({ domain: domain.toLowerCase(), apiCallsUsed: 1 });
    }
    void this.save();
  }

  // ── Emails ──

  getCachedEmails(name: string, domain: string): CachedEmail[] {
    const data = this.load();
    return data.emails
      .filter(
        (e) =>
          e.name.toLowerCase() === name.toLowerCase() &&
          e.domain.toLowerCase() === domain.toLowerCase()
      )
      .sort((a, b) => b.confidence - a.confidence);
  }

  saveEmail(
    email: string,
    name: string,
    domain: string,
    pattern: string,
    confidence: number,
    source: string,
    verified: boolean
  ): void {
    const data = this.load();

    // Upsert by email
    const idx = data.emails.findIndex(
      (e) => e.email.toLowerCase() === email.toLowerCase()
    );
    const record: CachedEmail = {
      email,
      name,
      domain: domain.toLowerCase(),
      pattern,
      confidence,
      source,
      verified,
    };

    if (idx >= 0) {
      data.emails[idx] = record;
    } else {
      data.emails.push(record);
    }

    void this.save();
  }

  // ── Patterns ──

  recordPatternSuccess(pattern: string, domain: string): void {
    const data = this.load();

    // Update domain-specific pattern
    const domainPat = data.patterns.find(
      (p) => p.pattern === pattern && p.domain === domain
    );
    if (domainPat) {
      domainPat.successCount += 1;
      domainPat.usageCount += 1;
    } else {
      data.patterns.push({
        pattern,
        domain,
        successCount: 1,
        usageCount: 1,
      });
    }

    // Also update global pattern
    const globalPat = data.patterns.find(
      (p) => p.pattern === pattern && p.domain === null
    );
    if (globalPat) {
      globalPat.successCount += 1;
      globalPat.usageCount += 1;
    }

    void this.save();
  }

  recordPatternUsage(pattern: string, domain: string): void {
    const data = this.load();

    const domainPat = data.patterns.find(
      (p) => p.pattern === pattern && p.domain === domain
    );
    if (domainPat) {
      domainPat.usageCount += 1;
    }

    const globalPat = data.patterns.find(
      (p) => p.pattern === pattern && p.domain === null
    );
    if (globalPat) {
      globalPat.usageCount += 1;
    }

    void this.save();
  }

  // ── Feedback ──

  logFeedback(email: string, status: "correct" | "incorrect"): void {
    const data = this.load();

    // Log the feedback
    data.feedback.push({
      email,
      status,
      timestamp: new Date().toISOString(),
    });

    // Find the email record to update patterns
    const emailRecord = data.emails.find(
      (e) => e.email.toLowerCase() === email.toLowerCase()
    );

    if (emailRecord) {
      const { pattern, domain } = emailRecord;

      if (status === "correct") {
        // Boost: update pattern success counts
        this.recordPatternSuccess(pattern, domain);
        // Mark email as verified with max confidence
        emailRecord.verified = true;
        emailRecord.confidence = 1.0;
      } else {
        // Penalize: increment usage but not success
        this.recordPatternUsage(pattern, domain);
        // Halve the email's confidence
        emailRecord.confidence *= 0.5;
      }
    }

    void this.save();
  }
}

export const store = new IntelligenceStore();
