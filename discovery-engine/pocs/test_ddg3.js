const fs = require('fs');

async function testFetch() {
    const query = 'site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")';
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; rv:109.0) Gecko/20100101 Firefox/115.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none',
                'Sec-Fetch-User': '?1',
            }
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg3.html', html);
        console.log('Saved to test_ddg3.html. Length: ', html.length);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
