const fs = require('fs');

const html = fs.readFileSync('test_ddg7.html', 'utf8');

const regex = /<a[^>]*class="result__a"[^>]*href="\/\/duckduckgo\.com\/l\/\?uddg=([^"&]+)[^>]*>([^<]+)<\/a>/gi;
let match;
while ((match = regex.exec(html)) !== null) {
    const url = decodeURIComponent(match[1]);
    const title = match[2];
    const name = title.split(' - ')[0].split(' | ')[0].trim();
    console.log(name, '->', url);
}
