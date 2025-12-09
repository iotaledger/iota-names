#!/usr/bin/env bash
set -euo pipefail

# This script updates the auction durations in packages/auction/sources/auction.move
# - AUCTION_BIDDING_PERIOD_MS -> 20 seconds (20 * 1000)
# - AUCTION_MIN_QUIET_PERIOD_MS -> 10 seconds (10 * 1000)

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
# Go two levels up from dapp/scripts to reach the repo root
REPO_ROOT="$(cd -- "$SCRIPT_DIR/../.." && pwd)"
FILE="$REPO_ROOT/packages/auction/sources/auction.move"

if [[ ! -f "$FILE" ]]; then
  echo "Error: target file not found: $FILE" >&2
  exit 1
fi

echo "Updating auction durations in: $FILE"

TMP_FILE="$(mktemp)"
sed -E \
  -e 's/^(const[[:space:]]+AUCTION_BIDDING_PERIOD_MS:[[:space:]]*u64[[:space:]]*=[[:space:]]*)[^;]+;/\1 20 * 1000;/' \
  -e 's/^(const[[:space:]]+AUCTION_MIN_QUIET_PERIOD_MS:[[:space:]]*u64[[:space:]]*=[[:space:]]*)[^;]+;/\1 10 * 1000;/' \
  "$FILE" > "$TMP_FILE"

if cmp -s "$FILE" "$TMP_FILE"; then
  rm -f "$TMP_FILE"
  echo "No changes made (values already set)."
  exit 0
fi

mv "$TMP_FILE" "$FILE"

echo "Done."
echo "New values:"
grep -nE "AUCTION_(BIDDING_PERIOD_MS|MIN_QUIET_PERIOD_MS)" "$FILE" || true
