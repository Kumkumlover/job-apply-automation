import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function testSerper() {
  const query = 'site:linkedin.com/in "PayU" "Present" (Product OR PM OR Founder OR Growth OR HR OR Recruiter OR Talent Acquisition OR Founder OR Co-Founder)';
  
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": process.env.SERPER_API_KEY!,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      q: query,
      num: 10
    })
  });

  const data = await res.json();
  console.log("Serper Query:", query);
  console.log("\nResults:");
  const items = data.organic || [];
  for (const item of items) {
    console.log("- Title:", item.title);
    console.log("  URL:", item.link);
    console.log("  Snippet:", item.snippet);
  }
}

testSerper();
