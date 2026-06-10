import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const GEMINI_MODEL = "gemini-2.0-flash-001";
const apiKey = process.env.GEMINI_API_KEY;

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: "Hello!" }] }],
    }),
  });
  console.log(res.status);
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}
run();
