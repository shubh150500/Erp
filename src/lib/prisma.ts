import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create a database helper that swallows errors or queries safely
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Resilient query wrapper to catch database connection resets universally
export const safeQuery = async <T>(queryFn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await queryFn();
  } catch (err) {
    console.error("Resilient database lookup caught error:", err);
    return fallback;
  }
};
