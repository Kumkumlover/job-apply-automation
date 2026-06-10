const fs = require('fs');
const html = fs.readFileSync('yahoo2.html', 'utf8');
const regex = /https:\/\/([a-z]{2}\.)?linkedin\.com\/in\/[^\"<>]+/g;
const matches = html.match(regex);
if (matches) {
    const unique = [...new Set(matches)];
    console.log(`Found ${unique.length} LinkedIn links.`);
    console.log(unique);
} else {
    console.log('No LinkedIn links found.');
    // Check if we got an error or captcha
    console.log('Includes Yahoo Search?', html.includes('Yahoo Search'));
    console.log('Includes Captcha?', html.toLowerCase().includes('captcha'));
}
