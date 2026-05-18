#!/usr/bin/env bash
# sync-translations.sh — Report missing or stale translation keys in en.json, pt.json, sw.json and fr.json.
# Usage: ./scripts/sync-translations.sh
# Exit code 1 if any drift is found, 0 otherwise.

set -euo pipefail
export LC_ALL=C

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
EN="$ROOT/public/locales/en.json"
PT="$ROOT/public/locales/pt.json"
SW="$ROOT/public/locales/sw.json"
FR="$ROOT/public/locales/fr.json"

# ── 1. Extract all t("...") keys from source ────────────────────────────────
CODE_KEYS=$(grep -roh 't("[^"]*")' "$ROOT/src/" --include='*.tsx' --include='*.ts' \
  | sed 's/^t("//;s/")$//' \
  | sort -u)

# ── 2. Filter out non-translatable keys ──────────────────────────────────────
SKIP_PATTERN='^$|^\*$|^\.$|^/$|^<>$|^ $|^-$|^a$|^y$|^,$'
SKIP_PATTERN+="|^api_key$|^email$|^error$|^files$|^url$"
SKIP_PATTERN+="|^dddd$|^HH:mm$|^l$|^m:ss$"
SKIP_PATTERN+="|^gpt-5-mini$|^nombre_de_plantilla$|^usuario@ejemplo\.com$"
SKIP_PATTERN+="|^\+54 9 11 1234 5678$|^https://ejemplo\.com/webhook$"
SKIP_PATTERN+="|^extra->>|^id,|^\*,"

FILTERED_KEYS=$(echo "$CODE_KEYS" | grep -Ev "$SKIP_PATTERN" || true)

# ── 3. Extract keys from JSON files ─────────────────────────────────────────
json_keys() {
  grep -oP '^\s*"[^"]*"\s*:' "$1" | sed 's/^\s*"//;s/"\s*:$//' | sort -u
}

EN_KEYS=$(json_keys "$EN")
PT_KEYS=$(json_keys "$PT")
SW_KEYS=$(json_keys "$SW")
FR_KEYS=$(json_keys "$FR")

# ── 4. Compare ───────────────────────────────────────────────────────────────
MISSING_EN=$(comm -23 <(echo "$FILTERED_KEYS") <(echo "$EN_KEYS"))
MISSING_PT=$(comm -23 <(echo "$FILTERED_KEYS") <(echo "$PT_KEYS"))
MISSING_SW=$(comm -23 <(echo "$FILTERED_KEYS") <(echo "$SW_KEYS"))
MISSING_FR=$(comm -23 <(echo "$FILTERED_KEYS") <(echo "$FR_KEYS"))
STALE_EN=$(comm -23 <(echo "$EN_KEYS") <(echo "$FILTERED_KEYS"))
STALE_PT=$(comm -23 <(echo "$PT_KEYS") <(echo "$FILTERED_KEYS"))
STALE_SW=$(comm -23 <(echo "$SW_KEYS") <(echo "$FILTERED_KEYS"))
STALE_FR=$(comm -23 <(echo "$FR_KEYS") <(echo "$FILTERED_KEYS"))

DRIFT=0

if [[ -n "$MISSING_EN" ]]; then
  echo "❌ Missing from en.json ($(echo "$MISSING_EN" | wc -l) keys):"
  echo "$MISSING_EN" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$MISSING_PT" ]]; then
  echo "❌ Missing from pt.json ($(echo "$MISSING_PT" | wc -l) keys):"
  echo "$MISSING_PT" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$MISSING_SW" ]]; then
  echo "❌ Missing from sw.json ($(echo "$MISSING_SW" | wc -l) keys):"
  echo "$MISSING_SW" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$MISSING_FR" ]]; then
  echo "❌ Missing from fr.json ($(echo "$MISSING_FR" | wc -l) keys):"
  echo "$MISSING_FR" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$STALE_EN" ]]; then
  echo "⚠️  Stale in en.json ($(echo "$STALE_EN" | wc -l) keys):"
  echo "$STALE_EN" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$STALE_PT" ]]; then
  echo "⚠️  Stale in pt.json ($(echo "$STALE_PT" | wc -l) keys):"
  echo "$STALE_PT" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$STALE_SW" ]]; then
  echo "⚠️  Stale in sw.json ($(echo "$STALE_SW" | wc -l) keys):"
  echo "$STALE_SW" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ -n "$STALE_FR" ]]; then
  echo "⚠️  Stale in fr.json ($(echo "$STALE_FR" | wc -l) keys):"
  echo "$STALE_FR" | sed 's/^/  /'
  echo
  DRIFT=1
fi

if [[ "$DRIFT" -eq 0 ]]; then
  EN_COUNT=$(echo "$EN_KEYS" | wc -l)
  PT_COUNT=$(echo "$PT_KEYS" | wc -l)
  SW_COUNT=$(echo "$SW_KEYS" | wc -l)
  FR_COUNT=$(echo "$FR_KEYS" | wc -l)
  CODE_COUNT=$(echo "$FILTERED_KEYS" | wc -l)
  echo "✅ All translation keys are in sync ($CODE_COUNT code keys, $EN_COUNT en, $PT_COUNT pt, $SW_COUNT sw, $FR_COUNT fr)"
fi

exit "$DRIFT"
