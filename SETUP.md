# Setup Guide for RFPs.ai

This guide will walk you through setting up RFPs.ai for local development.

## Prerequisites

Before you begin, ensure you have:

- **Node.js** ≥ 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** ≥ 8.0.0 (Install: `npm install -g pnpm`)
- **PostgreSQL** database (we recommend [Supabase](https://supabase.com))
- **Anthropic API key** (minimum requirement)

## Step 1: Clone and Install

```bash
# Clone the repository
git clone <your-repo-url>
cd rfps.ai-app

# Install dependencies
pnpm install
```

## Step 2: Set Up Database

### Option A: Using Supabase (Recommended)

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Project Settings → Database
4. Copy the **Connection string** (Transaction mode)
5. Use this as your `DATABASE_URL`

### Option B: Local PostgreSQL

```bash
# Create database
createdb rfpsai

# Connection string format:
# postgresql://username:password@localhost:5432/rfpsai
```

## Step 3: Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your editor
nano .env
```

### Minimum Required Variables

```env
# Database
DATABASE_URL="postgresql://..."

# Better Auth Secret (generate random 32+ char string)
BETTER_AUTH_SECRET="use-openssl-rand-base64-32-to-generate"

# AI Provider (at minimum Claude)
ANTHROPIC_API_KEY="sk-ant-xxxxx"
```

### Generate Better Auth Secret

```bash
# Use OpenSSL to generate a secure secret
openssl rand -base64 32
```

## Step 4: Get API Keys

### Required for Phase 1

1. **Anthropic (Claude)**
   - Sign up at [console.anthropic.com](https://console.anthropic.com)
   - Create an API key
   - Add to `.env` as `ANTHROPIC_API_KEY`

### Optional (can add later)

- **OpenAI**: [platform.openai.com](https://platform.openai.com)
- **Exa.AI**: [exa.ai](https://exa.ai)
- **Tavily**: [tavily.com](https://tavily.com)
- **Firecrawl**: [firecrawl.dev](https://firecrawl.dev)

## Step 5: Initialize Database

```bash
# Push the schema to your database
pnpm db:push

# (Optional) Open Drizzle Studio to view your database
pnpm db:studio
```

## Step 6: Start Development Server

```bash
# Start the dev server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Step 7: Create Your First User

Since there's no sign-up page yet, you'll need to create a user directly in the database:

### Option A: Using Drizzle Studio

```bash
# Open Drizzle Studio
pnpm db:studio

# Navigate to 'users' table and insert:
# - email: your@email.com
# - name: Your Name
# - emailVerified: true
# - role: admin
```

### Option B: Using SQL

```sql
INSERT INTO users (email, name, "emailVerified", role)
VALUES ('your@email.com', 'Your Name', true, 'admin');
```

## Troubleshooting

### Database Connection Issues

```bash
# Test your connection string
psql "postgresql://..."

# Or use Supabase SQL Editor to verify connection
```

### Environment Variable Issues

```bash
# Validate all env vars are loaded
pnpm dev

# Should show validation errors if any required vars are missing
```

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## Next Steps

Once you have the app running:

1. **Login**: Use the credentials you created
2. **Complete Profile**: Go to `/profile` and add your company info
3. **Try AI Search**: Go to `/search` and search for RFPs
4. **Explore Dashboard**: View the main dashboard at `/dashboard`

## Development Tips

### Database Management

```bash
# View database in browser
pnpm db:studio

# Generate migrations (when you change schema)
pnpm db:generate

# Push schema changes
pnpm db:push
```

### Hot Reload

The development server supports hot reload:
- Edit any file in `app/`, `components/`, or `lib/`
- Changes appear instantly in the browser

### Type Safety

TypeScript will catch errors as you code:
```bash
# Run type checking manually
pnpm tsc --noEmit
```

## Production Deployment

For production deployment to Vercel:

1. Push your code to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy!

Vercel will automatically:
- Build your Next.js app
- Set up Edge Functions
- Configure preview deployments

## Getting Help

- Check the [README.md](./README.md) for architecture details
- Review the Statement of Work for feature specifications
- Open an issue in the repository

---

**Happy coding!** 🚀
