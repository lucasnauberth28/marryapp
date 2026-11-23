-- Consumo da Liz (modelo de IA): uma linha por pergunta respondida, sem o texto.
CREATE TABLE "madrinha_usos" (
    "id" TEXT NOT NULL,
    "weddingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "custoEmMicroReais" INTEGER NOT NULL DEFAULT 0,
    "foraDoAssunto" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "madrinha_usos_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "madrinha_usos_weddingId_createdAt_idx" ON "madrinha_usos"("weddingId", "createdAt");
CREATE INDEX "madrinha_usos_createdAt_idx" ON "madrinha_usos"("createdAt");

ALTER TABLE "madrinha_usos" ADD CONSTRAINT "madrinha_usos_weddingId_fkey" FOREIGN KEY ("weddingId") REFERENCES "weddings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
