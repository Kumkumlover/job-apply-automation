const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function clear() {
  await prisma.cachedEmail.deleteMany({});
  await prisma.patternRecord.deleteMany({});
  console.log("Cleared cache");
}
clear().then(() => process.exit(0));
