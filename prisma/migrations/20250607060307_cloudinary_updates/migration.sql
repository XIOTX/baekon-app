-- AlterTable
ALTER TABLE "files" DROP COLUMN "filename",
DROP COLUMN "originalName", 
DROP COLUMN "mimetype",
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "type" TEXT NOT NULL DEFAULT '',
ADD COLUMN "cloudinaryPublicId" TEXT;
EOF  
cd /home/project && cd /home/project/baekon-app && cat > prisma/migrations/20250607060307_cloudinary_updates/migration.sql << 'EOF'
-- AlterTable
ALTER TABLE "files" DROP COLUMN "filename",
DROP COLUMN "originalName", 
DROP COLUMN "mimetype",
ADD COLUMN "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN "type" TEXT NOT NULL DEFAULT '',
ADD COLUMN "cloudinaryPublicId" TEXT;
