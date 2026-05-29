import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const emails = await prisma.cachedEmail.findMany();
  console.log(JSON.stringify(emails, null, 2));
}

run();
