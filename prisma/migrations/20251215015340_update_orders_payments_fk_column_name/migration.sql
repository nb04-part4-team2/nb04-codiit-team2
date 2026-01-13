/*
  Warnings:

  - A unique constraint covering the columns `[productId,sizeId]` on the table `stocks` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "stocks_productId_sizeId_key" ON "stocks"("productId", "sizeId");
