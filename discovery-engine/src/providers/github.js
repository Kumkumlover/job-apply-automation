async function discover(company, keywords = "") {
    try {
        console.log(`[GitHub] Searching for employees of ${company}...`);
        
        const q = `${company} ${keywords}`.trim();
        const response = await fetch(`https://api.github.com/search/users?q=${encodeURIComponent(q)}+type:user`, {
            headers: {
                'User-Agent': 'Node.js-OSINT-Script'
            }
        });

        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const users = data.items || [];
        
        console.log(`[GitHub] Found ${users.length} users. Fetching details...`);
        
        const results = [];

        for (const user of users) {
            const userResponse = await fetch(user.url, {
                headers: {
                    'User-Agent': 'Node.js-OSINT-Script'
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                
                results.push({
                    name: userData.name || userData.login,
                    url: userData.html_url,
                    source: 'GitHub',
                    bio: userData.bio || '',
                    login: userData.login
                });
            } else {
                console.warn(`[GitHub] Failed to fetch details for ${user.login}: ${userResponse.status}`);
            }
            // Add a small delay to avoid rate limits
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return results;
    } catch (error) {
        console.error("[GitHub] Error occurred:", error.message);
        throw error;
    }
}

module.exports = { discover };
