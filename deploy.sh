#!/bin/bash
set -e

if [ -z "$RAILWAY_TOKEN" ]; then
  echo "❌ RAILWAY_TOKEN دانەنراوە."
  echo ""
  echo "   ١. بچۆ: https://railway.app/account/tokens"
  echo "   ٢. Token-ێک درووست بکە"
  echo "   ٣. لە Replit: Tools → Secrets → RAILWAY_TOKEN زیاد بکە"
  exit 1
fi

echo "🚂 دیپلۆی بۆ Railway..."
railway up --detach
echo "✅ شاندرا — https://railway.app بچۆ بۆ بینینی حاڵەتەکە"
