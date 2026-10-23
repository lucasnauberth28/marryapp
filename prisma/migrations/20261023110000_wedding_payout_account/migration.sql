-- Onde o casal recebe os presentes: um registro por casamento, com documento do titular, chave Pix e conta
-- bancária SÓ cifrados (AES-256-GCM, feito pelo app). As colunas abertas guardam apenas máscaras (final do
-- documento, "Pix CPF final 12", "Banco 260, ag 0001, conta •••• 45"). Só acrescenta; nada é removido.
-- Tudo ou nada: se algum passo falhar, o banco volta ao estado anterior.
BEGIN;

-- CreateEnum
CREATE TYPE "PayoutAccountType" AS ENUM ('PIX_KEY', 'BANK_ACCOUNT');

-- CreateEnum
CREATE TYPE "PayoutPixKeyType" AS ENUM ('CPF', 'CNPJ', 'EMAIL', 'PHONE', 'RANDOM');

-- CreateEnum
CREATE TYPE "PayoutDocumentKind" AS ENUM ('CPF', 'CNPJ');

-- CreateTable
CREATE TABLE "wedding_payout_accounts" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "type" "PayoutAccountType" NOT NULL,
    "holderName" TEXT NOT NULL,
    "holderDocumentKind" "PayoutDocumentKind" NOT NULL,
    "holderDocumentEnc" TEXT NOT NULL,
    "holderDocumentLast4" TEXT NOT NULL,
    "pixKeyType" "PayoutPixKeyType",
    "pixKeyEnc" TEXT,
    "bankAccountEnc" TEXT,
    "keyHint" TEXT NOT NULL,
    "encKeyVersion" INTEGER NOT NULL DEFAULT 1,
    "verifiedAt" TIMESTAMP(3),
    "registeredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_payout_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wedding_payout_accounts_weddingId_key" ON "wedding_payout_accounts"("weddingId");

-- CreateIndex
CREATE INDEX "wedding_payout_accounts_registeredByUserId_idx" ON "wedding_payout_accounts"("registeredByUserId");

-- AddForeignKey
ALTER TABLE "wedding_payout_accounts" ADD CONSTRAINT "wedding_payout_accounts_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wedding_payout_accounts" ADD CONSTRAINT "wedding_payout_accounts_registeredByUserId_fkey" FOREIGN KEY ("registeredByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Coerência entre o tipo e os dados cifrados: Pix guarda só a chave; conta bancária guarda só os dados da conta.
ALTER TABLE "wedding_payout_accounts" ADD CONSTRAINT "wedding_payout_accounts_type_data_check" CHECK (
    ("type" = 'PIX_KEY' AND "pixKeyEnc" IS NOT NULL AND "pixKeyType" IS NOT NULL AND "bankAccountEnc" IS NULL)
    OR ("type" = 'BANK_ACCOUNT' AND "bankAccountEnc" IS NOT NULL AND "pixKeyEnc" IS NULL AND "pixKeyType" IS NULL)
);

COMMIT;
