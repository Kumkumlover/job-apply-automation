import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;
const models = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash'
];

async function run() {
  for (const GEMINI_MODEL of models) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello!" }] }],
        }),
      });
      console.log(`${GEMINI_MODEL} -> ${res.status}`);
  }
}
run();
