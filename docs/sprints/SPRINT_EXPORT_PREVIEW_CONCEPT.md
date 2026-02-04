# Sprint Konzept: Export Preview

## Übersicht

**Feature**: Live-Preview im Export Dialog
**Variante**: Standard (skalierte Preview mit Debounce und Memory Management)
**Geschätzter Aufwand**: 7-11 Tage (5 Phasen)
**Priorität**: Enhancement
**Status**: ✅ IMPLEMENTED (v0.0.28 - 2026-01-15)

### Aufwand-Übersicht
| Phase | Beschreibung | Tage |
|-------|--------------|------|
| 1 | Basis-Infrastruktur (Hook, Debounce, Cleanup) | 2 |
| 2 | PNG/SVG Preview | 1-2 |
| 3 | PDF Preview mit Seitenlayout | 2-3 |
| 4 | Layout & Integration | 1-2 |
| 5 | Polish & Testing | 1-2 |

## Ziel

Benutzer sollen vor dem Export eine visuelle Vorschau sehen, die alle gewählten Einstellungen reflektiert. Die Preview aktualisiert sich bei jeder Änderung der Export-Optionen.

## Aktueller Zustand

### ExportDialog Struktur
- **Datei**: `src/components/Export/ExportDialog.tsx`
- **Aktuelle Breite**: `max-w-xl` (576px)
- **Layout**: Vertikal gestapelt (Format-Selector → Options → Footer)
- **Keine visuelle Preview** - nur geschätzte Dimensionen als Text

### Export Rendering Pipeline
1. `calculateExportDimensions()` - Berechnet Größe basierend auf Options
2. `createOffscreenContainer()` - Erstellt versteckten DOM-Container
3. `ExportRenderer` - React-Komponente rendert Chart
4. `waitForFonts()` + `waitForPaint()` - Wartet auf Fonts/Rendering
5. `html-to-image.toCanvas()` - Konvertiert zu Canvas
6. Cleanup: `root.unmount()` + Container entfernen

### Relevante Dateien
- `src/components/Export/ExportDialog.tsx` - Dialog-Komponente
- `src/components/Export/ExportRenderer.tsx` - Render-Komponente (516 LOC)
- `src/utils/export/captureChart.ts` - Capture-Logik (172 LOC)
- `src/utils/export/helpers.ts` - Helper-Funktionen
- `src/store/slices/uiSlice.ts` - Export State Management

## Neues Design

### Layout-Änderung

**PNG/SVG Preview:**
```
┌─────────────────────────────────────────────────────────────┐
│  Export Chart                                          [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │ ┌─────────────────┐ │  │  [PNG] [PDF] [SVG]            │ │
│  │ │                 │ │  │                               │ │
│  │ │    CHART        │ │  │  Timeline Scale               │ │
│  │ │    PREVIEW      │ │  │  ○ Use current view (67%)     │ │
│  │ │                 │ │  │  ○ Fit to width               │ │
│  │ │  (skaliert)     │ │  │  ○ Custom zoom                │ │
│  │ │                 │ │  │                               │ │
│  │ └─────────────────┘ │  │  ... weitere Optionen         │ │
│  │   4521 × 2340 px    │  │                               │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                      [Cancel] [Export PNG]  │
└─────────────────────────────────────────────────────────────┘
```

**PDF Preview (mit Seitenlayout):**
```
┌─────────────────────────────────────────────────────────────┐
│  Export Chart                                          [X]  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────┐  ┌───────────────────────────────┐ │
│  │ ┌─────────────────┐ │  │  [PNG] [PDF] [SVG]            │ │
│  │ │ Project Title   │ │  │                               │ │
│  │ ├─────────────────┤ │  │  Timeline Scale               │ │
│  │ │░░░░░░░░░░░░░░░░░│ │  │  ○ Use current view           │ │
│  │ │░░ CHART ░░░░░░░░│ │  │  ○ Fit to page                │ │
│  │ │░░ PREVIEW ░░░░░░│ │  │  ○ Custom zoom                │ │
│  │ │░░░░░░░░░░░░░░░░░│ │  │                               │ │
│  │ ├─────────────────┤ │  │  Page Setup                   │ │
│  │ │ Footer Text     │ │  │  Size: A4  Orient: Landscape  │ │
│  │ └─────────────────┘ │  │                               │ │
│  │      A4 Landscape   │  │  ... weitere Optionen         │ │
│  └─────────────────────┘  └───────────────────────────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                      [Cancel] [Export PDF]  │
└─────────────────────────────────────────────────────────────┘
```

