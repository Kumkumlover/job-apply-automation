import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function run() {
  await prisma.cachedEmail.deleteMany({});
  await prisma.patternRecord.deleteMany({});
  console.log("Cleared cache");
}
run();
