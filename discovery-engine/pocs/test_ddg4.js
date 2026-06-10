const fs = require('fs');

async function testFetch() {
    const query = 'site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")';
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'curl/7.81.0',
                'Accept': '*/*',
            }
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg4.html', html);
        console.log('Saved to test_ddg4.html. Length: ', html.length);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
