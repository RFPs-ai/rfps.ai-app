#!/bin/bash

# Script to help set up Vercel environment variables
# Usage: ./scripts/setup-vercel-env.sh

set -e

echo "🚀 Vercel Environment Variables Setup"
echo "======================================"
echo ""
echo "This script will help you set environment variables in Vercel."
echo "Make sure you have:"
echo "  - Vercel CLI installed (npm i -g vercel)"
echo "  - Logged in to Vercel (vercel login)"
echo "  - Linked your project (vercel link)"
echo ""
read -p "Press Enter to continue..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Install it with: npm i -g vercel"
    exit 1
fi

echo ""
echo "📝 Setting up environment variables..."
echo ""

# Database variables
echo "Setting DATABASE_URL..."
vercel env add DATABASE_URL production

echo "Setting SUPABASE_URL..."
vercel env add SUPABASE_URL production

echo "Setting SUPABASE_ANON_KEY..."
vercel env add SUPABASE_ANON_KEY production

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
vercel env add SUPABASE_SERVICE_ROLE_KEY production

# Auth variables
echo "Setting BETTER_AUTH_SECRET..."
vercel env add BETTER_AUTH_SECRET production

echo "Setting BETTER_AUTH_URL..."
echo "⚠️  IMPORTANT: Set BETTER_AUTH_URL to https://app.rfps.ai for production"
vercel env add BETTER_AUTH_URL production

# Email
echo "Setting RESEND_API_KEY..."
vercel env add RESEND_API_KEY production

# AI Services
echo "Setting OPENAI_API_KEY..."
vercel env add OPENAI_API_KEY production

echo "Setting EXA_API_KEY..."
vercel env add EXA_API_KEY production

echo "Setting TAVILY_API_KEY..."
vercel env add TAVILY_API_KEY production

echo "Setting MEM0_API_KEY..."
vercel env add MEM0_API_KEY production

# Cron
echo "Setting CRON_SECRET..."
vercel env add CRON_SECRET production

# Environment
echo "Setting NODE_ENV..."
vercel env add NODE_ENV production

echo ""
echo "✅ Environment variables setup complete!"
echo ""
echo "⚠️  Note: You'll need to set the same variables for Preview and Development environments"
echo "   You can do this in the Vercel Dashboard or by running this script again with different environment flags"
echo ""
echo "Next steps:"
echo "  1. Verify all variables in Vercel Dashboard"
echo "  2. Set BETTER_AUTH_URL to https://app.rfps.ai for production"
echo "  3. Deploy: vercel --prod"











