# Accessibility (a11y)

Checkliste für Semantic HTML, Keyboard Navigation, Screen Reader Support und Farb-Kontraste.

## Semantic HTML

- [ ] Prüfe korrekte Heading-Hierarchie: h1 → h2 → h3, keine Ebenen überspringen
- [ ] Prüfe dass `<button>` für Aktionen und `<a>` für Navigation verwendet wird — NICHT div/span mit onClick
- [ ] Prüfe dass `<form>` mit korrektem Submit-Handling verwendet wird wo Formulare existieren
- [ ] Prüfe dass native Elemente bevorzugt werden: `<input>` statt custom Text-Fields, `<select>` statt custom Dropdowns (wo möglich)

## Keyboard Navigation

- [ ] Prüfe dass ALLE interaktiven Elemente per Keyboard erreichbar sind (Tab, Enter, Space)
- [ ] Prüfe dass Focus-Styles sichtbar sind — KEIN `outline: none` ohne alternative Focus-Indikation
- [ ] Prüfe dass die Tab-Reihenfolge logisch ist und der visuellen Reihenfolge folgt
- [ ] Prüfe Focus Trapping in Modals — Focus darf nicht hinter dem Modal landen
- [ ] Prüfe dass Escape Modals/Dropdowns schließt
- [ ] Prüfe dass Arrow Keys in Menüs/Listen funktionieren

## Screen Reader Support

- [ ] Prüfe dass Icon-Buttons ARIA Labels haben (`aria-label="Save"`, `aria-label="Close"`)
- [ ] Prüfe dass Bilder Alt-Text haben (leerer Alt für dekorative: `alt=""`)
- [ ] Prüfe dass Custom Widgets ARIA Roles haben (`role="dialog"`, `role="menu"`, `role="tablist"`)
- [ ] Prüfe ob Live Regions für dynamischen Content sinnvoll wären (`aria-live="polite"` für Status-Updates)
- [ ] Prüfe dass ARIA States korrekt gesetzt werden: `aria-expanded`, `aria-selected`, `aria-disabled`, `aria-checked`

## Color & Contrast

- [ ] Prüfe dass Farbe NICHT der einzige Informationsträger ist — zusätzlich Icons und/oder Text verwenden
- [ ] Prüfe Kontrastverhältnis: ≥ 4.5:1 für normalen Text, ≥ 3:1 für großen Text (18px+ oder 14px+ bold)
- [ ] Prüfe Focus-Indikatoren: Sichtbar und mit ausreichendem Kontrast für Keyboard-User
- [ ] Berücksichtige Farbenblindheit: Rot/Grün-Kombinationen vermeiden als einzigen Unterscheidungsfaktor
