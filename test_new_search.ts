import { searchCandidatesAuto } from "./lib/pipeline/search.js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

async function run() {
  const { results } = await searchCandidatesAuto("PayU", "Product Intern Loan management system", "");
  console.log("Results:");
  for (const r of results) {
    console.log("- Title:", r.title);
    console.log("  URL:", r.url);
  }
}

run();
