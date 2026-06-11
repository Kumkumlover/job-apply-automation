const serperKey = process.env.SERPER_API_KEY || "cf2dbb699c1f852bebad72a0700160e86b0fc8c9"; // From .env.local

async function testSerper() {
  const q = `site:linkedin.com/in "Univest" ("Product Manager" OR "Associate Product Manager" OR "Product")`;
  
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 20 }) // Ask for 20 results!
  });
  
  if (!res.ok) {
    console.error("Error:", await res.text());
    return;
  }
  
  const data = await res.json();
  console.log(`Found ${data.organic?.length || 0} organic results for broad query.`);
  for (const item of data.organic || []) {
    console.log("-", item.title);
  }

  const q2 = `site:linkedin.com/in intitle:"Univest" ("Product Manager" OR "Product Lead" OR "Head of Product" OR "VP Product" OR "Group Product Manager" OR "Director of Product" OR "Founder")`;
  const res2 = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: q2, num: 20 }) 
  });
  const data2 = await res2.json();
  console.log(`\nFound ${data2.organic?.length || 0} organic results for strict intitle query.`);
  for (const item of data2.organic || []) {
    console.log("-", item.title);
  }
}

testSerper();
