-- AlterTable
ALTER TABLE "users" ADD COLUMN     "partnerVendorId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_partnerVendorId_key" ON "users"("partnerVendorId");

-- CreateIndex
CREATE INDEX "vendor_leads_vendorId_status_idx" ON "vendor_leads"("vendorId", "status");

-- CreateIndex
CREATE INDEX "vendor_leads_createdAt_idx" ON "vendor_leads"("createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_partnerVendorId_fkey" FOREIGN KEY ("partnerVendorId") REFERENCES "partner_vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

