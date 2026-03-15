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

# Resolve Playwright version from installed package
PW_VERSION=$(node -e "console.log(require('./node_modules/@playwright/test/package.json').version)")
IMAGE="mcr.microsoft.com/playwright:v${PW_VERSION}-noble"

# Host UID/GID — passed into Docker so chown works without sudo on the host
HOST_UID=$(id -u)
HOST_GID=$(id -g)

# Directories that Docker (running as root) may create or modify
OWNED_DIRS="node_modules playwright-report test-results tests/e2e/visual-regression.spec.ts-snapshots"

UPDATE_FLAG=""
if [[ "${1:-}" == "--update" ]]; then
  UPDATE_FLAG="--update-snapshots"
fi

echo "Using Playwright Docker image: ${IMAGE}"
echo "Host UID:GID = ${HOST_UID}:${HOST_GID}"

docker run --rm -v "$(pwd)":/app -w /app "${IMAGE}" \
  bash -c "
    npm ci --ignore-scripts &&
    npx playwright install --with-deps chromium &&
    npx playwright test visual-regression --project=chromium ${UPDATE_FLAG}
    TEST_EXIT=\$?
    # Fix ownership of all Docker-created files back to host user
    chown -R ${HOST_UID}:${HOST_GID} ${OWNED_DIRS} 2>/dev/null || true
    exit \$TEST_EXIT
  "
