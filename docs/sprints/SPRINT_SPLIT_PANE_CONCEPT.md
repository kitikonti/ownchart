# Sprint Konzept: Split Pane für TaskTable/Timeline

## Übersicht

Implementierung eines resizebaren Split Pane Systems zwischen TaskTable und Timeline View, mit dynamischer Breitenbegrenzung basierend auf den Spaltenbreiten.

## Aktueller Stand

### Layout-Struktur (GanttLayout.tsx)
```
Header Row (flex)
├── TaskTableHeader (w-auto flex-shrink-0 min-w-[800px])
└── TimelineHeader (flex-1)

Content Row (flex)
├── TaskTable (w-auto flex-shrink-0 min-w-[800px])
└── ChartCanvas (flex-1)
```

### Spaltenbreiten-Management
- **State**: `columnWidths: Record<string, number>` in `taskSlice.ts`
- **Default**: Definiert in `tableColumns.ts` als `defaultWidth` (z.B. `minmax(200px, 1fr)`)
- **Resize**: `ColumnResizer.tsx` für einzelne Spalten (innerhalb TaskTable)

## Anforderungen

1. **Split Pane zwischen TaskTable und Timeline**
   - Vertikaler Divider/Handle zum Ziehen
   - Drag & Drop für Breitenänderung

2. **Timeline View**
   - Füllt immer den restlichen horizontalen Bereich
   - Keine wesentlichen Änderungen erforderlich

3. **TaskTable**
   - Horizontaler Scrollbalken wenn Inhalt breiter als verfügbarer Platz
   - Split Pane nicht größer ziehbar als Gesamtbreite der Spalten

4. **Dynamische Maximalgröße**
   - Maximale Split-Pane-Breite = Summe aller Spaltenbreiten
   - Passt sich an wenn Spaltenbreiten geändert werden

## Technisches Design

### 1. Neuer State im Store

```typescript
// taskSlice.ts erweitern
interface TaskState {
  // ... existing
  columnWidths: Record<string, number>;
  taskTableWidth: number | null;  // NEU: null = auto (Gesamtspaltenbreite)
}

// Neue Actions
setTaskTableWidth: (width: number | null) => void;
```

### 2. Berechnung der Gesamtspaltenbreite

```typescript
// hooks/useTableDimensions.ts (NEU)
export function useTableDimensions() {
  const columnWidths = useTaskStore((state) => state.columnWidths);

  const totalColumnWidth = useMemo(() => {
    return TASK_COLUMNS.reduce((sum, col) => {
      const width = columnWidths[col.id] ?? parseDefaultWidth(col.defaultWidth);
      return sum + width;
    }, 0);
  }, [columnWidths]);

  return { totalColumnWidth };
}

// Helper: Default-Breite aus CSS-Grid-Syntax extrahieren
function parseDefaultWidth(defaultWidth: string): number {
  // 'minmax(200px, 1fr)' → 200
  // '150px' → 150
  const match = defaultWidth.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 100;
}
```

### 3. Split Pane Komponente

```typescript
// components/Layout/SplitPane.tsx (NEU)
interface SplitPaneProps {
  leftContent: React.ReactNode;
  rightContent: React.ReactNode;
  leftWidth: number;
  minLeftWidth: number;
  maxLeftWidth: number;
  onLeftWidthChange: (width: number) => void;
}

export function SplitPane({
  leftContent,
  rightContent,
  leftWidth,
  minLeftWidth,
  maxLeftWidth,
  onLeftWidthChange,
}: SplitPaneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = e.clientX - containerRect.left;

      // Begrenzen zwischen min und max
      const clampedWidth = Math.max(
        minLeftWidth,
        Math.min(maxLeftWidth, newWidth)
      );

      onLeftWidthChange(clampedWidth);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, minLeftWidth, maxLeftWidth, onLeftWidthChange]);

  return (
    <div ref={containerRef} className="flex h-full">
      {/* Left Panel (TaskTable) */}
      <div
        style={{ width: leftWidth }}
        className="flex-shrink-0 overflow-x-auto"
      >
        {leftContent}
      </div>

      {/* Resize Handle */}
      <div
        className={cn(
          "w-1 cursor-col-resize bg-gray-200 hover:bg-blue-400 transition-colors",
          isDragging && "bg-blue-500"
        )}
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel (Timeline) */}
      <div className="flex-1 min-w-0">
        {rightContent}
      </div>
    </div>
  );
}
```

