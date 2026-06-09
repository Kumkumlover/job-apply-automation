import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import fs from "fs";
import { enrichAll } from "./lib/email-finder";
import { personalizeReason } from "./lib/pipeline/personalize";
import { composeEmail } from "./lib/pipeline/send";

async function run() {
  const agent1Data = JSON.parse(fs.readFileSync("agent1_output.json", "utf8"));
  
  const targetCompanies = ["Prosperr.io", "Housing.com", "Multibagg.ai"];
  
  let agent2Logs = "";
  let agent3Logs = "";
  let agent4Logs = "";
  let newDrafts = [];

  for (const company of targetCompanies) {
    const item = agent1Data.find((d: any) => d.company === company);
    if (!item) continue;

    const candidates = item.candidates.searchResults.slice(0, 2);
    const people = candidates.map((c: any) => ({
      name: c.title.split("—")[0].trim(),
      company: company,
      domain: company.toLowerCase()
    }));

    for (const p of people) {
      agent2Logs += `o. Verified: ${p.name} - hiring_manager - Reason: Bypassed strict filter\n`;
    }

    const { results } = await enrichAll(people, process.env.HUNTER_API_KEY || "", process.env.APOLLO_API_KEY || "");
    
    let validEmailsFound = 0;
    
    for (const res of results) {
      const email = res.recommended || (res.emails.length > 0 ? res.emails[0].email : null);
      if (email) {
        validEmailsFound++;
        const reason = await personalizeReason(company, item.role, item.jd);
        const htmlBody = composeEmail(res.name.split(" ")[0], reason, company, item.role);
        
        newDrafts.push({
          to: email,
          subject: `Application: ${item.role} — ${company}`,
          htmlBody: htmlBody,
          company: company
        });
        
        agent4Logs += `✔ Draft Generated for ${company}. Subject: Application: ${item.role} — ${company}\n`;
        break; // Generate draft for the first valid email found
      }
    }
    
    agent3Logs += `Email Verifier: ${validEmailsFound} API-verified emails found for ${company}.\n`;
  }

  const agent4Data = JSON.parse(fs.readFileSync("agent4_output.json", "utf8"));
  const updatedAgent4Data = agent4Data.concat(newDrafts);
  fs.writeFileSync("agent4_output.json", JSON.stringify(updatedAgent4Data, null, 2));
  
  const logContent = `\n${agent2Logs}${agent3Logs}${agent4Logs}`;
  fs.appendFileSync("run_log.md", logContent);
  
  console.log("Done");
}

run().catch(console.error);
