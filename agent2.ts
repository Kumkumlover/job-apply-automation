import * as fs from 'fs';
import { rankCandidates } from './lib/pipeline/rank';

async function run() {
  const data = JSON.parse(fs.readFileSync('agent1_output.json', 'utf8'));
  const output = [];
  const logLines = [];

  for (const job of data) {
    const { company, role, jd, candidates } = job;
    const searchResults = candidates.searchResults || [];
    
    // Map URL to link just in case rank.ts uses r.link, though TypeScript would complain.
    // Wait, rank.ts does `r.link`. The interface `SearchResult` doesn't have `link` but maybe it's any.
    // Let's add link to the objects before passing.
    const mappedResults = searchResults.map((r: any) => ({
      ...r,
      link: r.url
    }));

    const verified = await rankCandidates(mappedResults, company, role, jd);
    
    output.push({
      company,
      role,
      jd,
      verifiedCandidates: verified
    });

    logLines.push(`### Agent 2 Logs`);
    for (const v of verified) {
      logLines.push(`o. Verified: ${v.name} - ${v.current_title} - Reason: ${v.reason}`);
    }
  }

  fs.writeFileSync('agent2_output.json', JSON.stringify(output, null, 2));

  const logPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md';
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, '\n' + logLines.join('\n') + '\n');
  } else {
    fs.writeFileSync(logPath, logLines.join('\n') + '\n');
  }
}

run().catch(console.error);
