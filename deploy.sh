#!/bin/bash
set -e

echo "📦 Committing and pushing to GitHub..."
git add -A
git commit -m "${1:-update}" 2>/dev/null || echo "(nothing new to commit)"
git push origin main
echo "✅ Done — Railway will auto-deploy in ~2 minutes"
