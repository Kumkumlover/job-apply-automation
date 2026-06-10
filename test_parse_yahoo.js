const fs = require('fs');
const html = fs.readFileSync('yahoo_out.html', 'utf8');
const cheerio = require('cheerio');
const $ = cheerio.load(html);
console.log($('body').text().replace(/\s+/g, ' ').substring(0, 1000));
