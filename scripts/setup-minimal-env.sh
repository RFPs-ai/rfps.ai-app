#!/bin/bash

# Minimal environment variables setup for Vercel
# Usage: ./scripts/setup-minimal-env.sh

set -e

echo "🚀 Minimal Vercel Environment Variables Setup"
echo "=============================================="
echo ""
echo "This script will help you set the MINIMUM required environment variables."
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
echo "📝 Setting up MINIMUM required environment variables..."
echo ""
echo "⚠️  These are the minimum required variables:"
echo "   1. DATABASE_URL (Supabase)"
echo "   2. BETTER_AUTH_SECRET (32+ chars)"
echo "   3. ANTHROPIC_API_KEY (Claude)"
echo ""

# Database
echo "Setting DATABASE_URL..."
echo "   Enter your Supabase PostgreSQL connection string"
vercel env add DATABASE_URL production

# Auth
echo ""
echo "Setting BETTER_AUTH_SECRET..."
echo "   Generate with: node scripts/generate-secrets.js"
echo "   Or: openssl rand -base64 32"
vercel env add BETTER_AUTH_SECRET production

# AI Service
echo ""
echo "Setting ANTHROPIC_API_KEY..."
echo "   Get from: https://console.anthropic.com/"
vercel env add ANTHROPIC_API_KEY production

# Optional but recommended
echo ""
echo "Setting BETTER_AUTH_URL (recommended)..."
echo "   Set to: https://app.rfps.ai"
read -p "Do you want to set BETTER_AUTH_URL? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel env add BETTER_AUTH_URL production
fi

echo ""
echo "✅ Minimum environment variables setup complete!"
echo ""
echo "⚠️  Important:"
echo "   - Set BETTER_AUTH_URL=https://app.rfps.ai in Vercel Dashboard for production"
echo "   - Verify all variables in Vercel Dashboard → Settings → Environment Variables"
echo ""
echo "Next steps:"
echo "  1. Verify all variables in Vercel Dashboard"
echo "  2. Deploy: vercel --prod"
echo ""

