-- ==============================================================================
-- Migration: Add STAFF role, serviceProcessingStatus enum, and audit history
-- Purpose: Support staff-specific VIP ticket processing workflow without overloading TicketStatus
-- Safety: Non-destructive. Backfills existing tickets to PENDING.
-- ==============================================================================

-- 1. Add STAFF to UserRole enum (if not exists)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'STAFF';

-- 2. Create ServiceProcessingStatus enum type
DO $$ BEGIN
    CREATE TYPE "ServiceProcessingStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Add serviceProcessingStatus column to vip_tickets with DEFAULT 'PENDING'
ALTER TABLE "vip_tickets"
    ADD COLUMN IF NOT EXISTS "serviceProcessingStatus" "ServiceProcessingStatus" NOT NULL DEFAULT 'PENDING';

-- 4. Create index on serviceProcessingStatus for efficient admin queue filtering
CREATE INDEX IF NOT EXISTS "vip_tickets_serviceProcessingStatus_idx"
    ON "vip_tickets"("serviceProcessingStatus");

-- 5. Create vip_ticket_status_history table for auditing status transitions
CREATE TABLE IF NOT EXISTS "vip_ticket_status_history" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "previousStatus" "ServiceProcessingStatus",
    "newStatus" "ServiceProcessingStatus" NOT NULL,
    "changedById" TEXT,
    "changedByName" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_ticket_status_history_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vip_ticket_status_history_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "vip_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- 6. Create indexes for the status history table
CREATE INDEX IF NOT EXISTS "vip_ticket_status_history_ticketId_idx" ON "vip_ticket_status_history"("ticketId");
CREATE INDEX IF NOT EXISTS "vip_ticket_status_history_createdAt_idx" ON "vip_ticket_status_history"("createdAt");

