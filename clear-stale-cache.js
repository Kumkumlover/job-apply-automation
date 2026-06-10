const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clearStaleCache() {
  // Delete all cached emails that came from Pattern Engine with low confidence
  // and all emails with empty/invalid domains
  const deleted = await prisma.cachedEmail.deleteMany({
    where: {
      OR: [
        { source: "Pattern Engine", verified: false },
        { domain: "" },
        { email: { startsWith: "error-lite@" } },
      ]
    }
  });
  console.log(`Deleted ${deleted.count} stale cached emails.`);

  // Also clear pattern records so they're re-learned from scratch with real API data
  const pDeleted = await prisma.patternRecord.deleteMany({
    where: {
      successCount: 1,
      usageCount: { lte: 2 }
    }
  });
  console.log(`Deleted ${pDeleted.count} low-confidence pattern records.`);

  await prisma.$disconnect();
}

clearStaleCache();
