import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { searchCandidates } from "./lib/pipeline/search";

async function main() {
  try {
    const res = await searchCandidates("SalarySe", "Associate Product Manager - Platform and Card");
    console.log(JSON.stringify(res, null, 2));
  } catch(e) {
    console.error("Error calling CSE:", e);
  }
}

main().catch(console.error);
