const google = require('googlethis');
const fs = require('fs');

async function doResearch() {
    console.log("Starting market research via Google Search...");
    const queries = [
        "job application automation tools",
        "AI job application sender",
        "getmoreinterviews.ai competitor",
        "automate cold emails for jobs"
    ];

    let results = [];

    for (let q of queries) {
        console.log(`Searching for: ${q}`);
        try {
            const res = await google.search(q, {
                page: 0,
                safe: false,
                additional_params: { hl: 'en' }
            });
            results.push({
                query: q,
                items: res.results.map(r => ({ title: r.title, url: r.url, snippet: r.description }))
            });
        } catch (e) {
            console.error(`Error searching ${q}:`, e);
        }
    }

    fs.writeFileSync('.agents/teamwork_preview_explorer_m1_3/research_results.json', JSON.stringify(results, null, 2));
    console.log("Done");
}

doResearch();