### 4. Split Pane Divider Komponente

```typescript
// components/Layout/SplitPaneDivider.tsx (NEU)
interface SplitPaneDividerProps {
  onMouseDown: (e: React.MouseEvent) => void;
  isDragging: boolean;
}

export function SplitPaneDivider({ onMouseDown, isDragging }: SplitPaneDividerProps) {
  return (
    <div
      className={cn(
        "w-1 cursor-col-resize flex-shrink-0",
        "bg-gray-200 hover:bg-blue-400",
        "transition-colors duration-150",
        "relative group",
        isDragging && "bg-blue-500"
      )}
      onMouseDown={onMouseDown}
    >
      {/* Visual indicator on hover */}
      <div className={cn(
        "absolute inset-y-0 -left-1 -right-1",
        "opacity-0 group-hover:opacity-100",
        isDragging && "opacity-100"
      )} />
    </div>
  );
}
```

### 5. GanttLayout Anpassung

```typescript
// GanttLayout.tsx - Angepasste Struktur
export function GanttLayout() {
  const { totalColumnWidth } = useTableDimensions();
  const taskTableWidth = useTaskStore((s) => s.taskTableWidth);
  const setTaskTableWidth = useTaskStore((s) => s.setTaskTableWidth);

  // Effektive Breite: entweder manuell gesetzt oder Gesamtspaltenbreite
  const effectiveTableWidth = taskTableWidth ?? totalColumnWidth;

  // Minimum: Kleinste sinnvolle Breite (z.B. erste 2 Spalten)
  const MIN_TABLE_WIDTH = 200;

  // Maximum: Gesamtspaltenbreite (dynamisch!)
  const maxTableWidth = totalColumnWidth;

  // Wenn Spalten verkleinert werden und aktuelle Breite > neue Max:
  // Automatisch anpassen
  useEffect(() => {
    if (taskTableWidth !== null && taskTableWidth > totalColumnWidth) {
      setTaskTableWidth(totalColumnWidth);
    }
  }, [totalColumnWidth, taskTableWidth, setTaskTableWidth]);

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <AppToolbar />

      {/* Main Content mit Split Pane */}
      <div ref={outerScrollRef} className="flex-1 overflow-y-auto">
        {/* ... virtual scrolling wrapper ... */}

        <SplitPane
          leftWidth={effectiveTableWidth}
          minLeftWidth={MIN_TABLE_WIDTH}
          maxLeftWidth={maxTableWidth}
          onLeftWidthChange={setTaskTableWidth}
          leftContent={
            <div className="flex flex-col h-full">
              <TaskTableHeader />
              <TaskTable />
            </div>
          }
          rightContent={
            <div className="flex flex-col h-full">
              <TimelineHeader />
              <ChartCanvas />
            </div>
          }
        />
      </div>
    </div>
  );
}
```

### 6. TaskTable Scroll-Anpassung

```typescript
// TaskTable.tsx - Scroll-Verhalten
export function TaskTable() {
  // ... existing code ...

  // Gesamtbreite der Spalten berechnen
  const totalGridWidth = useMemo(() => {
    return TASK_COLUMNS.reduce((sum, col) => {
      const width = columnWidths[col.id] ?? parseDefaultWidth(col.defaultWidth);
      return sum + width;
    }, 0);
  }, [columnWidths]);

  return (
    <div className="h-full overflow-x-auto overflow-y-hidden">
      <div
        style={{
          minWidth: totalGridWidth,
          // Grid-Template bleibt wie bisher
          display: 'grid',
          gridTemplateColumns: gridTemplateColumns,
        }}
      >
        {visibleTasks.map((task) => (
          <TaskTableRow key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}
```

