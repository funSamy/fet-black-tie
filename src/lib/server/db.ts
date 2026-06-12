// Server-only Prisma client singleton. Prisma 7 uses the PrismaPg driver
// adapter — DATABASE_URL is read here at runtime, not from schema.prisma.
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required. Set it to your PostgreSQL connection string.");
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
}

// Reuse a single client across hot reloads in development to avoid
// exhausting database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
