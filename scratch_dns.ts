import dns from "dns/promises";

async function run() {
  try {
    const records = await dns.resolveMx("salaryse.com");
    console.log("MX:", records);
  } catch (err) {
    console.error("MX error:", err);
  }
}

run();
