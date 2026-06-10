const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const apps = await prisma.application.findMany({
    select: { id: true, company: true, role: true, status: true }
  });
  console.log("Found", apps.length, "applications in DB.");
  console.log(apps);
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
