-- Tudo ou nada: se algum passo falhar, o banco volta ao estado anterior.
BEGIN;

-- Planos de casal valem para o casamento: preenche o casamento das cobranças antigas
-- (geradas antes de o checkout gravar o weddingId) a partir da conta que pagou.
UPDATE "subscriptions" AS s
SET "weddingId" = u."weddingId"
FROM "users" AS u
WHERE s."userId" = u."id"
  AND s."planType" = 'COUPLE'
  AND s."weddingId" IS NULL
  AND u."weddingId" IS NOT NULL;

COMMIT;
