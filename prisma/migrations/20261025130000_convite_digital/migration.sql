BEGIN;

-- Convite digital animado: escolha do casal sobre o nome do convidado e a frase do convite
ALTER TABLE "site_customization" ADD COLUMN "inviteGuestName" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "site_customization" ADD COLUMN "inviteMessage" TEXT;

COMMIT;
