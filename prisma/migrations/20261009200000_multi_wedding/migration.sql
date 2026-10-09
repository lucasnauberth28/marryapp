-- Multi-casamento: cada dado do painel do casal passa a pertencer a um casamento.
-- Os dados que já existem viram o "casamento principal", sem perda.

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'PROPOSAL_SENT', 'CLOSED', 'DECLINED');

-- CreateEnum
CREATE TYPE "CurationStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "weddings" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "coupleNames" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3),
    "city" TEXT,
    "guestEstimate" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#5E2B4E',
    "onboardedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weddings_pkey" PRIMARY KEY ("id")
);

-- Casamento principal (dados atuais)
INSERT INTO "weddings" ("id", "slug", "coupleNames", "weddingDate", "themeColor", "onboardedAt", "updatedAt")
SELECT gen_random_uuid()::text,
       COALESCE((SELECT NULLIF("slug", '') FROM "site_customization" LIMIT 1), 'nosso-casamento'),
       COALESCE((SELECT NULLIF("title", '') FROM "site_customization" LIMIT 1), 'Nosso casamento'),
       COALESCE((SELECT "weddingDate" FROM "system_settings" LIMIT 1), (SELECT "weddingDate" FROM "site_customization" LIMIT 1)),
       '#5E2B4E', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP;

-- guests: passa a pertencer ao casamento principal
ALTER TABLE "guests" ADD COLUMN "weddingId" TEXT;
UPDATE "guests" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "guests" ALTER COLUMN "weddingId" SET NOT NULL;

-- timeline_events: passa a pertencer ao casamento principal
ALTER TABLE "timeline_events" ADD COLUMN "weddingId" TEXT;
UPDATE "timeline_events" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "timeline_events" ALTER COLUMN "weddingId" SET NOT NULL;

-- tables: passa a pertencer ao casamento principal
ALTER TABLE "tables" ADD COLUMN "weddingId" TEXT;
UPDATE "tables" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "tables" ALTER COLUMN "weddingId" SET NOT NULL;

-- gifts: passa a pertencer ao casamento principal
ALTER TABLE "gifts" ADD COLUMN "weddingId" TEXT;
UPDATE "gifts" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "gifts" ALTER COLUMN "weddingId" SET NOT NULL;

-- transactions: passa a pertencer ao casamento principal
ALTER TABLE "transactions" ADD COLUMN "weddingId" TEXT;
UPDATE "transactions" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "transactions" ALTER COLUMN "weddingId" SET NOT NULL;

-- vendors: passa a pertencer ao casamento principal
ALTER TABLE "vendors" ADD COLUMN "weddingId" TEXT;
UPDATE "vendors" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "vendors" ALTER COLUMN "weddingId" SET NOT NULL;

-- expenses: passa a pertencer ao casamento principal
ALTER TABLE "expenses" ADD COLUMN "weddingId" TEXT;
UPDATE "expenses" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "expenses" ALTER COLUMN "weddingId" SET NOT NULL;

-- tasks: passa a pertencer ao casamento principal
ALTER TABLE "tasks" ADD COLUMN "weddingId" TEXT;
UPDATE "tasks" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "tasks" ALTER COLUMN "weddingId" SET NOT NULL;

-- honeymoon_items: passa a pertencer ao casamento principal
ALTER TABLE "honeymoon_items" ADD COLUMN "weddingId" TEXT;
UPDATE "honeymoon_items" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "honeymoon_items" ALTER COLUMN "weddingId" SET NOT NULL;

-- message_templates: passa a pertencer ao casamento principal
ALTER TABLE "message_templates" ADD COLUMN "weddingId" TEXT;
UPDATE "message_templates" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "message_templates" ALTER COLUMN "weddingId" SET NOT NULL;

