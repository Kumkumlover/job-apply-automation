const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'shared_state.json');
const LOG_FILE = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md';

async function main() {
    let rawdata = fs.readFileSync(STATE_FILE, 'utf8');
    let state = JSON.parse(rawdata);

    let logEntries = '\n### Agent 3: Email Finder & Validator Logs\n';

    for (let companyName of Object.keys(state)) {
        let job = state[companyName];
        let contacts = job.verified_contacts || [];

        console.log(`Processing ${companyName} with ${contacts.length} verified contacts`);

        let response = await fetch('http://localhost:3000/api/outreach', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: "find-emails", contacts: contacts })
        });

        let result = {};
        try {
            result = await response.json();
        } catch(e) {
            console.error(`Error parsing JSON for ${companyName}`, e);
        }
        
        let emailsFound = [];
        if (result && result.emails) {
            emailsFound = result.emails;
        } else if (Array.isArray(result)) {
            emailsFound = result;
        } else if (result && result.results) {
            emailsFound = result.results;
        } else if (result && result.emailResults) {
            emailsFound = result.emailResults;
        } else {
            // fallback if it returns directly an object
            emailsFound = result.emailResults || [];
        }

        job.emails = emailsFound;

        logEntries += `Company: ${companyName}\n`;
        let validEmailsCount = 0;
        
        for (let contact of emailsFound) {
            let emailStr = contact.email || contact.emails || (contact.emails && contact.emails[0]);
            if (emailStr) {
                logEntries += `- ${contact.name}: ${emailStr}\n`;
                validEmailsCount++;
            }
        }
        
        if (validEmailsCount >= 2) {
            logEntries += `Email Verifier: ${validEmailsCount} API-verified emails found for ${companyName}. Two-Verified rule met.\n\n`;
        } else if (validEmailsCount > 0) {
            logEntries += `Email Verifier: Only ${validEmailsCount} API-verified emails for ${companyName}. Two-Verified rule NOT met. Proceeding with caution.\n\n`;
        } else {
            logEntries += `Email Verifier: No verified emails found for ${companyName}. Two-Verified rule NOT met.\n\n`;
        }
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    fs.appendFileSync(LOG_FILE, logEntries);
    console.log("Finished processing all jobs.");
}

main().catch(err => console.error(err));
