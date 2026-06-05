import google from "googlethis";

async function main() {
  try {
    const options = {
      page: 0, 
      safe: false, // Safe Search
      additional_params: { 
        hl: 'en' 
      }
    };
    const response = await google.search('site:linkedin.com/in "SalarySe" ("product manager" OR "platform" OR "cards" OR "human resources")', options);
    console.log(JSON.stringify(response.results, null, 2));
  } catch (err) {
    console.error("GoogleThis Error:", err);
  }
}
main();
