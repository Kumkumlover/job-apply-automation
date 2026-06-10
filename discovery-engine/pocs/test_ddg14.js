const fs = require('fs');

async function testFetch() {
    const url = 'https://html.duckduckgo.com/html/?q=site:linkedin.com/in+"Zenskar"+("Engineering"+OR+"Product")';
    
    console.log(`Fetching ${url}`);
    
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                'Accept': '*/*',
                'Accept-Language': undefined,
                'Referer': undefined
            }
        });
        
        const html = await response.text();
        fs.writeFileSync('test_ddg14.html', html);
        console.log('Saved to test_ddg14.html. Length: ', html.length);
        if (html.includes('Nitya')) {
            console.log('SUCCESS!');
        } else {
            console.log('FAILED.');
        }
    } catch (e) {
        console.error(e);
    }
}

testFetch();
