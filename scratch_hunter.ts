async function testHunter() {
  const apiKey = "c9dff947f42d6e4cc5ffa72f84cc4a545a07e708";
  
  const domainsToTest = ["offbeat.com", "offbeatmedia.in", "salaryse.com"];
  
  for (const domain of domainsToTest) {
    console.log(`\nTesting Hunter for domain: ${domain}`);
    const params = new URLSearchParams({
      domain,
      first_name: "vibhor",
      last_name: "jain",
      api_key: apiKey,
    });
    const res = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
    console.log(`Status: ${res.status}`);
    const text = await res.text();
    console.log(`Response: ${text}`);
  }
}

testHunter();