### Dialog-Breite
- **Neu**: `max-w-4xl` oder `max-w-5xl` (896px - 1024px)
- **Preview-Bereich**: ~300-350px Breite (links)
- **Options-Bereich**: ~500-600px Breite (rechts)

## Technische Implementierung

### 1. Neuer Hook: `useExportPreview`

```typescript
// src/hooks/useExportPreview.ts

interface UseExportPreviewResult {
  previewCanvas: HTMLCanvasElement | null;
  previewDimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
}

function useExportPreview(
  tasks: Task[],
  options: ExportOptions,
  columnWidths: Record<string, number>,
  currentAppZoom: number,
  projectDateRange?: { start: Date; end: Date },
  visibleDateRange?: { start: Date; end: Date },
  enabled: boolean = true
): UseExportPreviewResult
```

**Funktionsweise**:
1. Debounce Options-Änderungen (300ms)
2. Berechne Dimensionen
3. Rendere in Offscreen-Container (skaliert auf max 600px Breite)
4. Capture zu Canvas
5. Cleanup alter Canvas bei neuem Render
6. Cleanup bei Unmount

### 2. Preview-Komponenten

#### 2.1 ChartPreview (PNG/SVG)

```typescript
// src/components/Export/ChartPreview.tsx

interface ChartPreviewProps {
  canvas: HTMLCanvasElement | null;
  dimensions: { width: number; height: number };
  isRendering: boolean;
  error: string | null;
  background: "white" | "transparent";
  maxWidth?: number;  // Default: 300
  maxHeight?: number; // Default: 400
}
```

**Features**:
- Zeigt Canvas skaliert an (object-fit: contain)
- Loading-Spinner während Rendering
- Error-State bei Fehlern
- Dimensionen-Anzeige unter Preview (z.B. "4521 × 2340 px")
- Checkerboard-Hintergrund für transparente Exports

#### 2.2 PdfPreview (PDF mit Seitenlayout)

```typescript
// src/components/Export/PdfPreview.tsx

interface PdfPreviewProps {
  canvas: HTMLCanvasElement | null;
  chartDimensions: { width: number; height: number };
  pdfOptions: PdfExportOptions;
  projectTitle?: string;
  projectAuthor?: string;
  isRendering: boolean;
  error: string | null;
  maxWidth?: number;  // Default: 300
}
```

**Features**:
- Zeigt "Papier"-Rahmen mit korrektem Seitenverhältnis
- Seitenformat-Label unter Preview (z.B. "A4 Landscape")
- Visualisiert Margins als Abstände
- Header-Bereich mit Project Title / Author / Date (wenn aktiviert)
- Footer-Bereich mit Project Title / Author / Date (wenn aktiviert)
- Chart-Content skaliert im verfügbaren Bereich
- Zeigt Skalierungsfaktor wenn Content verkleinert wird (z.B. "67%")

**PDF-Preview Struktur**:
```
┌────────────────────────────────────┐  ← Paper border (shadow)
│  ┌──────────────────────────────┐  │  ← Margin top
│  │ Project Title    2026-01-11  │  │  ← Header (wenn aktiviert)
│  ├──────────────────────────────┤  │
│  │                              │  │
│  │      ┌────────────────┐      │  │  ← Chart (skaliert, zentriert)
│  │      │   CHART CANVAS │      │  │
│  │      │                │      │  │
│  │      └────────────────┘      │  │
│  │                              │  │
│  ├──────────────────────────────┤  │
│  │ Author Name      2026-01-11  │  │  ← Footer (wenn aktiviert)
│  └──────────────────────────────┘  │  ← Margin bottom
└────────────────────────────────────┘

       A4 Landscape · Scaled to 67%      ← Info-Label
```

#### 2.3 ExportPreview (Wrapper)

```typescript
// src/components/Export/ExportPreview.tsx

interface ExportPreviewProps {
  format: ExportFormat;
  canvas: HTMLCanvasElement | null;
  dimensions: { width: number; height: number };
  pdfOptions?: PdfExportOptions;
  exportOptions: ExportOptions;
  projectTitle?: string;
  projectAuthor?: string;
  isRendering: boolean;
  error: string | null;
}
```

