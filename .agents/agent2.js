const fs = require('fs');

const stateFile = 'C:/Users/Lenovo/Downloads/n8n-data-20260510T162446Z-3-001/n8n-data/job-apply-automation/.agents/shared_state.json';
const logFile = 'C:/Users/Lenovo/.gemini/antigravity/brain/f7c2a5f2-3e51-427b-9e30-21910d0721c6/run_log.md';

let rawData = fs.readFileSync(stateFile, 'utf8');
let state = JSON.parse(rawData);
let logEntries = [];

function verifyContact(contact, company) {
    if (contact.current_title && /unverified|llm-generated/i.test(contact.current_title)) return false;
    if (contact.current_title && /intern|student/i.test(contact.current_title)) return false;
    
    // Check if the contact belongs to a relevant role
    const validRoles = ['hiring_manager', 'recruiter_hr', 'team_lead'];
    if (!validRoles.includes(contact.role_type)) return false;
    
    return true;
}

for (let key in state) {
    let job = state[key];
    let verified_contacts = [];
    
    // Verify JD Contacts
    if (job.jdContacts && job.jdContacts.length > 0) {
        for (let contact of job.jdContacts) {
            verified_contacts.push(contact);
            logEntries.push(`- Verified ${contact.name || 'Unknown'} - JD Contact for ${job.company}`);
        }
    }
    
    // Verify Ranked Candidates
    if (job.rankedCandidates && job.rankedCandidates.length > 0) {
        for (let contact of job.rankedCandidates) {
            if (verifyContact(contact, job.company)) {
                verified_contacts.push(contact);
                let roleDisp = contact.role_type || 'Candidate';
                if (contact.current_title) {
                    // Extract a clean version of the title
                    roleDisp = contact.current_title.split('.')[0] || roleDisp;
                }
                logEntries.push(`- Verified ${contact.name} - ${contact.role_type} at ${job.company}`);
            } else {
                logEntries.push(`- Rejected ${contact.name} - Did not meet verification criteria for ${job.company}`);
            }
        }
    }
    
    job.verified_contacts = verified_contacts;
}

fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));

const logContent = `\n### Agent 2: Contact Verification Log\n` + logEntries.join('\n') + `\n`;
fs.appendFileSync(logFile, logContent);

console.log('Verification complete. State updated and log appended.');
