BEGIN;

-- Login com Google: vínculo da conta com o provedor e marca de conta sem senha própria
ALTER TABLE "users" ADD COLUMN "hasPassword" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE "external_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "external_accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "external_accounts_provider_providerAccountId_key" ON "external_accounts"("provider", "providerAccountId");
CREATE UNIQUE INDEX "external_accounts_userId_provider_key" ON "external_accounts"("userId", "provider");

ALTER TABLE "external_accounts" ADD CONSTRAINT "external_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT;
