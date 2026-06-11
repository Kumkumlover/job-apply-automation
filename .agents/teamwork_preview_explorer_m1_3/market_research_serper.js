const fs = require("fs");

async function doResearch() {
    console.log("Starting market research via Serper...");
    const dotenv = require("dotenv");
    dotenv.config({ path: ".env.local" });
    dotenv.config();

    const serperKey = process.env.SERPER_API_KEY;
    if (!serperKey) return console.error("No Serper API key found.");

    const queries = [
        "job application automation tools software list",
        "AI job application sender lazyapply alternative",
        "getmoreinterviews.ai competitor vs",
        "automate cold emails for jobs outreach tool"
    ];

    let results = [];

    for (let q of queries) {
        console.log(`Searching for: ${q}`);
        try {
            const res = await fetch("https://google.serper.dev/search", {
                method: "POST",
                headers: {
                    "X-API-KEY": serperKey,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ q: q, num: 10 })
            });
            const data = await res.json();
            results.push({
                query: q,
                items: (data.organic ?? []).map(r => ({ title: r.title, url: r.link, snippet: r.snippet }))
            });
        } catch (e) {
            console.error(`Error searching ${q}:`, e);
        }
    }

    fs.writeFileSync('.agents/teamwork_preview_explorer_m1_3/research_results_serper.json', JSON.stringify(results, null, 2));
    console.log("Done");
}

doResearch();
