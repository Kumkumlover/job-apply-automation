const fs = require('fs');
const html = fs.readFileSync('yahoo2.html', 'utf8');
const cheerio = require('cheerio');
const $ = cheerio.load(html);

const results = [];
$('div.algo-sr').each((i, el) => {
    console.log("Found algo-sr");
});
$('div').each((i, el) => {
    const classAttr = $(el).attr('class');
    if (classAttr && classAttr.includes('algo')) {
        console.log("Found class:", classAttr);
        const title = $(el).find('h3 a').text() || $(el).find('h3').text();
        const link = $(el).find('h3 a').attr('href') || $(el).find('a').attr('href');
        console.log("Title:", title, "Link:", link);
    }
});
