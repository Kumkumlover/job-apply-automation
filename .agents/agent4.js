const fs = require('fs');
const http = require('http');

function postData(url, data) {
  return new Promise((resolve, reject) => {
    const dataString = JSON.stringify(data);
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(dataString)
      }
    };
    
    const req = http.request(url, options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(body));
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          reject(new Error(`Status: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(dataString);
    req.end();
  });
}

async function main() {
  const statePath = 'C:\\Users\\Lenovo\\Downloads\\n8n-data-20260510T162446Z-3-001\\n8n-data\\job-apply-automation\\.agents\\shared_state.json';
  const logPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md';
  
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  let totalDraftsGenerated = 0;
  let logEntries = [];

  for (const [companyName, job] of Object.entries(state)) {
    job.drafts = job.drafts || [];
    let draftsForCompany = 0;

    if (!job.emails || !Array.isArray(job.emails)) {
      logEntries.push(`Generated 0 customized email drafts for ${companyName}.`);
      continue;
    }

    for (const emailContact of job.emails) {
      const emailAddress = emailContact.recommended;
      if (!emailAddress) continue; // Skip if no recommended email

      // find profile_url
      let profileUrl = '';
      if (job.verified_contacts) {
        const vc = job.verified_contacts.find(c => c.name === emailContact.name);
        if (vc && vc.profile_url) profileUrl = vc.profile_url;
      }
      if (!profileUrl && job.rankedCandidates) {
        const rc = job.rankedCandidates.find(c => c.name === emailContact.name);
        if (rc && rc.profile_url) profileUrl = rc.profile_url;
      }

      console.log(`Generating draft for ${emailContact.name} at ${companyName}...`);

      try {
        const data = await postData('http://localhost:3000/api/outreach', {
          action: 'generate-email',
          recipientName: emailContact.name,
          company: job.company,
          jobTitle: job.role,
          jd: job.jd,
          profileUrl: profileUrl
        });
        
        job.drafts.push({
          name: emailContact.name,
          email: emailAddress,
          subject: data.subject,
          htmlBody: data.htmlBody
        });
        
        draftsForCompany++;
        totalDraftsGenerated++;
      } catch (err) {
        console.error(`Error generating email for ${emailContact.name}: ${err.message}`);
      }
    }

    logEntries.push(`Generated ${draftsForCompany} customized email drafts for ${companyName}.`);
  }

  fs.writeFileSync(statePath, JSON.stringify(state, null, 2), 'utf8');
  console.log('State saved successfully.');

  if (logEntries.length > 0) {
    fs.appendFileSync(logPath, '\n' + logEntries.join('\n') + '\n', 'utf8');
    console.log('Run log updated successfully.');
  }
}

main().catch(err => console.error('Script failed:', err));
