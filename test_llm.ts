import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { askJSON } from "./lib/llm";

async function run() {
  try {
    const res = await askJSON('Return ["idfcfirstbank.com"] as JSON array');
    console.log(res);
  } catch (err) {
    console.error("FAILED:", err);
  }
}
run();
