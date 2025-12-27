#!/bin/bash

# Script to verify deployment configuration for app.rfps.ai
# Usage: ./scripts/verify-deployment.sh

set -e

echo "🔍 Verifying Deployment Configuration for app.rfps.ai"
echo "======================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Install it with: npm i -g vercel${NC}"
    echo ""
fi

# Check if project is linked
if [ -d ".vercel" ]; then
    echo -e "${GREEN}✅ Project is linked to Vercel${NC}"
    if [ -f ".vercel/project.json" ]; then
        echo "   Project info found in .vercel/project.json"
    fi
else
    echo -e "${RED}❌ Project is not linked. Run: vercel link${NC}"
fi
echo ""

# Verify vercel.json exists and is valid
if [ -f "vercel.json" ]; then
    echo -e "${GREEN}✅ vercel.json found${NC}"
    
    # Check for required fields
    if grep -q '"buildCommand"' vercel.json; then
        echo "   ✓ Build command configured"
    fi
    if grep -q '"crons"' vercel.json; then
        echo "   ✓ Cron jobs configured"
    fi
    if grep -q '"headers"' vercel.json; then
        echo "   ✓ Security headers configured"
    fi
else
    echo -e "${RED}❌ vercel.json not found${NC}"
fi
echo ""

# Check DNS resolution
echo "🌐 Checking DNS resolution for app.rfps.ai..."
if command -v dig &> /dev/null; then
    DNS_RESULT=$(dig +short app.rfps.ai 2>&1)
    if [ -n "$DNS_RESULT" ] && [ "$DNS_RESULT" != "" ]; then
        echo -e "${GREEN}✅ DNS is resolving${NC}"
        echo "   Result: $DNS_RESULT"
    else
        echo -e "${YELLOW}⚠️  DNS may not be resolving yet${NC}"
        echo "   This could be normal if DNS was recently configured"
    fi
elif command -v nslookup &> /dev/null; then
    NSLOOKUP_RESULT=$(nslookup app.rfps.ai 2>&1 | grep -A 2 "Name:" | head -3)
    if [ -n "$NSLOOKUP_RESULT" ]; then
        echo -e "${GREEN}✅ DNS is resolving${NC}"
        echo "$NSLOOKUP_RESULT" | sed 's/^/   /'
    else
        echo -e "${YELLOW}⚠️  DNS may not be resolving yet${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Cannot check DNS (dig/nslookup not available)${NC}"
fi
echo ""

# Test HTTPS connectivity
echo "🔒 Testing HTTPS connectivity..."
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 https://app.rfps.ai 2>&1 || echo "000")
    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
        echo -e "${GREEN}✅ Domain is accessible via HTTPS (HTTP $HTTP_CODE)${NC}"
    elif [ "$HTTP_CODE" = "000" ]; then
        echo -e "${YELLOW}⚠️  Could not connect to https://app.rfps.ai${NC}"
        echo "   This might be normal if the domain is still propagating"
    else
        echo -e "${YELLOW}⚠️  Domain returned HTTP $HTTP_CODE${NC}"
        echo "   Check Vercel dashboard for deployment status"
    fi
else
    echo -e "${YELLOW}⚠️  curl not available to test connectivity${NC}"
fi
echo ""

# Environment variables checklist
echo "📋 Environment Variables Checklist"
echo "===================================="
echo ""
echo "Required environment variables for Production:"
echo ""
echo "  Database:"
echo "    [ ] DATABASE_URL"
echo "    [ ] SUPABASE_URL"
echo "    [ ] SUPABASE_ANON_KEY"
echo "    [ ] SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "  Auth:"
echo "    [ ] BETTER_AUTH_SECRET"
echo "    [ ] BETTER_AUTH_URL (must be: https://app.rfps.ai)"
echo ""
echo "  Email:"
echo "    [ ] RESEND_API_KEY"
echo ""
echo "  AI Services:"
echo "    [ ] ANTHROPIC_API_KEY (Claude) ⚠️ Required"
echo "    [ ] OPENAI_API_KEY (optional)"
echo "    [ ] EXA_API_KEY (or TAVILY_API_KEY) (optional)"
echo "    [ ] MEM0_API_KEY (optional)"
echo ""
echo "  Cron:"
echo "    [ ] CRON_SECRET"
echo ""
echo "  Environment:"
echo "    [ ] NODE_ENV=production"
echo ""
echo "⚠️  To verify environment variables:"
echo "   1. Go to Vercel Dashboard → Project → Settings → Environment Variables"
echo "   2. Or run: vercel env ls (if CLI is working)"
echo ""

# Summary
echo "📊 Verification Summary"
echo "======================="
echo ""
echo "Next steps:"
echo "  1. Verify all environment variables are set in Vercel Dashboard"
echo "  2. Ensure BETTER_AUTH_URL=https://app.rfps.ai in Production"
echo "  3. Check Vercel Dashboard → Deployments for latest deployment status"
echo "  4. Test the application at https://app.rfps.ai"
echo "  5. Verify cron jobs in Vercel Dashboard → Settings → Cron Jobs"
echo ""
echo "For detailed deployment guide, see: DEPLOYMENT.md"
echo ""

