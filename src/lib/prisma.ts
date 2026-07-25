/**
 * Prisma Client singleton for Sociova.
 * MySQL via DATABASE_URL. Auth: JWT + bcrypt (adult accounts).
 */
import { PrismaClient } from "@prisma/client";

declare global {
  // Prevent multiple instances in development hot-reload
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  return new PrismaClient({
    log: ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

export const prisma: PrismaClient =
  globalThis.__prisma ?? (globalThis.__prisma = createPrismaClient());

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
