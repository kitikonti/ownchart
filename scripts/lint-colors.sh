#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# lint-colors.sh — Detect hardcoded color values outside the design system
#
# Single source of truth: src/styles/colors.js
# Allowed: design-tokens.ts, colors.js, colors.d.ts, colorPalettes.ts,
#          colorSwatches.ts, export/constants.ts (SVG_BACKGROUND_WHITE)
# Forbidden: hardcoded #hex, rgb(), rgba(), hsl(), hsla() in components,
#            hooks, config, and CSS files
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

VIOLATIONS=0

# ─── Helper ───────────────────────────────────────────────────────────────────
check_pattern() {
  local pattern="$1"
  local description="$2"
  shift 2
  local paths=("$@")

  local results
  results=$(grep -rn --include='*.ts' --include='*.tsx' --include='*.css' \
    -E "$pattern" "${paths[@]}" \
    --exclude='colors.js' \
    --exclude='colors.d.ts' \
    --exclude='design-tokens.ts' \
    --exclude='colorPalettes.ts' \
    --exclude='colorSwatches.ts' \
    --exclude='constants.ts' \
    --exclude='renderConstants.ts' \
    --exclude-dir='fonts' \
    --exclude-dir='node_modules' \
    --exclude-dir='dist' \
    2>/dev/null || true)

  if [ -n "$results" ]; then
    # Filter out comments (lines starting with // or * after whitespace) and
    # JSDoc examples, type annotations, and string comparisons in tests
    local filtered
    filtered=$(echo "$results" \
      | grep -v -E '//.*#[0-9a-fA-F]' \
      | grep -v -E '//.*rgba?\(' \
      | grep -v -E '/\*.*\*/' \
      | grep -v -E '^\s*\*' \
      | grep -v -E '\{/\*' \
      | grep -v '\.test\.' \
      | grep -v '\.spec\.' \
      || true)

    if [ -n "$filtered" ]; then
      echo -e "${RED}✗ ${description}${NC}"
      echo "$filtered" | head -20
      VIOLATIONS=$((VIOLATIONS + $(echo "$filtered" | wc -l)))
      echo ""
    fi
  fi
}

echo "🎨 Checking for hardcoded color values..."
echo ""

# ─── Check TS/TSX components, hooks, config ──────────────────────────────────

# Hex color values (#xxx, #xxxxxx, #xxxxxxxx)
# Exclude: Tailwind class strings (bg-slate-200, text-brand-600, etc.)
# Exclude: SVG url-encoded colors (%23...)
# Exclude: import paths, comments
check_pattern '"#[0-9a-fA-F]{3,8}"' \
  "Hardcoded hex color strings in components/hooks/config" \
  src/components src/hooks src/config

# rgb/rgba/hsl/hsla function calls
check_pattern 'rgba?\([0-9]' \
  "Hardcoded rgb()/rgba() values in components/hooks" \
  src/components src/hooks

check_pattern 'hsla?\([0-9]' \
  "Hardcoded hsl()/hsla() values in components/hooks" \
  src/components src/hooks

# ─── Check CSS for raw hex values (should use theme()) ────────────────────────
# #ffffff is excluded — pure white for text-on-brand buttons, not a gray scale value

css_hex=$(grep -n -E '#[0-9a-fA-F]{3,8}' src/index.css 2>/dev/null \
  | grep -v '/\*' \
  | grep -v '^\s*[0-9]*:\s*\*' \
  | grep -v '^\s*[0-9]*:\s*-' \
  | grep -v 'url(' \
  | grep -v 'theme(' \
  | grep -v '#ffffff' \
  || true)

if [ -n "$css_hex" ]; then
  echo -e "${RED}✗ Hardcoded hex values in index.css (use theme() instead)${NC}"
  echo "$css_hex" | head -20
  VIOLATIONS=$((VIOLATIONS + $(echo "$css_hex" | wc -l)))
  echo ""
fi

# ─── Result ───────────────────────────────────────────────────────────────────

if [ "$VIOLATIONS" -gt 0 ]; then
  echo -e "${RED}Found $VIOLATIONS hardcoded color violation(s).${NC}"
  echo ""
  echo -e "${YELLOW}How to fix:${NC}"
  echo "  • In TS/TSX: Use COLORS.slate[X] or COLORS.brand[X] from @/styles/design-tokens"
  echo "  • In JSX classes: Use Tailwind slate-X or brand-X utilities"
  echo "  • In CSS: Use theme(\"colors.slate.X\") or theme(\"colors.brand.X\")"
  echo "  • New colors: Add to src/styles/colors.js → colors.d.ts → design-tokens.ts"
  echo ""
  exit 1
else
  echo -e "${GREEN}✓ No hardcoded color violations found.${NC}"
fi
