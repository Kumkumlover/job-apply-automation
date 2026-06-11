const ddg = require('duck-duck-scrape');
const fs = require('fs');

async function doResearch() {
    console.log("Starting market research via DuckDuckGo...");
    const queries = [
        "job application automation tools software list",
        "AI job application sender lazyapply",
        "getmoreinterviews.ai alternative competitor",
        "automate cold emails for jobs outreach"
    ];

    let results = [];

    for (let q of queries) {
        console.log(`Searching for: ${q}`);
        try {
            const res = await ddg.search(q, {
                safeSearch: ddg.SafeSearchType.OFF
            });
            results.push({
                query: q,
                items: res.results.slice(0, 10).map(r => ({ title: r.title, url: r.url, snippet: r.description }))
            });
        } catch (e) {
            console.error(`Error searching ${q}:`, e);
        }
    }

    fs.writeFileSync('.agents/teamwork_preview_explorer_m1_3/research_results_ddg.json', JSON.stringify(results, null, 2));
    console.log("Done");
}

doResearch();
