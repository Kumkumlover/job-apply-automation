const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.linkedGmailAccount.deleteMany().then(res => {
  console.log("Deleted old gmail accounts:", res);
  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
