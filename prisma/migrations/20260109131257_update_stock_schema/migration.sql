/*
  Warnings:

  - You are about to drop the column `productId` on the `stocks` table. All the data in the column will be lost.
  - You are about to drop the column `sizeId` on the `stocks` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[product_id,size_id]` on the table `stocks` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `product_id` to the `stocks` table without a default value. This is not possible if the table is not empty.
  - Added the required column `size_id` to the `stocks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_productId_fkey";

-- DropForeignKey
ALTER TABLE "stocks" DROP CONSTRAINT "stocks_sizeId_fkey";

-- DropIndex
DROP INDEX "stocks_productId_sizeId_key";

-- AlterTable
ALTER TABLE "stocks" DROP COLUMN "productId",
DROP COLUMN "sizeId",
ADD COLUMN     "product_id" TEXT NOT NULL,
ADD COLUMN     "reserved_quantity" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "size_id" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stocks_product_id_size_id_key" ON "stocks"("product_id", "size_id");

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stocks" ADD CONSTRAINT "stocks_size_id_fkey" FOREIGN KEY ("size_id") REFERENCES "size"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