-- system_settings: passa a pertencer ao casamento principal
ALTER TABLE "system_settings" ADD COLUMN "weddingId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
UPDATE "system_settings" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "system_settings" ALTER COLUMN "weddingId" SET NOT NULL;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "weddingId" TEXT;

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "couponCode" TEXT,
ADD COLUMN     "credit" INTEGER,
ADD COLUMN     "discount" INTEGER,
ADD COLUMN     "weddingId" TEXT;

-- wallet_balance: passa a pertencer ao casamento principal
ALTER TABLE "wallet_balance" ADD COLUMN "weddingId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
UPDATE "wallet_balance" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "wallet_balance" ALTER COLUMN "weddingId" SET NOT NULL;

-- credit_cards: passa a pertencer ao casamento principal
ALTER TABLE "credit_cards" ADD COLUMN "weddingId" TEXT;
UPDATE "credit_cards" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "credit_cards" ALTER COLUMN "weddingId" SET NOT NULL;

-- site_customization: passa a pertencer ao casamento principal
ALTER TABLE "site_customization" ADD COLUMN "weddingId" TEXT,
ALTER COLUMN "id" DROP DEFAULT;
UPDATE "site_customization" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "site_customization" ALTER COLUMN "weddingId" SET NOT NULL;

-- wedding_story_items: passa a pertencer ao casamento principal
ALTER TABLE "wedding_story_items" ADD COLUMN "weddingId" TEXT;
UPDATE "wedding_story_items" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "wedding_story_items" ALTER COLUMN "weddingId" SET NOT NULL;

-- wedding_tips: passa a pertencer ao casamento principal
ALTER TABLE "wedding_tips" ADD COLUMN "weddingId" TEXT;
UPDATE "wedding_tips" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "wedding_tips" ALTER COLUMN "weddingId" SET NOT NULL;

-- guest_book_entries: passa a pertencer ao casamento principal
ALTER TABLE "guest_book_entries" ADD COLUMN "weddingId" TEXT;
UPDATE "guest_book_entries" SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1);
ALTER TABLE "guest_book_entries" ALTER COLUMN "weddingId" SET NOT NULL;

-- partner_vendors: status de curadoria vira enum, convertendo os valores existentes
ALTER TABLE "partner_vendors" ADD COLUMN "planReminderDays" INTEGER;
ALTER TABLE "partner_vendors" ALTER COLUMN "curationStatus" DROP DEFAULT;
ALTER TABLE "partner_vendors" ALTER COLUMN "curationStatus" TYPE "CurationStatus" USING "curationStatus"::"CurationStatus";
ALTER TABLE "partner_vendors" ALTER COLUMN "curationStatus" SET DEFAULT 'APPROVED';

-- AlterTable
ALTER TABLE "vendor_reviews" ADD COLUMN     "leadId" TEXT;

-- vendor_leads: status do pedido vira enum, convertendo os valores existentes
ALTER TABLE "vendor_leads" ADD COLUMN "locked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "proposalAcceptedAt" TIMESTAMP(3),
ADD COLUMN "proposalAcceptedIp" TEXT,
ADD COLUMN "proposalAcceptedName" TEXT,
ADD COLUMN "proposalToken" TEXT,
ADD COLUMN "reviewRequestedAt" TIMESTAMP(3),
ADD COLUMN "reviewToken" TEXT;
ALTER TABLE "vendor_leads" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "vendor_leads" ALTER COLUMN "status" TYPE "LeadStatus" USING "status"::"LeadStatus";
ALTER TABLE "vendor_leads" ALTER COLUMN "status" SET DEFAULT 'NEW';

-- CreateTable
CREATE TABLE "wedding_invites" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "email" TEXT,
    "createdById" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_invites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_profile_views" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "vendor_profile_views_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coupons" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "percentOff" INTEGER,
    "amountOff" INTEGER,
    "planIds" JSONB,
    "maxRedemptions" INTEGER,
    "redemptions" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coupons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actorName" TEXT,
    "action" TEXT NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weddings_slug_key" ON "weddings"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "wedding_invites_tokenHash_key" ON "wedding_invites"("tokenHash");

