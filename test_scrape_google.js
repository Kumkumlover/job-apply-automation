const google = require('googlethis');

async function testGoogle() {
    try {
        const options = {
            page: 0,
            safe: false,
            additional_params: {
                hl: 'en'
            }
        };
        const response = await google.search('site:linkedin.com/in "Zenskar" ("Engineering" OR "Product")', options);
        console.log(`Found ${response.results.length} results via googlethis.`);
        console.log(response.results.slice(0, 2));
    } catch (e) {
        console.error(e);
    }
}

testGoogle();
