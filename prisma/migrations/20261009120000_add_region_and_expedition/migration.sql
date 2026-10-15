-- AlterEnum
ALTER TYPE "DeliveryMethodType" ADD VALUE 'EXPEDITION';

-- AlterTable: region ajouté en nullable, backfillé, puis contraint NOT NULL
-- (une migration directe en NOT NULL échouerait sur les lignes existantes).
ALTER TABLE "Order" ADD COLUMN "region" TEXT;
UPDATE "Order" SET "region" = 'Centre' WHERE "region" IS NULL;
ALTER TABLE "Order" ALTER COLUMN "region" SET NOT NULL;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "expeditionFeePercent" DOUBLE PRECISION NOT NULL DEFAULT 10;
