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

**Current Version**: See `package.json` for the current version number.

**Completed Sprints**:
- ✅ Sprint 1.1.1 - Task Groups & Hierarchical Organization
- ✅ Sprint 1.1.2 - Hierarchy Indent/Outdent
- ✅ Sprint 1.2 Package 1 - Timeline Visualization
- ✅ Sprint 1.2 Package 2 - Interactive Editing
- ✅ Sprint 1.2 Package 3 - Navigation & Scale
- ✅ Sprint 1.3 - File Operations
- ✅ Sprint 1.4 - Dependencies (FS only)
- ✅ Sprint 1.5 - Undo/Redo System
- ✅ Sprint 1.5.4 - Copy/Paste & Multi-Select (ahead of schedule from V1.1)
- ✅ Sprint 1.6 - PNG Export & Polish
- ✅ Sprint 1.5.9.1 - UI Density (Compact/Normal/Comfortable)
- ✅ Sprint 1.5.9 - User Preferences & Settings
- ✅ Sprint 1.5.9.2 - Infinite Scroll & Zoom Anchoring
- ✅ Sprint 1.5.5 - PDF & SVG Export (vector formats)

**MVP Features Complete**:
- ✅ Multi-select with rectangular marquee selection in timeline
- ✅ Copy/Cut/Paste with cross-tab clipboard support
- ✅ Multi-task dragging (all selected tasks move together)
- ✅ Summary task dragging (moves all children automatically)
- ✅ Insert task above/below toolbar buttons
- ✅ DEL key and toolbar button for task deletion
- ✅ Placeholder row for quick task creation
- ✅ PNG Export with options dialog (zoom, columns, grid lines, weekends, background)
- ✅ Help Panel with keyboard shortcuts reference
- ✅ Welcome Tour for first-time users
- ✅ File extension changed to `.ownchart`
- ✅ Auto-fit name column on file open
- ✅ Export settings persisted in project file
- ✅ Multi-tab persistence (dependencies, column widths)
- ✅ UI Density settings (Compact/Normal/Comfortable) with preferences dialog
- ✅ Export density selection independent from app setting

**Sprint 1.5.5 Features (Complete)**:
- ✅ PDF Export with vector graphics (scales perfectly for large prints)
- ✅ SVG Export for editable vector output
- ✅ Page size selection (A4, A3, Letter, Legal, Tabloid)
- ✅ Orientation (Landscape/Portrait) and margin presets
- ✅ Scale modes (Fit to page, Custom zoom %)
- ✅ Unified export dialog with teal accent color
- ✅ Chart settings persistence in localStorage
- ✅ Inter-Italic font embedded for proper PDF rendering
- ✅ Shared export utilities for PNG/PDF/SVG consistency

**Sprint 1.5.9 Features (Complete)**:
- ✅ Holiday Service with date-holidays library (199 countries supported)
- ✅ User Preferences: Date Format, First Day of Week, Week Numbering System
- ✅ Chart Settings Dialog (Timeline Display, Task Display sections)
- ✅ Holiday region selection per project
- ✅ Holiday highlighting in timeline with tooltips
- ✅ Task Label Position (before/inside/after/none)
- ✅ Show/Hide toggles: Today Marker, Weekends, Holidays, Dependencies, Progress
- ✅ Keyboard shortcuts for view toggles (T, D, P, H)
- ✅ Dependencies toggle button in toolbar (FlowArrow icon)
- ✅ Timeline header improvements: Calendar week visible at all zoom levels
- ✅ Working Days Mode (duration editing, task drag maintains working days)

**Sprint 1.5.9.2 Features (Complete)**:
- ✅ Infinite Scroll for timeline (auto-extends past/future on scroll)
- ✅ Zoom Anchoring (cursor-centered for wheel, viewport-centered for keyboard/toolbar)
- ✅ Smooth left-scrolling for infinite timeline
- ✅ Dependency arrows no longer animate during scroll

**Post-Sprint UI/UX Enhancements (v0.0.23 - v0.0.33)**:
- ✅ Smart Color Management with 5 color modes (Manual, By Type, By Progress, By Duration, Random)
- ✅ Export dialog redesigned with Figma-style live preview
- ✅ MS Office-style Ribbon UI (tabbed interface: File, Task, View, Help)
- ✅ Dynamic text color contrast for task labels
- ✅ Today marker changed from red to blue with header highlight
- ✅ Unified dropdown styling across components
- ✅ Auto-fit column widths on density and content changes
- ✅ "F" keyboard shortcut for fit to view
- ✅ Color mode state persisted to .ownchart files
- ✅ Undo/redo support for indent/outdent operations
- ✅ Timeline header shows "Week N, Mon YYYY" at medium zoom levels

**Latest Improvements (v0.0.13 - v0.0.33)**:
- ✅ Smart Color Management (5 modes: Manual, By Type, By Progress, By Duration, Random)
- ✅ MS Office-style Ribbon UI with tabbed interface
- ✅ Export dialog redesign with Figma-style live preview
- ✅ PDF Export with vector graphics and page size options
- ✅ SVG Export for editable vector output
- ✅ Dynamic text color contrast for task labels
- ✅ Today marker changed to blue with header highlight
- ✅ Unified dropdown and dialog styling
- ✅ Auto-fit column widths on density changes
- ✅ Inter font with embedded PDF support (replaced IBM Plex Sans)
- ✅ Chart settings persistence in localStorage
- ✅ Exponential zoom for consistent feel at all zoom levels
- ✅ Color mode state persisted in .ownchart files
- ✅ Undo/redo support for indent/outdent operations
- ✅ "F" keyboard shortcut for fit to view
- ✅ Project name included in PNG export filename
- ✅ Column widths restored when opening files
- ✅ Dependencies no longer auto-move tasks on creation
- ✅ Custom domain configured: ownchart.app

