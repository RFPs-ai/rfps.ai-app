# Quick Deployment Guide for app.rfps.ai

## 🚀 Essential Steps to Deploy

### 1. Connect Branch to Vercel

The project is already linked. To connect a new branch:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project `rfps-app`
3. Go to Settings → Git
4. Connect your GitHub repository if not already connected
5. Select the branch you want to deploy

### 2. Add Required Environment Variables (MUST be done BEFORE deploying)

> **Important:** The build will fail if these environment variables are not set. This is intentional - the application validates required configuration at build time to prevent runtime failures.

Go to **Vercel Dashboard → Project → Settings → Environment Variables** and add:

#### Required Variables (Minimum)

- **`DATABASE_URL`** 
  - Your Supabase PostgreSQL connection string
  - Format: `postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

- **`BETTER_AUTH_SECRET`**
  - Random string, 32+ characters
  - Generate with: `node scripts/generate-secrets.js`
  - Or manually: `openssl rand -base64 32`

- **`ANTHROPIC_API_KEY`**
  - Your Claude/Anthropic API key
  - Get from: https://console.anthropic.com/

#### Optional but Recommended

- **`BETTER_AUTH_URL`**
  - Set to: `https://app.rfps.ai` (for production)
  - Critical for authentication to work correctly

- **`NODE_ENV`**
  - Set to: `production`

### 3. Deploy!

Once environment variables are set:

**Option A: Via GitHub**
- Push to your main/production branch
- Vercel will automatically deploy

**Option B: Via CLI**
```bash
vercel --prod
```

## ✅ Verification Checklist

After deployment:

- [ ] Visit `https://app.rfps.ai` - should load correctly
- [ ] Test authentication flow
- [ ] Check Vercel Dashboard → Deployments for status
- [ ] Review logs for any errors

## 🔧 Generate Secrets

```bash
# Generate BETTER_AUTH_SECRET
node scripts/generate-secrets.js
```

## 📝 Domain Configuration

The domain `app.rfps.ai` is already configured in Vercel. DNS is resolving correctly.

## 🆘 Troubleshooting

**Build failing with "Invalid environment variables"?**
- This means required environment variables are not set
- Go to Vercel Dashboard → Settings → Environment Variables
- Add: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `ANTHROPIC_API_KEY`
- Redeploy after setting variables

**Application not loading?**
- Check environment variables are set for Production
- Verify `BETTER_AUTH_URL=https://app.rfps.ai` is set
- Check deployment logs in Vercel Dashboard

**Authentication not working?**
- Ensure `BETTER_AUTH_SECRET` is set (32+ characters)
- Verify `BETTER_AUTH_URL` matches your domain

**Database connection issues?**
- Verify `DATABASE_URL` is correct
- Check Supabase firewall allows Vercel IPs

## 📚 More Information

- Full deployment guide: `DEPLOYMENT.md`
- Deployment status: `DEPLOYMENT_STATUS.md`
- Verification script: `./scripts/verify-deployment.sh`

