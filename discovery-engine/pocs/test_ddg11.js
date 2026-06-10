const fs = require('fs');

async function testFetch() {
    const url = 'https://lite.duckduckgo.com/lite/';
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Lynx/2.8.9rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/3.6.13',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            },
            body: new URLSearchParams({ q: 'site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")' }).toString()
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg11.html', html);
        console.log('Saved to test_ddg11.html. Length: ', html.length);
    } catch (e) {
        console.error(e);
    }
}

testFetch();
