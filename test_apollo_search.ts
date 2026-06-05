import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config({ path: ".env.local" });
dotenv.config();

async function testApolloSearch() {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) {
    console.error("Missing APOLLO_API_KEY");
    return;
  }

  const url = "https://api.apollo.io/v1/people/match";
  const data = {
    first_name: "Suparna",
    last_name: "Sarkar",
    organization_name: "SalarySe"
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
        "X-Api-Key": apiKey
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      console.error("Error:", await res.text());
      return;
    }

    const result = await res.json();
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testApolloSearch();
