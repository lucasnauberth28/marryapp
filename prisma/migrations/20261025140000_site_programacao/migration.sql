BEGIN;

-- Programação do casamento no site (jantar de boas-vindas, cerimônia, festa...)
ALTER TABLE "site_customization" ADD COLUMN "programJson" TEXT;

COMMIT;
