import { search } from "duck-duck-scrape";

async function main() {
  try {
    const results = await search('site:linkedin.com/in "SalarySe" ("product manager" OR "platform" OR "cards" OR "human resources")');
    console.log(JSON.stringify(results.results, null, 2));
  } catch (err) {
    console.error("DDG Search Error:", err);
  }
}
main();
