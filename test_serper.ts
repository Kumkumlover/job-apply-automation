import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function testSerper() {
  const serperKey = process.env.SERPER_API_KEY;
  if (!serperKey) return console.error("No key");

  const query = `site:linkedin.com/in "SalarySe" "Present" Niyatee`;
  
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": serperKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ q: query, num: 10 })
  });
  const data = await res.json();
  const items = data.organic ?? [];
  for (const item of items) {
    console.log(`- ${item.title}`);
    console.log(`  Snippet: ${item.snippet}\n`);
  }
}
testSerper();
