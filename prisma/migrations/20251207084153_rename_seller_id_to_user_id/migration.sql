/*
  Warnings:

  - You are about to drop the column `sellerId` on the `stores` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `stores` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `stores` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "stores" DROP CONSTRAINT "stores_sellerId_fkey";

-- DropIndex
DROP INDEX "stores_sellerId_key";

-- AlterTable
ALTER TABLE "stores" DROP COLUMN "sellerId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "stores_userId_key" ON "stores"("userId");

-- AddForeignKey
ALTER TABLE "stores" ADD CONSTRAINT "stores_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
