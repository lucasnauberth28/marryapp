-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('PIX', 'CREDIT_CARD');

-- CreateEnum
CREATE TYPE "ExpenseType" AS ENUM ('CONTRACT', 'PURCHASE');

-- CreateEnum
CREATE TYPE "VendorPlanTier" AS ENUM ('FREE', 'PRO', 'MASTER');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'REJECTED';

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_vendorId_fkey";

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "purchaseUrl" TEXT,
ADD COLUMN     "storeName" TEXT,
ADD COLUMN     "type" "ExpenseType" NOT NULL DEFAULT 'CONTRACT',
ALTER COLUMN "vendorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "guests" ADD COLUMN     "category" TEXT,
ADD COLUMN     "checkInTime" TIMESTAMP(3),
ADD COLUMN     "companionsNames" TEXT,
ADD COLUMN     "confirmedCompanions" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "dietaryRestrictions" TEXT,
ADD COLUMN     "isPresent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentGuestId" TEXT,
ADD COLUMN     "tableId" TEXT;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "externalReference" TEXT,
ADD COLUMN     "fee" INTEGER DEFAULT 0,
ADD COLUMN     "guestName" TEXT,
ADD COLUMN     "thankYouSent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL;

-- CreateTable
CREATE TABLE "timeline_events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT NOT NULL DEFAULT 'Clock',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "timeline_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 10,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "buttons" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "rsvpDeadline" TIMESTAMP(3),
    "weddingDate" TIMESTAMP(3),
    "weddingLocation" TEXT,
    "weddingLocationUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#18181b',
    "heroImageUrl" TEXT,
    "welcomeText" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "allowedPaths" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_balance" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wallet_balance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_cards" (
    "id" TEXT NOT NULL,
    "bank" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "nickname" TEXT,
    "lastDigits" TEXT,
    "limit" INTEGER NOT NULL DEFAULT 0,
    "color" TEXT DEFAULT '#18181b',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_customization" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "slug" TEXT NOT NULL DEFAULT 'lucas-e-giovanna',
    "customDomain" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Lucas & Giovanna',
    "subtitle" TEXT NOT NULL DEFAULT 'Vamos nos casar!',
    "weddingDate" TIMESTAMP(3),
    "ceremonyTime" TEXT DEFAULT '16:30',
    "receptionTime" TEXT DEFAULT '18:30',
    "locationName" TEXT DEFAULT 'Espaço Monte Castelo',
    "locationAddress" TEXT DEFAULT 'Rua das Flores, 1200 - São Paulo, SP',
    "locationMapUrl" TEXT,
    "wazeUrl" TEXT,
    "uberUrl" TEXT,
    "themeColor" TEXT NOT NULL DEFAULT '#8C6D45',
    "fontFamily" TEXT NOT NULL DEFAULT 'serif',
    "heroImageUrl" TEXT,
    "couplePhotoUrl" TEXT,
    "dressCodeTitle" TEXT DEFAULT 'Passeio Completo',
    "dressCodeDesc" TEXT,
    "dressCodePalette" TEXT,
    "spotifyPlaylistUrl" TEXT,
    "welcomeMessage" TEXT,
    "showStory" BOOLEAN NOT NULL DEFAULT true,
    "showLocation" BOOLEAN NOT NULL DEFAULT true,
    "showDressCode" BOOLEAN NOT NULL DEFAULT true,
    "showTips" BOOLEAN NOT NULL DEFAULT true,
    "showGifts" BOOLEAN NOT NULL DEFAULT true,
    "showRsvp" BOOLEAN NOT NULL DEFAULT true,
    "showGuestbook" BOOLEAN NOT NULL DEFAULT true,
    "showMusic" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_customization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_story_items" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "dateLabel" TEXT,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wedding_story_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wedding_tips" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "linkUrl" TEXT,
    "discountCode" TEXT,
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wedding_tips_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_book_entries" (
    "id" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "imageUrl" TEXT,
    "isApproved" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guest_book_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_vendors" (
    "id" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "coverUrl" TEXT,
    "galleryImages" TEXT,
    "startingPrice" INTEGER,
    "averageTicket" INTEGER,
    "priceRange" TEXT DEFAULT '$$',
    "documentType" TEXT DEFAULT 'CNPJ',
    "documentNumber" TEXT,
    "curationStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "curationNotes" TEXT,
    "serviceRegions" TEXT,
    "hasPhysicalSpace" BOOLEAN NOT NULL DEFAULT false,
    "address" TEXT,
    "offersOnlineMeet" BOOLEAN NOT NULL DEFAULT true,
    "phone" TEXT,
    "whatsapp" TEXT,
    "instagram" TEXT,
    "tiktok" TEXT,
    "website" TEXT,
    "planTier" "VendorPlanTier" NOT NULL DEFAULT 'FREE',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_vendors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_reviews" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "coupleNames" TEXT NOT NULL,
    "weddingDate" TIMESTAMP(3),
    "rating" INTEGER NOT NULL DEFAULT 5,
    "comment" TEXT NOT NULL,
    "isVerified" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_leads" (
    "id" TEXT NOT NULL,
    "vendorId" TEXT NOT NULL,
    "coupleName" TEXT NOT NULL,
    "couplePhone" TEXT NOT NULL,
    "coupleEmail" TEXT,
    "weddingDate" TIMESTAMP(3),
    "guestCount" INTEGER,
    "message" TEXT,
    "meetingType" TEXT DEFAULT 'ONLINE',
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendor_leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_parentGuestId_fkey" FOREIGN KEY ("parentGuestId") REFERENCES "guests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "guests" ADD CONSTRAINT "guests_tableId_fkey" FOREIGN KEY ("tableId") REFERENCES "tables"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_reviews" ADD CONSTRAINT "vendor_reviews_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partner_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_leads" ADD CONSTRAINT "vendor_leads_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "partner_vendors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

