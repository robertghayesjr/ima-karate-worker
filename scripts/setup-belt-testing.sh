#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  IMA Karate — one-shot Belt-Testing setup
#
#  Runs every step I cannot do from a chat window:
#    1. Creates the BELT_TEST KV namespace on your Cloudflare account
#    2. Patches wrangler.toml with the returned KV id
#    3. Sets the three Worker secrets (MEMBERSTACK_SECRET_KEY,
#       ZAPIER_DOCUSIGN_HOOK_URL, ADMIN_TOKEN)
#    4. Deploys the Worker
#    5. Seeds the KV config for the Aug 29, 2026 test
#
#  Run this from the repo root:  bash scripts/setup-belt-testing.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

cd "$(dirname "$0")/.."

# Load .env if you use it (optional; falls back to interactive prompts).
if [[ -f ".env.setup" ]]; then
  # shellcheck disable=SC1091
  source .env.setup
fi

# ── Helpers ────────────────────────────────────────────────────────────────
prompt_secret() {
  local varname="$1" label="$2"
  local value="${!varname:-}"
  if [[ -z "$value" ]]; then
    read -r -s -p "$label: " value; echo
  fi
  echo "$value"
}

# ── 0. Prereqs ─────────────────────────────────────────────────────────────
command -v npx >/dev/null 2>&1 || { echo "❌ Please install Node.js/npm first."; exit 1; }
command -v jq  >/dev/null 2>&1 || echo "⚠️  'jq' not installed — output will be raw JSON."

echo "▶︎ Ensuring wrangler is available…"
npx --yes wrangler@3 --version >/dev/null

# Make sure you're logged into the right Cloudflare account.
echo
echo "▶︎ Verifying wrangler login…"
if ! npx wrangler whoami 2>&1 | grep -q "email"; then
  echo "You're not logged in. Running 'wrangler login' — a browser will open."
  npx wrangler login
fi

# ── 1. Create the KV namespace ─────────────────────────────────────────────
echo
echo "▶︎ Creating KV namespace 'BELT_TEST'…"
KV_OUT="$(npx wrangler kv:namespace create BELT_TEST 2>&1 || true)"
echo "$KV_OUT"

KV_ID="$(printf '%s' "$KV_OUT" | grep -oE 'id = "[^"]+"' | head -1 | sed 's/.*"\(.*\)".*/\1/')"

if [[ -z "$KV_ID" ]]; then
  echo
  echo "⚠️  Couldn't auto-detect the KV id (it may already exist)."
  echo "    Paste the id printed above, or find it via 'npx wrangler kv:namespace list':"
  read -r -p "BELT_TEST KV id: " KV_ID
fi

echo "✔︎ Using KV id: $KV_ID"

# ── 2. Patch wrangler.toml ─────────────────────────────────────────────────
if grep -q "REPLACE_WITH_BELT_TEST_KV_ID" wrangler.toml; then
  echo
  echo "▶︎ Writing KV id into wrangler.toml…"
  sed -i.bak "s|REPLACE_WITH_BELT_TEST_KV_ID|$KV_ID|" wrangler.toml
  echo "✔︎ wrangler.toml patched (backup at wrangler.toml.bak)."
else
  echo "ℹ︎ wrangler.toml already has a KV id — leaving it alone."
fi

# ── 3. Set the three Worker secrets ────────────────────────────────────────
echo
echo "▶︎ Setting Worker secrets…"

# Sensible default for the admin token so you don't have to invent one.
ADMIN_TOKEN_DEFAULT="wnFp8jv3U3wd-mgjb5g5f5YUg1TVYhOQAmZ4kq6r-Tk"

MS_KEY="$(prompt_secret MEMBERSTACK_SECRET_KEY  'Memberstack Admin API secret (sk_…)')"
ZAP_HOOK="$(prompt_secret ZAPIER_DOCUSIGN_HOOK_URL 'Zapier catch-hook URL for the DocuSign envelope Zap')"
ADMIN_TOKEN="${ADMIN_TOKEN:-$ADMIN_TOKEN_DEFAULT}"

echo "$MS_KEY"      | npx wrangler secret put MEMBERSTACK_SECRET_KEY
echo "$ZAP_HOOK"    | npx wrangler secret put ZAPIER_DOCUSIGN_HOOK_URL
echo "$ADMIN_TOKEN" | npx wrangler secret put ADMIN_TOKEN

echo
echo "▶︎ Your ADMIN_TOKEN is:"
echo "   $ADMIN_TOKEN"
echo "   (save this — you'll use it in the Authorization: Bearer header)"

# ── 4. Deploy ──────────────────────────────────────────────────────────────
echo
echo "▶︎ Deploying Worker…"
npx wrangler deploy

# ── 5. Seed the KV config for the Aug 29, 2026 test ────────────────────────
echo
echo "▶︎ Seeding belt-test config for August 29, 2026…"
curl -sS -X POST "https://ima.rob-hayes.com/__admin/belt-testing" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "testDate": "2026-08-29",
    "testDateDisplay": "August 29, 2026",
    "testDay": "Saturday",
    "lateFeeCutoff": "2026-08-27",
    "applicationCutoff": "2026-08-27",
    "location": "IMA Dojo — 1340 Main St., Louisville, CO 80027",
    "phone": "(303) 665-0339",
    "email": "madani@imakarate.com",
    "lateFeeCents": 5000,
    "manualAddonCents": 3000,
    "ccSurchargePct": 3
  }' | (jq . 2>/dev/null || cat)

echo
echo "✅ Done. Test flow:"
echo "   • Landing page: https://ima.rob-hayes.com/belt-testing"
echo "   • Thank-you:    https://ima.rob-hayes.com/belt-testing/thank-you"
echo "   • Admin:        https://ima.rob-hayes.com/__admin/belt-testing  (Bearer $ADMIN_TOKEN)"
echo
echo "🔜 Still to do (Memberstack + Zapier — see docs/belt-testing-manual-setup.md):"
echo "   1. Create 5 one-time Memberstack plans (Tiny Tiger \$60 → Brown \$365)"
echo "   2. Paste plan IDs into wrangler.toml (MS_PLAN_* vars) and 'npx wrangler deploy'"
echo "   3. Import the two Zapier zaps from docs/zapier-zaps/"
echo "   4. Set up the DocuSign template tabs — see docs/docusign-template-fields.md"
