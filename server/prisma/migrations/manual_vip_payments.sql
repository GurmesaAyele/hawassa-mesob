-- ==============================================================================
-- Migration: Add vip_payments table and PaymentStatus enum
-- Database: PostgreSQL (Neon)
-- Purpose: Support Chapa v2 payment integration for Hawassa MESOB VIP Tickets
-- Safety: Non-destructive. Does not alter, rename, or drop existing tables or columns.
-- ==============================================================================

-- 1. Create PaymentStatus enum type (if not already existing)
DO $$ BEGIN
    CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create the vip_payments table
CREATE TABLE IF NOT EXISTS "vip_payments" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'CHAPA',
    "merchantReference" TEXT NOT NULL,
    "providerReference" TEXT,
    "idempotencyKey" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "checkoutUrl" TEXT,
    "paymentMethod" TEXT,
    "errorMessage" TEXT,
    "metadata" JSONB,
    "verifiedAt" TIMESTAMP(3) WITH TIME ZONE,
    "createdAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_payments_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vip_payments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "vip_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 3. Create unique constraints and indexes
CREATE UNIQUE INDEX IF NOT EXISTS "vip_payments_merchantReference_key" ON "vip_payments"("merchantReference");
CREATE UNIQUE INDEX IF NOT EXISTS "vip_payments_providerReference_key" ON "vip_payments"("providerReference");
CREATE UNIQUE INDEX IF NOT EXISTS "vip_payments_idempotencyKey_key" ON "vip_payments"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "vip_payments_ticketId_idx" ON "vip_payments"("ticketId");
CREATE INDEX IF NOT EXISTS "vip_payments_status_idx" ON "vip_payments"("status");
