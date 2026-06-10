const googleIt = require('google-it');

async function testGoogleIt() {
    try {
        const results = await googleIt({ 'query': 'Zenskar linkedin site:linkedin.com/in' });
        console.log(`Found ${results.length} results via google-it.`);
        console.log(results.slice(0, 2));
    } catch (e) {
        console.error(e);
    }
}

testGoogleIt();
