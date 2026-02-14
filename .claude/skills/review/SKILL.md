---
name: review
description: "Comprehensive code review using OwnChart review checklist (Issue #44). /review for full review, /review quick for pre-commit check, /review <category> for focused review. Categories: architecture, code-quality, refactoring, security, performance, a11y, testing, docs, ownchart."
---

# Code Review Skill

Systematische Code-Reviews basierend auf der OwnChart Review-Checkliste (GitHub Issue #44).

## Modi

### 1. Full Review (default)
**Trigger:** `/review` oder `/review full`
**Lädt:** Alle 9 Reference-Dateien
**Nutzen:** Umfassende Review aller Aspekte

### 2. Quick Review (Pre-Commit)
**Trigger:** `/review quick`
**Lädt:** architecture-design.md, code-quality-standards.md, ownchart-patterns.md
**Nutzen:** Schnelle Prüfung vor dem Commit — fokussiert auf die häufigsten Probleme

### 3. Focused Review
**Trigger:** `/review <category>`
**Lädt:** Nur die zugehörige Reference-Datei

| Argument | Reference-Datei |
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

## Scope-Erkennung

Bestimme was reviewt werden soll:

1. **Dateien explizit angegeben** (z.B. `/review src/store/taskSlice.ts`) → Diese Dateien reviewen
2. **"uncommitted"/"staged"/"changes"** → `git diff` + `git diff --cached` auswerten
3. **PR-Nummer** (z.B. `/review #42` oder `/review PR 42`) → `gh pr diff 42` auswerten
4. **Nichts angegeben** → User fragen: "Was soll ich reviewen? Dateien, uncommitted changes, oder eine PR?"

## Workflow

### Schritt 1: Scope bestimmen
Identifiziere die zu reviewenden Dateien gemäß Scope-Erkennung oben.

### Schritt 2: Modus bestimmen
Parse das Argument nach Modi-Definition oben. Default ist `full`.

### Schritt 3: Reference-Dateien laden
Lade die Reference-Dateien entsprechend dem gewählten Modus. Nutze das Read-Tool um die Dateien aus `references/` relativ zu dieser SKILL.md zu lesen.

### Schritt 4: Dateien lesen und analysieren
Lies jede zu reviewende Datei vollständig. Bei großen Diffs: Fokussiere auf die geänderten Bereiche, aber prüfe auch den Kontext drumherum.

### Schritt 5: Systematische Prüfung
**KERNREGEL: Kein Checklist-Item überspringen. Jedes Item gegen jede Datei prüfen.**

Gehe jede geladene Reference-Datei durch und prüfe JEDES Item gegen JEDE Datei. Notiere nur Findings — Items die bestanden werden, müssen nicht aufgelistet werden.

### Schritt 6: Report erstellen
Erstelle den Report im definierten Output-Format (siehe unten).

## Output-Format

```markdown
# Code Review Report

**Mode**: Full / Quick / Focused (<category>)
**Scope**: [Dateiliste oder "uncommitted changes" oder "PR #X"]
**Date**: [YYYY-MM-DD]

## Summary

| Severity | Count |
|----------|-------|
| CRITICAL | X |
| WARNING  | Y |
| NOTE     | Z |

## Findings

### [Dateiname]

#### CRITICAL
- **[Checklist-Item]** (Zeile X-Y): [Beschreibung des Problems]
  - **Impact**: [Was kann passieren]
  - **Fix**: [Konkreter Lösungsvorschlag]

#### WARNING
- **[Checklist-Item]** (Zeile X-Y): [Beschreibung]
  - **Fix**: [Lösungsvorschlag]

#### NOTE
- **[Checklist-Item]** (Zeile X-Y): [Beschreibung]

### [Nächste Datei...]

## Cross-File Impacts
- [Änderungen die andere Dateien betreffen]
- [Gemeinsame Patterns die refactored werden sollten]

## Prioritized Recommendations
1. [Wichtigste Änderung zuerst]
2. [Zweitwichtigste]
3. [...]
```

## Severity Guide

### CRITICAL
Muss vor dem nächsten Release gefixt werden:
- Security-Vulnerabilities (XSS, Injection, Sensitive Data Exposure)
- Datenverlust-Risiken (fehlende Validation, kaputte Serialisierung)
- Kaputte Funktionalität (Runtime-Errors, Logic-Bugs)
- `any` Types in kritischen Pfaden (Store, File Operations, Validation)
- Breaking Changes ohne Migration

### WARNING
Sollte zeitnah gefixt werden:
- Code Smells (Funktionen >50 Zeilen, Komponenten >200 Zeilen)
- Fehlende Tests für neue Funktionalität
- Hardcoded Values (Magic Numbers, Farben, Strings)
- Accessibility-Probleme (fehlende ARIA-Labels, Keyboard-Navigation)
- Performance-Probleme (unnötige Re-Renders, O(n²) wo O(n) möglich)
- DRY-Verletzungen (duplizierter Code)

### NOTE
Nice-to-have Verbesserungen:
- Style & Naming Inkonsistenzen
- Kleine Refactorings (Extract Method, Rename Variable)
- Dokumentations-Lücken (fehlende JSDoc, unklare Comments)
- Import-Organisation
- Tailwind-Nutzung statt Inline-Styles

## OwnChart Kontext-Reminder

Beachte diese projektspezifischen Gotchas während der Review:

- **NEVER read font data files** (`src/utils/export/fonts/inter*FontData.ts`) — riesige Base64-Daten
- **Column config**: `getVisibleColumns(hiddenColumns, showProgress)` — ALLE Aufrufer müssen beide Parameter übergeben
- **State-Architektur**: Zustand Slices mit Immer in `src/store/slices/` — nicht `src/store/` direkt
- **EDITABLE_FIELDS** in taskSlice enthält 'type' — navigierbar aber keine sichtbare Spalte
- **SplitPane**: Direct DOM manipulation während Drag (Refs, nicht State) — performancekritisch
- **Dropdown-Pattern**: `useDropdown` Hook + `DropdownTrigger` + `DropdownPanel` + Content
- **Conventional Commits** sind Pflicht (feat:, fix:, refactor:, etc.)
- **CI-Check vor Push**: `npm run ci:local` muss bestanden werden
