# OwnChart-Specific Architecture

Checkliste für projektspezifische Patterns: Zustand State Management, .ownchart File Format, Undo/Redo, Component Architecture und Tailwind.

## State Management (Zustand)

- [ ] Prüfe dass Slices den Projekt-Patterns folgen: Actions sind semantisch (`addTask()` nicht `setState()`), Selectors sind extrahiert
- [ ] Prüfe dass Immer Middleware korrekt verwendet wird — KEIN manuelles Object-Spreading in Immer-Actions, direkte Mutation des Draft-State ist korrekt
- [ ] Stelle sicher dass KEINE direkte State-Mutation außerhalb von Immer stattfindet
- [ ] Prüfe dass State normalisiert ist — keine verschachtelten Arrays/Objects die Daten duplizieren
- [ ] Prüfe dass Store-Zugriffe über Hooks erfolgen: `useTaskStore()`, `useChartStore()` etc.
- [ ] Prüfe dass Cross-Store-Zugriffe über `getState()` erfolgen wo nötig (z.B. in navigateCell)

## File Format Compatibility (.ownchart)

- [ ] Prüfe dass Änderungen Rückwärtskompatibilität mit bestehenden .ownchart Dateien wahren
- [ ] Prüfe dass Validation fehlerhafte Daten graceful abfängt (keine Crashes bei alten Dateien)
- [ ] Stelle sicher dass KEINE Breaking Changes ohne Migrationsstrategie eingeführt werden
- [ ] Prüfe dass die File-Format-Version getrackt wird wenn strukturelle Änderungen gemacht werden
- [ ] Prüfe Round-Trip-Konsistenz: Save → Load → Save produziert identische Datei

## Undo/Redo System (historySlice)

- [ ] Prüfe dass ALLE user-initiierten Mutationen in die History integriert sind
- [ ] Prüfe dass das Command Pattern korrekt befolgt wird: Jede Operation muss invertierbar sein
- [ ] Prüfe dass die History KEINE intermediate Drag-States erfasst — nur den finalen State
- [ ] Prüfe dass die History Stack Size limitiert ist — keine Memory Leaks bei langen Sessions

## Component Architecture

- [ ] Prüfe dass SVAR-style Layout-Patterns eingehalten werden: Sticky Headers, synchronisiertes Scrollen
- [ ] Prüfe dass D3.js NUR für das verwendet wird was React nicht effizient kann (Scales, SVG-Helpers, Axis-Rendering)
- [ ] Prüfe dass Timeline-Rendering optimiert ist — nur der sichtbare Bereich sollte gerendert werden bei >1000 Tasks
- [ ] Prüfe dass Refs angemessen verwendet werden: DOM-Zugriff, D3-Integration, Performance-kritische DOM-Manipulation (z.B. SplitPane Drag)

## TailwindCSS Usage

- [ ] Prüfe dass Tailwind-Klassen verwendet werden, NICHT Inline-Styles oder separates CSS
- [ ] Prüfe dass Custom Classes in `index.css` NUR für wirklich wiederverwendbare Utilities sind
- [ ] Stelle sicher dass KEINE hardcodierten Farben existieren — Tailwind Color System oder Custom Theme nutzen
- [ ] Prüfe ob Responsive Design mit Tailwind Breakpoints nötig ist

## Import Organization

- [ ] Prüfe dass absolute Imports von `src/` verwendet werden (nicht relative Pfade wie `../../../`)
- [ ] Prüfe Import-Gruppierung: React/Libraries zuerst, dann lokale Imports, dann Types
- [ ] Prüfe auf zirkuläre Imports — verwende bei Bedarf `madge --circular src/` zur Überprüfung
