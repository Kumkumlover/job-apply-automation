const fs = require('fs');

async function testFetch() {
    const url = 'https://html.duckduckgo.com/html/?q=site:linkedin.com/in+"Zenskar"+("Engineering"+OR+"Product")';
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
            }
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg8.html', html);
        console.log('Saved to test_ddg8.html. Length: ', html.length);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
