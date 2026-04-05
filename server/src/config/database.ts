import { PrismaClient } from "@prisma/client";
import { logger } from "../lib/logger";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const IS_DEV = process.env.NODE_ENV !== "production";

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // In dev: log queries, warnings, and errors to the Prisma console.
    // In prod: only capture errors; they are forwarded to our logger below.
    log: IS_DEV
      ? [
          { emit: "stdout", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ]
      : [
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
        ],
  });

// Forward Prisma error/warn events through our structured logger so they
// appear in Railway / Vercel logs the same way as application errors.
prisma.$on("error" as never, (e: { message: string; target: string }) => {
  logger.error("Prisma error", { message: e.message, target: e.target });
});
prisma.$on("warn" as never, (e: { message: string; target: string }) => {
  logger.warn("Prisma warning", { message: e.message, target: e.target });
});

if (!IS_DEV) {
  globalForPrisma.prisma = prisma;
}
