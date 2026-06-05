import { validateEmail } from "../lib/pipeline/validate";
import { resolveMxSafe } from "../lib/dns-utils";

async function run() {
  console.log("Testing MX for payufin.com...");
  const mx = await resolveMxSafe("payufin.com");
  console.log("MX Records:", mx);

  console.log("\nTesting full validation...");
  const val = await validateEmail("shantanu.chaudhary@payufin.com");
  console.log("Validation Result:", val);
}

run();
