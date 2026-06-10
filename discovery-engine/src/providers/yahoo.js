const cheerio = require('cheerio');

async function discover(company, keywords = "") {
    const query = `site:linkedin.com/in ${company} ${keywords}`.trim();
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query).replace(/%20/g, '+')}`;
    
    try {
        const response = await fetch(url);
        
        const html = await response.text();
        const $ = cheerio.load(html);
        const results = [];
        
        $('div.algo-sr').each((i, el) => {
            const title = $(el).find('h3 a').text() || $(el).find('h3').text();
            let link = $(el).find('h3 a').attr('href') || $(el).find('a').attr('href');
            
            if (title && link && link.includes('linkedin.com/in/')) {
                const cleanTitle = title.split(' - ')[0].split(' | ')[0].trim();
                if (link.includes('RU=')) {
                    const ruMatch = link.match(/RU=([^/]+)\//);
                    if (ruMatch) {
                        link = decodeURIComponent(ruMatch[1]);
                    }
                }
                results.push({ 
                    name: cleanTitle, 
                    url: link,
                    source: 'Yahoo',
                    title: title
                });
            }
        });
        
        return results;
    } catch (e) {
        console.error('Error fetching or parsing data from Yahoo:', e);
        return [];
    }
}

module.exports = { discover };