**Test Coverage**: 834 unit tests (80%+ coverage)

**Next Phase**:
- 🔜 Phase 1.5 (V1.1) - Remaining Deferred Features & Extensibility

## Directory Structure

```
ownchart/
├── src/
│   ├── components/     # React components
│   ├── store/          # Zustand stores (taskSlice, chartSlice, historySlice)
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript interfaces
│   └── hooks/          # Custom React hooks
├── docs/            # ALL design documentation
│   ├── planning/       # PRD, Roadmap, User Stories
│   ├── architecture/   # Technical Architecture, Data Model
│   ├── sprints/        # Sprint-specific documentation
│   ├── design/         # UI/UX specs, Competitive Analysis
│   └── process/        # CI/CD, Testing Strategy
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── CHANGELOG.md        # Auto-generated release notes
```

## Core Technologies

| Purpose | Technology | Why |
|---------|-----------|-----|
| UI Framework | React 18 | Ecosystem, TypeScript support |
| State Management | Zustand | Simple, minimal boilerplate |
| Styling | TailwindCSS | Utility-first, fast development |
| Build Tool | Vite | Fast HMR, modern tooling |
| Timeline Rendering | D3.js | SVG utilities, date scales |
| Testing | Vitest + Playwright | Fast, modern, TypeScript-first |

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
# Start development
npm run dev

# Lint and format
npm run lint
npm run format

# Type check
npm run type-check

# Run tests
npm run test:unit

# Full CI check
npm run ci:local
```

### Git Commit Standards

**Use Conventional Commits** (required for automated changelog):

```bash
feat: add new feature description
fix: resolve bug description
perf: improve performance description
refactor: restructure code description
test: add test coverage
docs: update documentation
chore: update dependencies
ui: improve UI/UX
```

**Examples**:
```bash
git commit -m "feat: add undo/redo buttons to toolbar"
git commit -m "fix: resolve zoom functionality bug"
git commit -m "perf: optimize task rendering for large datasets"
git commit -m "refactor: split App.tsx into sub-components"
git commit -m "test: improve test coverage from 67% to 75%"
git commit -m "docs: update Sprint 1.3 documentation"
git commit -m "chore: update React to 18.3.1"
git commit -m "ui: shorten progress column header"
```

**Commit Type → Version Bump**:
- `feat:` → MINOR version (0.0.1 → 0.1.0)
- `fix:`, `perf:` → PATCH version (0.1.0 → 0.1.1)
- `feat!:`, `BREAKING CHANGE:` → MAJOR version (0.1.1 → 1.0.0)
- `test:`, `docs:`, `chore:` → No release

### Release Management Workflow

**When to Release**:
- After completing a sprint
- After significant bug fixes
- When Martin asks for a release
- Before deploying to production

**Release Process** (automated):

```bash
# 1. Ensure all changes are committed
git status  # Should be clean

# 2. Run release (analyzes commits, bumps version, generates CHANGELOG)
npm run release

# 3. Push with tags
git push --follow-tags origin main
```

**What happens automatically**:
1. ✅ Analyzes all commits since last release
2. ✅ Determines version bump (based on commit types)
3. ✅ Updates `package.json` version
4. ✅ Generates/updates `CHANGELOG.md`
5. ✅ Creates git commit: `chore(release): vX.Y.Z`
6. ✅ Creates git tag: `vX.Y.Z`

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

**When Martin says "let's release" or after completing a sprint**:

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

### Documentation Updates

**When to update CLAUDE.md**:
- After major architectural changes
- After completing a sprint (update status)
- When adding new development patterns
- When tooling changes

**When to update other docs**:
- Sprint docs: During/after sprint completion
- Architecture docs: When patterns change
- README.md: For user-facing changes

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

## Common Tasks

### Adding a New Component
```bash
# 1. Create file in src/components/
# 2. Define Props interface
# 3. Implement component with TypeScript
# 4. Write tests in tests/unit/
# 5. Import and use in parent component
```

### Adding a New Zustand Slice
```bash
# 1. Create file in src/store/
# 2. Define state interface
# 3. Create slice with Immer middleware
# 4. Export hooks and selectors
# 5. Write tests
```

### Adding a New Utility
```bash
# 1. Create file in src/utils/
# 2. Implement pure functions
# 3. Write comprehensive unit tests
# 4. Aim for 100% coverage
```

## Troubleshooting

**Tests failing**:
- Check Node version (should be 20.x)
- Clear cache: `rm -rf node_modules && npm install`
- Check for missing mocks

**Build errors**:
- Run `npm run type-check` for TypeScript errors
- Check for circular imports
- Verify all dependencies installed

**Performance issues**:
- Use React DevTools Profiler
- Check for unnecessary re-renders
- Profile with Chrome DevTools

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

## Key Decision Records

**Why Zustand over Redux?**
- Less boilerplate for solo project
- Better TypeScript inference
- No provider wrapper needed

**Why SVG over Canvas?**
- Better accessibility
- Easier event handling
- Good performance for <1000 tasks

**Why standard-version for releases?**
- Local control (not fully automated)
- Solo-friendly workflow
- Generates changelog from commits

## External Resources

- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Vite Docs](https://vitejs.dev)
- [TailwindCSS Docs](https://tailwindcss.com)
- [Conventional Commits](https://www.conventionalcommits.org)
- [Semantic Versioning](https://semver.org)

---

**Status**: ✅ Sprint 1.5.5 Complete + UI/UX Polish (Smart Color Management, Ribbon UI, Export Preview)
**Current Version**: 0.0.33
**File Extension**: `.ownchart`
**Last Updated**: 2026-02-04
