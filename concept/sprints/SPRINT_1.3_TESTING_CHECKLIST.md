# Sprint 1.3 File Operations - Testing Checklist

## Automated Testing Summary

**Automated Tests Run**: 206 total tests (all passing)
- ✅ **validate.test.ts**: 31 tests - All 6 validation layers
- ✅ **serialize.test.ts**: 25 tests - Serialization & round-trip
- ✅ **sanitize.test.ts**: 23 tests - XSS prevention & metadata sanitization
- ✅ **deserialize.test.ts**: 33 tests - Full deserialization pipeline
- ✅ **Other tests**: 94 tests - Undo/redo, zoom toolbar, etc.

**Build & Quality Checks**:
- ✅ TypeScript: No type errors (`npm run type-check`)
- ⚠️ ESLint: 71 errors, 137 warnings (mostly missing return types)
- ✅ Build: Successful (370.74 kB bundle)

**Test Coverage by Section**:
- ✅ Section 4 (Validation): 18/21 automated (85%) - 3 migration tests need manual testing
- ✅ Section 5 (Data Integrity): 13/13 automated (100%)
- ✅ Section 9 (Security): 8/10 automated (80%)
- ✅ Section 12 (Code Quality): 14/15 automated (93%)
- ✅ Section 13 (Example Files): 1/6 automated (17%)

**Total Automated Coverage**: ~53 of ~150 checklist items (35%)

**Remaining Manual Tests**: Sections 1, 2, 3, 6, 7, 8, 10, 11, 14 require browser/UI testing

---

## 1. File Operations - Basic Functionality

### Save (Ctrl+S)
- [ ] Neues Chart erstellen und speichern (Ctrl+S)
- [ ] Datei wird im .gantt Format gespeichert
- [ ] Save-Icon wechselt von "fill" (blau) zu "regular" (grau) nach erfolgreichem Speichern
- [ ] Toast Notification "Saved 'filename.gantt'" erscheint
- [ ] isDirty Flag wird auf false gesetzt
- [ ] **Chrome/Edge**: Zweites Speichern (Ctrl+S) öffnet KEINEN Dialog (re-save)
- [ ] **Firefox/Safari**: Jedes Speichern löst Download aus

### Save As (Ctrl+Shift+S)
- [ ] Save As Dialog öffnet sich bei Ctrl+Shift+S
- [ ] Neuer Dateiname kann eingegeben werden
- [ ] Datei wird unter neuem Namen gespeichert
- [ ] Toast Notification zeigt neuen Dateinamen
- [ ] **Chrome/Edge**: Nachfolgendes Ctrl+S speichert zur NEUEN Datei

### Open (Ctrl+O)
- [ ] Open Dialog öffnet sich bei Ctrl+O
- [ ] Nur .gantt Dateien sind auswählbar
- [ ] Chart wird korrekt geladen (Tasks, Hierarchie, Farben, Progress)
- [ ] View Settings werden wiederhergestellt (Zoom, Pan, Column Widths)
- [ ] Toast Notification "Opened 'filename.gantt'" erscheint
- [ ] Undo/Redo History wird geleert
- [ ] isDirty Flag wird auf false gesetzt

### New (Ctrl+N)
- [ ] Bei ungespeicherten Änderungen: Confirm Dialog erscheint
- [ ] Bei Abbruch: Nichts passiert
- [ ] Bei Bestätigung: Alle Tasks werden gelöscht
- [ ] View Settings werden zurückgesetzt
- [ ] Undo/Redo History wird geleert
- [ ] isDirty Flag wird auf false gesetzt
- [ ] fileName wird auf null gesetzt

---

## 2. Dirty State Tracking

### Auto-Mark Dirty
- [ ] Task hinzufügen → Save-Icon wird blau (fill)
- [ ] Task bearbeiten (Name, Datum, Progress) → Save-Icon wird blau
- [ ] Task löschen → Save-Icon wird blau
- [ ] Task neu ordnen (Drag & Drop) → Save-Icon wird blau
- [ ] View Settings ändern (Zoom, Pan) → Save-Icon bleibt UNVERÄNDERT (kein dirty)

