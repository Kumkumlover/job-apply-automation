const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const emails = await prisma.cachedEmail.findMany();
  console.log(JSON.stringify(emails, null, 2));
  await prisma.$disconnect();
}

check();