**Logik**:
- `format === "pdf"` → Rendert `<PdfPreview />`
- `format === "png" | "svg"` → Rendert `<ChartPreview />`

### 3. Anpassungen ExportDialog

```typescript
// Änderungen in ExportDialog.tsx

// 1. Dialog breiter machen
widthClass="max-w-4xl"

// 2. Two-Column Layout
<div className="flex gap-6">
  {/* Left: Preview */}
  <div className="w-[320px] flex-shrink-0">
    <ExportPreview {...previewProps} />
  </div>

  {/* Right: Options (scrollable) */}
  <div className="flex-1 overflow-y-auto max-h-[600px]">
    {/* Existing options components */}
  </div>
</div>
```

### 4. Skalierung für Preview

```typescript
// Preview-spezifische Skalierung
const PREVIEW_MAX_WIDTH = 600;  // Pixel für Offscreen-Render
const PREVIEW_DISPLAY_WIDTH = 300;  // Pixel für Anzeige

// Berechne Skalierungsfaktor
const scaleFactor = Math.min(
  PREVIEW_MAX_WIDTH / dimensions.width,
  PREVIEW_MAX_WIDTH / dimensions.height,
  1  // Nie hochskalieren
);

// Render mit reduzierter Größe für Performance
const previewDimensions = {
  width: Math.round(dimensions.width * scaleFactor),
  height: Math.round(dimensions.height * scaleFactor)
};
```

### 5. Memory Management

```typescript
// Cleanup-Pattern im Hook
useEffect(() => {
  let currentCanvas: HTMLCanvasElement | null = null;
  let aborted = false;

  const render = async () => {
    // ... render logic
    if (!aborted) {
      // Cleanup vorheriger Canvas
      if (currentCanvas) {
        // Canvas hat keine explizite dispose(), aber
        // Garbage Collector räumt auf wenn keine Referenz mehr
      }
      currentCanvas = newCanvas;
      setPreviewCanvas(newCanvas);
    }
  };

  render();

  return () => {
    aborted = true;
    currentCanvas = null;
  };
}, [debouncedOptions]);
```

### 6. Debounce Implementation

```typescript
// Nutze bestehenden useDebouncedValue oder implementiere neu
const debouncedOptions = useDebouncedValue(options, 300);

// Oder mit useEffect + setTimeout
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedOptions(options);
  }, 300);

  return () => clearTimeout(timer);
}, [options]);
```

## Implementierungs-Phasen

### Phase 1: Basis-Infrastruktur (2 Tage)
- [ ] `useExportPreview` Hook erstellen
- [ ] Debounce-Logik implementieren
- [ ] Memory Management (Cleanup)
- [ ] Basis-Integration in ExportDialog

### Phase 2: PNG/SVG Preview (1-2 Tage)
- [ ] `ChartPreview` Komponente erstellen
- [ ] Canvas-Anzeige mit Skalierung
- [ ] Loading-State Styling
- [ ] Checkerboard für transparenten Hintergrund
- [ ] Dimensionen-Anzeige

### Phase 3: PDF Preview mit Seitenlayout (2-3 Tage)
- [ ] `PdfPreview` Komponente erstellen
- [ ] Paper-Rahmen mit korrektem Seitenverhältnis
- [ ] Margin-Visualisierung
- [ ] Header-Bereich (Project Title, Author, Date)
- [ ] Footer-Bereich (Project Title, Author, Date)
- [ ] Skalierungsfaktor-Berechnung und -Anzeige
- [ ] Seitenformat-Label (z.B. "A4 Landscape")

### Phase 4: Layout & Integration (1-2 Tage)
- [ ] Two-Column Layout im Dialog
- [ ] Dialog-Breite anpassen
- [ ] `ExportPreview` Wrapper (Format-Switch)
- [ ] Responsive Verhalten prüfen

### Phase 5: Polish & Testing (1-2 Tage)
- [ ] Error Handling verbessern
- [ ] Edge Cases (leere Tasks, sehr große Charts)
- [ ] Unit Tests für Hooks und Komponenten
- [ ] Manuelle Tests aller Formate

## Zu beachtende Edge Cases

1. **Leere Task-Liste**: Zeige Placeholder oder deaktiviere Preview
2. **Sehr große Charts (>8000px)**: Preview auf max 600px skalieren
3. **Font-Loading**: Warte auf Fonts vor erstem Render
4. **Schnelle Option-Änderungen**: Debounce verhindert Render-Spam
5. **Dialog schließen während Render**: Abort-Flag und Cleanup
6. **Format-Wechsel (PNG→PDF→SVG)**: Preview aktualisieren

