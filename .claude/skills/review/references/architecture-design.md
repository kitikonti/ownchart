# Architecture & Design Patterns

Checkliste für Architektur und Design-Entscheidungen. Jedes Item systematisch gegen die reviewte Datei prüfen.

## Architecture Decisions

- [ ] Prüfe dass die Datei im richtigen Layer liegt (components vs utils vs store vs hooks vs config vs types)
- [ ] Prüfe dass etablierte Architektur-Patterns des Projekts eingehalten werden
- [ ] Stelle sicher dass UI, Business Logic, State und Side Effects sauber getrennt sind
- [ ] Prüfe ob das richtige Abstraktionslevel gewählt wurde — nicht zu generisch, nicht zu spezifisch

## SOLID Principles

- [ ] **Single Responsibility**: Hat diese Datei/Komponente genau einen klar definierten Zweck? Wenn die Beschreibung "und" enthält, sollte sie aufgeteilt werden
- [ ] **Open/Closed**: Kann die Funktionalität erweitert werden ohne bestehenden Code zu ändern? (z.B. durch Props, Konfiguration, Callbacks)
- [ ] **Dependency Inversion**: Hängt der Code von Abstraktionen ab, nicht von konkreten Implementierungen? (z.B. Interfaces statt direkte Imports)
- [ ] **Interface Segregation**: Gibt es keine ungenutzten Props oder aufgeblähte Interfaces? Jede Property sollte vom Consumer tatsächlich genutzt werden

## Design Patterns Usage

- [ ] Prüfe ob das richtige Pattern für das Problem gewählt wurde (Observer, Factory, Command, etc.)
- [ ] Prüfe dass Zustand-Slices den etablierten Patterns folgen (Actions, Selectors, Immer-Middleware)
- [ ] Prüfe dass das Command Pattern für Undo/Redo korrekt verwendet wird (invertierbare Operationen)
- [ ] Frage: Gibt es ein einfacheres Pattern das hier besser funktionieren würde?

## Coupling & Cohesion

- [ ] **Low Coupling**: Minimale Abhängigkeiten zwischen Modulen. Prüfe Import-Liste — zu viele Imports = zu hohe Kopplung
- [ ] **High Cohesion**: Zusammengehörige Funktionalität ist gruppiert. Unzusammenhängendes gehört in separate Dateien
- [ ] Prüfe auf zirkuläre Abhängigkeiten — A importiert B importiert A ist ein Architektur-Problem
- [ ] Gibt es Dependency-Injection-Möglichkeiten die Testbarkeit verbessern würden?

## State Management Architecture

- [ ] Prüfe dass State auf dem richtigen Level lebt: Lokaler State (useState) vs. globaler State (Zustand Store)
- [ ] Prüfe dass Zustand-Slices fokussiert und richtig organisiert sind (taskSlice, chartSlice, historySlice, etc.)
- [ ] Stelle sicher dass kein Prop Drilling stattfindet — nutze stattdessen den Zustand Store direkt
- [ ] Prüfe dass State-Updates immutable sind und Immer-Middleware korrekt genutzt wird (keine manuelle Object-Spreads in Immer-Actions)