### Mark Clean
- [ ] Nach Speichern (Ctrl+S) → Save-Icon wird grau (regular)
- [ ] Nach Öffnen einer Datei → Save-Icon wird grau
- [ ] Nach New (Ctrl+N) → Save-Icon wird grau

---

## 3. Unsaved Changes Warning

### Browser Close/Reload
- [ ] Ungespeicherte Änderungen vorhanden → beforeunload Dialog erscheint
- [ ] Keine Änderungen → Kein Dialog beim Schließen
- [ ] Nach Speichern → Kein Dialog beim Schließen

### Open File
- [ ] Ungespeicherte Änderungen + Ctrl+O → Confirm Dialog erscheint
- [ ] Abbruch → Open wird abgebrochen
- [ ] Bestätigung → Datei wird geöffnet

### New Chart
- [ ] Ungespeicherte Änderungen + Ctrl+N → Confirm Dialog erscheint
- [ ] Abbruch → New wird abgebrochen
- [ ] Bestätigung → Chart wird geleert

---

## 4. Validation - Layer Testing

### Layer 1: Pre-Parse Validation
- [x] **Zu große Datei (>50MB)**: Error "File size X MB exceeds limit of 50MB" ✅ *Automated: validate.test.ts*
- [x] **Falsche Extension (.json, .txt)**: Error "File must have .gantt extension" ✅ *Automated: validate.test.ts*

### Layer 2: JSON Parsing
- [x] **Ungültiges JSON**: Error "Invalid JSON: ..." ✅ *Automated: validate.test.ts*
- [x] **Prototype Pollution (`__proto__`)**: Wird gefiltert, kein Error ✅ *Automated: validate.test.ts*

### Layer 3: Structure Validation
- [x] **Fehlendes fileVersion**: Error "Missing required field: fileVersion" ✅ *Automated: validate.test.ts*
- [x] **Fehlendes chart.tasks**: Error "chart.tasks must be an array" ✅ *Automated: validate.test.ts*
- [x] **Task ohne id**: Error "Task X missing field: id" ✅ *Automated: validate.test.ts*
- [x] **Zu viele Tasks (>10000)**: Error "File contains X tasks (max: 10000)" ✅ *Automated: validate.test.ts*

### Layer 4: Semantic Validation
- [x] **Ungültige UUID (`task-001`)**: Error "Task X has invalid UUID: task-001" ✅ *Automated: validate.test.ts*
- [x] **Duplicate IDs**: Error "Duplicate task ID: ..." ✅ *Automated: validate.test.ts*
- [x] **Ungültiges Datum (`2026-13-40`)**: Error "Task X has invalid startDate: ..." ✅ *Automated: validate.test.ts*
- [x] **endDate vor startDate**: Error "Task X: endDate before startDate" ✅ *Automated: validate.test.ts*
- [x] **Progress außerhalb 0-100**: Error "Task X has invalid progress: 150" ✅ *Automated: validate.test.ts*
- [x] **Ungültige Farbe (`red`, `#gggggg`)**: Error "Task X has invalid color: ..." ✅ *Automated: validate.test.ts*
- [x] **Dangling Parent**: Error "Task X references non-existent parent: ..." ✅ *Automated: validate.test.ts, deserialize.test.ts*
- [x] **Circular Hierarchy**: Error "Circular reference detected: ..." ✅ *Automated: validate.test.ts, deserialize.test.ts*

### Layer 5: Sanitization (XSS Prevention)
- [x] Task-Name mit `<script>alert('XSS')</script>` → Script-Tags werden entfernt ✅ *Automated: sanitize.test.ts*
- [x] Task-Name mit HTML-Tags → Tags werden entfernt, Text bleibt ✅ *Automated: sanitize.test.ts*
- [x] Metadata mit HTML → Wird sanitized ✅ *Automated: sanitize.test.ts*

### Layer 6: Migration
- [ ] Datei mit fileVersion "0.9.0" (falls Migration implementiert) → Wird migriert ⚠️ *Manual: No migrations implemented yet*
- [ ] Toast Notification "File migrated from v0.9.0 to v1.0.0" ⚠️ *Manual: No migrations implemented yet*
- [ ] Datei von zukünftiger Version → Warning "created with newer version" ⚠️ *Manual: Requires browser testing*

