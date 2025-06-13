# Railway Environment Variables Setup

## Required Environment Variables for Production Deployment

Set these environment variables in your Railway project settings:

### Database
```
DATABASE_URL=${{ Postgres.DATABASE_URL }}
```

### NextAuth Configuration
```
NEXTAUTH_SECRET=baekon-production-secret-2025-secure-key-xyz
NEXTAUTH_URL=https://baekon-app-production-59d0.up.railway.app
```

**CRITICAL**: The `NEXTAUTH_URL` must include the `https://` protocol. Common issues:
- Railway generates random domains like `project-name-production-abc123.up.railway.app`
- The domain changes if you redeploy or recreate the service
- **MUST include `https://` prefix** - without it NextAuth will fail
- Check Railway dashboard for the correct current domain
- Mismatched NEXTAUTH_URL causes sign-in/session issues

**Current Issue Detected**: The production `NEXTAUTH_URL` is missing `https://` protocol.
**Fix Required**: Update Railway environment variable from:
- ❌ `baekon-app-production-59d0.up.railway.app`
- ✅ `https://baekon-app-production-59d0.up.railway.app`

### OpenAI API
```
OPENAI_API_KEY=your-openai-api-key-here
```

**Note**: The actual API key (sk-proj-rjS4ZTHChSp_...) is set directly in Railway environment variables for security and is working correctly.

### Cloudinary Configuration
```
CLOUDINARY_CLOUD_NAME=db8ofx1mh
CLOUDINARY_API_KEY=347121289324585
CLOUDINARY_API_SECRET=1UWEkZKykvocdQ6d-2ULtvXI90Y
```

### Optional Debugging (Remove after fixing auth)
```
ALLOW_TEST_USER_CREATION=true
```
**Note**: Only set this temporarily to create test users. Remove after auth is working.

## Setup Instructions

1. Add PostgreSQL service to your Railway project
2. Add the above environment variables to your service
3. **CRITICAL**: Ensure `NEXTAUTH_URL` includes `https://` protocol
4. Deploy the `main` branch
5. Run database migrations if needed

## Debugging Steps

If authentication issues persist:

1. **Check Environment Variables**:
   - Visit `/api/auth/debug` to verify all environment variables
   - Ensure `NEXTAUTH_URL` includes `https://` protocol
   - Verify `hasSecret: true` and `hasDatabaseUrl: true`

2. **Test Auth Endpoints**:
   - `/api/auth/session` should return `{}` when not authenticated
   - `/api/auth/debug` should show environment status
   - `/test-no-auth` should load basic app

3. **Test Sign-in Flow**:
   - Go to `/auth/signin`
   - Test with existing user: `gamebraicher@gmail.com`
   - Check browser console for session callback logs

## Notes

- The database migration issue should be resolved with the current schema
- All API keys are production-ready (OpenAI API key updated to latest working version)
- The Cloudinary cloud is configured and active
- NextAuth session fixes have been applied in Version 30+
- OpenAI API integration is working correctly with the new key set in Railway variables

## Current Status

- ✅ NextAuth session endpoint working (no redirect loops)
- ✅ Database connected (1 user found)
- ✅ Environment variables present
- ❌ **NEXTAUTH_URL missing `https://` protocol** ← **FIX THIS FIRST**

**Next Step**: Update Railway environment variable `NEXTAUTH_URL` to include `https://` protocol, then test authentication flow.
