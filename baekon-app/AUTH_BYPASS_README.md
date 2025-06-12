# 🚫 TEMPORARY AUTH BYPASS - IMPORTANT

## Current Status
Authentication is temporarily bypassed to allow app development to continue while auth issues are resolved.

## What's Bypassed
- User login/signup flow
- Session validation
- Authentication middleware

## What's Preserved
- All NextAuth configuration files
- Database schema and user models
- Auth hooks and infrastructure
- User ID system for data association

## Files Modified
- `src/app/page.tsx` - Added bypass flag and direct user ID

## How to Restore Authentication

### Step 1: Test Auth Components
1. Set `BYPASS_AUTH = false` in `src/app/page.tsx`
2. Test login flow at `/auth/signin`
3. Check session endpoint at `/api/auth/session`

### Step 2: Debug Common Issues
- Verify `NEXTAUTH_URL` includes `https://` protocol
- Check `NEXTAUTH_SECRET` is set in Railway environment
- Confirm `DATABASE_URL` connects to Railway PostgreSQL
- Test user exists: `gamebraicher@gmail.com`

### Step 3: Railway Environment Variables
Required variables in Railway dashboard:
```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=https://baekon-app-production-59d0.up.railway.app
OPENAI_API_KEY=sk-proj-...
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-secret
```

### Step 4: Test Endpoints
- `/api/test-db` - Database connectivity test
- `/api/auth/session` - Session validation
- `/auth/signin` - Login page

## Current User ID
App is using hardcoded user ID: `cmbmis8d60000p81ypu1paujm`

## Notes for Future Development
- All auth infrastructure remains intact
- User data is properly associated with user ID
- Easy toggle between bypass and normal auth
- No auth code needs to be rewritten

## Quick Re-enable
Change line 9 in `src/app/page.tsx`:
```typescript
const BYPASS_AUTH = false; // Restore normal auth
```
