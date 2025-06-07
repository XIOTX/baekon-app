# Fix Failed Migration on Railway

## Problem
Migration `20250607060307_cloudinary_updates` failed during Railway deployment with error P3009.

## Solution Options

### Option 1: Reset and Reapply (RECOMMENDED)
If your production database doesn't have critical data yet:

```bash
# Connect to Railway and run:
npx prisma migrate resolve --rolled-back 20250607060307_cloudinary_updates
npx prisma migrate deploy
```

### Option 2: Force Mark as Applied (if schema is already correct)
If the database schema is already in the correct state:

```bash
# Connect to Railway and run:
npx prisma migrate resolve --applied 20250607060307_cloudinary_updates
```

### Option 3: Reset All Migrations (NUCLEAR OPTION)
Only if database can be recreated:

```bash
# This will DROP ALL DATA
npx prisma migrate reset --force
```

## How to Execute on Railway

1. **Access Railway Console**: Go to your Railway project dashboard
2. **Open Database Console** or use Railway CLI
3. **Set DATABASE_URL**: Make sure it points to your Railway PostgreSQL
4. **Run the chosen command** from above

## Verify Fix

After running the fix, verify with:
```bash
npx prisma migrate status
```

Should show all migrations as applied successfully.

## Current Migration Content
The migration is trying to:
- DROP COLUMN "filename"
- DROP COLUMN "originalName"
- DROP COLUMN "mimetype"
- ADD COLUMN "name" TEXT NOT NULL DEFAULT ''
- ADD COLUMN "type" TEXT NOT NULL DEFAULT ''
- ADD COLUMN "cloudinaryPublicId" TEXT
