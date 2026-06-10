const fs = require('fs');

async function testFetch() {
    const query = 'site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")';
    const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query).replace(/%20/g, '+')}`;
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            }
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg12.html', html);
        console.log('Saved to test_ddg12.html. Length: ', html.length);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
