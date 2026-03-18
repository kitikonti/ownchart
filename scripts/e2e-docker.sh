#!/usr/bin/env bash
#
# Run Playwright E2E tests inside Docker.
# Automatically fixes file ownership so host user isn't left with root-owned files.
#
# Usage:
#   scripts/e2e-docker.sh                              # run all e2e tests
#   scripts/e2e-docker.sh tests/e2e/some.spec.ts       # run specific test file
#   scripts/e2e-docker.sh --project=chromium            # pass Playwright flags
#   scripts/e2e-docker.sh tests/e2e/some.spec.ts --project=chromium
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

# --- Config -------------------------------------------------------------------

PW_VERSION=$(node -e "console.log(require('./node_modules/@playwright/test/package.json').version)")
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"

HOST_UID=$(id -u)
HOST_GID=$(id -g)

# Directories that Docker (running as root) may create or modify
OWNED_DIRS="node_modules playwright-report test-results"

echo "Playwright ${PW_VERSION} | Docker image: ${IMAGE}"

# --- Run ----------------------------------------------------------------------

# All arguments are forwarded to `npx playwright test`
ARGS="${*}"

# Run tests inside Docker; always fix ownership on exit, even on failure/crash.
docker run --rm -v "$(pwd)":/app -w /app "${IMAGE}" \
  bash -c "
    cleanup() { chown -R ${HOST_UID}:${HOST_GID} ${OWNED_DIRS} 2>/dev/null || true; }
    trap cleanup EXIT
    npm ci --ignore-scripts &&
    npx playwright test ${ARGS}
  "
