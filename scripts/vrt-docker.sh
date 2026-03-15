#!/usr/bin/env bash
#
# Run Playwright visual regression tests inside Docker.
# Automatically fixes file ownership so host user isn't left with root-owned files.
#
# Usage:
#   scripts/vrt-docker.sh                  # verify snapshots match
#   scripts/vrt-docker.sh --update         # generate / update baseline snapshots
#
set -euo pipefail

# Always run from repo root, regardless of where the script is called from
cd "$(dirname "$0")/.."

# --- Prerequisites -----------------------------------------------------------

if ! command -v docker &>/dev/null; then
  echo "Error: docker is not installed or not in PATH." >&2
  exit 1
fi

if [[ ! -d node_modules/@playwright/test ]]; then
  echo "Error: node_modules not found. Run 'npm install' first." >&2
  exit 1
fi

# --- Arguments ----------------------------------------------------------------

UPDATE_FLAG=""
case "${1:-}" in
  --update) UPDATE_FLAG="--update-snapshots" ;;
  "")       ;;
  *)
    echo "Usage: $0 [--update]" >&2
    exit 1
    ;;
esac

# --- Config -------------------------------------------------------------------

PW_VERSION=$(node -e "console.log(require('./node_modules/@playwright/test/package.json').version)")
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"

HOST_UID=$(id -u)
HOST_GID=$(id -g)

# Directories that Docker (running as root) may create or modify
OWNED_DIRS="node_modules playwright-report test-results tests/e2e/visual-regression.spec.ts-snapshots"

echo "Playwright ${PW_VERSION} | Docker image: ${IMAGE}"

# --- Run ----------------------------------------------------------------------

docker run --rm -v "$(pwd)":/app -w /app "${IMAGE}" \
  bash -c "
    npm ci --ignore-scripts &&
    npx playwright test visual-regression --project=chromium ${UPDATE_FLAG}
    TEST_EXIT=\$?
    chown -R ${HOST_UID}:${HOST_GID} ${OWNED_DIRS} 2>/dev/null || true
    exit \$TEST_EXIT
  "
