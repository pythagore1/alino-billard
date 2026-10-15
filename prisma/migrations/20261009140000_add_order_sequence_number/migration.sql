-- AlterTable
-- SERIAL crée la séquence et affecte automatiquement des valeurs croissantes
-- aux lignes existantes (par ordre physique), puis continue pour les futurs
-- inserts — aucun backfill manuel nécessaire.
ALTER TABLE "Order" ADD COLUMN "sequenceNumber" SERIAL;

-- CreateIndex
CREATE UNIQUE INDEX "Order_sequenceNumber_key" ON "Order"("sequenceNumber");
