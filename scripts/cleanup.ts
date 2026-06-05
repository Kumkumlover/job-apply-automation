import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  await prisma.cachedEmail.deleteMany({
    where: { domain: 'zenskar.com' }
  });
  await prisma.patternRecord.deleteMany({
    where: { domain: 'zenskar.com' }
  });
  console.log("Deleted old zenskar.com records to ensure clean test.");
}

cleanup().catch(console.error).finally(() => prisma.$disconnect());
