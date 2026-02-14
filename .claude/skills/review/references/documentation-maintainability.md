# Documentation & Maintainability

Checkliste für Code-Dokumentation, Self-Documenting Code und Commit-Standards.

## Code Documentation

- [ ] Prüfe dass komplexe Logik Comments hat die das WARUM erklären (nicht das Was — Code erklärt sich selbst)
- [ ] Stelle sicher dass KEINE offensichtlichen Comments existieren: `// increment i` für `i++` ist unnötig
- [ ] Prüfe ob JSDoc für Public APIs/Utilities vorhanden ist (Parameter, Return, Beispiele)
- [ ] Prüfe dass Type-Definitionen als Inline-Dokumentation dienen — gute Typen ersetzen viele Comments
- [ ] Prüfe ob README/Docs aktualisiert werden müssen wenn sich Public APIs ändern
- [ ] Prüfe ob Architektur-Entscheidungen dokumentiert sind (im Code als Comment oder in docs/)

## Self-Documenting Code

- [ ] Prüfe dass Variablen-Namen den Zweck erklären: `isTaskCompleted` nicht `flag`, `selectedTaskIds` nicht `ids`
- [ ] Prüfe dass Funktions-Namen Verben sind: `calculateTotalDuration()` nicht `total()`, `filterVisibleTasks()` nicht `filter()`
- [ ] Prüfe dass Boolean-Namen Fragen sind: `hasChildren`, `canEdit`, `isVisible`, `shouldAutoScroll`
- [ ] Prüfe dass Konstanten-Namen Bedeutung erklären: `MAX_TASK_DEPTH = 10` nicht `MAX = 10`, `SCROLL_DEBOUNCE_MS = 150` nicht `DELAY = 150`
- [ ] Prüfe dass Enum/Union-Werte selbsterklärend sind: `'fit-to-page' | 'custom-zoom'` nicht `'mode1' | 'mode2'`

## Commit Messages

- [ ] Prüfe dass Conventional Commits Format eingehalten wird (feat:, fix:, refactor:, perf:, test:, docs:, chore:, ui:)
- [ ] Prüfe dass Messages beschreibend sind: "fix: prevent crash when loading file with missing dates" nicht "fix bug"
- [ ] Prüfe dass Commits atomar sind: Ein logischer Change pro Commit, nicht mehrere unzusammenhängende Änderungen
