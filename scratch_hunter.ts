async function testHunter() {
  const apiKey = "c9dff947f42d6e4cc5ffa72f84cc4a545a07e708";
  
  const domainsToTest = ["idfcfirstbank.com", "idfcfirst.com"];
  const people = [
    { first: "abhilasha", last: "jain" },
    { first: "kishor", last: "sonar" },
    { first: "nikita", last: "sarni" },
    { first: "sahil", last: "gupta" }
  ];
  
  for (const domain of domainsToTest) {
    for (const person of people) {
      console.log(`\nTesting Hunter for: ${person.first} ${person.last} @ ${domain}`);
      const params = new URLSearchParams({
        domain,
        first_name: person.first,
        last_name: person.last,
        api_key: apiKey,
      });
      try {
        const res = await fetch(`https://api.hunter.io/v2/email-finder?${params}`);
        const data = await res.json();
        console.log(`Hunter Result:`, data?.data?.email || "NOT FOUND");
      } catch (e) {
        console.log("Error fetching from Hunter");
      }
    }
  }
}

testHunter();
