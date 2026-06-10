const fs = require('fs');
const path = require('path');

const COMPANY = process.argv[2] || "Cashify";
const OUTPUT_FILE = path.join(__dirname, 'output_gh.txt');

async function main() {
    try {
        console.log(`Searching GitHub for employees of ${COMPANY}...`);
        
        const response = await fetch(`https://api.github.com/search/users?q=${COMPANY}+type:user`, {
            headers: {
                'User-Agent': 'Node.js-OSINT-Script'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const users = data.items || [];
        
        console.log(`Found ${users.length} users. Fetching details...`);
        
        let outputText = `GitHub Employees for ${COMPANY}:\n=================================\n\n`;

        for (const user of users) {
            console.log(`Fetching details for ${user.login}...`);
            const userResponse = await fetch(user.url, {
                headers: {
                    'User-Agent': 'Node.js-OSINT-Script'
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                outputText += `Name: ${userData.name || 'N/A'}\n`;
                outputText += `Login: ${userData.login}\n`;
                outputText += `Company: ${userData.company || 'N/A'}\n`;
                outputText += `Location: ${userData.location || 'N/A'}\n`;
                outputText += `Email: ${userData.email || 'N/A'}\n`;
                outputText += `Blog/Website: ${userData.blog || 'N/A'}\n`;
                outputText += `Bio: ${userData.bio || 'N/A'}\n`;
                outputText += `GitHub URL: ${userData.html_url}\n`;
                outputText += `---------------------------------\n`;
            } else {
                console.warn(`Failed to fetch details for ${user.login}: ${userResponse.status}`);
            }
            // Add a small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        fs.writeFileSync(OUTPUT_FILE, outputText);
        console.log(`Successfully wrote data to ${OUTPUT_FILE}`);
        
    } catch (error) {
        console.error("Error occurred:", error.message);
        process.exit(1);
    }
}

main();
