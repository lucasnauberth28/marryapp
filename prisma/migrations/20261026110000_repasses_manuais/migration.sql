-- Repasse manual dos presentes ao casal: um registro por transferência feita pela equipe.
CREATE TABLE "wedding_payouts" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "reference" TEXT,
    "registeredBy" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_payouts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wedding_payouts_weddingId_paidAt_idx" ON "wedding_payouts"("weddingId", "paidAt");

ALTER TABLE "wedding_payouts" ADD CONSTRAINT "wedding_payouts_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