---

## 5. Data Integrity - Round-Trip Testing

### Standard Fields
- [x] Alle Task-Felder (id, name, startDate, endDate, duration, progress, color, order) bleiben erhalten ✅ *Automated: serialize.test.ts, deserialize.test.ts*
- [x] Task-Typen (task, summary, milestone) bleiben erhalten ✅ *Automated: serialize.test.ts*
- [x] Hierarchie (parent, open) bleibt erhalten ✅ *Automated: deserialize.test.ts*
- [x] Task-Metadata bleibt erhalten ✅ *Automated: serialize.test.ts*

### View Settings
- [x] Zoom-Level wird gespeichert und wiederhergestellt ✅ *Automated: serialize.test.ts, deserialize.test.ts*
- [x] Pan Offset (x, y) bleibt erhalten ✅ *Automated: serialize.test.ts*
- [x] showWeekends Einstellung bleibt erhalten ✅ *Automated: serialize.test.ts*
- [x] showTodayMarker Einstellung bleibt erhalten ✅ *Automated: serialize.test.ts*
- [x] taskTableWidth bleibt erhalten ✅ *Automated: serialize.test.ts*
- [x] columnWidths bleiben erhalten ✅ *Automated: serialize.test.ts*

### Unknown Fields (Forward Compatibility)
- [x] Datei mit unbekannten Task-Feldern öffnen → Felder werden in `__unknownFields` gespeichert ✅ *Automated: deserialize.test.ts*
- [x] Datei erneut speichern → Unbekannte Felder sind noch vorhanden ✅ *Automated: serialize.test.ts*

### Chart Metadata
- [x] Chart Name wird gespeichert ✅ *Automated: serialize.test.ts*
- [x] Chart ID bleibt erhalten (UUID) ✅ *Automated: serialize.test.ts, deserialize.test.ts*
- [x] createdAt / updatedAt Timestamps bleiben erhalten ✅ *Automated: serialize.test.ts*

---

## 6. UI/UX Testing

### Toolbar Buttons
- [ ] **New Button**: File Icon, Tooltip "New Chart (Ctrl+N)"
- [ ] **Open Button**: FolderOpen Icon, Tooltip "Open File (Ctrl+O)"
- [ ] **Save Button**: FloppyDisk Icon, Tooltip "Save (Ctrl+S)"
- [ ] Save Button Farbe: Grau (regular) wenn clean, Blau (fill) wenn dirty
- [ ] Buttons sind immer enabled (keine disabled states)
- [ ] Trennlinie nach Save Button ist sichtbar

### Keyboard Shortcuts
- [ ] **Ctrl+S** (Windows/Linux) / **Cmd+S** (Mac): Speichern
- [ ] **Ctrl+Shift+S**: Save As
- [ ] **Ctrl+O**: Öffnen
- [ ] **Ctrl+N**: Neues Chart
- [ ] Shortcuts funktionieren auch wenn Focus in Task Table ist

### Toast Notifications
- [ ] **Erfolg**: Grüner Toast bei erfolgreichem Speichern/Öffnen
- [ ] **Error**: Roter Toast bei Validierungsfehler
- [ ] **Warning**: Gelber Toast bei Migration/Future Version
- [ ] Toast verschwindet automatisch nach 3-5 Sekunden

---

## 7. Browser Compatibility

### Chrome / Edge (File System Access API)
- [ ] **Erste Save**: Native "Save File" Dialog öffnet sich
- [ ] **Zweite Save (Ctrl+S)**: Kein Dialog, Datei wird direkt gespeichert
- [ ] **Save As**: Öffnet immer Dialog
- [ ] **Open**: Native "Open File" Dialog
- [ ] Dateiname wird im App-State gespeichert

### Firefox
- [ ] **Save**: Download wird ausgelöst (jedes Mal)
- [ ] **Save As**: Download mit neuem Namen
- [ ] **Open**: Hidden File Input wird verwendet
- [ ] Kein Re-Save möglich (jedes Ctrl+S = neuer Download)

