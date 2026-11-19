import prisma from "../src/config/db.js";

async function run() {
  console.log("Checking and creating password_reset_requests table...");
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS password_reset_requests (
        id TEXT PRIMARY KEY,
        "userId" TEXT,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        "institutionName" TEXT,
        reason TEXT,
        status TEXT NOT NULL DEFAULT 'PENDING',
        "tempPassword" TEXT,
        "rejectionReason" TEXT,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "reviewedById" TEXT,
        "reviewedByName" TEXT,
        "reviewedAt" TIMESTAMP(3),
        "completedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "password_reset_requests_email_idx" ON password_reset_requests(email);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "password_reset_requests_status_idx" ON password_reset_requests(status);
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "password_reset_requests_createdAt_idx" ON password_reset_requests("createdAt");
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS "mustChangePassword" BOOLEAN DEFAULT false;
    `);

    console.log("SUCCESS: password_reset_requests table and users.mustChangePassword verified in database.");
  } catch (err) {
    console.error("Migration error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
