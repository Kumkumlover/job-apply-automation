const fs = require('fs');

async function scrapeDuckDuckGo() {
    const query = 'site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")';
    
    console.log(`Fetching fallback`);
    
    try {
        const fallbackUrl = 'https://lite.duckduckgo.com/lite/';
        const response = await fetch(fallbackUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Referer': 'https://lite.duckduckgo.com/',
            },
            body: new URLSearchParams({ q: query }).toString()
        });
        const html = await response.text();
        fs.writeFileSync('test_ddg_lite_fallback.html', html);
        console.log('Saved to test_ddg_lite_fallback.html. Length: ', html.length);
        
    } catch (e) {
        console.error('Error fetching data:', e);
    }
}

scrapeDuckDuckGo();
