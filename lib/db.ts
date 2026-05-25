import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

// Export a proxy so we don't instantiate PrismaClient at module load time
// This prevents build-time execution errors when Next.js collects page data
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = new PrismaClient({ log: ["query"] });
    }
    return (globalForPrisma.prisma as any)[prop];
  }
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = globalForPrisma.prisma;

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
