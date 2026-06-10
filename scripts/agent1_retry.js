import fs from 'fs';

async function run() {
  const jobs = JSON.parse(fs.readFileSync('jobs.json', 'utf8'));
  let results = [];
  if (fs.existsSync('agent1_results.json')) {
    results = JSON.parse(fs.readFileSync('agent1_results.json', 'utf8'));
  }
  
  for (const job of jobs) {
    if (results.some(r => r.jobId === job.id)) {
      console.log(`Skipping Job ${job.id} (already done)`);
      continue;
    }
    console.log(`Processing Job ${job.id}: ${job.company} - ${job.role}`);
    
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const res = await fetch('http://localhost:3000/api/outreach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'find-contacts',
          company: job.company,
          jobTitle: job.role,
          jd: job.jd
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);
      
      const data = await res.json();
      if (data.error) {
        console.error(`Error for ${job.company}: ${data.error}`);
      }
      results.push({
        jobId: job.id,
        company: job.company,
        role: job.role,
        candidates: data.rankedCandidates || []
      });
      
      fs.writeFileSync('agent1_results.json', JSON.stringify(results, null, 2));
      console.log(`Saved result for Job ${job.id}`);
    } catch (e) {
      console.error(`Fetch failed for Job ${job.id}:`, e.message);
      // We will skip this one and keep going, but log it as empty so we don't infinite loop
      results.push({
        jobId: job.id,
        company: job.company,
        role: job.role,
        candidates: []
      });
      fs.writeFileSync('agent1_results.json', JSON.stringify(results, null, 2));
    }
  }
  console.log('agent1_retry.js complete.');
}

run().catch(console.error);
