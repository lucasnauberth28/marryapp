-- Administração da plataforma (/admin): suspensão e acompanhamento de casamentos, moderação de avaliações,
-- notas internas, "entrar como" auditado, comunicados, suporte e LGPD, configurações da plataforma e da Madrinha,
-- preços de catálogo, reembolsos e o registro das rotinas e dos serviços externos (Saúde do sistema).
-- Tudo ou nada: se algum passo falhar, o banco volta ao estado anterior. Só acrescenta; nada é removido.
BEGIN;

-- CreateEnum
CREATE TYPE "AnnouncementStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELED');

-- CreateEnum
CREATE TYPE "AnnouncementChannel" AS ENUM ('PANEL', 'PUSH', 'EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "DeliveryStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "SupportTicketStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED');

-- CreateEnum
CREATE TYPE "DataRequestType" AS ENUM ('EXPORT', 'DELETE', 'CORRECTION', 'OTHER');

-- CreateEnum
CREATE TYPE "DataRequestStatus" AS ENUM ('NEW', 'IN_REVIEW', 'DONE', 'REFUSED');

-- CreateEnum
CREATE TYPE "IncidentStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "RefundStatus" AS ENUM ('REQUESTED', 'REFUNDED', 'DENIED');

-- CreateEnum
CREATE TYPE "CronRunStatus" AS ENUM ('OK', 'FAILED');

-- CreateEnum
CREATE TYPE "MadrinhaContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "domain_orders" ADD COLUMN     "renewalReminderDays" INTEGER;

-- AlterTable
ALTER TABLE "partner_vendors" ADD COLUMN     "isFeatured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "invoiceIssuedAt" TIMESTAMP(3),
ADD COLUMN     "invoiceNumber" TEXT;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "lastLoginAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vendor_reviews" ADD COLUMN     "hiddenAt" TIMESTAMP(3),
ADD COLUMN     "hiddenReason" TEXT,
ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "reportReason" TEXT,
ADD COLUMN     "reportedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "weddings" ADD COLUMN     "flaggedAt" TIMESTAMP(3),
ADD COLUMN     "lastActiveAt" TIMESTAMP(3),
ADD COLUMN     "suspendedAt" TIMESTAMP(3),
ADD COLUMN     "suspendedReason" TEXT;

