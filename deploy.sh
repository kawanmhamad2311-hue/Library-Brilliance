#!/bin/bash
set -e
git add -A
git commit -m "${1:-update}" 2>/dev/null || true
git push origin main
echo "✅ شاندرا بۆ GitHub"
