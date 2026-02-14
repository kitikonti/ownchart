# Code Quality & Standards

Checkliste für TypeScript-Qualität, Naming, Dead Code und Code Smells. Jedes Item systematisch prüfen.

## TypeScript Strict Mode

- [ ] Prüfe dass KEINE `any` Types vorhanden sind — nutze `unknown` mit Type Guards oder korrekte Typisierung
- [ ] Prüfe dass alle Funktionen explizite Return-Types haben
- [ ] Prüfe dass keine unsicheren Type Assertions (`as`) ohne Begründungskommentar existieren
- [ ] Prüfe korrekte Interface/Type-Definitionen: Interface für Objekte, Type für Unions
- [ ] Prüfe ob Generic Types genutzt werden wo sie Wiederverwendbarkeit verbessern würden
- [ ] Prüfe ob Discriminated Unions für komplexe State-Typen genutzt werden statt String-Literale

## Code Organization

- [ ] Prüfe dass KEINE Funktion länger als 50 Zeilen ist — bei Überschreitung: Extract Method mit klarem Namen
- [ ] Prüfe dass KEINE Komponente länger als 200 Zeilen ist — bei Überschreitung: Aufteilen in Sub-Komponenten
- [ ] Prüfe dass Single Responsibility eingehalten wird — eine Funktion = eine Aufgabe
- [ ] Prüfe Naming: Klare, beschreibende Namen ohne Abkürzungen (`userData` nicht `usrDat`, `isTaskCompleted` nicht `flag`)
- [ ] Prüfe logische Gruppierung: Zusammengehörige Funktionen stehen beieinander
- [ ] Prüfe Export-Organisation: Types zuerst, dann Functions/Components

## Dead Code Removal

- [ ] Prüfe auf ungenutzte Imports — jeder Import muss verwendet werden
- [ ] Prüfe auf auskommentierten Code — muss gelöscht werden (Git-History existiert)
- [ ] Prüfe auf unerreichbare Code-Pfade (Code nach return, unreachable branches)
- [ ] Prüfe auf ungenutzte Variablen, Funktionen oder Props
- [ ] Prüfe auf Debug-Code: `console.log`, `console.debug`, `debugger` Statements müssen entfernt werden

## Code Smells (Martin Fowler's Katalog)

- [ ] **Long Method**: Funktionen >50 Zeilen → Extract Method anwenden
- [ ] **Large Class**: Dateien mit zu vielen Verantwortlichkeiten → In fokussierte Module aufteilen
- [ ] **Duplicated Code**: Gleiche oder sehr ähnliche Code-Blöcke → Extract zu Utility/Hook
- [ ] **Long Parameter List**: Mehr als 3-4 Parameter → Parameter Object Pattern verwenden
- [ ] **Primitive Obsession**: Primitive Typen wo Domain-Types besser wären → Custom Types erstellen (z.B. `TaskId` statt `string`)
- [ ] **Switch Statements**: Lange switch/if-else Ketten → Map/Record oder Polymorphismus verwenden
- [ ] **Temporary Field**: Felder die nur manchmal gesetzt sind → State-Management refactoren
- [ ] **Message Chains**: `a.b.c.d.method()` → Law of Demeter beachten, Zwischenvariablen oder Delegation nutzen