## Implementierungsplan

### Task 1: Hook für Tabellendimensionen
- [ ] `useTableDimensions.ts` erstellen
- [ ] `parseDefaultWidth()` Helper implementieren
- [ ] `totalColumnWidth` Berechnung

### Task 2: Store erweitern
- [ ] `taskTableWidth` State hinzufügen
- [ ] `setTaskTableWidth` Action hinzufügen
- [ ] Auto-Korrektur wenn maxWidth überschritten

### Task 3: SplitPane Komponente
- [ ] `SplitPane.tsx` erstellen
- [ ] `SplitPaneDivider.tsx` erstellen
- [ ] Drag & Drop Logik
- [ ] Min/Max Constraints

### Task 4: GanttLayout Integration
- [ ] SplitPane in GanttLayout einbauen
- [ ] Header-Bereich synchron halten
- [ ] Bestehende Scroll-Synchronisation erhalten

### Task 5: TaskTable Scroll
- [ ] Horizontaler Scrollbalken wenn nötig
- [ ] `minWidth` basierend auf Spaltenbreiten
- [ ] Synchronisation mit Header

### Task 6: Edge Cases & Polish
- [ ] Verhalten bei Fenster-Resize
- [ ] Doppelklick auf Divider → Reset zu Auto
- [ ] Cursor-Feedback während Drag
- [ ] Persist Split-Position (optional)

## Dateiänderungen

### Neue Dateien
```
src/
├── components/
│   └── Layout/
│       ├── SplitPane.tsx
│       └── SplitPaneDivider.tsx
└── hooks/
    └── useTableDimensions.ts
```

### Zu ändernde Dateien
```
src/
├── components/
│   └── Layout/
│       └── GanttLayout.tsx        # Split Pane Integration
├── store/
│   └── slices/
│       └── taskSlice.ts           # taskTableWidth State
└── components/
    └── TaskList/
        ├── TaskTable.tsx          # overflow-x-auto
        └── TaskTableHeader.tsx    # overflow-x-auto (sync)
```

## Visuelle Darstellung

```
┌─────────────────────────────────────────────────────────────────┐
│                          AppToolbar                             │
├─────────────────────────┬───┬───────────────────────────────────┤
│    TaskTableHeader      │ ║ │         TimelineHeader            │
├─────────────────────────┤ ║ ├───────────────────────────────────┤
│                         │ ║ │                                   │
│      TaskTable          │ ║ │         ChartCanvas               │
│   (overflow-x: auto)    │ ║ │        (flex: 1)                  │
│                         │ ║ │                                   │
│   ←──── scrollbar ────→ │ ║ │   ←──── scrollbar ────→           │
│                         │ ║ │                                   │
└─────────────────────────┴───┴───────────────────────────────────┘
                          ↑
                    Resize Handle
                    (Drag & Drop)

Constraints:
- Min TaskTable Width: 200px
- Max TaskTable Width: Σ(column widths) - dynamisch!
```

## Technische Überlegungen

### Warum kein Library-basierter Splitter?
- react-split-pane: Nicht maintained, React 18 Issues
- react-resizable-panels: Gute Option, aber simple Anforderungen
- Eigene Implementierung: Volle Kontrolle, minimaler Code

### Performance
- `totalColumnWidth` ist memoized
- Drag Events sind throttled (durch Browser)
- CSS-basiertes Layout (keine JS-Layout-Berechnungen)

### Barrierefreiheit
- Keyboard-Support für Resize (optional, Phase 2)
- ARIA-Attribute für Split-Handle
- Fokus-Management

## Offene Fragen

1. **Persist Split-Position?**
   - LocalStorage speichern?
   - Als Prozent oder absolute Pixel?

2. **Reset-Verhalten?**
   - Doppelklick auf Divider → zurück zu Auto?
   - Button in Toolbar?

3. **Minimum Timeline-Breite?**
   - Sollte Timeline auch eine Mindestbreite haben?
   - Aktuell: Nimmt allen verfügbaren Platz
