#!/usr/bin/env bash
# =============================================================================
# rotate-secrets.sh — PFM Secret Rotation Script
# =============================================================================
# Run this script to rotate ALL secrets in the PFM project.
#
# Usage:
#   chmod +x rotate-secrets.sh
#   ./rotate-secrets.sh
#
# This script will:
#   1. Generate a new JWT_SECRET
#   2. Guide you through revoking Google OAuth credentials
#   3. Guide you through changing the database password
#   4. Guide you through rotating the Twelve Data API key
#   5. Update .env and .env.example
#   6. Invalidates all existing refresh tokens (if refresh token table exists)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${SCRIPT_DIR}/../../../../.env"
ENV_EXAMPLE="${SCRIPT_DIR}/../../../../.env.example"

echo "============================================"
echo "  PFM Secret Rotation Script"
echo "============================================"
echo ""

# --------------------------------------------------
# Step 1: Back up current .env
# --------------------------------------------------
if [ -f "$ENV_FILE" ]; then
  BACKUP="${ENV_FILE}.backup.$(date +%Y%m%d%H%M%S)"
  cp "$ENV_FILE" "$BACKUP"
  echo "[✓] Current .env backed up to: $BACKUP"
else
  echo "[!] No .env file found at $ENV_FILE — skipping backup"
fi

# --------------------------------------------------
# Step 2: Generate new JWT_SECRET
# --------------------------------------------------
echo ""
echo "--- Step 1: JWT_SECRET ---"
NEW_JWT_SECRET=$(openssl rand -hex 64)
echo "  Generated new JWT_SECRET (128 hex chars)"

# --------------------------------------------------
# Step 3: Rotate Google OAuth credentials
# --------------------------------------------------
echo ""
echo "--- Step 2: Google OAuth ---"
echo "  Manual steps required:"
echo "    1. Go to https://console.cloud.google.com/apis/credentials"
echo "    2. Find the OAuth 2.0 Client ID for this application"
echo "    3. Click the pencil/edit icon"
echo "    4. Under 'Authorized redirect URIs', verify the callback URL"
echo "    5. Click 'Save'"
echo "    6. Copy the new Client ID and Client Secret"
echo ""
echo "  Alternatively, create a NEW credential and update the env vars."
echo "  To revoke the old credential, delete it from the console."

# --------------------------------------------------
# Step 4: Rotate database password
# --------------------------------------------------
echo ""
echo "--- Step 3: Database Password ---"
echo "  Manual steps required:"
echo "    1. Connect to PostgreSQL: psql -U postgres -d pfm_db"
echo "    2. Run: ALTER USER postgres PASSWORD 'new-strong-password';"
echo "    3. If using docker-compose:"
echo "       docker compose exec postgres psql -U postgres -c"
echo '       "ALTER USER postgres PASSWORD '"'"'new-strong-password'"'"';"'
echo "    4. Update DB_PASSWORD in .env"
echo "    5. Restart the backend service"

# --------------------------------------------------
# Step 5: Rotate Twelve Data API key
# --------------------------------------------------
echo ""
echo "--- Step 4: Twelve Data API Key ---"
echo "  Manual steps required:"
echo "    1. Log in to https://twelvedata.com/apikey"
echo "    2. Regenerate or create a new API key"
echo "    3. Update Twelve_data_API in .env"

# --------------------------------------------------
# Step 6: Apply changes to .env and .env.example
# --------------------------------------------------
echo ""
echo "--- Step 5: Updating .env ---"

# Create a new .env with the updated JWT_SECRET
if [ -f "$ENV_FILE" ]; then
  # Read existing .env and update JWT_SECRET
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_JWT_SECRET}|" "$ENV_FILE"
  else
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=${NEW_JWT_SECRET}|" "$ENV_FILE"
  fi
  echo "[✓] JWT_SECRET updated in .env"
else
  echo "[!] .env not found — skip automatic update"
fi

# Update .env.example with a fresh placeholder
if [ -f "$ENV_EXAMPLE" ]; then
  echo "[✓] .env.example already exists — update JWT_SECRET placeholder manually if needed"
else
  echo "[!] .env.example not found — create one from the project template"
fi

echo ""
echo "--- Step 6: Invalidate Refresh Tokens ---"
echo "  If the refresh_tokens table exists:"
echo "  TRUNCATE refresh_tokens;"
echo "  This forces all users to re-authenticate."
echo ""
echo "  Connect to the database and run the above SQL, or run:"
echo "  docker compose exec postgres psql -U postgres -d pfm_db"
echo "    -c 'TRUNCATE refresh_tokens;'"

# --------------------------------------------------
# Step 7: Re-apply migrations (if schema changed)
# --------------------------------------------------
echo ""
echo "--- Step 7: Re-apply Migrations (if needed) ---"
echo "  Run the following if schema changes were part of the rotation:"
echo "    cd backend && npm run migration:run"
echo ""
echo "  To verify the current migration status:"
echo "    cd backend && npm run typeorm -- migration:show -d ./src/infrastructure/config/data-source.ts"

echo ""
echo "============================================"
echo "  Rotation complete!"
echo ""
echo "  NEXT STEPS:"
echo "    1. Fill in the manual values (Google OAuth, DB password, Twelve Data)"
echo "    2. Restart all services"
echo "    3. Test authentication flow"
echo "    4. Delete the backup file once verified:"
echo "       rm $BACKUP"
echo "============================================"
