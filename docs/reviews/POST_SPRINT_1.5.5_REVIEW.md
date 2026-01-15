# Post-Sprint 1.5.5 Code Review

> **Status:** IN PROGRESS
> **Erstellt:** 2026-01-15
> **Letztes Update:** 2026-01-15
> **Review-Scope:** Commits nach Sprint 1.5.5 Completion (`5dd4439`)

---

## Workflow-Anleitung

Dieses Dokument dient als persistenter State für das Code Review. Nach jedem `/clear` kann hier fortgesetzt werden.

### Ablauf pro Review-Gruppe:

1. **Lese diese Datei** um den aktuellen Stand zu kennen
2. **Führe das Review** der nächsten offenen Gruppe durch:
   - Code auf Architektur-Konformität prüfen
   - Bugs identifizieren
   - Refactoring-Möglichkeiten erkennen
   - Duplizierten Code finden
   - Tests ergänzen falls sinnvoll
   - Docs aktualisieren falls notwendig
3. **Aktualisiere diese Datei** mit Findings und Status
4. **Erstelle einen Commit** mit dem Review-Ergebnis
5. **Context Clear** - dann weiter mit nächster Gruppe

### Wichtige Regeln:

- Review-Commits (die wir hier erstellen) müssen NICHT reviewed werden
- Änderungen dürfen nichts kaputt machen - immer Tests laufen lassen
- Bei wichtigen Erkenntnissen für folgende Reviews: in "Notizen für Folge-Reviews" eintragen

---

## Übersicht der Review-Gruppen

| # | Gruppe | Commits | Status |
|---|--------|---------|--------|
| 1 | MS Office Ribbon UI Refactoring | 7 | [ ] Offen |
| 2 | Test & Accessibility Fixes | 4 | [ ] Offen |
| 3 | Minor UI Improvements | 2 | [ ] Offen |
| 4 | Typography & Visual Polish | 6 | [ ] Offen |
| 5 | Export Dialog Redesign | 8 | [ ] Offen |

**Gesamt:** 27 Commits (+ 7 Release-Commits die übersprungen werden)

---

## Gruppe 1: MS Office Ribbon UI Refactoring

**Releases:** v0.0.23 - v0.0.24
**Status:** [ ] Offen

### Commits:

- [ ] `590b7d7` chore: fix formatting and lint issues
- [ ] `8ed59a9` docs: add sprint concept for export preview feature
- [ ] `2b71984` refactor(ui): MS Office-style Ribbon UI and cleanup
- [ ] `00b4ba4` ui: MS Office-style selection and status bar improvements
- [ ] `c47a324` feat: auto-fit column widths on density and content changes
- [ ] `ef2ebaf` fix: drag select now uses visible task order instead of raw array
- [ ] `1bee106` ui: update View tab icons and add week settings

### Review-Checkliste:

- [ ] Code-Architektur geprüft
- [ ] Keine Bugs gefunden / Bugs gefixt
- [ ] Kein problematischer duplizierter Code
- [ ] Refactoring durchgeführt (falls nötig)
- [ ] Tests ergänzt (falls nötig)
- [ ] Docs aktualisiert (falls nötig)

### Findings:

_Noch nicht reviewed_

### Änderungen vorgenommen:

_Keine_

---

## Gruppe 2: Test & Accessibility Fixes

**Releases:** v0.0.25
**Status:** [ ] Offen

### Commits:

- [ ] `1b93d11` fix: repair broken tests after UI refactoring
- [ ] `8d7ce4c` fix: use div instead of nav for tablist role
- [ ] `9cf5ec1` fix: resolve lint errors for interactive roles
- [ ] `891bd2b` chore: run prettier formatting

### Review-Checkliste:

- [ ] Code-Architektur geprüft
- [ ] Keine Bugs gefunden / Bugs gefixt
- [ ] Kein problematischer duplizierter Code
- [ ] Refactoring durchgeführt (falls nötig)
- [ ] Tests ergänzt (falls nötig)
- [ ] Docs aktualisiert (falls nötig)

### Findings:

_Noch nicht reviewed_

### Änderungen vorgenommen:

_Keine_

---

## Gruppe 3: Minor UI Improvements

