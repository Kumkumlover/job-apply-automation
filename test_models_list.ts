import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

async function run() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  const geminiModels = data.models.filter(m => m.name.includes('gemini-2.0'));
  console.log(JSON.stringify(geminiModels.map(m => m.name), null, 2));
}
run();
