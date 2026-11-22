#!/usr/bin/env bash
# .context/hooks/check-commit-msg.sh
# commit-msg hook. Requires a multi-file commit to add an ADR, reference one, or
# say explicitly that none is needed.
#
# This MUST be installed as a commit-msg hook, not a pre-commit one. git passes
# the path to the message file as $1, and only commit-msg receives it; at
# pre-commit time the message does not exist yet and .git/COMMIT_EDITMSG still
# holds the PREVIOUS commit's text. The guard below refuses to run in the wrong
# place rather than silently judging the wrong message.
#
# Installed in this repo by following skills/groundwork/commands/init.md step 7.

set -e

commit_msg_file="${1:-}"
if [ -z "$commit_msg_file" ] || [ ! -f "$commit_msg_file" ]; then
  echo "check-commit-msg: no commit message file was passed."
  echo "  This script must be installed as a commit-msg hook, which receives the"
  echo "  message path as its first argument. A pre-commit hook does not."
  exit 1
fi

repo_root="$(git rev-parse --show-toplevel)"
cd "$repo_root"

staged_files="$(git diff --cached --name-only)"

# git strips comment lines before storing the message; judge the same text it will.
commit_msg="$(git stripspace --strip-comments < "$commit_msg_file")"

file_count=$(echo "$staged_files" | grep -cE '\.(ts|tsx|js|jsx|py|rs|go|java|kt|rb|php|sql)$' || true)
threshold=5  # tune for your repo

if [ "$file_count" -gt "$threshold" ]; then
  # Explicit opt-out wins, and is checked first so opting out prints nothing.
  if echo "$commit_msg" | grep -q "no-adr-needed"; then
    exit 0
  fi
  if echo "$staged_files" | grep -qE '^docs/decisions/[0-9]{4}-.+\.md$'; then
    exit 0
  fi
  if echo "$commit_msg" | grep -qiE '(ADR-?[0-9]{4}|docs/decisions/[0-9]{4})'; then
    exit 0
  fi
  echo "check-commit-msg: This commit changes $file_count source files but does not add or reference an ADR."
  echo "  If a decision was made here, capture it: run the groundwork skill's \`adr\` command."
  echo "  If not, add 'no-adr-needed' to the commit message, or commit with --no-verify."
  exit 1
fi

exit 0
