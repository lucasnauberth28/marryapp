-- AlterTable
ALTER TABLE "vendor_reviews" ADD COLUMN     "repliedAt" TIMESTAMP(3),
ADD COLUMN     "reply" TEXT;

-- AlterTable
ALTER TABLE "vendor_leads" ADD COLUMN     "budget" TEXT,
ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "declineMessage" TEXT,
ADD COLUMN     "declinedAt" TIMESTAMP(3),
ADD COLUMN     "location" TEXT,
ADD COLUMN     "proposalAmount" INTEGER,
ADD COLUMN     "proposalDetails" TEXT,
ADD COLUMN     "proposalSentAt" TIMESTAMP(3),
ADD COLUMN     "proposalValidUntil" TIMESTAMP(3),
ADD COLUMN     "respondedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "vendor_events" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "time" TEXT,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "leadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vendor_events_vendorId_date_idx" ON "vendor_events"("vendorId", "date");

-- AddForeignKey
ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partner_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_events" ADD CONSTRAINT "vendor_events_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "vendor_leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

