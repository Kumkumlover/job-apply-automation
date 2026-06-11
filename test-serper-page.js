const serperKey = process.env.SERPER_API_KEY || "cf2dbb699c1f852bebad72a0700160e86b0fc8c9";

async function testSerper() {
  const q = `site:linkedin.com/in intitle:"Univest" ("Product Manager" OR "Product Lead" OR "VP Product")`;
  
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q, num: 10, page: 2 }) 
  });
  
  if (!res.ok) {
    console.log("Error:", await res.text());
    return;
  }
  
  const data = await res.json();
  console.log(`Page 2 found ${data.organic?.length || 0} results.`);
}
testSerper();
