#!/usr/bin/env bash
#
# PostToolUse (Edit|Write|MultiEdit) — format + check the edited file with THIS
# repo's CI tools (prettier/eslint/tsc; see .github/workflows/check.yml) so
# Claude gets immediate feedback on its own edits.
#
#   format -> prettier --write <file>  (CI gate: prettier --check .)
#   lint   -> eslint <file>            (CI gate: npm run lint; warnings don't block)
#   types  -> tsc -b                   (CI gate: tsc -b; project-wide, no per-file mode)
#
# Formatting is applied in place. eslint-error/type failures are written to
# stderr with exit 2, which Claude Code feeds back so the error can be fixed
# in-flow. Only acts on files inside this repo ($CLAUDE_PROJECT_DIR).

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0
case "$file" in "$CLAUDE_PROJECT_DIR"/*) ;; *) exit 0 ;; esac
case "$file" in
  *.ts | *.tsx | *.js | *.jsx | *.json | *.jsonc | *.md | *.css) ;;
  *) exit 0 ;;
esac
cd "$CLAUDE_PROJECT_DIR" || exit 0

npx prettier --write "$file" >/dev/null 2>&1 || true

problems=""
case "$file" in
  *.ts | *.tsx | *.js | *.jsx)
    # eslint exits non-zero only on errors; warnings pass (matches CI).
    if ! out=$(npx eslint "$file" 2>&1); then
      problems+="[eslint]"$'\n'"$out"$'\n\n'
    fi
    ;;
esac
case "$file" in
  *.ts | *.tsx)
    # tsc uses project references — there is no reliable single-file mode, so
    # this is the whole-project build, same as CI.
    if ! out=$(npx tsc -b 2>&1); then
      problems+="[tsc -b]"$'\n'"$out"$'\n'
    fi
    ;;
esac

if [ -n "$problems" ]; then
  printf '%s' "$problems" >&2
  exit 2
fi
exit 0
