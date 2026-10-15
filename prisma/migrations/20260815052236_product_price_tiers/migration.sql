-- CreateTable
CREATE TABLE "ProductPriceTier" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "minQuantity" INTEGER NOT NULL,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "ProductPriceTier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductPriceTier_productId_idx" ON "ProductPriceTier"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductPriceTier_productId_minQuantity_key" ON "ProductPriceTier"("productId", "minQuantity");

-- AddForeignKey
ALTER TABLE "ProductPriceTier" ADD CONSTRAINT "ProductPriceTier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
