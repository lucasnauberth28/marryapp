BEGIN;

-- Mesas em 3D: cenário escolhido pelo casal e código do link somente leitura.
ALTER TABLE "weddings" ADD COLUMN "tables3dScene" TEXT;
ALTER TABLE "weddings" ADD COLUMN "tables3dShareToken" TEXT;
CREATE UNIQUE INDEX "weddings_tables3dShareToken_key" ON "weddings"("tables3dShareToken");

COMMIT;
