#!/bin/bash
# Run steps 1 and 2 for Supabase admin setup
# Usage: bash scripts/setup-supabase-admin.sh [your_admin_password]
#
# Step 1: Run the SQL in supabase/migrations/ (drop anon select policy) in the Supabase SQL Editor
# Step 2: This script - requires: npm install, then "supabase login" (opens browser)

set -e
cd "$(dirname "$0")/.."
PROJECT_REF="iqkpbuetqfwmmiuwmslt"
SUPABASE="./node_modules/supabase/bin/supabase"

[ -x "$SUPABASE" ] || { echo "Run 'npm install' first."; exit 1; }

echo "Have you run the SQL from supabase/migrations/ (drop anon select policy) in the Supabase SQL Editor? (y/n)"
read -r ans
[ "$ans" = "y" ] || { echo "Run it first: Supabase Dashboard → SQL Editor → paste SQL from supabase/migrations/"; exit 1; }

echo ""
echo "Linking and deploying Edge Function..."
$SUPABASE link --project-ref "$PROJECT_REF" || {
  echo "Run '$SUPABASE login' first (opens browser), then re-run."
  exit 1
}

if [ -n "$1" ]; then
  $SUPABASE secrets set ADMIN_SECRET="$1"
else
  echo "Enter your admin password:"
  read -s ADMIN_PW
  $SUPABASE secrets set ADMIN_SECRET="$ADMIN_PW"
fi

$SUPABASE functions deploy admin-sends --no-verify-jwt
echo ""
echo "Done."
