import dotenv from "dotenv"; dotenv.config({ path: ".env.local" }); dotenv.config();
import fs from "fs";
import { personalizeReason } from "./lib/pipeline/personalize";
import { composeEmail } from "./lib/pipeline/send";

// Helper to check if an email is valid
function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const parts = email.split("@");
  return parts.length === 2 && parts[1].trim().length > 0;
}

async function main() {
  const agent3Output = JSON.parse(fs.readFileSync("agent3_output.json", "utf-8"));
  const drafts: any[] = [];
  const logEntries: string[] = [];
  
  for (const job of agent3Output) {
    const company = job.company;
    const role = job.role;
    const jd = job.jd;
    
    let bestCandidate = null;
    let bestEmail = null;
    
    for (const candidate of job.verifiedCandidates || []) {
      const email = candidate.recommended_email || (candidate.emails && candidate.emails.length > 0 ? candidate.emails[0].email : null);
      if (isValidEmail(email)) {
        bestCandidate = candidate;
        bestEmail = email;
        break;
      }
    }
    
    if (bestCandidate && bestEmail) {
      // found a valid email
      const reason = await personalizeReason(company, role, jd, "");
      const htmlBody = composeEmail(bestCandidate.name, reason, company, role, bestCandidate.profile_url || "");
      const subject = `Application: ${role} — ${company}`;
      
      drafts.push({
        to: bestEmail,
        subject: subject,
        htmlBody: htmlBody,
        company: company
      });
      
      logEntries.push(`✔ Draft Generated for ${company}. Subject: ${subject}`);
    } else {
      logEntries.push(`❌ Draft Generator: No valid email found for ${company}, skipping.`);
    }
  }
  
  fs.writeFileSync("agent4_output.json", JSON.stringify(drafts, null, 2), "utf-8");
  
  const logPath = "C:\\Users\\Lenovo\\.gemini\\antigravity\\brain\\f7c2a5f2-3e51-427b-9e30-21910d0721c6\\run_log.md";
  let logContent = "";
  for (const entry of logEntries) {
    logContent += `### Agent 4 Logs\n${entry}\n`;
  }
  
  if (fs.existsSync(logPath)) {
    fs.appendFileSync(logPath, logContent, "utf-8");
  } else {
    const dir = require("path").dirname(logPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(logPath, logContent, "utf-8");
  }
  
  console.log("Agent 4 finished processing.");
}

main().catch(console.error);