### Safari
- [ ] **Save**: Download wird ausgelöst
- [ ] **Open**: File Input funktioniert
- [ ] Gleiche Funktionalität wie Firefox

---

## 8. Edge Cases & Stress Testing

### Large Files
- [ ] Chart mit 100 Tasks speichern und öffnen → Funktioniert
- [ ] Chart mit 1000 Tasks speichern und öffnen → Funktioniert
- [ ] Chart mit 10000 Tasks → Funktioniert (Limit)
- [ ] Chart mit 10001 Tasks → Error beim Öffnen

### Deep Hierarchies
- [ ] Hierarchie mit 10 Ebenen → Funktioniert
- [ ] Alle Eltern-IDs sind gültig
- [ ] Keine Circular References

### Special Characters
- [ ] Task-Name mit Umlauten (ä, ö, ü, ß) → Funktioniert
- [ ] Task-Name mit Emojis (🚀, ✅) → Funktioniert
- [ ] Task-Name mit Quotes ("Test", 'Test') → Escaped korrekt
- [ ] Task-Name mit Newlines/Tabs → Funktioniert

### Empty/Minimal Charts
- [ ] Leeres Chart (0 Tasks) speichern → Funktioniert
- [ ] Chart mit 1 Task speichern → Funktioniert
- [ ] Chart ohne View Settings → Default Settings werden verwendet

### Rapid Operations
- [ ] Schnelles Wechseln zwischen Speichern/Öffnen → Keine Crashes
- [ ] Doppelklick auf Save Button → Nur eine Save Operation
- [ ] Ctrl+S halten → Keine mehrfachen Saves

---

## 9. Security Testing

### XSS Prevention
- [x] Task-Name: `<img src=x onerror=alert('XSS')>` → Script wird nicht ausgeführt ✅ *Automated: sanitize.test.ts*
- [x] Task-Name: `<script>console.log('test')</script>` → Tag wird entfernt ✅ *Automated: sanitize.test.ts, deserialize.test.ts*
- [x] Metadata mit `<iframe>` → Wird sanitized ✅ *Automated: sanitize.test.ts*

### Prototype Pollution
- [x] JSON mit `"__proto__": {"polluted": true}` → Wird gefiltert ✅ *Automated: validate.test.ts, deserialize.test.ts*
- [x] JSON mit `"constructor": {"polluted": true}` → Wird gefiltert ✅ *Automated: validate.test.ts*
- [x] JSON mit `"prototype": {"polluted": true}` → Wird gefiltert ✅ *Automated: validate.test.ts*
- [x] Nach Öffnen: `Object.prototype.polluted` ist `undefined` ✅ *Automated: validate.test.ts, deserialize.test.ts*

### Malformed Files
- [x] Datei mit fehlendem schließendem `}` → JSON Parse Error ✅ *Automated: validate.test.ts, deserialize.test.ts*
- [ ] Datei mit UTF-8 BOM → Funktioniert ⚠️ *Manual: Requires file testing*
- [ ] Datei mit Windows Line Endings (CRLF) → Funktioniert ⚠️ *Manual: Requires file testing*

---

## 10. Integration Testing

### Undo/Redo Integration
- [ ] Nach Open: Undo/Redo History ist leer
- [ ] Nach New: Undo/Redo History ist leer
- [ ] Nach Save: Undo/Redo History bleibt erhalten

### Task Table Integration
- [ ] Gespeicherte Tasks erscheinen in Task Table
- [ ] Hierarchie wird korrekt dargestellt (Einrückung)
- [ ] Progress Bars zeigen korrekte Werte
- [ ] Farben werden angezeigt

### Timeline Integration
- [ ] Gespeicherte Tasks erscheinen auf Timeline
- [ ] Bars haben korrekte Länge (duration)
- [ ] Bars haben korrekte Farben
- [ ] Milestones (◆) werden korrekt dargestellt

---

## 11. Performance Testing

