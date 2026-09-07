-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "data" BYTEA;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarData" BYTEA,
ADD COLUMN     "avatarMime" TEXT;
