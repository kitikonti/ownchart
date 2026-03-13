# OwnChart Design System Architecture

> How styling is organized, where tokens live, and which layer to use when.

## Overview

OwnChart uses a **layered design system** where each layer serves a distinct purpose. This is intentional — not every styling concern belongs in the same tool.

## The 5 Layers

### 1. Shared Color Definitions (`src/styles/colors.js`)

**Single source of truth** for color palettes. Plain JS so it can be imported by both TypeScript and the Tailwind config (which runs in Node.js/PostCSS context).

Exports: `neutral`, `brand`, `semantic`, `surface`

### 2. Tailwind CSS (`tailwind.config.js` + utility classes)

**Primary styling tool** for static UI: layout, spacing, colors, typography, borders, shadows.

- Imports color scales from `colors.js`
- Used via `className` props in 65+ component files
- Shadows, radii, transitions, and animations defined inline in config (these have small, stable subsets that rarely change)

**When to use**: Any static styling that can be expressed as utility classes.

### 3. Global CSS (`src/index.css`)

**Complex interactive components** that benefit from CSS selectors over utility classes:

- Ribbon tabs (`.ribbon-tab`, `.ribbon-tab-active`)
- Toolbar buttons (`.ribbon-toolbar-button` with `data-variant`, `aria-pressed`)
- File menu items (`.file-menu-item`)
- Dropdown system (`.dropdown-panel`, `.dropdown-item`, `.dropdown-trigger`)
- Context menus (`.context-menu-container`, `.context-menu-item`)
- Form controls (checkbox, radio, select, input)
- Density mode switching (`.density-compact`, `.density-comfortable`)
- Scrollbar styling, animations, focus overrides

Also contains **CSS custom properties** in `:root`:

- `--color-neutral-*`, `--color-accent`, `--color-surface`, `--color-border-*`, `--color-text-*` — consumed by the CSS component classes above
- `--density-*` — consumed by both CSS and a few TypeScript components for responsive sizing
- `--shadow-*`, `--radius-*`, `--transition-*` — consumed within CSS rules

**When to use**: Complex interactive states driven by CSS selectors, attribute-based styling (`data-*`, `aria-*`), density-aware sizing.

### 4. TypeScript Design Tokens (`src/styles/design-tokens.ts`)

**Runtime token access** for code that cannot use Tailwind classes:

- SVG/canvas rendering (chart bars, grid lines, dependency arrows, today marker)
- Dynamic JS calculations (cell styling, z-index stacking, toolbar dimensions)
- Export pipeline (PDF/SVG/PNG rendering)
- Toast configuration

Exports: `COLORS`, `SPACING`, `TYPOGRAPHY`, `RADIUS`, `SHADOWS`, `Z_INDEX`, `TRANSITIONS`, `TOOLBAR`, `CONTEXT_MENU`, `TABLE_HEADER`, `GRID`, `TIMELINE_HEADER`, `CONNECTION_HANDLE`, `CELL`, `PLACEHOLDER_CELL`, `ROW_NUMBER`, `TABLE_ROW`, `TOAST`

**When to use**: Any styling that must be computed in JavaScript — SVG attributes, dynamic inline styles, conditional logic.

### 5. Inline Styles

**Genuinely dynamic values** that cannot be expressed as static classes:

- Calculated dimensions (`height: contentAreaHeight`)
- Dynamic positioning (`left: scrollPosition`)
- Progress indicators (`width: progress + '%'`)
- Density-aware CSS variable references (`height: var(--density-row-height)`)

**When to use**: Only when the value is computed at runtime and cannot be a Tailwind class or CSS rule.

## Decision Guide

| Scenario | Use |
|----------|-----|
| Static layout, spacing, colors | Tailwind utility classes |
| Interactive hover/focus/active states | CSS classes in index.css |
| SVG fill/stroke colors | `COLORS` from design-tokens.ts |
| Z-index stacking | `Z_INDEX` from design-tokens.ts |
| Calculated dimensions | Inline `style={{}}` |
| Density-responsive sizing | CSS `var(--density-*)` |
| Adding a new color | Add to `colors.js`, used automatically by Tailwind and design-tokens |
| Adding a chart-specific token | Add to design-tokens.ts (chart-only scales like `coolGray`, `slate` live there) |

## Color Architecture

```
colors.js (canonical source)
  |
  +-- tailwind.config.js  (generates bg-neutral-*, text-brand-*, etc.)
  |
  +-- design-tokens.ts    (COLORS.neutral, COLORS.brand, etc.)
  |
  +-- index.css :root     (--color-neutral-*, --color-accent)
       NOTE: CSS cannot import from JS, so these are
       hard-coded hex values that match colors.js.
       Only the subset actually consumed by CSS rules is defined.
```

## Legal Status

- **All components are original work** — no UI library code used
- **No Fluent UI dependency** — zero packages, zero imports
- **Inter font** — SIL Open Font License (free, embeddable)
- **Phosphor Icons** — MIT License
- **All npm dependencies** — MIT or compatible open-source licenses
