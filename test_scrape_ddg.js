const ddg = require('duck-duck-scrape');

async function testDDG() {
    try {
        const results = await ddg.search('site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")');
        console.log(`Found ${results.results.length} results via duck-duck-scrape.`);
        console.log(results.results.slice(0, 2));
    } catch (e) {
        console.error(e);
    }
}

testDDG();
