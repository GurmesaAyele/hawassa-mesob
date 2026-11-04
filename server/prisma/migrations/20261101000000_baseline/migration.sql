-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'CONFIRMED', 'QUEUED', 'SERVING', 'USED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CITIZEN', 'OPERATOR', 'SUPER_ADMIN');

-- CreateTable
CREATE TABLE "service_providers" (
    "id" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "code" TEXT NOT NULL,
    "icon" TEXT,
    "floorRoomNumber" TEXT,
    "contactPhone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "services" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "description" JSONB NOT NULL,
    "requirements" JSONB NOT NULL DEFAULT '[]',
    "estimatedFee" DOUBLE PRECISION,
    "processingDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chatbot_faqs" (
    "id" TEXT NOT NULL,
    "question" JSONB NOT NULL,
    "answer" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "quickButtonLabel" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_faqs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phoneOrEmail" TEXT,
    "message" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isReviewed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "news_announcements" (
    "id" TEXT NOT NULL,
    "title" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "imageUrl" TEXT,
    "category" TEXT NOT NULL DEFAULT 'general',
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "news_announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CITIZEN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_tickets" (
    "id" TEXT NOT NULL,
    "ticketCode" TEXT NOT NULL,
    "citizenName" TEXT NOT NULL,
    "citizenPhone" TEXT NOT NULL,
    "email" TEXT,
    "serviceId" TEXT,
    "purpose" TEXT,
    "slotDate" TIMESTAMP(3),
    "slotTime" TEXT,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "paymentRef" TEXT,
    "qrCodeUrl" TEXT,
    "vipFee" DOUBLE PRECISION NOT NULL DEFAULT 1000,
    "currency" TEXT NOT NULL DEFAULT 'ETB',
    "queueNumber" INTEGER,
    "queueDate" TIMESTAMP(3),
    "checkedInAt" TIMESTAMP(3),
    "servedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_ticket_services" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vip_ticket_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vip_payments" (
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
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vip_payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_providers_code_key" ON "service_providers"("code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "vip_tickets_ticketCode_key" ON "vip_tickets"("ticketCode");

-- CreateIndex
CREATE INDEX "vip_tickets_slotDate_slotTime_idx" ON "vip_tickets"("slotDate", "slotTime");

-- CreateIndex
CREATE INDEX "vip_tickets_ticketCode_idx" ON "vip_tickets"("ticketCode");

-- CreateIndex
CREATE INDEX "vip_tickets_queueDate_status_idx" ON "vip_tickets"("queueDate", "status");

-- CreateIndex
CREATE INDEX "vip_ticket_services_ticketId_idx" ON "vip_ticket_services"("ticketId");

-- CreateIndex
CREATE INDEX "vip_ticket_services_serviceId_idx" ON "vip_ticket_services"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "vip_ticket_services_ticketId_serviceId_key" ON "vip_ticket_services"("ticketId", "serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "vip_payments_merchantReference_key" ON "vip_payments"("merchantReference");

-- CreateIndex
CREATE UNIQUE INDEX "vip_payments_providerReference_key" ON "vip_payments"("providerReference");

-- CreateIndex
CREATE UNIQUE INDEX "vip_payments_idempotencyKey_key" ON "vip_payments"("idempotencyKey");

-- CreateIndex
CREATE INDEX "vip_payments_ticketId_idx" ON "vip_payments"("ticketId");

-- CreateIndex
CREATE INDEX "vip_payments_merchantReference_idx" ON "vip_payments"("merchantReference");

-- CreateIndex
CREATE INDEX "vip_payments_providerReference_idx" ON "vip_payments"("providerReference");

-- CreateIndex
CREATE INDEX "vip_payments_status_idx" ON "vip_payments"("status");

-- AddForeignKey
ALTER TABLE "services" ADD CONSTRAINT "services_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "service_providers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_tickets" ADD CONSTRAINT "vip_tickets_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_ticket_services" ADD CONSTRAINT "vip_ticket_services_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "vip_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_ticket_services" ADD CONSTRAINT "vip_ticket_services_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vip_payments" ADD CONSTRAINT "vip_payments_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "vip_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

