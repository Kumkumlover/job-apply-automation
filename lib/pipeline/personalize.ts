/**
 * Phase 4a: Gemini writes a single personalized sentence for the cold email
 *
 * Replaces: "Message a model" node (cleaned up — ONE task only)
 */

import { askGemini } from "../gemini";

export async function personalizeReason(
  company: string,
  jobTitle: string,
  jd?: string,
  companyReason?: string,
  mySummary?: string
): Promise<string> {
  // If the user already wrote a company_reason, just use it
  if (companyReason?.trim()) {
    return companyReason.trim();
  }

  const prompt = `You are helping me write one personalised sentence for a cold email job application.

Company: ${company}
Role: ${jobTitle}
Job description: ${jd || "Not provided"}
${mySummary ? `Candidate summary: ${mySummary}` : ""}

Write exactly ONE sentence explaining why I am excited about this company and role.
Use "I" voice, be specific to the JD above, and keep it between 20 and 35 words.
No greeting, no closing, no bullet points, no quotes - return only the sentence.`;

  const raw = await askGemini(prompt);
  // Strip any quotes Gemini might wrap around the sentence
  return raw.replace(/^["']+|["']+$/g, "").trim();
}
