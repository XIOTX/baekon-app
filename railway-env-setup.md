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
NEXTAUTH_URL=https://baekon-app-production.up.railway.app
```

### OpenAI API
```
OPENAI_API_KEY=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
```

### Cloudinary Configuration
```
CLOUDINARY_CLOUD_NAME=db8ofx1mh
CLOUDINARY_API_KEY=347121289324585
CLOUDINARY_API_SECRET=1UWEkZKykvocdQ6d-2ULtvXI90Y
```

## Setup Instructions

1. Add PostgreSQL service to your Railway project
2. Add the above environment variables to your service
3. Deploy the `db8ofx1mh` branch
4. Run database migrations if needed

## Notes

- The database migration issue should be resolved with the current schema
- All API keys are production-ready
- The Cloudinary cloud is configured and active
- NextAuth is configured for the production URL
