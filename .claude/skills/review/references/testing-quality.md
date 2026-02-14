# Testing & Quality Assurance

Checkliste für Test Coverage, Error Handling, Testing Best Practices und Logging.

## Test Coverage

- [ ] Prüfe dass Unit Tests für alle Utilities und Pure Functions existieren (100% Target für kritische Module)
- [ ] Prüfe dass Tests für Custom Hooks existieren
- [ ] Prüfe dass Component Tests Verhalten testen, NICHT Implementierungsdetails (kein Testing von internem State)
- [ ] Prüfe dass Edge Cases abgedeckt sind: leere Werte, null, undefined, Extremwerte, leere Arrays/Objects
- [ ] Prüfe dass Error Cases getestet sind: Was passiert bei ungültigen Inputs?
- [ ] Prüfe ob Integration Tests für Feature-Flows existieren

## Error Handling

- [ ] Prüfe dass try-catch Blocks dort existieren wo Fehler auftreten können (Parsing, File Operations, externe Aufrufe)
- [ ] Prüfe dass Error Messages User-freundlich sind — keine technischen Stack Traces für den Enduser
- [ ] Stelle sicher dass KEINE Silent Failures existieren — Fehler müssen geloggt oder dem User angezeigt werden
- [ ] Prüfe ob Error Boundaries für React Component Errors existieren
- [ ] Prüfe auf Graceful Degradation: Feature schlägt fehl, App läuft weiter
- [ ] Prüfe ob Recovery-Mechanismen existieren (Retry, Reset, Alternative Pfade)

## Testing Best Practices

- [ ] Prüfe dass Tests deterministisch sind — keine flaky Tests (keine Abhängigkeit von Timing, Reihenfolge oder externem State)
- [ ] Prüfe dass Tests isoliert sind — kein geteilter State zwischen Tests (beforeEach mit Clean Setup)
- [ ] Prüfe dass Test-Namen Verhalten beschreiben: `it('should calculate business days excluding weekends')` nicht `it('test 1')`
- [ ] Prüfe AAA Pattern: Arrange (Setup), Act (Ausführung), Assert (Überprüfung) — klar getrennt
- [ ] Prüfe dass Mocks sparsam eingesetzt werden — echten Code testen wo möglich, nur externe Dependencies mocken

## Logging & Observability

- [ ] Stelle sicher dass KEIN `console.log` in Production-Code existiert — nur in Test-/Dev-Hilfscode
- [ ] Stelle sicher dass KEIN Debug-Code existiert: `debugger`, test-only Branches, temporäre Flags
- [ ] Prüfe dass Error Messages genug Kontext für Debugging enthalten (aber keine sensitiven Daten)
- [ ] Prüfe dass Fehler mit Kontext-Information geloggt werden (welche Operation, welche Daten, wo im Flow)
