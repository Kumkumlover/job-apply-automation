const fs = require('fs');
const serperKey = process.env.SERPER_API_KEY || "cf2dbb699c1f852bebad72a0700160e86b0fc8c9"; 

async function searchWeb(query) {
    try {
        const res = await fetch("https://google.serper.dev/search", {
            method: "POST",
            headers: { "X-API-KEY": serperKey, "Content-Type": "application/json" },
            body: JSON.stringify({ q: query, num: 10 }) 
        });
        const data = await res.json();
        return (data.organic || []).map(r => ({ title: r.title, snippet: r.snippet, link: r.link }));
    } catch (e) {
        console.error(e);
        return [];
    }
}

async function run() {
    const queries = [
        'ai automated job application tool review features "getmoreinterviews.ai"',
        'job search automation tools ai platforms features competitors',
        'lazyapply vs sonara vs massive job application automation',
        'top features missing in job application automation tools',
        'third party integrations for job apply automation platform',
        '"getmoreinterviews.ai" alternative feature gap'
    ];
    
    let allResults = {};
    for (const q of queries) {
        console.log(`Searching for: ${q}`);
        allResults[q] = await searchWeb(q);
    }
    
    fs.writeFileSync('.agents/teamwork_preview_explorer_m1_1/search_results.json', JSON.stringify(allResults, null, 2));
    console.log('Done!');
}

run();
