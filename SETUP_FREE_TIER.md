# Free Tier Setup Guide

This guide walks you through setting up all required services using free tiers.

## Required Environment Variables

| Variable | Service | Free Tier |
|----------|---------|-----------|
| `DATABASE_URL` | Supabase | Yes (500MB) |
| `BETTER_AUTH_SECRET` | Generated locally | N/A |
| `ANTHROPIC_API_KEY` | Anthropic | $5 free credits |
| `BETTER_AUTH_URL` | Your domain | N/A |

---

## Step 1: Supabase Database (DATABASE_URL)

### 1.1 Create Account
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub (recommended) or email

### 1.2 Create New Project
1. Click "New Project"
2. Fill in:
   - **Name:** `rfps-ai` (or any name)
   - **Database Password:** Generate a strong password (save this!)
   - **Region:** Choose closest to your users
   - **Pricing Plan:** Free (default)
3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Get Connection String
1. Go to **Project Settings** (gear icon in sidebar)
2. Click **Database** in the left menu
3. Scroll to **Connection string** section
4. Select **URI** tab
5. Copy the connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with your database password

### 1.4 Your DATABASE_URL
```
postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

**Free Tier Limits:**
- 500MB database storage
- 2GB bandwidth per month
- 50MB file storage
- Unlimited API requests

---

## Step 2: Generate BETTER_AUTH_SECRET

Run this command locally:

```bash
cd /Users/tachafineelkendoussi/rfps.ai-app
node scripts/generate-secrets.js
```

Or generate manually:
```bash
openssl rand -base64 32
```

**Your generated secret:**
```
d2DoR2hxWahYSwwiQ+XPfE/jbp9w7VG9xQE7PCTjlEg=
```

(Already generated - use this or generate a new one)

---

## Step 3: Anthropic API Key (ANTHROPIC_API_KEY)

### 3.1 Create Account
1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Click "Sign up"
3. Sign up with Google or email
4. Verify your email

### 3.2 Get API Key
1. Once logged in, go to **API Keys** in the sidebar
2. Click "Create Key"
3. Name it: `rfps-ai-production`
4. Copy the key (starts with `sk-ant-`)

**Free Tier:**
- $5 free credits for new accounts
- No credit card required initially
- Credits expire after 14 days

---

## Step 4: Set BETTER_AUTH_URL

This is simply your production domain:

```
https://app.rfps.ai
```

---

## Step 5: Add Variables to Vercel

### 5.1 Go to Vercel Dashboard
1. Open [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `rfps-ai-app`
3. Go to **Settings** → **Environment Variables**

### 5.2 Add Each Variable

Click "Add New" for each:

| Key | Value | Environment |
|-----|-------|-------------|
| `DATABASE_URL` | `postgresql://postgres.[PROJECT-REF]:[PASSWORD]@...` | Production |
| `BETTER_AUTH_SECRET` | `d2DoR2hxWahYSwwiQ+XPfE/jbp9w7VG9xQE7PCTjlEg=` | Production |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Production |
| `BETTER_AUTH_URL` | `https://app.rfps.ai` | Production |

### 5.3 Save and Redeploy
1. Click "Save" after adding each variable
2. Go to **Deployments** tab
3. Find the latest deployment
4. Click the three dots (⋮) → "Redeploy"

---

## Step 6: Verify Deployment

After redeployment completes:

1. Visit [https://app.rfps.ai](https://app.rfps.ai)
2. Try logging in
3. Check the dashboard loads
4. Test the AI search feature

---

## Quick Reference: All Variables

```env
# Database (from Supabase)
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres

# Auth (generated)
BETTER_AUTH_SECRET=d2DoR2hxWahYSwwiQ+XPfE/jbp9w7VG9xQE7PCTjlEg=
BETTER_AUTH_URL=https://app.rfps.ai

# AI (from Anthropic)
ANTHROPIC_API_KEY=sk-ant-...
```

---

## Troubleshooting

### Build fails with "Invalid environment variables"
- Ensure all 4 required variables are set
- Check for typos in variable names
- Make sure variables are set for "Production" environment

### Database connection errors
- Verify DATABASE_URL is correct
- Check password doesn't have special characters that need escaping
- Try the "Session" connection string instead of "Transaction"

### Authentication not working
- Ensure BETTER_AUTH_URL matches your domain exactly
- Check BETTER_AUTH_SECRET is at least 32 characters

### AI features not working
- Verify ANTHROPIC_API_KEY is correct
- Check you have remaining credits at console.anthropic.com

---

## Cost Summary

| Service | Free Tier | Paid Tier (if needed) |
|---------|-----------|----------------------|
| Supabase | 500MB DB, 2GB bandwidth | $25/month (Pro) |
| Anthropic | $5 credits (14 days) | Pay-as-you-go |
| Vercel | Unlimited deploys (Hobby) | $20/month (Pro) |

**Total initial cost: $0**

---

## Support Links

- Supabase Docs: https://supabase.com/docs
- Anthropic Docs: https://docs.anthropic.com
- Vercel Docs: https://vercel.com/docs
- Project Issues: Check deployment logs in Vercel Dashboard

