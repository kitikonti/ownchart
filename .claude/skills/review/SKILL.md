---
name: review
description: "Comprehensive code reviews based on the OwnChart review checklist (Issue #44). /review for full review, /review quick for pre-commit check, /review <category> for focused review. Categories: architecture, code-quality, refactoring, security, performance, a11y, testing, docs, ownchart."
---

# Code Review Skill

Systematic code reviews based on the OwnChart review checklist (GitHub Issue #44).

## Modes

### 1. Full Review (default)
**Trigger:** `/review` or `/review full`
**Loads:** All 9 reference files
**Purpose:** Comprehensive review of all aspects

### 2. Quick Review (Pre-Commit)
**Trigger:** `/review quick`
**Loads:** architecture-design.md, code-quality-standards.md, ownchart-patterns.md
**Purpose:** Quick check before committing — focused on the most common issues

### 3. Focused Review
**Trigger:** `/review <category>`
**Loads:** Only the corresponding reference file

| Argument | Reference file |
|----------|----------------|
| `architecture` | references/architecture-design.md |
| `code-quality` | references/code-quality-standards.md |
| `refactoring` | references/refactoring-opportunities.md |
| `security` | references/security-legal.md |
| `performance` | references/performance-optimization.md |
| `a11y` | references/accessibility.md |
| `testing` | references/testing-quality.md |
| `docs` | references/documentation-maintainability.md |
| `ownchart` | references/ownchart-patterns.md |

## Scope Detection

Determine what should be reviewed:

1. **Files explicitly specified** (e.g., `/review src/store/taskSlice.ts`) → Review those files
2. **"uncommitted"/"staged"/"changes"** → Evaluate `git diff` + `git diff --cached`
3. **PR number** (e.g., `/review #42` or `/review PR 42`) → Evaluate `gh pr diff 42`
4. **Nothing specified** → Ask the user: "What should I review? Files, uncommitted changes, or a PR?"

## Workflow

### Step 1: Determine scope
Identify the files to review according to the scope detection above.

### Step 2: Determine mode
Parse the argument according to the mode definitions above. Default is `full`.

### Step 3: Load reference files
Load the reference files corresponding to the chosen mode. Use the Read tool to read the files from `references/` relative to this SKILL.md.

### Step 4: Read and analyze files
Read each file to be reviewed in full. For large diffs: Focus on the changed areas, but also check the surrounding context.

### Step 5: Systematic check
**CORE RULE: Do not skip any checklist item. Check every item against every file.**

Go through each loaded reference file and check EVERY item against EVERY file. Only note findings — items that pass do not need to be listed.

### Step 6: Create report
Create the report in the defined output format (see below).

## Output Format

```markdown
# Code Review Report

**Mode**: Full / Quick / Focused (<category>)
**Scope**: [File list or "uncommitted changes" or "PR #X"]
**Date**: [YYYY-MM-DD]

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | X |
| WARNING  | Y |
| NOTE     | Z |

## Findings

### [Filename]

#### CRITICAL
- **[F001]** **[Checklist item]** (Line X-Y): [Description of the problem]
  - **Impact**: [What could happen]
  - **Fix**: [Concrete fix suggestion]

#### WARNING
- **[F002]** **[Checklist item]** (Line X-Y): [Description]
  - **Fix**: [Fix suggestion]

#### NOTE
- **[F003]** **[Checklist item]** (Line X-Y): [Description]

### [Next file...]

## Cross-File Impacts
- [Changes that affect other files]
- [Shared patterns that should be refactored]

## Prioritized Recommendations
1. [F00X] [Most important change first]
2. [F00Y] [Second most important]
3. [...]

## Model Recommendation

**Recommended model for fixes:** [Sonnet / Opus]
**Reasoning:** [Brief reasoning]
```

## Finding IDs

Each finding gets a unique ID in the format `[FXXX]` (e.g., `[F001]`, `[F002]`, ...).

- **Sequentially numbered** across the entire report (not per file or severity)
- **Order**: Findings are numbered in the order they appear in the report (first File 1 CRITICAL → WARNING → NOTE, then File 2, etc.)
- **Purpose**: The user can specifically act on findings, e.g., "fix F003" or "ignore F007"

## Severity Guide

### CRITICAL
Must be fixed before the next release:
- Security vulnerabilities (XSS, Injection, Sensitive Data Exposure)
- Data loss risks (missing validation, broken serialization)
- Broken functionality (runtime errors, logic bugs)
- `any` types in critical paths (Store, File Operations, Validation)
- Breaking changes without migration

### WARNING
Should be fixed soon:
- Code smells (functions >50 lines, components >200 lines)
- Missing tests for new functionality
- Hardcoded values (magic numbers, colors, strings)
- Accessibility issues (missing ARIA labels, keyboard navigation)
- Performance issues (unnecessary re-renders, O(n²) where O(n) is possible)
- DRY violations (duplicated code)

### NOTE
Nice-to-have improvements:
- Style & naming inconsistencies
- Small refactorings (extract method, rename variable)
- Documentation gaps (missing JSDoc, unclear comments)
- Import organization
- Tailwind usage instead of inline styles

## OwnChart Context Reminder

Keep these project-specific gotchas in mind during the review:

- **NEVER read font data files** (`src/utils/export/fonts/inter*FontData.ts`) — huge Base64 data
- **Column config**: `getVisibleColumns(hiddenColumns, showProgress)` — ALL callers must pass both parameters
- **State architecture**: Zustand slices with Immer in `src/store/slices/` — not `src/store/` directly
- **EDITABLE_FIELDS** in taskSlice contains 'type' — navigable but not a visible column
- **SplitPane**: Direct DOM manipulation during drag (refs, not state) — performance-critical
- **Dropdown pattern**: `useDropdown` hook + `DropdownTrigger` + `DropdownPanel` + content
- **Conventional Commits** are required (feat:, fix:, refactor:, etc.)
- **CI check before push**: `npm run ci:local` must pass

## Model Recommendation Guide

At the end of each review, provide a recommendation for which model (Sonnet or Opus) should be used for the fixes.

### Recommend Sonnet when:
- Only NOTEs and simple WARNINGs were found
- Fixes are mechanical/repetitive (renames, import sorting, missing ARIA labels, extracting magic numbers)
- Changes are limited to individual files
- No deep architectural understanding is needed
- Standard patterns are being applied (e.g., adding `React.memo`, adding tests)

### Recommend Opus when:
- CRITICAL findings are present
- Fixes require architectural changes (state redesign, introducing new patterns)
- Cross-file refactorings are needed (coordinated changes across multiple files)
- Complex logic bugs need to be fixed
- Security fixes with subtle implications
- Changes affect the Zustand store or history system
- Deep understanding of the interplay between multiple systems is needed

### Mixed findings:
If both simple and complex fixes are needed, recommend Opus with the note that the simple fixes (NOTEs) could also be handled with Sonnet to save costs.
