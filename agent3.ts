import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import fs from "fs";
import { enrichAll, PersonInputType } from "./lib/email-finder.js";

async function main() {
  const agent2Output = JSON.parse(fs.readFileSync("agent2_output.json", "utf-8"));

  const allPeople: PersonInputType[] = [];
  const logEntries: string[] = [];
  
  for (const job of agent2Output) {
    for (const candidate of job.verifiedCandidates || []) {
      allPeople.push({
        name: candidate.name,
        company: job.company,
        domain: "" 
      });
    }
  }

  console.log(`Starting enrichment for ${allPeople.length} candidates...`);
  
  const hunterKey = process.env.HUNTER_API_KEY || "";
  const apolloKey = process.env.APOLLO_API_KEY || "";

  const enrichResult = await enrichAll(allPeople, hunterKey, apolloKey);
  const resultsByPerson = new Map(enrichResult.results.map(r => [`${r.name}-${r.company}`, r]));

  const finalOutput = [];

  for (const job of agent2Output) {
    const jobCandidates = job.verifiedCandidates || [];
    
    let apiVerifiedCount = 0;
    const enrichedCandidates = [];

    for (const candidate of jobCandidates) {
      const result = resultsByPerson.get(`${candidate.name}-${job.company}`);
      if (result) {
        enrichedCandidates.push({
          ...candidate,
          emails: result.emails,
          recommended_email: result.recommended
        });
        
        const apiVerifiedEmails = result.emails.filter(e => e.type === "verified" && (e.source === "Hunter.io" || e.source === "Apollo.io"));
        if (apiVerifiedEmails.length > 0) {
          apiVerifiedCount += apiVerifiedEmails.length;
        }
      } else {
        enrichedCandidates.push(candidate);
      }
    }

    finalOutput.push({
      company: job.company,
      role: job.role,
      jd: job.jd,
      verifiedCandidates: enrichedCandidates
    });

    logEntries.push(`### Agent 3 Logs`);
    logEntries.push(`Company: ${job.company}`);
    for (const ec of enrichedCandidates) {
       logEntries.push(`- ${ec.name}: ${ec.recommended_email || 'No email found'}`);
    }
    
    if (jobCandidates.length > 0) {
      if (apiVerifiedCount < 2) {
        logEntries.push(`Email Verifier: Only ${apiVerifiedCount} API-verified emails for ${job.company}. Proceeding with caution.`);
      } else {
        logEntries.push(`Email Verifier: ${apiVerifiedCount} API-verified emails found for ${job.company}.`);
      }
    } else {
      logEntries.push(`Email Verifier: No verified candidates found for ${job.company}.`);
    }
    logEntries.push("");
  }

  fs.writeFileSync("agent3_output.json", JSON.stringify(finalOutput, null, 2), "utf-8");
  
  const logPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md";
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, "\n" + logEntries.join("\n") + "\n", "utf-8");
  } else {
    console.error(`Log path does not exist: ${logPath}`);
    // Create it if it doesn't exist
    const dir = require("path").dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(logPath, "\n" + logEntries.join("\n") + "\n", "utf-8");
  }

  console.log("Agent 3 finished processing.");
}

main().catch(console.error);
