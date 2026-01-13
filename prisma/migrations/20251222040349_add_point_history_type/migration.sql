/*
  Warnings:

  - Changed the type of `type` on the `point_history` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PointHistoryType" AS ENUM ('USE', 'EARN', 'EARN_CANCEL', 'REFUND');

-- AlterTable
ALTER TABLE "point_history" DROP COLUMN "type",
ADD COLUMN     "type" "PointHistoryType" NOT NULL;
