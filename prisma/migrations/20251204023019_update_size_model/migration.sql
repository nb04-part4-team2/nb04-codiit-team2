/*
  Warnings:

  - You are about to drop the column `en` on the `size` table. All the data in the column will be lost.
  - You are about to drop the column `ko` on the `size` table. All the data in the column will be lost.
  - Added the required column `size` to the `size` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "size" DROP COLUMN "en",
DROP COLUMN "ko",
ADD COLUMN     "size" JSONB NOT NULL;
