import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(apiKey);

/**
 * Call Gemini and return the raw text response.
 * Uses gemini-2.5-flash for speed/cost; switch to gemini-2.5-pro if quality drops.
 */
export async function askGemini(
  prompt: string,
  model = "gemini-2.5-flash"
): Promise<string> {
  const m = genAI.getGenerativeModel({ model });
  const result = await m.generateContent(prompt);
  return result.response.text();
}

/**
 * Call Gemini and parse the response as JSON.
 * Strips markdown code fences that Gemini sometimes wraps around JSON.
 */
export async function askGeminiJSON<T>(
  prompt: string,
  model = "gemini-2.5-flash"
): Promise<T> {
  const raw = await askGemini(prompt, model);
  const cleaned = raw
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}
