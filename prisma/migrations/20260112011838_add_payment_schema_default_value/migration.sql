-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "method" SET DEFAULT 'card',
ALTER COLUMN "provider" SET DEFAULT 'kakaopay';
