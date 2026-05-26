import { PrismaClient } from "@prisma/client";

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: ["query"],
    ...(process.env.DATABASE_URL ? {
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      }
    } : {})
  })
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Fetch the User ID for the default Gmail account
 * so that we can link our data safely until NextAuth is fully integrated here.
 */
export async function getDefaultUserId(): Promise<string> {
  const email = process.env.SMTP_USER || "shikharguptah2@gmail.com";
  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        name: "Shikhar Gupta",
      },
    });
  }

  return user.id;
}
