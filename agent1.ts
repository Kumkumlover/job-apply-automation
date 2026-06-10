import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { searchCandidatesAuto, extractContactsFromJD } from './lib/pipeline/search';

dotenv.config({ path: '.env.local' });

function parseOpenings(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split('\n');
  const openings: {company: string, role: string, url: string, jd: string}[] = [];
  let currentOpening: {company: string, role: string, url: string, jd: string} | null = null;
  let jdLines: string[] = [];

  for (const line of lines) {
    const match = line.match(/^\d+\.\s*(.+?),\s*(.+?),\s*(https?:\/\/.+)/);
    if (match) {
      if (currentOpening) {
        currentOpening.jd = jdLines.join('\n').trim();
        openings.push(currentOpening);
      }
      currentOpening = {
        company: match[1].trim(),
        role: match[2].trim(),
        url: match[3].trim(),
        jd: ""
      };
      jdLines = [];
    } else if (currentOpening) {
      jdLines.push(line);
    }
  }
  if (currentOpening) {
    currentOpening.jd = jdLines.join('\n').trim();
    openings.push(currentOpening);
  }
  return openings;
}

async function run() {
  const openingsFilePath = path.join(__dirname, '../Opening Details.txt');
  const openings = parseOpenings(openingsFilePath);
  console.log(`Found ${openings.length} openings.`);

  const finalOutput: any[] = [];
  let logOutput = "";

  for (const job of openings) {
    console.log(`Processing Job: ${job.company} (${job.role})`);
    
    // Extract contacts from JD directly
    const jdContacts = extractContactsFromJD(job.jd);
    
    // Search candidates using Auto function
    const { results } = await searchCandidatesAuto(job.company, job.role, job.jd);
    
    const candidates = {
      jdContacts,
      searchResults: results
    };
    
    const totalCandidates = jdContacts.length + results.length;
    
    finalOutput.push({
      company: job.company,
      role: job.role,
      jd: job.jd,
      candidates
    });

    logOutput += `--- Job: ${job.company} (${job.role}) ---\n`;
    logOutput += `### Agent 1 Logs\n`;
    logOutput += `Found ${totalCandidates} potential candidates.\n`;
  }

  // Save to agent1_output.json
  const outputPath = path.join(__dirname, 'agent1_output.json');
  fs.writeFileSync(outputPath, JSON.stringify(finalOutput, null, 2), 'utf-8');
  console.log(`Saved output to ${outputPath}`);

  // Append to run_log.md
  const logPath = 'C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md';
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, '\n' + logOutput, 'utf-8');
  } else {
    // If it doesn't exist, create it or make directories
    fs.mkdirSync(path.dirname(logPath), { recursive: true });
    fs.writeFileSync(logPath, logOutput, 'utf-8');
  }
  console.log('Appended logs to run_log.md');
}

run().catch(err => {
  console.error('Error in agent1:', err);
});
