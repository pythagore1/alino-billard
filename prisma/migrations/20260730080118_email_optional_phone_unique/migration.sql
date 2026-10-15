-- AlterTable: email devient optionnel (inscription par téléphone seul possible)
ALTER TABLE "User" ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex: téléphone devient unique (peut servir d'identifiant de connexion)
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
