#!/usr/bin/env bash
# .context/hooks/check-context.sh
# Pre-commit hook. Catches two classes of context drift that are decidable from
# the staged files alone:
#   1. package.json's packageManager changed but AGENTS.md still names the old one.
#   2. A staged ADR is missing its Status field.
#
# The third check — "a multi-file commit should add or reference an ADR" — needs
# the commit message, which git has not written yet when pre-commit runs. It
# lives in .context/hooks/check-commit-msg.sh and must be installed as a
# commit-msg hook. Installing it here instead reads the PREVIOUS commit's
# message: it blocks compliant commits and waves through non-compliant ones.
#
# Installed in this repo by following skills/groundwork/commands/init.md step 7.

set -e

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

staged_files="$(git diff --cached --name-only)"

# --- Rule 1: package.json change must be reflected in AGENTS.md ----------------------
# If the package manager changed, the context files lie. Fail fast.
if echo "$staged_files" | grep -q "^package.json$"; then
  if [ -f package.json ]; then
    pkg_mgr_full="$(node -e "console.log(require('./package.json').packageManager || '')" 2>/dev/null || true)"
    pkg_mgr="${pkg_mgr_full%%@*}"
    if [ -n "$pkg_mgr" ] && [ -f AGENTS.md ] && ! grep -qi "$pkg_mgr" AGENTS.md; then
      echo "context-check: package.json declares packageManager=$pkg_mgr but AGENTS.md does not mention it."
      echo "  Update AGENTS.md (or run the groundwork skill's \`document\` command)"
      exit 1
    fi
  fi
fi

# --- Rule 2: ADRs must declare a valid Status ----------------------------------------
for adr_file in $(echo "$staged_files" | grep -E '^docs/decisions/[0-9]{4}-.+\.md$' || true); do
  if [ -f "$adr_file" ]; then
    if ! grep -qE '^\*\*Status\*\*:\s*(proposed|accepted|superseded|deprecated)' "$adr_file"; then
      echo "context-check: $adr_file does not declare a valid Status."
      echo "  Expected one of: proposed | accepted | superseded by ADR-XXXX | deprecated"
      exit 1
    fi
  fi
done

exit 0
