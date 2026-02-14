# Performance & Optimization

Checkliste für React Performance, algorithmische Effizienz, Bundle Size und Memory Management.

## React Performance Patterns

- [ ] Prüfe ob `React.memo()` auf teuren Komponenten verwendet wird — insbesondere Komponenten die häufig re-rendern aber selten neue Props bekommen
- [ ] Prüfe ob `useMemo()` für teure Berechnungen verwendet wird — aber NICHT für triviale Operationen (premature optimization)
- [ ] Prüfe ob `useCallback()` für Event-Handler verwendet wird die an memoized Children übergeben werden
- [ ] Prüfe Dependency Arrays auf Korrektheit — fehlende Dependencies = Bugs, unnötige Dependencies = überflüssige Re-Renders
- [ ] Prüfe dass List-Items stabile, eindeutige Keys haben — NICHT den Array-Index wenn die Liste umsortiert werden kann
- [ ] Prüfe ob Lazy Loading für schwere Komponenten sinnvoll wäre (`React.lazy` + Suspense)

## Algorithmic Efficiency

- [ ] Prüfe auf O(n²) nested Loops wo O(n) möglich wäre — nutze Map/Set für Lookups statt Array.find/Array.includes in Schleifen
- [ ] Prüfe dass schwere Berechnungen NICHT im Render-Pfad stattfinden — nutze useMemo/useEffect
- [ ] Prüfe ob Debouncing/Throttling für häufige Events verwendet wird (scroll, resize, input)
- [ ] Prüfe ob effiziente Datenstrukturen genutzt werden: Map für Lookups, Set für Einzigartigkeit
- [ ] Prüfe auf Early Returns — unnötige Arbeit frühzeitig vermeiden
- [ ] Prüfe ob Pagination/Virtualisierung für lange Listen nötig ist (>100 Items)

## Bundle Size & Loading

- [ ] Prüfe auf ungenutzte Library-Imports — Tree-Shaking funktioniert nur wenn keine Side-Effects importiert werden
- [ ] Prüfe ob große Dependencies Code-Split werden können
- [ ] Stelle sicher dass KEINE ganzen Libraries importiert werden wenn nur Teile benötigt werden (`import debounce from 'lodash/debounce'` NICHT `import _ from 'lodash'`)
- [ ] Prüfe ob Bilder optimiert sind (WebP, komprimiert, responsive Sizes)

## Memory Management

- [ ] Prüfe dass Event Listeners in useEffect Cleanup aufgeräumt werden (return-Funktion)
- [ ] Prüfe dass Timer/Intervals bei Unmount gecleaned werden (clearTimeout, clearInterval)
- [ ] Prüfe dass Subscriptions unsubscribed werden
- [ ] Prüfe auf Memory Leaks: Große Objekte die nicht freigegeben werden, wachsende Arrays/Maps ohne Limit
- [ ] Prüfe dass keine Closures über veraltete State-Werte schließen (stale closures)

## Render Optimization

- [ ] Prüfe ob teure Renders mit React DevTools Profiler analysiert werden sollten
- [ ] Prüfe ob Virtualisierung für lange Listen nötig ist (react-window/react-virtual)
- [ ] Prüfe ob Suspense Boundaries für Loading-States sinnvoll sind
- [ ] Prüfe ob DOM-Updates minimiert werden — Batch-Updates nutzen wo möglich
