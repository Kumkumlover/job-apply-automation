import { enrichAll } from "./lib/email-finder";
import { prisma } from "./lib/db";

async function run() {
  const people = [
    { name: "Abhilasha Jain", company: "IDFC FIRST Bank", domain: "" },
    { name: "Kishor Sonar", company: "IDFC FIRST Bank", domain: "" },
    { name: "Nikita Sarni", company: "IDFC FIRST Bank", domain: "" },
    { name: "Sahil Gupta", company: "IDFC FIRST Bank", domain: "" }
  ];

  // Pass empty keys to simulate exhausted keys or no keys
  const hunterKey = "";

  console.log("Running enrichAll WITHOUT keys...");
  const results = await enrichAll(people, hunterKey, "");
  
  for (let i = 0; i < people.length; i++) {
    console.log(`\nResults for ${people[i].name}:`);
    for (const email of results[i].emails) {
      console.log(`- ${email.email} (${email.type}, ${email.source}, conf: ${email.confidence})`);
    }
  }
}

run().catch(console.error);
