const fs = require('fs');

async function testFetch() {
    console.log(`Fetching main page to get vqd...`);
    try {
        const res = await fetch('https://duckduckgo.com/', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        const text = await res.text();
        const vqdMatch = text.match(/vqd=["']([^"']+)["']/);
        if (vqdMatch) {
            console.log('Found vqd:', vqdMatch[1]);
        } else {
            console.log('No vqd found in main page.');
            console.log(text.substring(0, 500));
        }
    } catch (e) {
        console.error(e);
    }
}

testFetch();
