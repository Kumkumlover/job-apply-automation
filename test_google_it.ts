import googleIt from "google-it";

async function main() {
  try {
    const results = await googleIt({ query: 'site:linkedin.com/in "SalarySe" ("product manager" OR "platform" OR "cards" OR "human resources")' });
    console.log(JSON.stringify(results, null, 2));
  } catch(e) {
    console.error(e);
  }
}
main();