## Nicht im Scope

- Scrollbare Preview (Chart wird skaliert, nicht gescrollt)
- Interaktive Preview (Klicken, Zoomen)
- Echtzeit-Preview ohne Debounce

## Abhängigkeiten

- Bestehende Export-Infrastruktur (captureChart, ExportRenderer)
- html-to-image Library (bereits installiert)
- React 18 (createRoot für Offscreen-Rendering)

## Risiken

| Risiko | Wahrscheinlichkeit | Impact | Mitigation |
|--------|-------------------|--------|------------|
| Performance bei großen Charts | Mittel | Mittel | Aggressive Skalierung, längeres Debounce |
| Memory Leaks | Niedrig | Hoch | Sorgfältiges Cleanup, Testing |
| Font-Loading Timing | Niedrig | Mittel | waitForFonts() bereits implementiert |
| Browser-Kompatibilität | Niedrig | Niedrig | html-to-image handhabt das |

## Erfolgskriterien

### Alle Formate
1. Preview zeigt exakt das Export-Ergebnis (nur skaliert)
2. Preview aktualisiert sich bei jeder Option-Änderung (~300ms Debounce)
3. Keine spürbaren Performance-Probleme bei normalen Charts (<200 Tasks)
4. Kein Memory-Aufbau bei wiederholten Option-Änderungen
5. Sauberer Loading-State während Rendering

### PDF-spezifisch
6. Seitenverhältnis entspricht gewähltem Format (A4, A3, Letter, etc.)
7. Margins sind korrekt visualisiert
8. Header zeigt korrekte Inhalte (wenn aktiviert)
9. Footer zeigt korrekte Inhalte (wenn aktiviert)
10. Skalierungsfaktor wird angezeigt wenn Content verkleinert wird

## Verifikation

### Manuelle Tests - Alle Formate
1. Dialog öffnen → Preview wird angezeigt
2. Zoom ändern → Preview aktualisiert nach ~300ms
3. Spalten an/abwählen → Preview aktualisiert
4. Format wechseln (PNG→PDF→SVG) → Preview aktualisiert korrekt
5. Export durchführen → Ergebnis entspricht Preview
6. Dialog schließen/öffnen → Kein Memory Leak

### Manuelle Tests - PDF Preview
7. Page Size ändern (A4→A3→Letter) → Paper-Rahmen ändert Seitenverhältnis
8. Orientation ändern (Landscape↔Portrait) → Paper-Rahmen dreht sich
9. Margins ändern → Abstände in Preview ändern sich
10. Header aktivieren → Header erscheint in Preview mit korrektem Text
11. Footer aktivieren → Footer erscheint in Preview mit korrektem Text
12. Fit to Page aktivieren → Skalierungsfaktor wird angezeigt

### Manuelle Tests - PNG/SVG Preview
13. Hintergrund auf "Transparent" → Checkerboard erscheint
14. Fit to Width ändern → Dimensionen-Anzeige aktualisiert
15. Custom Zoom ändern → Preview und Dimensionen aktualisieren

### Automatisierte Tests
```bash
npm run test:unit -- --grep "useExportPreview"
npm run test:unit -- --grep "ChartPreview"
npm run test:unit -- --grep "PdfPreview"
npm run test:unit -- --grep "ExportPreview"
```


---

## Implementation Status

**Status**: ✅ IMPLEMENTED (v0.0.28 - 2026-01-15)

### What Was Implemented:
- Figma-style export dialog with live preview panel
- Preview shows real-time export appearance for PNG/PDF/SVG
- Settings panel with all export options
- Preview updates with debouncing on settings changes
- 55/45 preview/settings split layout with larger preview area

### Key Features Delivered:
- Live preview for all export formats (PNG, PDF, SVG)
- Real-time updates when changing export settings
- Preview panel showing exact export output (scaled)
- Dimension display below preview
- Clean, modern UI matching Figma-style layout

### Notes:
- Implementation went beyond concept with additional UI polish
- Export dialog expanded to max-w-7xl for better preview visibility
- Preview panel width increased to 65% for optimal viewing
- All success criteria met

**Last Updated**: 2026-02-04
