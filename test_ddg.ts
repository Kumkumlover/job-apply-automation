import { searchDuckDuckGo } from "./lib/pipeline/duckduckgo";

async function main() {
  const res = await searchDuckDuckGo("SalarySe", "Product");
  console.log(JSON.stringify(res, null, 2));
}

main().catch(console.error);
