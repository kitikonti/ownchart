# Refactoring Opportunities

Checkliste für Refactoring-Möglichkeiten: Constants, DRY, Component Extraction, Function Naming.

## Hardcoded Values → Constants/Config

- [ ] Prüfe auf Magic Numbers — jede Zahl ohne offensichtliche Bedeutung muss eine benannte Konstante werden (z.B. `DEBOUNCE_DELAY_MS = 300` statt `300`)
- [ ] Prüfe auf hardcodierte Farb-Hex-Codes — gehören in `src/constants/colors.ts` oder das Tailwind Theme-System
- [ ] Prüfe auf hardcodierte Strings — Error Messages und Labels gehören in `src/constants/messages.ts`
- [ ] Prüfe auf hardcodierte Konfiguration — API-Endpoints, Feature Flags etc. gehören in `src/config/`
- [ ] Prüfe auf hardcodierte Timeouts/Durations — benannte Konstanten verwenden

## Duplication → DRY (Don't Repeat Yourself)

- [ ] Prüfe auf wiederholte Logik → Extract zu `src/utils/`
- [ ] Prüfe auf ähnliche Komponenten → Generische Komponente mit Props/Slots erstellen
- [ ] Prüfe auf Copy-Paste Code-Blöcke → Shared Function extrahieren
- [ ] Prüfe auf ähnliche Hooks → Generalisierten Custom Hook erstellen
- [ ] Prüfe auf wiederholtes JSX → Component Extraction
- [ ] Prüfe auf wiederholte Type-Definitionen → Shared Types File

## Component Extraction & Composition

- [ ] Prüfe auf verschachteltes JSX >20 Zeilen → Sub-Component extrahieren
- [ ] Prüfe auf wiederverwendbare UI-Patterns → `src/components/common/` nutzen
- [ ] Prüfe auf komplexes Conditional Rendering → Separate Komponenten + conditional mount statt langer Ternaries
- [ ] Prüfe auf Business Logic in Komponenten → Custom Hook extrahieren (z.B. useTaskValidation)
- [ ] Prüfe ob Render Props oder Children Props die Flexibilität verbessern würden
- [ ] Prüfe ob das Compound Component Pattern für komplexe UI sinnvoll wäre (z.B. Dropdown.Trigger, Dropdown.Menu)

## Function Extraction & Naming

- [ ] Prüfe auf komplexe Expressions → Benannte Funktion die den Intent erklärt
- [ ] Prüfe auf anonyme Callback-Funktionen → Benannte Funktion mit klarem Zweck
- [ ] Prüfe auf lange Funktionen → Kohärente Sub-Tasks extrahieren
- [ ] Prüfe Naming: Namen erklären WARUM, nicht WAS — `calculateBusinessDays()` nicht `loopDates()`, `filterVisibleTasks()` nicht `filter()`
