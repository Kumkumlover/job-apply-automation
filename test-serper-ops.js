const serperKey = process.env.SERPER_API_KEY || "cf2dbb699c1f852bebad72a0700160e86b0fc8c9"; // From .env.local

async function testSerper(q) {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 10 }) 
  });
  
  if (!res.ok) {
    console.error("Error for query:", q, await res.text());
    return;
  }
  
  const data = await res.json();
  console.log(`Query '${q}' found ${data.organic?.length || 0} organic results.`);
  for (const item of data.organic || []) {
    console.log("-", item.title);
  }
}

async function run() {
  await testSerper(`site:linkedin.com/in "Univest" "Product Manager"`);
  await testSerper(`intitle:"Univest" "Product Manager"`);
  await testSerper(`Univest "Product Manager" LinkedIn`);
}
run();
