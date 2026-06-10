const fs = require('fs');

async function main() {
    try {
        const response = await fetch(`https://api.github.com/search/users?q=Zenskar`, {
            headers: {
                'User-Agent': 'Node.js-OSINT-Script'
            }
        });
        const data = await response.json();
        console.log(`Found ${data.total_count} items`);
        console.log(JSON.stringify(data.items.slice(0, 2), null, 2));
    } catch (error) {
        console.error("Error:", error);
    }
}
main();
