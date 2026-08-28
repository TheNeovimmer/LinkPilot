-- CreateEnum
CREATE TYPE "ApplicationOfferFrequency" AS ENUM ('HOURLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "ApplicationOfferStatus" AS ENUM ('PENDING', 'NEGOTIATING', 'ACCEPTED', 'DECLINED');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "firstResponseAt" TIMESTAMP(3),
ADD COLUMN     "offerAmount" INTEGER,
ADD COLUMN     "offerCurrency" TEXT NOT NULL DEFAULT 'USD',
ADD COLUMN     "offerFrequency" "ApplicationOfferFrequency" NOT NULL DEFAULT 'YEARLY',
ADD COLUMN     "offerNotes" TEXT,
ADD COLUMN     "offerStatus" "ApplicationOfferStatus",
ADD COLUMN     "source" TEXT;

-- CreateIndex
CREATE INDEX "Application_userId_appliedAt_idx" ON "Application"("userId", "appliedAt");