### File Size
- [ ] 100 KB Datei: Öffnet in < 100ms
- [ ] 1 MB Datei: Öffnet in < 500ms
- [ ] 10 MB Datei: Öffnet in < 2s
- [ ] 50 MB Datei: Wird abgelehnt (Limit)

### Operations
- [ ] Save: < 100ms für 100 Tasks
- [ ] Open: < 200ms für 100 Tasks
- [ ] Validation: < 50ms für 100 Tasks

---

## 12. Documentation & Code Quality

### Code
- [x] Alle TypeScript Errors behoben (npm run type-check) ✅ *Automated: No type errors*
- [ ] Linting läuft durch (npm run lint) ⚠️ *Automated: 71 errors, 137 warnings (mostly missing return types)*
- [x] Build erfolgreich (npm run build) ✅ *Automated: Build successful (370.74 kB)*

### Files Created
- [x] `src/config/version.ts` existiert ✅ *Automated: File exists*
- [x] `src/utils/fileOperations/` Verzeichnis mit 8 Dateien ✅ *Automated: All 8 files exist*
- [x] `src/store/slices/fileSlice.ts` existiert ✅ *Automated: File exists*
- [x] `src/hooks/useFileOperations.ts` existiert ✅ *Automated: File exists*
- [x] `src/hooks/useUnsavedChanges.ts` existiert ✅ *Automated: File exists*
- [x] `src/components/Toolbar/FileButtons.tsx` existiert ✅ *Automated: File exists*

### Files Modified
- [x] `src/store/slices/taskSlice.ts` hat `setTasks` action ✅ *Automated: Verified in code*
- [x] `src/hooks/useKeyboardShortcuts.ts` hat File Shortcuts ✅ *Automated: Verified in code*
- [x] `src/components/Layout/AppToolbar.tsx` enthält FileButtons ✅ *Automated: Verified in code*
- [x] `src/App.tsx` ruft useUnsavedChanges auf ✅ *Automated: Verified in code*

---

## 13. Example Files

### Provided Example
- [x] `examples/website-relaunch.gantt` existiert ✅ *Automated: File exists (17 KB)*
- [ ] Datei öffnet ohne Fehler ⚠️ *Manual: Requires browser testing*
- [ ] Alle 27 Tasks werden geladen ⚠️ *Manual: Requires browser testing*
- [ ] Hierarchie (3 Ebenen) wird korrekt dargestellt ⚠️ *Manual: Requires browser testing*
- [ ] Alle Task-Typen (task, summary, milestone) vorhanden ⚠️ *Manual: Requires browser testing*
- [ ] View Settings werden angewendet (Zoom 1.2, Pan -150) ⚠️ *Manual: Requires browser testing*

---

## 14. Final Acceptance Criteria

### Must Have (Blocker)
- [ ] ✅ Save funktioniert in allen Browsern
- [ ] ✅ Open funktioniert in allen Browsern
- [ ] ✅ New funktioniert in allen Browsern
- [ ] ✅ Keyboard Shortcuts (Ctrl+S/O/N) funktionieren
- [ ] ✅ Dirty State wird korrekt getrackt
- [ ] ✅ Unsaved Changes Warning funktioniert
- [ ] ✅ Alle 6 Validation Layers funktionieren
- [ ] ✅ XSS Prevention funktioniert
- [ ] ✅ Prototype Pollution Prevention funktioniert
- [ ] ✅ Round-Trip ohne Datenverlust

### Should Have
- [ ] ✅ Re-Save in Chrome/Edge (kein Dialog)
- [ ] ✅ Toast Notifications
- [ ] ✅ Migration System (Basis vorhanden)
- [ ] ✅ Unknown Fields Preservation

### Nice to Have
- [ ] Documentation/README Update
- [ ] Keyboard Shortcut Cheatsheet
- [ ] Error Message Improvements

---

## Sprint 1.3 Sign-Off

**Tester**: ____________________
**Datum**: ____________________
**Blockers gefunden**: [ ] Ja [ ] Nein
**Sprint Status**: [ ] ✅ Freigegeben [ ] ❌ Zurück an Development

**Notizen**:
```
[Platz für Anmerkungen und gefundene Issues]
```