**Releases:** v0.0.26 - v0.0.27
**Status:** [ ] Offen

### Commits:

- [ ] `53a13ef` feat: add Chart Settings button to Help tab
- [ ] `8c898de` ui: simplify View tab dropdown labels

### Review-Checkliste:

- [ ] Code-Architektur geprüft
- [ ] Keine Bugs gefunden / Bugs gefixt
- [ ] Kein problematischer duplizierter Code
- [ ] Refactoring durchgeführt (falls nötig)
- [ ] Tests ergänzt (falls nötig)
- [ ] Docs aktualisiert (falls nötig)

### Findings:

_Noch nicht reviewed_

### Änderungen vorgenommen:

_Keine_

---

## Gruppe 4: Typography & Visual Polish

**Releases:** v0.0.27 - v0.0.28
**Status:** [ ] Offen

### Commits:

- [ ] `721bd09` ui: switch to Inter font with embedded PDF support
- [ ] `a7f934e` ui: standardize font weights to 400/600 only
- [ ] `77fca04` fix: auto column width respects headers and placeholder text
- [ ] `9da123c` fix: remove stray rectangle in placeholder row number cell
- [ ] `d48c089` feat: add dynamic text color contrast for task labels
- [ ] `83d73bc` ui: change today marker from red to blue with header highlight

### Review-Checkliste:

- [ ] Code-Architektur geprüft
- [ ] Keine Bugs gefunden / Bugs gefixt
- [ ] Kein problematischer duplizierter Code
- [ ] Refactoring durchgeführt (falls nötig)
- [ ] Tests ergänzt (falls nötig)
- [ ] Docs aktualisiert (falls nötig)

### Findings:

_Noch nicht reviewed_

### Änderungen vorgenommen:

_Keine_

---

## Gruppe 5: Export Dialog Redesign

**Releases:** v0.0.28 - v0.0.29
**Status:** [ ] Offen

### Commits:

- [ ] `4679179` feat: redesign export dialog with Figma-style layout and live preview
- [ ] `883fcd1` fix: export preview rendering blank due to invisible container
- [ ] `bc90d0a` ui: adjust export dialog layout to 55/45 preview/settings ratio
- [ ] `7c7c71c` ui: increase export preview panel to 65% width
- [ ] `553f41a` ui: expand export dialog with larger preview, fixed settings width
- [ ] `3652702` ui: widen settings panel to 480px, expand dialog to max-w-7xl
- [ ] `6dea551` fix: resolve export preview flash and PDF bold font issues
- [ ] `dcd53a2` refactor: extract reusable components from export dialogs

### Review-Checkliste:

- [ ] Code-Architektur geprüft
- [ ] Keine Bugs gefunden / Bugs gefixt
- [ ] Kein problematischer duplizierter Code
- [ ] Refactoring durchgeführt (falls nötig)
- [ ] Tests ergänzt (falls nötig)
- [ ] Docs aktualisiert (falls nötig)

### Findings:

_Noch nicht reviewed_

### Änderungen vorgenommen:

_Keine_

---

## Notizen für Folge-Reviews

_Hier werden wichtige Erkenntnisse notiert, die für nachfolgende Review-Gruppen relevant sind._

---

## Abschluss-Checkliste

- [ ] Alle 5 Gruppen reviewed
- [ ] Alle Findings dokumentiert
- [ ] Alle notwendigen Änderungen committed
- [ ] Tests laufen durch (`npm run ci:local`)
- [ ] Docs auf aktuellem Stand
- [ ] CLAUDE.md aktualisiert (falls nötig)

---

## Review-Commits (nicht zu reviewen)

_Hier werden die Commits eingetragen, die im Rahmen dieses Reviews erstellt wurden:_

1. _(noch keine)_

---

## Nächster Schritt

**Starte mit Gruppe 1: MS Office Ribbon UI Refactoring**

Befehle zum Starten:
```bash
# Zeige alle Commits der Gruppe 1
git show 590b7d7 --stat
git show 8ed59a9 --stat
git show 2b71984 --stat
git show 00b4ba4 --stat
git show c47a324 --stat
git show ef2ebaf --stat
git show 1bee106 --stat
```
