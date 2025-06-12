# Railway Deployment Guide for BÆKON App

## Prerequisites
1. Railway account with CLI installed
2. PostgreSQL service added to your Railway project
3. All environment variables configured

## Deployment Methods

### Method 1: Railway.toml (Recommended)
This method uses the railway.toml configuration file for deployment.

#### Environment Variables Required:
```bash
DATABASE_URL=${{ Postgres.DATABASE_URL }}
NEXTAUTH_SECRET=baekon-production-secret-2025-secure-key-xyz
NEXTAUTH_URL=https://your-app-name.up.railway.app
OPENAI_API_KEY=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
CLOUDINARY_CLOUD_NAME=db8ofx1mh
CLOUDINARY_API_KEY=347121289324585
CLOUDINARY_API_SECRET=1UWEkZKykvocdQ6d-2ULtvXI90Y
NODE_ENV=production
PORT=3000
```

#### Deployment Steps:
1. Push code to your GitHub repository
2. Connect Railway to your GitHub repo
3. Set environment variables in Railway dashboard
4. Deploy the branch: `railway-deployment-fixes-YYYYMMDD-HHMMSS`

### Method 2: Docker Deployment (Backup)
If the railway.toml method fails, use Docker deployment.

#### Steps:
1. Railway will automatically detect the Dockerfile
2. Same environment variables as Method 1
3. Build process handled by Docker multi-stage build

## Common Issues & Solutions

### Build Failures
- **Prisma Generation**: Ensure DATABASE_URL is available during build
- **Missing Dependencies**: Check bun.lock is committed
- **TypeScript Errors**: Build ignores errors but check for critical issues

### Runtime Failures
- **Database Connection**: Verify DATABASE_URL format
- **Port Binding**: App listens on PORT environment variable
- **Health Check**: App responds on "/" path within 300 seconds

### Migration Issues
- **First Deploy**: Migrations run automatically via `prisma migrate deploy`
- **Schema Changes**: Ensure migrations are committed to repository

## Troubleshooting Commands

### Local Testing
```bash
# Test build locally
bun run build

# Test production start
bun run start

# Test with production env
NODE_ENV=production bun run start
```

### Railway CLI Debugging
```bash
# View logs
railway logs

# Check environment variables
railway variables

# Force redeploy
railway up --detach
```

## Health Check Endpoints
- Main app: `https://your-app.up.railway.app/`
- API health: `https://your-app.up.railway.app/api/health` (if implemented)

## Performance Optimizations
- Standalone Next.js build for smaller container size
- Multi-stage Docker build for optimized layers
- Prisma client generated during build time

## Security Notes
- All secrets stored as Railway environment variables
- No sensitive data in repository
- HTTPS enforced in production
