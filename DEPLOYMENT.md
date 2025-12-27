# Deployment Guide for rfps.ai-app

This guide walks you through deploying the application to Vercel with domain `app.rfps.ai`.

## Prerequisites

- GitHub account with repository access
- Vercel account
- Supabase account
- Resend account
- API keys for: OpenAI, Exa/Tavily, Mem0

## Step 1: GitHub Repository Setup

### 1.1 Verify Repository Access

```bash
# Check current remote
git remote -v

# Should show:
# origin  https://github.com/tachafine/rfps.ai-app.git
```

### 1.2 Push Your Code

```bash
# If you have a branch to push:
git push -u origin claude/continue-work-01Ld64mntKDjUQP2xxgyUMAs

# Or push main branch:
git push -u origin main
```

### 1.3 Generate GitHub Personal Access Token (if needed)

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Generate new token with `repo` scope
3. Save the token securely

## Step 2: Supabase/PostgreSQL Database Setup

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down:
   - Project URL (e.g., `https://xxxxx.supabase.co`)
   - Anon/Public Key
   - Service Role Key (keep secret!)
   - Database Password

### 2.2 Get Database Connection String

1. In Supabase Dashboard → Settings → Database
2. Copy the connection string (URI format):
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
   ```

### 2.3 Run Database Migrations

```bash
# If you have migrations, run them:
pnpm db:migrate
# or
npx supabase db push
```

## Step 3: Resend Email Service Setup

### 3.1 Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up and verify your account
3. Create an API key in the dashboard
4. Verify your domain (optional but recommended)

### 3.2 Get API Key

1. Go to API Keys section
2. Create a new API key
3. Copy the key (starts with `re_`)

## Step 4: API Keys Setup

### 4.1 OpenAI API Key

1. Go to [platform.openai.com](https://platform.openai.com)
2. Navigate to API Keys
3. Create a new secret key
4. Copy the key (starts with `sk-`)

### 4.2 Exa/Tavily API Key

**For Exa:**
1. Go to [exa.ai](https://exa.ai)
2. Sign up and get your API key

**For Tavily:**
1. Go to [tavily.com](https://tavily.com)
2. Sign up and get your API key

### 4.3 Mem0 API Key

1. Go to [mem0.ai](https://mem0.ai) or your Mem0 provider
2. Get your API key

## Step 5: Generate Secrets

### 5.1 Generate BETTER_AUTH_SECRET

```bash
# Run the generate-secrets script
node scripts/generate-secrets.js

# Or manually generate:
openssl rand -base64 32
```

### 5.2 Generate CRON_SECRET

```bash
# Use the same script or:
openssl rand -base64 32
```

## Step 6: Configure Environment Variables

### 6.1 Local Environment Files

```bash
# Copy example files
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```

### 6.2 Fill in Environment Variables

Edit `apps/web/.env.local` and `apps/admin/.env.local` with:

```env
# Database
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]

# Auth
BETTER_AUTH_SECRET=[GENERATED_SECRET]
BETTER_AUTH_URL=http://localhost:3000

# Email
RESEND_API_KEY=re_[YOUR_KEY]

# AI Services
OPENAI_API_KEY=sk-[YOUR_KEY]
EXA_API_KEY=[YOUR_KEY]
# OR
TAVILY_API_KEY=[YOUR_KEY]
MEM0_API_KEY=[YOUR_KEY]

# Cron
CRON_SECRET=[GENERATED_SECRET]

# Environment
NODE_ENV=development
```

## Step 7: Deploy to Vercel

### 7.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 7.2 Login to Vercel

```bash
vercel login
```

### 7.3 Link Project

```bash
vercel link
```

### 7.4 Set Environment Variables in Vercel

```bash
# Set all environment variables
vercel env add DATABASE_URL
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add BETTER_AUTH_SECRET
vercel env add BETTER_AUTH_URL
vercel env add RESEND_API_KEY
vercel env add OPENAI_API_KEY
vercel env add EXA_API_KEY
vercel env add TAVILY_API_KEY
vercel env add MEM0_API_KEY
vercel env add CRON_SECRET
vercel env add NODE_ENV
```

Or use Vercel Dashboard:
1. Go to your project → Settings → Environment Variables
2. Add each variable for Production, Preview, and Development

### 7.5 Configure Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add `app.rfps.ai`
3. Configure DNS records as instructed:
   - Add CNAME record: `app` → `cname.vercel-dns.com`
   - Or A record as shown in Vercel dashboard

### 7.6 Deploy

```bash
# Deploy to production
vercel --prod

# Or push to main branch (if connected to GitHub)
git push origin main
```

## Step 8: Verify Deployment

### 8.1 Check Deployment Status

1. Go to Vercel Dashboard
2. Verify deployment is successful
3. Check logs for any errors

### 8.2 Test Cron Jobs

1. Go to Vercel Dashboard → Settings → Cron Jobs
2. Verify cron job is configured
3. Test the cron endpoint: `https://app.rfps.ai/api/cron?secret=[CRON_SECRET]`

### 8.3 Test Application

1. Visit `https://app.rfps.ai`
2. Test authentication
3. Test API endpoints
4. Check database connections

## Step 9: Post-Deployment

### 9.1 Update BETTER_AUTH_URL

Update `BETTER_AUTH_URL` in Vercel environment variables:
```
BETTER_AUTH_URL=https://app.rfps.ai
```

### 9.2 Configure CORS (if needed)

Update CORS settings in your application to allow `app.rfps.ai`

### 9.3 Set up Monitoring

- Configure error tracking (Sentry, etc.)
- Set up uptime monitoring
- Configure log aggregation

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify DATABASE_URL is correct
   - Check Supabase firewall settings
   - Ensure IP is whitelisted (Vercel IPs)

2. **Cron Jobs Not Running**
   - Verify CRON_SECRET matches
   - Check vercel.json cron configuration
   - Verify endpoint is accessible

3. **Environment Variables Not Loading**
   - Ensure variables are set for correct environment
   - Redeploy after adding variables
   - Check variable names match code

4. **Domain Not Resolving**
   - Verify DNS records
   - Wait for DNS propagation (up to 48 hours)
   - Check domain configuration in Vercel

## Security Checklist

- [ ] All secrets are in environment variables (not in code)
- [ ] BETTER_AUTH_SECRET is strong and unique
- [ ] CRON_SECRET is strong and unique
- [ ] Database credentials are secure
- [ ] API keys are restricted to necessary scopes
- [ ] CORS is properly configured
- [ ] HTTPS is enforced
- [ ] Environment variables are set for correct environments

## Support

For issues, check:
- Vercel logs: Dashboard → Deployments → [Deployment] → Logs
- Application logs
- Database logs in Supabase dashboard











