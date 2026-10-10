-- Domínio próprio (.com.br) no nome do cliente: pedidos acompanhados pelo Aceito e o domínio conectado ao casamento.
-- Tudo ou nada: se algum passo falhar, o banco volta ao estado anterior.
BEGIN;

-- CreateEnum
CREATE TYPE "DomainOrderStatus" AS ENUM ('REQUESTED', 'REGISTERING', 'REGISTERED', 'CONNECTED', 'REJECTED', 'CANCELED');

-- AlterTable
ALTER TABLE "weddings" ADD COLUMN "customDomain" TEXT;

-- CreateTable
CREATE TABLE "domain_orders" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "requestedByUserId" TEXT,
    "subscriptionId" TEXT,
    "domain" TEXT NOT NULL,
    "status" "DomainOrderStatus" NOT NULL DEFAULT 'REQUESTED',
    "holderName" TEXT NOT NULL,
    "holderDocument" TEXT NOT NULL,
    "holderEmail" TEXT NOT NULL,
    "holderPhone" TEXT NOT NULL,
    "adminNote" TEXT,
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "registeredAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3),
    "vercelState" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "domain_orders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "weddings_customDomain_key" ON "weddings"("customDomain");

-- CreateIndex
CREATE INDEX "domain_orders_status_requestedAt_idx" ON "domain_orders"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "domain_orders_weddingId_idx" ON "domain_orders"("weddingId");

-- Um domínio tem no máximo um pedido ativo (recusado e cancelado liberam o nome)
CREATE UNIQUE INDEX "domain_orders_domain_active_key" ON "domain_orders"("domain")
  WHERE "status" IN ('REQUESTED', 'REGISTERING', 'REGISTERED', 'CONNECTED');

-- Um casamento tem no máximo um pedido ativo
CREATE UNIQUE INDEX "domain_orders_weddingId_active_key" ON "domain_orders"("weddingId")
  WHERE "status" IN ('REQUESTED', 'REGISTERING', 'REGISTERED', 'CONNECTED');

-- AddForeignKey
ALTER TABLE "domain_orders" ADD CONSTRAINT "domain_orders_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_orders" ADD CONSTRAINT "domain_orders_requestedByUserId_fkey" FOREIGN KEY ("requestedByUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "domain_orders" ADD CONSTRAINT "domain_orders_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "subscriptions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- O módulo novo do painel (/dominio) entra no perfil "Casal" que já existe. O perfil guarda a lista de áreas
-- liberadas e quem ajustou a lista à mão mantém o resto: só acrescentamos a área nova, uma vez.
UPDATE "roles"
SET "allowedPaths" = ("allowedPaths"::jsonb || '["/dominio"]'::jsonb)
WHERE "name" = 'Casal'
  AND jsonb_typeof("allowedPaths"::jsonb) = 'array'
  AND NOT ("allowedPaths"::jsonb ? '*')
  AND NOT ("allowedPaths"::jsonb ? '/dominio');

COMMIT;
