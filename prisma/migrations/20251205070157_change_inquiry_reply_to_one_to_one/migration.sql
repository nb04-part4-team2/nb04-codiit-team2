/*
  Warnings:

  - A unique constraint covering the columns `[inquiryId]` on the table `replies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "replies_inquiryId_key" ON "replies"("inquiryId");
