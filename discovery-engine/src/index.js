const fs = require('fs');
const path = require('path');
const { dedupe } = require('./utils/dedupe');

async function main() {
    const company = process.argv[2];
    const keywords = process.argv[3] || "";
    
    if (!company) {
        console.error("Usage: node src/index.js <CompanyName> [\"keywords\"]");
        process.exit(1);
    }
    
    console.log(`Starting discovery for: ${company} (Keywords: ${keywords})`);
    
    // We load providers inside async functions so that if a module is missing, 
    // it results in a rejected promise rather than a synchronous crash.
    const runProvider = async (providerPath, companyName, keywordStr) => {
        const provider = require(providerPath);
        return provider.discover(companyName, keywordStr);
    };

    const results = await Promise.allSettled([
        runProvider('./providers/yahoo', company, keywords),
        runProvider('./providers/github', company, keywords)
    ]);
    
    let allEmployees = [];
    const providerNames = ['Yahoo', 'GitHub'];
    
    results.forEach((res, index) => {
        const providerName = providerNames[index];
        if (res.status === 'fulfilled') {
            const data = res.value || [];
            console.log(`[${providerName}] Found ${data.length} records.`);
            allEmployees = allEmployees.concat(data);
        } else {
            console.error(`[${providerName}] Failed:`, res.reason.message || res.reason);
        }
    });
    
    const dedupedEmployees = dedupe(allEmployees);
    
    console.log(`\nSummary:`);
    console.log(`Total records found: ${allEmployees.length}`);
    console.log(`Unique records after deduplication: ${dedupedEmployees.length}`);
    
    const outputPath = path.resolve(process.cwd(), 'output.json');
    fs.writeFileSync(outputPath, JSON.stringify(dedupedEmployees, null, 2), 'utf-8');
    console.log(`Results written to ${outputPath}`);
}

main().catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
});
