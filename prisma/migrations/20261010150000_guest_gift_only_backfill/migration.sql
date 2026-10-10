-- Convidados criados só porque compraram um presente apareciam como "Confirmado".
-- Corrige apenas os registros que dá para identificar com certeza: o convidado nasceu junto
-- com o primeiro pagamento dele (diferença de segundos) e ninguém mexeu nele depois
-- (updatedAt igual ao createdAt, sem grupo, acompanhantes, mesa, vínculo, check-in nem convite enviado).
-- Quem respondeu ao convite ou foi editado pelo casal tem updatedAt diferente e fica como está.
-- Idempotente: depois de rodar, os registros deixam de ser CONFIRMED e não casam mais com o filtro.
-- Tudo ou nada: se algum passo falhar, o banco volta ao estado anterior.
BEGIN;

UPDATE "guests" g
SET "rsvpStatus" = 'PENDING',
    "category" = 'Só presenteou'
WHERE g."rsvpStatus" = 'CONFIRMED'
  AND g."category" IS NULL
  AND g."hasReceivedMessage" = false
  AND g."allowedCompanions" = 0
  AND g."confirmedCompanions" = 0
  AND g."companionsNames" IS NULL
  AND g."dietaryRestrictions" IS NULL
  AND g."parentGuestId" IS NULL
  AND g."tableId" IS NULL
  AND g."isPresent" = false
  AND g."checkInTime" IS NULL
  AND abs(extract(epoch FROM (g."updatedAt" - g."createdAt"))) < 2
  AND NOT EXISTS (SELECT 1 FROM "guests" c WHERE c."parentGuestId" = g."id")
  AND EXISTS (
    SELECT 1 FROM "transactions" t
    WHERE t."guestId" = g."id"
      AND t."createdAt" >= g."createdAt" - interval '2 seconds'
      AND t."createdAt" <= g."createdAt" + interval '10 seconds'
  );

COMMIT;
