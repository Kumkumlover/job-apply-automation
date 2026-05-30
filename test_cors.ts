async function run() {
  const res = await fetch("https://api.hunter.io/v2/email-finder?domain=stripe.com&first_name=patrick&last_name=collison&api_key=test", {
    method: "OPTIONS",
    headers: {
      "Origin": "https://job-apply-automation.vercel.app",
      "Access-Control-Request-Method": "GET"
    }
  });
  console.log("Status:", res.status);
  for (const [key, val] of res.headers.entries()) {
    console.log(key, ":", val);
  }
}
run().catch(console.error);
