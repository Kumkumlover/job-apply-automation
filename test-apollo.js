const apiKey = process.env.APOLLO_API_KEY || "-jUxFKsCVRPK7UhOQGnnZw"; // The key from .env.local

async function testApollo() {
  const res = await fetch("https://api.apollo.io/v1/mixed_people/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "X-Api-Key": apiKey
    },
    body: JSON.stringify({
      q_organization_name: "Univest",
      person_titles: ["Product Manager", "Product", "Associate Product Manager"],
      page: 1,
      per_page: 10
    })
  });
  
  if (!res.ok) {
    console.error("Error:", await res.text());
    return;
  }
  
  const data = await res.json();
  console.log("Total matched:", data.pagination?.total_entries);
  for (const p of data.people || []) {
    console.log("-", p.name, "|", p.title, "| LinkedIn:", p.linkedin_url);
  }
}

testApollo();
