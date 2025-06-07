-- AlterTable
ALTER TABLE "files" DROP COLUMN "filename",
DROP COLUMN "originalName",
DROP COLUMN "mimetype",
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "type" TEXT NOT NULL DEFAULT '',
ADD COLUMN "cloudinaryPublicId" TEXT;