-- CreateTable
CREATE TABLE "admin_notes" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT,
    "vendorId" TEXT,
    "authorId" TEXT,
    "authorName" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "impersonation_sessions" (
    "id" TEXT NOT NULL,
    "adminUserId" TEXT NOT NULL,
    "adminName" TEXT NOT NULL,
    "weddingId" TEXT,
    "weddingNames" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "ticketNumber" INTEGER,
    "canEdit" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "endedReason" TEXT,

    CONSTRAINT "impersonation_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "emailSubject" TEXT,
    "body" TEXT NOT NULL,
    "linkUrl" TEXT,
    "audience" JSONB NOT NULL,
    "channels" "AnnouncementChannel"[],
    "status" "AnnouncementStatus" NOT NULL DEFAULT 'DRAFT',
    "scheduledFor" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "deliveredCount" INTEGER NOT NULL DEFAULT 0,
    "failedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcement_recipients" (
    "id" TEXT NOT NULL,
    "announcementId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "channel" "AnnouncementChannel" NOT NULL,
    "status" "DeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "error" TEXT,
    "sentAt" TIMESTAMP(3),

    CONSTRAINT "announcement_recipients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_tickets" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT,
    "requesterPhone" TEXT,
    "weddingId" TEXT,
    "vendorId" TEXT,
    "userId" TEXT,
    "status" "SupportTicketStatus" NOT NULL DEFAULT 'NEW',
    "assigneeId" TEXT,
    "assigneeName" TEXT,
    "internalNote" TEXT,
    "answeredAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "data_requests" (
    "id" TEXT NOT NULL,
    "type" "DataRequestType" NOT NULL,
    "requesterName" TEXT NOT NULL,
    "requesterEmail" TEXT NOT NULL,
    "userId" TEXT,
    "weddingId" TEXT,
    "status" "DataRequestStatus" NOT NULL DEFAULT 'NEW',
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "note" TEXT,
    "handledById" TEXT,
    "handledByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "data_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "security_incidents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "affected" TEXT,
    "discoveredAt" TIMESTAMP(3) NOT NULL,
    "notifiedAt" TIMESTAMP(3),
    "notifiedWho" TEXT,
    "status" "IncidentStatus" NOT NULL DEFAULT 'OPEN',
    "closedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "security_incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_settings" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "updatedByName" TEXT,

    CONSTRAINT "platform_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "catalog_prices" (
    "key" TEXT NOT NULL,
    "priceCents" INTEGER NOT NULL,
    "name" TEXT,
    "reason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,
    "updatedByName" TEXT,

    CONSTRAINT "catalog_prices_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "requestedByName" TEXT,
    "status" "RefundStatus" NOT NULL DEFAULT 'REQUESTED',
    "dueAt" TIMESTAMP(3),
    "decidedAt" TIMESTAMP(3),
    "decidedByName" TEXT,
    "decisionNote" TEXT,
    "gatewayRefundId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cron_runs" (
    "id" TEXT NOT NULL,
    "job" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "CronRunStatus" NOT NULL,
    "summary" JSONB,
    "error" TEXT,

    CONSTRAINT "cron_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_events" (
    "id" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "ok" BOOLEAN NOT NULL,
    "message" TEXT,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "service_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "madrinha_instruction_versions" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "changeNote" TEXT,
    "status" "MadrinhaContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdById" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "madrinha_instruction_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "madrinha_knowledge_articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "MadrinhaContentStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "madrinha_knowledge_articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "madrinha_wedding_overrides" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "enabled" BOOLEAN,
    "extraMessages" INTEGER NOT NULL DEFAULT 0,
    "blockedAt" TIMESTAMP(3),
    "blockedReason" TEXT,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "madrinha_wedding_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "admin_notes_weddingId_createdAt_idx" ON "admin_notes"("weddingId", "createdAt");

-- CreateIndex
CREATE INDEX "admin_notes_vendorId_createdAt_idx" ON "admin_notes"("vendorId", "createdAt");

-- CreateIndex
CREATE INDEX "impersonation_sessions_adminUserId_endedAt_idx" ON "impersonation_sessions"("adminUserId", "endedAt");

-- CreateIndex
CREATE INDEX "impersonation_sessions_weddingId_startedAt_idx" ON "impersonation_sessions"("weddingId", "startedAt");

-- CreateIndex
CREATE INDEX "announcements_status_scheduledFor_idx" ON "announcements"("status", "scheduledFor");

-- CreateIndex
CREATE INDEX "announcements_createdAt_idx" ON "announcements"("createdAt");

-- CreateIndex
CREATE INDEX "announcement_recipients_announcementId_status_idx" ON "announcement_recipients"("announcementId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "announcement_recipients_announcementId_userId_channel_key" ON "announcement_recipients"("announcementId", "userId", "channel");

-- CreateIndex
CREATE UNIQUE INDEX "support_tickets_number_key" ON "support_tickets"("number");

-- CreateIndex
CREATE INDEX "support_tickets_status_createdAt_idx" ON "support_tickets"("status", "createdAt");

-- CreateIndex
CREATE INDEX "data_requests_status_dueAt_idx" ON "data_requests"("status", "dueAt");

-- CreateIndex
CREATE INDEX "security_incidents_status_discoveredAt_idx" ON "security_incidents"("status", "discoveredAt");

-- CreateIndex
CREATE INDEX "refund_requests_status_dueAt_idx" ON "refund_requests"("status", "dueAt");

-- CreateIndex
CREATE INDEX "refund_requests_subscriptionId_idx" ON "refund_requests"("subscriptionId");

-- CreateIndex
CREATE INDEX "cron_runs_job_startedAt_idx" ON "cron_runs"("job", "startedAt");

-- CreateIndex
CREATE INDEX "service_events_service_createdAt_idx" ON "service_events"("service", "createdAt");

-- CreateIndex
CREATE INDEX "service_events_createdAt_idx" ON "service_events"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "madrinha_instruction_versions_version_key" ON "madrinha_instruction_versions"("version");

-- CreateIndex
CREATE INDEX "madrinha_instruction_versions_status_idx" ON "madrinha_instruction_versions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "madrinha_wedding_overrides_weddingId_key" ON "madrinha_wedding_overrides"("weddingId");

-- CreateIndex
CREATE INDEX "vendor_reviews_reportedAt_idx" ON "vendor_reviews"("reportedAt");

-- CreateIndex
CREATE INDEX "weddings_createdAt_idx" ON "weddings"("createdAt");

-- CreateIndex
CREATE INDEX "weddings_weddingDate_idx" ON "weddings"("weddingDate");

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_notes" ADD CONSTRAINT "admin_notes_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partner_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "impersonation_sessions" ADD CONSTRAINT "impersonation_sessions_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_announcementId_fkey" FOREIGN KEY ("announcementId") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "announcement_recipients" ADD CONSTRAINT "announcement_recipients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partner_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_tickets" ADD CONSTRAINT "support_tickets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "data_requests" ADD CONSTRAINT "data_requests_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "madrinha_wedding_overrides" ADD CONSTRAINT "madrinha_wedding_overrides_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;


COMMIT;
