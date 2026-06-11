const google = require('googlethis');

async function searchWeb() {
    console.log("Searching for competitors and target personas...");
    
    try {
        const options = {
            page: 0,
            safe: false,
            additional_params: {
                hl: 'en'
            }
        };

        const queries = [
            "getmoreinterviews.ai features pricing job search",
            "job search automation tool \"cold email\" outreach finding emails",
            "competitors to getmoreinterviews.ai",
            "target persona for job search automation tools"
        ];

        for (const query of queries) {
            console.log(`\n--- Searching: ${query} ---`);
            const response = await google.search(query, options);
            console.log(`Found ${response.results.length} results.`);
            response.results.slice(0, 5).forEach(res => {
                console.log(`Title: ${res.title}`);
                console.log(`Link: ${res.url}`);
                console.log(`Snippet: ${res.description}`);
                console.log('---');
            });
        }
    } catch (e) {
        console.error(e);
    }
}

searchWeb();
