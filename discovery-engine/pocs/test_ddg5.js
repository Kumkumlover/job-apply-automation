const fs = require('fs');

async function testFetch() {
    const query = 'site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")';
    const url = 'https://html.duckduckgo.com/html/';
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            },
            body: new URLSearchParams({
                q: query
            }).toString()
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg5.html', html);
        console.log('Saved to test_ddg5.html. Length: ', html.length);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
