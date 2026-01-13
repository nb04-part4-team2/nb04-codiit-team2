/*
  Warnings:

  - The values [Pending,CompletedPayment,Failed,Cancelled] on the enum `PaymentStatus` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[impUid]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `method` to the `payments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('kakaopay', 'naverpay', 'tosspay');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('card', 'point', 'kakaopay', 'naverpay', 'tosspay');

-- AlterEnum
BEGIN;
CREATE TYPE "PaymentStatus_new" AS ENUM ('processing', 'pending', 'paid', 'failed', 'cancelled', 'completed');

ALTER TABLE "payments" ALTER COLUMN "status" TYPE "PaymentStatus_new" USING (
  CASE 
    WHEN "status"::text = 'CompletedPayment' THEN 'completed'::"PaymentStatus_new"
    ELSE "status"::text::"PaymentStatus_new"
  END
);

ALTER TYPE "PaymentStatus" RENAME TO "PaymentStatus_old";
ALTER TYPE "PaymentStatus_new" RENAME TO "PaymentStatus";
DROP TYPE "public"."PaymentStatus_old";
COMMIT;

-- DropIndex
DROP INDEX "payments_orderId_key";

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "errorCode" TEXT,
ADD COLUMN     "errorMessage" TEXT,
ADD COLUMN     "failedAt" TIMESTAMP(3),
ADD COLUMN     "impUid" TEXT,
ADD COLUMN     "method" "PaymentMethod" DEFAULT 'card' NOT NULL,
ADD COLUMN     "pgTid" TEXT,
ADD COLUMN     "provider" "PaymentProvider" DEFAULT 'kakaopay' NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "payments_impUid_key" ON "payments"("impUid");
