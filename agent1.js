const fs = require('fs');
const path = require('path');

const openingsPath = path.join(__dirname, '.agents', 'openings.json');
const statePath = path.join(__dirname, '.agents', 'shared_state.json');
const logPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md';

async function main() {
    let openings = [];
    if (fs.existsSync(openingsPath)) {
        openings = JSON.parse(fs.readFileSync(openingsPath, 'utf8'));
    } else {
        console.error("openings.json not found at", openingsPath);
        return;
    }

    let sharedState = {};
    if (fs.existsSync(statePath)) {
        try {
            sharedState = JSON.parse(fs.readFileSync(statePath, 'utf8'));
        } catch (e) {
            console.warn("Could not parse shared_state.json, initializing empty state.");
        }
    }

    for (let i = 0; i < openings.length; i++) {
        const opening = openings[i];
        const { company, role, jd } = opening;
        
        console.log(`Processing: ${company} - ${role}`);
        
        try {
            const response = await fetch('http://localhost:3000/api/outreach', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'find-contacts',
                    company: company,
                    jobTitle: role,
                    jd: jd
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            const candidates = data.rankedCandidates || [];
            const jdContacts = data.jdContacts || [];
            
            const jobKey = company;
            sharedState[jobKey] = {
                company,
                role,
                jd,
                rankedCandidates: candidates,
                jdContacts: jdContacts
            };
            
            fs.writeFileSync(statePath, JSON.stringify(sharedState, null, 2));
            
            const logDir = path.dirname(logPath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const logEntry = `\n- Job: ${company} (${role}) -> Found ${candidates.length} ranked candidates and ${jdContacts.length} JD contacts.`;
            fs.appendFileSync(logPath, logEntry);
            
            console.log(`Success: ${company} -> Found ${candidates.length} candidates`);
        } catch (error) {
            console.error(`Failed to process ${company}:`, error);
            const logDir = path.dirname(logPath);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            const logEntry = `\n- Job: ${company} (${role}) -> Error occurred: ${error.message}`;
            fs.appendFileSync(logPath, logEntry);
        }
    }
    
    console.log("Done processing all openings.");
}

main();
