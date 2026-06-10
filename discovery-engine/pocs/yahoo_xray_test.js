const cheerio = require('cheerio');

async function scrapeYahoo(company) {
    const query = `site:linkedin.com/in ${company}`;
    const url = `https://search.yahoo.com/search?p=${encodeURIComponent(query).replace(/%20/g, '+')}`;
    
    console.log(`Fetching ${url} using fetch() API...`);
    
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
                results.push({ name: cleanTitle, url: link });
            }
        });
        
        if (results.length === 0) {
            console.warn("No results found or blocked by Captcha.");
            require('fs').writeFileSync('pocs/yahoo_debug.html', html);
        } else {
            console.log(`Found ${results.length} results.`);
            results.forEach(r => console.log(`Name: ${r.name}\nURL: ${r.url}\n`));
            const outputStr = results.map(r => `Name: ${r.name}\nURL: ${r.url}`).join('\n\n');
            require('fs').writeFileSync('pocs/output_yahoo.txt', outputStr);
            console.log('Saved results to pocs/output_yahoo.txt');
        }
        
        return results;
    } catch (e) {
        console.error('Error fetching or parsing data:', e);
        return [];
    }
}

scrapeYahoo("Cashify");
