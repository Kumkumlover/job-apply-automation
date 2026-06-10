import fs from 'fs';

const data = JSON.parse(fs.readFileSync('agent3_results_patched.json', 'utf8'));

for (const job of data) {
  if (job.jobId === 5) {
    job.company = 'Onsurity';
  }
}

fs.writeFileSync('agent3_results_patched.json', JSON.stringify(data, null, 2));
console.log('Fixed company name in agent3_results_patched.json');
