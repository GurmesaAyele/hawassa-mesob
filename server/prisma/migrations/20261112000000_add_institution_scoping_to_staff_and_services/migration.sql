-- Migration: add_institution_scoping_to_staff_and_services
-- Adds institutionId to users, per-service processing status to vip_ticket_services, and serviceId to vip_ticket_status_history

-- 1. users: institutionId foreign key and index
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "institutionId" TEXT;
CREATE INDEX IF NOT EXISTS "users_institutionId_idx" ON "users"("institutionId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_institutionId_fkey'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_institutionId_fkey"
    FOREIGN KEY ("institutionId") REFERENCES "service_providers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- 2. vip_ticket_services: per-institution service lifecycle
ALTER TABLE "vip_ticket_services" ADD COLUMN IF NOT EXISTS "serviceProcessingStatus" "ServiceProcessingStatus" NOT NULL DEFAULT 'PENDING';
ALTER TABLE "vip_ticket_services" ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP(3);
ALTER TABLE "vip_ticket_services" ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP(3);
ALTER TABLE "vip_ticket_services" ADD COLUMN IF NOT EXISTS "servedById" TEXT;
ALTER TABLE "vip_ticket_services" ADD COLUMN IF NOT EXISTS "notes" TEXT;
CREATE INDEX IF NOT EXISTS "vip_ticket_services_serviceProcessingStatus_idx" ON "vip_ticket_services"("serviceProcessingStatus");

-- 3. vip_ticket_status_history: track which specific service was updated
ALTER TABLE "vip_ticket_status_history" ADD COLUMN IF NOT EXISTS "serviceId" TEXT;
CREATE INDEX IF NOT EXISTS "vip_ticket_status_history_serviceId_idx" ON "vip_ticket_status_history"("serviceId");

