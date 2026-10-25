BEGIN;

-- Modelos prontos do site do casal e galeria de fotos
ALTER TABLE "site_customization" ADD COLUMN "showGallery" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "site_customization" ADD COLUMN "template" TEXT NOT NULL DEFAULT 'classico';
ALTER TABLE "site_customization" ADD COLUMN "galleryUrls" TEXT;

COMMIT;
