# BÆKON - Personal Command Center

A neon-lit digital personal command center for life organization and productivity. Built with Next.js, React, Tailwind CSS, Prisma, PostgreSQL, and OpenAI.

## Features

- **Schedule Management**: 7-day planner with 6-hour quarter blocks and hourly scheduling
- **Work & Life Sections**: AI-powered note organization for work and personal tasks
- **AI Assistant**: Integrated OpenAI chat for intelligent suggestions and task management
- **Real-time Updates**: Live schedule and note synchronization
- **Dark Neon UI**: Cyberpunk-inspired interface with custom fonts and animations

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript
- **Styling**: Tailwind CSS with custom neon theme
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4 integration
- **Deployment**: Railway

## Local Development

1. Clone the repository
2. Install dependencies: `bun install`
3. Set up environment variables (copy `.env.example` to `.env`)
4. Set up database: `bunx prisma db push`
5. Run development server: `bun dev`

## Railway Deployment

### Prerequisites
- Railway account (https://railway.app)
- OpenAI API key (https://platform.openai.com)

### Deploy Steps

1. **Create Railway Project**:
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Create new project
   railway create baekon-app
   ```

2. **Add PostgreSQL Database**:
   - In Railway dashboard, click "Add Service" → "Database" → "PostgreSQL"
   - Railway will automatically provide DATABASE_URL

3. **Set Environment Variables**:
   ```bash
   # Set required environment variables
   railway env set NEXTAUTH_SECRET="your-super-secure-secret-key"
   railway env set NEXTAUTH_URL="https://your-app-name.railway.app"
   railway env set OPENAI_API_KEY="your-openai-api-key"
   railway env set NODE_ENV="production"
   ```

4. **Deploy**:
   ```bash
   # Deploy to Railway
   railway up
   ```

The database will be automatically created and migrated on first deployment.

## Environment Variables

Required environment variables:

- `DATABASE_URL`: PostgreSQL connection string (provided by Railway)
- `NEXTAUTH_SECRET`: Secure random string for NextAuth.js
- `NEXTAUTH_URL`: Your app's URL (e.g., https://your-app.railway.app)
- `OPENAI_API_KEY`: Your OpenAI API key
- `NODE_ENV`: Set to "production" for deployment

## Project Structure

```
baekon-app/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/          # React components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility libraries
│   └── types/              # TypeScript definitions
├── prisma/                 # Database schema and migrations
├── public/                 # Static assets
└── ...config files
```

## Key Components

- **Header**: Navigation and clock display
- **Sidebar**: Date and month selection
- **MainPanel**: Schedule, work, and life views
- **DetailsPanel**: Selected time slot details
- **BottomPanel**: AI chat and controls

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details.