-- CreateIndex
CREATE INDEX "wedding_invites_weddingId_idx" ON "wedding_invites"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_profile_views_vendorId_day_key" ON "vendor_profile_views"("vendorId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "coupons_code_key" ON "coupons"("code");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_targetType_targetId_idx" ON "audit_logs"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "guests_weddingId_idx" ON "guests"("weddingId");

-- CreateIndex
CREATE INDEX "timeline_events_weddingId_idx" ON "timeline_events"("weddingId");

-- CreateIndex
CREATE INDEX "tables_weddingId_idx" ON "tables"("weddingId");

-- CreateIndex
CREATE INDEX "gifts_weddingId_idx" ON "gifts"("weddingId");

-- CreateIndex
CREATE INDEX "transactions_weddingId_idx" ON "transactions"("weddingId");

-- CreateIndex
CREATE INDEX "vendors_weddingId_idx" ON "vendors"("weddingId");

-- CreateIndex
CREATE INDEX "expenses_weddingId_idx" ON "expenses"("weddingId");

-- CreateIndex
CREATE INDEX "tasks_weddingId_idx" ON "tasks"("weddingId");

-- CreateIndex
CREATE INDEX "honeymoon_items_weddingId_idx" ON "honeymoon_items"("weddingId");

-- CreateIndex
CREATE INDEX "message_templates_weddingId_idx" ON "message_templates"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_weddingId_key" ON "system_settings"("weddingId");

-- CreateIndex
CREATE INDEX "subscriptions_weddingId_status_idx" ON "subscriptions"("weddingId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_balance_weddingId_key" ON "wallet_balance"("weddingId");

-- CreateIndex
CREATE INDEX "credit_cards_weddingId_idx" ON "credit_cards"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "site_customization_weddingId_key" ON "site_customization"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_story_items_weddingId_idx" ON "wedding_story_items"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_tips_weddingId_idx" ON "wedding_tips"("weddingId");

-- CreateIndex
CREATE INDEX "guest_book_entries_weddingId_idx" ON "guest_book_entries"("weddingId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_reviews_leadId_key" ON "vendor_reviews"("leadId");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_leads_proposalToken_key" ON "vendor_leads"("proposalToken");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_leads_reviewToken_key" ON "vendor_leads"("reviewToken");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "timeline_events" ADD CONSTRAINT "timeline_events_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tables" ADD CONSTRAINT "tables_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gifts" ADD CONSTRAINT "gifts_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendors" ADD CONSTRAINT "vendors_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "honeymoon_items" ADD CONSTRAINT "honeymoon_items_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_templates" ADD CONSTRAINT "message_templates_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_balance" ADD CONSTRAINT "wallet_balance_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_cards" ADD CONSTRAINT "credit_cards_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_customization" ADD CONSTRAINT "site_customization_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_story_items" ADD CONSTRAINT "wedding_story_items_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_tips" ADD CONSTRAINT "wedding_tips_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guest_book_entries" ADD CONSTRAINT "guest_book_entries_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "vendor_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_invites" ADD CONSTRAINT "wedding_invites_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profile_views" ADD CONSTRAINT "vendor_profile_views_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partner_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Contas do casal atual (perfis com acesso ao painel) entram no casamento principal.
-- Cadastros novos aguardando ativação ganham o próprio casamento no onboarding.
UPDATE "users" u SET "weddingId" = (SELECT "id" FROM "weddings" ORDER BY "createdAt" LIMIT 1)
FROM "roles" r
WHERE u."roleId" = r."id" AND u."partnerVendorId" IS NULL
  AND (r."allowedPaths"::jsonb ? '*' OR r."allowedPaths"::jsonb ? '/dashboard');

-- Assinaturas de casal pertencem ao casamento de quem pagou
UPDATE "subscriptions" s SET "weddingId" = u."weddingId"
FROM "users" u
WHERE s."userId" = u."id" AND s."planType" = 'COUPLE';
