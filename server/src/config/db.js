// src/config/db.js
import { PrismaClient } from "@prisma/client";

let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({
    log: ["error"],
  });
} else {
  // Prevent hot-reload from creating multiple PrismaClient instances
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({
      log: ["query", "error", "warn"],
    });
  }
  prisma = globalThis.__prisma;
}

export { prisma };
export default prisma;
