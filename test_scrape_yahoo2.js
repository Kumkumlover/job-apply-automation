const cheerio = require('cheerio');
const fetch = require('node-fetch');

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
        
        // Yahoo search results usually live under div.algo or li.algo
        $('.algo').each((i, el) => {
            const title = $(el).find('h3 a').text() || $(el).find('h3').text() || $(el).find('.title a').text();
            let link = $(el).find('h3 a').attr('href') || $(el).find('.title a').attr('href');
            
            // Extract the actual URL from Yahoo's tracking URL if needed
            if (link && link.includes('RU=')) {
                const ruMatch = link.match(/RU=([^/]+)\//);
                if (ruMatch) {
                    link = decodeURIComponent(ruMatch[1]);
                }
            }
            
            if (title && link) {
                results.push({ title, link });
            }
        });
        
        console.log(`Found ${results.length} results via Yahoo.`);
        console.log(results);
    } catch (e) {
        console.error(e);
    }
}

scrapeYahoo();
