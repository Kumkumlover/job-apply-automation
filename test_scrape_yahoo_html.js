const fs = require('fs');
async function testYahoo() {
    const url = `https://search.yahoo.com/search?p=site:linkedin.com/in+%22Zenskar%22`;
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
        }
    });
    const html = await response.text();
    fs.writeFileSync('yahoo_out.html', html);
    console.log(html.includes('Zenskar'));
}
testYahoo();
