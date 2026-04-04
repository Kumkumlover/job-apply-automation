/**
 * Phase 2b: Gemini ranks the top search results into candidates
 *
 * Replaces 2 n8n nodes: Rank candidates + Parse LLM output
 */

import { askGeminiJSON } from "../gemini";
import type { SearchResult, RankedCandidate } from "../types";

interface RankResponse {
  topCandidates: RankedCandidate[];
}

export async function rankCandidates(
  results: SearchResult[],
  company: string,
  jobTitle: string,
  jd?: string
): Promise<RankedCandidate[]> {
  if (!results.length) return [];

  const prompt = `You are helping me find likely hiring managers or HR contacts for a job.

Context:
- Company: ${company}
- Job title / role: ${jobTitle}
- JD: ${jd || "No detailed JD given"}

Here is a JSON array of search results (each has name-from-url, url, title, snippet, score):
${JSON.stringify(results, null, 2)}

Task:
1. Pick up to 3 people most likely to be the hiring manager, team lead, or recruiter for this role.
2. For each, decide:
   - role_type: one of "hiring_manager", "team_lead", "recruiter_hr", "other"
   - confidence: 0.0 to 1.0
   - reason: 1-2 short bullet points

Return ONLY valid JSON in this exact shape:
{
  "topCandidates": [
    {
      "name": "...",
      "profile_url": "...",
      "current_title": "...",
      "role_type": "hiring_manager",
      "confidence": 0.0,
      "reason": "point 1; point 2"
    }
  ]
}

No extra keys, comments, or prose. Just valid JSON.`;

  const parsed = await askGeminiJSON<RankResponse>(prompt);
  return parsed.topCandidates ?? [];
}
