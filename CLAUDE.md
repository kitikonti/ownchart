# Claude AI Assistant Guide - OwnChart

> **This file provides context and workflow instructions for Claude AI when working on this project.**

## Project Overview

**OwnChart** - Privacy-first, offline Gantt chart for project planning. Own your data.

- **Live**: [ownchart.app](https://ownchart.app)
- **Tech Stack**: React 18 + TypeScript + Vite + Zustand + TailwindCSS + D3.js
- **Testing**: Vitest (unit) + Playwright (E2E) + 80%+ coverage
- **CI/CD**: GitHub Actions + GitHub Pages
- **Solo Project**: 100% vibe-coded by Martin

## File References

When the user references a file (screenshot, image, document, etc.) without providing a full path, always look for it in `/tmp/`.

## ⛔ CRITICAL SYSTEM CONSTRAINT - READ FIRST ⛔

### FORBIDDEN FILES - WILL CAUSE CRASH
The following files contain large base64 data and **WILL CRASH THIS SESSION** if you interact with them:
```
src/utils/export/fonts/interFontData.ts
src/utils/export/fonts/interItalicFontData.ts
src/utils/export/fonts/interSemiBoldFontData.ts
```

### BANNED COMMANDS ON THESE FILES (instant crash):
- ❌ `Read()` / `view`
- ❌ `head` / `tail` / `cat`
- ❌ `grep` (even with patterns!)
- ❌ ANY command that reads content

### THE ONLY SAFE COMMANDS:
- ✅ `ls -la <directory>` (not the file itself)
- ✅ `rm <file>` (delete)
- ✅ `mv <file>` (move/rename)

### KNOWN EXPORT NAMES (DO NOT VERIFY - TRUST THIS):
```typescript
// interFontData.ts exports:
export const INTER_REGULAR_BASE64 = "..."

// interItalicFontData.ts exports:
export const INTER_ITALIC_FONT_BASE64 = "..."

// interSemiBoldFontData.ts exports:
export const INTER_SEMIBOLD_BASE64 = "..."
```

### IF YOU NEED INFO ABOUT THESE FILES:
**STOP and ASK the user** to run the command and paste the result.

Example: "I need to check the export name in interFontData.ts. Could you run `grep '^export' src/utils/export/fonts/interFontData.ts` and paste the result?"

## Project Status

**Current Version**: See `package.json`. Full history in `CHANGELOG.md` and `docs/planning/ROADMAP.md`.

**Next Phase**: Phase 1.5 (V1.1) - Remaining Deferred Features & Extensibility

## Directory Structure

- `src/components/` — React components
- `src/store/` — Zustand slices (taskSlice, chartSlice, historySlice, clipboardSlice, uiSlice)
- `src/utils/` — Helper functions (including `fileOperations/`)
- `src/types/` — TypeScript interfaces; `src/hooks/` — Custom hooks
- `docs/` — All design docs (planning/, architecture/, sprints/, design/, process/)
- `tests/` — unit/, integration/, e2e/

## Key Architectural Patterns

**State Management**: Zustand slices with Immer middleware
- `taskSlice.ts` - Task CRUD, hierarchy, validation, multi-select
- `chartSlice.ts` - Timeline state, zoom, scales, drag state
- `historySlice.ts` - Undo/redo with Command Pattern
- `clipboardSlice.ts` - Copy/cut/paste with cross-tab support
- `uiSlice.ts` - Export dialog, help panel, welcome tour state

**Component Architecture**: Functional components with hooks
- Extract logic to custom hooks
- Keep components under 200 LOC
- Use `React.memo` for expensive renders

**Layout Pattern**: SVAR-style sticky scroll
- Sticky headers at App level
- Synchronized vertical scrolling
- Separate horizontal scroll per panel

## Development Workflow

### Before Any Code Changes

1. **Read the concept docs** if working on a new feature:
   ```bash
   docs/sprints/SPRINT_X.Y_*.md
   docs/planning/ROADMAP.md
   ```

2. **Check current sprint** status in ROADMAP.md

### Making Changes

```bash
npm run dev          # Start development
npm run lint         # Lint
npm run format       # Format
npm run type-check   # Type check
npm run test:unit    # Unit tests
npm run ci:local     # Full CI check
```

### Git Commit Standards

**Use Conventional Commits** (required for automated changelog):

```
feat: add new feature description
fix: resolve bug description
perf: improve performance description
refactor: restructure code description
test: add test coverage
docs: update documentation
chore: update dependencies
ui: improve UI/UX
```

**Git Commit Messages**:

Never use `$()` command substitution or heredocs for commit messages.
Use a single `-m` flag with a plain multiline string instead:

```bash
git commit -m "subject line

- bullet one
- bullet two"
```

**Commit Type → Version Bump**:
- `feat:` → MINOR version (0.0.1 → 0.1.0)
- `fix:`, `perf:` → PATCH version (0.1.0 → 0.1.1)
- `feat!:`, `BREAKING CHANGE:` → MAJOR version (0.1.1 → 1.0.0)
- `test:`, `docs:`, `chore:` → No release

### Release Management Workflow

**Release Process**:

```bash
# 1. Ensure all changes are committed
git status  # Should be clean

# 2. Run release (analyzes commits, bumps version, generates CHANGELOG)
npm run release

# 3. Push with tags
git push --follow-tags origin main
```

**Manual version control** (optional):
```bash
npm run release:patch  # 0.0.1 → 0.0.2
npm run release:minor  # 0.0.1 → 0.1.0
npm run release:major  # 0.0.1 → 1.0.0
npm run release:dry    # Preview without changes
```

## Claude AI Workflow Instructions

### ⛔ MANDATORY: Pre-Push CI Check

**Before EVERY `git push`**, run the full local CI check and fix any failures:

```bash
npm run ci:local
```

This includes linting, formatting, type-checking, and all unit tests. Do NOT push if any of these fail. Fix the issues first, amend or create a new commit, and re-run `ci:local` until it passes. Only then push.

### When Working on Features

1. **Always check sprint documentation first**:
   - Read `docs/sprints/SPRINT_*.md` for requirements
   - Check `docs/planning/ROADMAP.md` for phase/status
   - Review related architecture docs if needed

2. **Follow the concept documentation**:
   - Don't invent requirements - they're in the docs
   - If unclear, ask Martin before implementing
   - Update docs if architecture changes

3. **Write tests for new features**:
   - Unit tests for utilities and hooks
   - Integration tests for component interactions
   - Aim for 80%+ coverage

4. **Use proper commit messages**:
   - Follow Conventional Commits format
   - Be descriptive but concise
   - One logical change per commit

5. **Update help documentation**:
   - New user-facing feature → add HelpTopic to `src/config/helpContent.ts`
   - Changed shortcuts → update shortcuts section + helpContent.ts
   - Removed feature → remove its help topic

6. **Check export pipeline impact**:
   - Any change to task visibility or filtering MUST also be reflected in
     `src/utils/export/prepareExportTasks.ts` (single source of truth for export filtering)
   - Run the export dialog manually to verify changes render correctly in PNG/PDF/SVG

### When Fixing Bugs

1. **Reproduce the bug** with a test if possible
2. **Minimal fix** - don't refactor unrelated code
3. **Verify** tests still pass
4. **Commit** with `fix:` prefix

### When Refactoring

1. **Ensure tests pass** before starting
2. **No behavior changes** - only code structure
3. **Verify tests still pass** after
4. **Commit** with `refactor:` prefix

### Release Workflow for Claude

**When Martin asks to push OR says "let's release" or after completing a sprint**:

```bash
# 1. Check if all tests pass
npm run ci:local

# 2. Ensure everything is committed
git status

# 3. Run release command
npm run release

# 4. Review generated CHANGELOG.md
# (Claude should read it and summarize to Martin)

# 5. Push with tags
git push --follow-tags origin main

# 6. Confirm success
git log --oneline -n 5
git tag -l
```

**After release**:
- Inform Martin of new version number
- Summarize what's in the changelog
- Confirm tags were pushed successfully

### Push = Release Rule

**Whenever Martin asks to push** (e.g., "push", "push it", "push to main"), **ALWAYS run the full release workflow above first** — including `npm run release` and `git push --follow-tags`. Never do a bare `git push` without releasing.

### Documentation Updates

**When to update CLAUDE.md**:
- After major architectural changes
- After completing a sprint (update status)
- When adding new development patterns
- When tooling changes

## Important Files Reference

**Configuration**:
- `package.json` - Dependencies, scripts, version
- `tsconfig.json` - TypeScript strict mode
- `vite.config.ts` - Build config
- `.versionrc.json` - Release config (changelog format)

**Key Source Files**:
- `src/store/taskSlice.ts` - Core task state management
- `src/store/chartSlice.ts` - Timeline state and zoom
- `src/store/historySlice.ts` - Undo/redo system
- `src/utils/fileOperations/*` - File save/load with validation
- `src/components/App.tsx` - Root layout component

**Documentation Hub**:
- `docs/README.md` - Start here for all documentation
- `docs/planning/ROADMAP.md` - Development phases and status
- `docs/planning/PRD.md` - Product requirements
- `docs/architecture/TECHNICAL_ARCHITECTURE.md` - System design
- `docs/architecture/DATA_MODEL.md` - Data structures

## Testing Requirements

**Coverage Requirements**:
- Overall: ≥80%
- Critical modules: 100% (validation, file operations, history)

**Test Commands**:
```bash
npm test                    # Watch mode
npm run test:unit           # Unit tests with coverage
npm run test:integration    # Integration tests
npm run test:e2e            # E2E tests (Playwright)
```

**Visual Regression Tests** (`tests/e2e/visual-regression.spec.ts`):
- Baseline PNGs live in `tests/e2e/visual-regression.spec.ts-snapshots/` and are committed to git
- **Must be generated inside Docker** (CI runs Linux; local screenshots won't match)
- File ownership is fixed automatically — no manual `chown` needed
- Commands:
  ```bash
  npm run test:vrt           # Verify snapshots match
  npm run test:vrt:update    # Generate / update baseline snapshots
  ```
- Verify snapshots are deterministic by running `npm run test:vrt` after updating
- The script auto-detects the Playwright version from `node_modules`

**What to test**:
- ✅ Utility functions (pure functions)
- ✅ Custom hooks
- ✅ Component behavior (not implementation)
- ✅ User interactions (clicks, keyboard)
- ✅ Edge cases and error handling

**What NOT to test**:
- ❌ Implementation details
- ❌ Third-party libraries
- ❌ Styling (unless critical to UX)

## Color System (Issue #56)

**Single source of truth**: `src/styles/colors.js` defines all color palettes. Never duplicate hex values elsewhere.

**Architecture**:
- `colors.js` → defines `slate` (gray), `brand` (blue), `semantic`, `surface` scales
- `colors.d.ts` → TypeScript type declarations (must stay in sync with colors.js)
- `design-tokens.ts` → imports from colors.js, exports `COLORS.slate[X]`, `COLORS.brand[X]`, and section tokens (GRID, TABLE_HEADER, TOAST, etc.)
- `tailwind.config.js` → imports from colors.js, generates Tailwind utility classes
- `index.css` → uses `theme("colors.slate.X")` to reference colors (never hardcode hex)

**Rules — NEVER violate these**:
- ❌ **Never hardcode hex/rgb/hsl values** in components, hooks, or CSS
- ✅ In TS/TSX: use `COLORS.slate[X]` or `COLORS.brand[X]` from `@/styles/design-tokens`
- ✅ In JSX className: use Tailwind classes like `bg-slate-50`, `text-slate-700`, `border-slate-300`
- ✅ In CSS: use `theme("colors.slate.X")` — PostCSS resolves at build time
- ✅ New colors: add to `colors.js` → `colors.d.ts` → `design-tokens.ts`

**Allowed exceptions** (intentionally curated data, not design tokens):
- `src/utils/colorPalettes.ts` — named chart color palettes (Tableau, D3, etc.)
- `src/config/colorSwatches.ts` — color picker swatch values

**Custom stops**: The slate scale includes custom intermediate stops:
- `325` — form borders, disabled text (contrast-matched)
- `350` — muted icons, indicators (luminance-matched)

**CI enforcement**: `npm run lint:colors` checks for violations. Runs as part of `ci:local`.

## Code Style

**TypeScript**:
- Strict mode enabled
- No `any` types (use `unknown` with type guards)
- Explicit return types for functions
- Interface for objects, type for unions

**React**:
- Functional components with hooks
- Named exports (not default)
- Props interface for every component
- Extract complex logic to custom hooks

**Formatting**:
- Prettier handles all formatting
- Run `npm run format` before committing
- 2 spaces indentation, single quotes, semicolons

## Security

**Client-Side Security**:
- Input validation for all user data
- XSS prevention (React auto-escapes)
- File validation (6-layer validation pipeline)
- No `eval()` or `new Function()`

**File Operations**:
- JSON schema validation
- DOMPurify for string sanitization
- Prototype pollution prevention
- Size limits enforced
