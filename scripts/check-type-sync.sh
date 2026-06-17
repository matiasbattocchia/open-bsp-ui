#!/usr/bin/env bash
#
# check-type-sync.sh — assist re-syncing the hand-written Supabase types in
# src/supabase/types/ with their source in open-bsp-api/_shared/types/.
#
# The UI mirrors the API's shared types but cannot use them verbatim:
#   - Deno `.ts` import extensions vs the UI's extensionless imports.
#   - The UI omits server-only deps (a2a_types, SQLToolConfig, agent-client) and
#     subsets several files (e.g. status_types keeps only the stored shapes).
#   - A handful of fields genuinely diverge, each tagged `// @ui-divergence`.
#
# So a re-sync is: paste the API file over the UI one, fix imports/prune, then
# re-apply the tagged divergences. This script lists those divergences and shows
# a comment/format-normalized diff per file so drift is easy to spot.
#
# Usage:  scripts/check-type-sync.sh
# Env:    API_TYPES_DIR  (default: ../open-bsp-api/supabase/functions/_shared/types)

set -euo pipefail

cd "$(dirname "$0")/.."
UI_DIR="src/supabase/types"
API_DIR="${API_TYPES_DIR:-../open-bsp-api/supabase/functions/_shared/types}"

# UI files that subset their API counterpart (API-only blocks are expected).
SUBSET_FILES=" status_types whatsapp_webhook_message_types whatsapp_endpoint_types whatsapp_webhook_payload_types instagram_webhook_payload_types "
# UI files with no API counterpart (skip the diff).
UI_ONLY_FILES=" ui_types database_types "

echo "==> UI divergences to re-apply after a paste (grep @ui-divergence:):"
grep -rn "@ui-divergence:" "$UI_DIR" || echo "  (none found)"
echo

if [ ! -d "$API_DIR" ]; then
  echo "!! API types dir not found: $API_DIR"
  echo "   Set API_TYPES_DIR to the open-bsp-api _shared/types path and re-run."
  exit 0
fi

# Strip line comments + blank lines and normalize `.ts` import extensions so the
# diff shows only structural type differences.
normalize() {
  sed -E 's#(from "[^"]*)\.ts"#\1"#; s#[[:space:]]+$##' "$1" \
    | grep -vE '^[[:space:]]*//' \
    | grep -vE '^[[:space:]]*$'
}

echo "==> Normalized diffs (< API only, > UI only):"
for ui in "$UI_DIR"/*.ts; do
  base="$(basename "$ui" .ts)"
  case "$UI_ONLY_FILES" in *" $base "*) continue ;; esac
  api="$API_DIR/$base.ts"
  if [ ! -f "$api" ]; then
    echo "  -- $base: no API counterpart, skipping"
    continue
  fi
  label=""
  case "$SUBSET_FILES" in *" $base "*) label=" (subset — API-only blocks expected)" ;; esac
  if diff <(normalize "$api") <(normalize "$ui") >/tmp/typesync.diff 2>&1; then
    echo "  == $base: in sync"
  else
    echo "  != $base$label"
    sed 's/^/       /' /tmp/typesync.diff
  fi
done
rm -f /tmp/typesync.diff
