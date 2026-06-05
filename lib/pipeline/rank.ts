/**
 * Phase 2b: LLM ranks the top search results into candidates
 *
 * Replaces 2 n8n nodes: Rank candidates + Parse LLM output
 */

import { askJSON } from "../llm";
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
1. Pick up to 5 people most likely to be the hiring manager, team lead, or recruiter for this role.
2. CRITICAL RULES for selection:
   - READ THE SNIPPET CAREFULLY. If the snippet contains an end date in the past (e.g., "Jun 2023 - Jul 2025" or anything implying they left), or says "Ex-", "Former", or "Past", DO NOT PICK THEM.
   - CHECK THE "Present" KEYWORD. If the snippet shows the word "Present" associated with a DIFFERENT company name (e.g. "Agilitas... Present... SalarySe... 1 year"), this means they currently work at the other company and are an ex-employee of ${company}. DO NOT PICK THEM.
   - Make absolutely sure the person CURRENTLY belongs to the company ${company} (Do not pick ex-employees or false positives).
   - Prioritize people in the exact same department mentioned in the JD (e.g., Product, Platform and Cards).
   - Prioritize HRs or Recruiters of that company who hire for that department.
   - If the model cannot find anyone in those categories, at least ensure they are currently at the company and are in HR or a similar role.
4. For each, decide:
   - current_company_analysis: analyze the snippet step-by-step to determine which company they currently work at (look at where "Present" is attached). If it's not ${company}, EXCLUDE THEM.
   - role_type: one of "hiring_manager", "team_lead", "recruiter_hr", "other"
   - confidence: 0.0 to 1.0
   - reason: 1-2 short bullet points why they are the best contact

Return ONLY valid JSON in this exact shape:
{
  "topCandidates": [
    {
      "name": "...",
      "profile_url": "...",
      "current_title": "...",
      "current_company_analysis": "...",
      "role_type": "hiring_manager",
      "confidence": 0.0,
      "reason": "point 1; point 2"
    }
  ]
}

No extra keys, comments, or prose. Just valid JSON.`;

  const parsed = await askJSON<RankResponse>(prompt);
  return parsed.topCandidates ?? [];
}
