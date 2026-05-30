import { enrichAll } from "./lib/email-finder";
import { store } from "./lib/intelligence-store";
import { prisma } from "./lib/db";

async function run() {
  // Clear the cache for a clean slate
  await prisma.cachedEmail.deleteMany();
  await prisma.patternRecord.deleteMany();
  
  // Create an admin user or use default
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com"
      }
    });
  }

  const people = [
    { name: "Sahil Gupta", company: "IDFC FIRST Bank", domain: "" },
    { name: "Nikita Sarni", company: "IDFC FIRST Bank", domain: "" },
    { name: "Kishor Sonar", company: "IDFC FIRST Bank", domain: "" },
    { name: "Abhilasha Jain", company: "IDFC FIRST Bank", domain: "" }
  ];

  console.log("Running enrichAll...");
  const results = await enrichAll(people, "c9dff947f42d6e4cc5ffa72f84cc4a545a07e708", "");
  
  for (let i = 0; i < people.length; i++) {
    console.log(`\nResults for ${people[i].name}:`);
    for (const email of results[i].emails) {
      console.log(`- ${email.email} (${email.type}, ${email.source}, conf: ${email.confidence})`);
    }
  }
}

run().catch(console.error);
