const cheerio = require('cheerio');

async function scrapeYahoo() {
    try {
        const query = 'site:linkedin.com/in "Zenskar"';
        const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query)}`;
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
            }
        });
        const html = await response.text();
        const $ = cheerio.load(html);
        const results = [];
        $('.algo-sr').each((i, el) => {
            const title = $(el).find('h3.title').text().trim();
            const link = $(el).find('h3.title a').attr('href');
            if (title && link) {
                results.push({ title, link });
            }
        });
        console.log(`Found ${results.length} results via Yahoo.`);
        console.log(results.slice(0, 2));
    } catch (e) {
        console.error(e);
    }
}

scrapeYahoo();
