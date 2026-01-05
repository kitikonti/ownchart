# Technical Architecture

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Single Page Application                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         User Interface Layer                     │ │ │
│  │  │  - React Components                              │ │ │
│  │  │  - UI Controls, Toolbars, Panels                 │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Application Logic Layer                  │ │ │
│  │  │  - State Management (Zustand/Redux)              │ │ │
│  │  │  - Business Logic                                │ │ │
│  │  │  - Command/Event System                          │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Rendering Layer                          │ │ │
│  │  │  - SVG/Canvas Rendering                          │ │ │
│  │  │  - Chart Visualization Engine                    │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │         Data Layer                               │ │ │
│  │  │  - History Manager                               │ │ │
│  │  │  - File I/O Handler                              │ │ │
│  │  │  - Local Storage Manager                         │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌────────────────┐  ┌────────────────┐  ┌──────────────┐ │
│  │ IndexedDB      │  │ Local Storage  │  │ File System  │ │
│  │ (Auto-save)    │  │ (Preferences)  │  │ (Save/Load)  │ │
│  └────────────────┘  └────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Principles

1. **Client-Side Only**: No backend, all processing in browser
2. **Offline-First**: Works without internet after initial load
3. **Progressive Enhancement**: Core features work on all modern browsers
4. **Performance-First**: 60fps interactions, lazy loading where appropriate
5. **Privacy-First**: No data collection, no external requests
6. **Portable**: Static files, hostable anywhere
7. **Extensible**: Design for future features without breaking changes (see EXTENSIBILITY_ARCHITECTURE.md)

---

## 2. Technology Stack

### 2.1 Frontend Framework

**Choice: React 19 with TypeScript**

**Current Version**: React 19.0.0 (upgraded from React 18 in December 2025)

**Rationale**:
- Component-based architecture fits UI needs
- Large ecosystem for charting/visualization
- Strong TypeScript support for type safety
- Excellent performance with virtual DOM
- Widespread knowledge/community
- React 19 improvements: better performance, enhanced compiler

**Alternatives Considered**:
- Vue.js: Good, but smaller ecosystem
- Svelte: Excellent performance, but smaller community
- Vanilla JS: Too much boilerplate for complex UI

### 2.2 State Management

**Choice: Zustand**

**Rationale**:
- Lightweight (~1KB) vs Redux (~5KB)
- Simple API, less boilerplate
- Built-in devtools support
- Good TypeScript support
- Undo/redo middleware available

**Alternatives Considered**:
- Redux: Too heavy for client-only app
- Jotai/Recoil: Atomic state might be overkill
- Context API: Not optimized for frequent updates

### 2.3 Visualization/Rendering

**Choice: D3.js + Custom SVG Rendering**

**Rationale**:
- D3.js for scales, axes, date manipulation
- SVG for crisp, scalable graphics
- Full control over rendering
- Easy export to SVG format
- Excellent for timeline-based visualizations

**Alternatives Considered**:
- Canvas: Harder to export, accessibility issues
- Chart libraries (Chart.js, etc.): Not flexible enough for Gantt
- FullCalendar: Too calendar-focused
- DHTMLX Gantt: Commercial license required

### 2.4 Date/Time Handling

**Choice: date-fns**

**Rationale**:
- Modular (tree-shakeable)
- Immutable date operations
- Good TypeScript support
- Smaller than Moment.js
- Modern API

**Alternatives Considered**:
- Moment.js: Too large, deprecated
- Luxon: Good, but date-fns is lighter
- Day.js: Similar, date-fns has better TS support

### 2.5 Build Tool

**Choice: Vite**

**Current Version**: Vite 7.0.0 (upgraded from Vite 6 in December 2025)

**Rationale**:
- Lightning-fast dev server (ESM-based)
- Optimized production builds
- Excellent TypeScript/React support
- Simple configuration
- Growing industry standard
- Vite 7 improvements: faster cold starts, better HMR

**Alternatives Considered**:
- Create React App: Slower, ejecting issues
- Webpack: More complex configuration
- Parcel: Less mature ecosystem

### 2.6 UI Component Library

**Choice: Radix UI + Tailwind CSS 4**

**Current Versions**:
- Tailwind CSS 4.0.0 (upgraded from v3 in December 2025)
- Phosphor Icons 2.1.10 (adopted December 2025, replacing Heroicons)

**Rationale**:
- Radix: Unstyled, accessible components
- Tailwind 4: Utility-first, fast styling, improved performance
- Phosphor Icons: Broader icon set, consistent design system
- Full design control
- Small bundle size

**Icon System Change**:
- Migrated from Heroicons to Phosphor Icons for richer icon variety
- Phosphor provides better coverage for Gantt-specific icons (indent/outdent, hierarchy, etc.)
- Excellent DX

**Alternatives Considered**:
- Material-UI: Too opinionated, large bundle
- Ant Design: Heavy, Chinese-market focused
- Chakra UI: Good, but Radix+Tailwind more flexible

### 2.7 File Export

**Choice:
- PNG: html2canvas
- PDF: jsPDF
- SVG: Native SVG extraction**

**Rationale**:
- html2canvas: Reliable PNG/Canvas conversion
- jsPDF: SVG support, vector quality
- Native SVG: Direct DOM extraction, cleanest output

---

## 3. Application Architecture

### 3.1 Component Structure

```
src/
├── components/
│   ├── App.tsx                    # Root component
│   ├── Layout/
│   │   ├── MainLayout.tsx         # Overall layout
│   │   ├── Toolbar.tsx            # Top toolbar
│   │   ├── Sidebar.tsx            # Left task list panel
│   │   ├── TimelineSlider.tsx     # Bottom history slider
│   │   └── SettingsPanel.tsx      # Right customization panel
│   ├── Chart/
│   │   ├── GanttChart.tsx         # Main chart container
│   │   ├── ChartCanvas.tsx        # SVG rendering area
│   │   ├── Timeline.tsx           # Timeline header
│   │   ├── TaskBar.tsx            # Individual task bars
│   │   ├── DependencyArrow.tsx    # Dependency lines
│   │   ├── Milestone.tsx          # Milestone markers
│   │   └── TodayMarker.tsx        # Current date indicator
│   ├── TaskList/
│   │   ├── TaskTable.tsx          # Spreadsheet-like table container
│   │   ├── TaskTableRow.tsx       # Individual table row
│   │   └── Cell.tsx               # Excel-like cell with inline editing
│   ├── History/
│   │   ├── HistorySlider.tsx      # Timeline scrubber
│   │   ├── SnapshotMarker.tsx     # Named snapshot indicators
│   │   └── HistoryPanel.tsx       # History details sidebar
│   ├── Export/
│   │   ├── ExportDialog.tsx       # Export settings modal
│   │   └── ExportPreview.tsx      # Export preview
│   ├── Common/
│   │   ├── Button.tsx
│   │   ├── DatePicker.tsx
│   │   ├── ColorPicker.tsx
│   │   ├── Modal.tsx
│   │   └── Tooltip.tsx
│   └── Dialogs/
│       ├── NewChartDialog.tsx
│       ├── SaveDialog.tsx
│       └── AboutDialog.tsx
├── store/
│   ├── index.ts                   # Zustand store setup
│   ├── slices/
│   │   ├── chartSlice.ts          # Chart data state
│   │   ├── historySlice.ts        # History management
│   │   ├── uiSlice.ts             # UI state (zoom, view)
│   │   └── settingsSlice.ts       # User preferences
│   └── middleware/
│       ├── historyMiddleware.ts   # Auto-track changes
│       └── persistMiddleware.ts   # Auto-save to storage
├── services/
│   ├── fileService.ts             # Save/load operations
│   ├── exportService.ts           # PNG/PDF/SVG export
│   ├── historyService.ts          # History diffing/replay
│   ├── validationService.ts       # Data validation
│   └── renderingService.ts        # Chart rendering logic
├── utils/
│   ├── dateUtils.ts               # Date calculations
│   ├── colorUtils.ts              # Color manipulation
│   ├── geometryUtils.ts           # SVG coordinate math
│   └── dependencyUtils.ts         # Dependency graph logic
├── types/
│   ├── chart.types.ts             # Chart data types
│   ├── history.types.ts           # History types
│   └── export.types.ts            # Export configuration types
├── hooks/
│   ├── useChart.ts                # Chart operations hook
│   ├── useHistory.ts              # History operations hook
│   ├── useKeyboard.ts             # Keyboard shortcuts
│   └── useDragDrop.ts             # Drag and drop logic
└── constants/
    ├── themes.ts                  # Color themes
    ├── defaults.ts                # Default values
    └── shortcuts.ts               # Keyboard shortcut maps
```

### 3.2 State Management Structure

```typescript
interface AppState {
  // Chart data
  chart: {
    id: string;
    name: string;
    tasks: Task[];
    dependencies: Dependency[];
    milestones: Milestone[];
    metadata: ChartMetadata;
  };

  // History
  history: {
    entries: HistoryEntry[];
    currentIndex: number;
    snapshots: Snapshot[];
    maxEntries: number;
  };

  // UI state
  ui: {
    zoom: number;
    viewMode: 'day' | 'week' | 'month';
    selectedTaskIds: string[];
    isDragging: boolean;
    showWeekends: boolean;
    sidebarOpen: boolean;
    settingsPanelOpen: boolean;
  };

  // Settings
  settings: {
    theme: string;
    colorPalette: string[];
    dateFormat: string;
    autoSave: boolean;
    autoSaveInterval: number;
  };
}
```

---

### 3.3 Architectural Patterns Adopted from Competitive Analysis

#### SVAR Pattern (Type-Hierarchy Decoupling)

**Source**: SVAR React Gantt competitive analysis (December 2025)

**Key Insight**: Task type and hierarchy capability are independent concerns.

**Implementation**:
```typescript
interface Task {
  id: string;
  type: 'task' | 'summary' | 'milestone';  // Type determines data behavior
  parent?: string;                          // Hierarchy is independent
  children?: string[];                      // Tasks CAN have children regardless of type
  // ...
}
```

**Type Behavior**:
- `type: 'task'` with children → Manual dates (fixed deadline containers)
- `type: 'summary'` with children → Auto-calculated dates (aggregating phases)
- `type: 'milestone'` → No children allowed (zero-duration markers)

**Benefits**:
- Simpler mental model: "summary tasks are just tasks with type='summary'"
- Single `taskSlice` handles all task types (no separate group slice)
- Flexible: regular tasks can act as deadline containers with manual dates
- Consistent with professional Gantt tools (validated against SVAR)

**Files**:
- `/src/types/chart.types.ts` - Task interface with type + parent
- `/src/store/slices/taskSlice.ts` - Single slice for all task types
- `/src/utils/hierarchy.ts` - Hierarchy utilities (getChildren, calculateSummaryDates)

#### Snapshot-Based Hierarchy Operations

**Pattern**: Pre-calculate hierarchy snapshots before operations to prevent cascading bugs.

**Problem**: Direct hierarchy modifications can cause cascading errors during indent/outdent operations when traversing a changing tree.

**Solution**: Use snapshot-based approach:
```typescript
function indentSelectedTasks(selectedIds: string[]) {
  // 1. Build snapshot of current hierarchy
  const flatList = buildFlattenedTaskList(tasks, collapsedIds);

  // 2. Calculate all changes based on snapshot
  const changes = selectedIds.map(id => {
    const index = flatList.findIndex(t => t.task.id === id);
    const newParent = findPreviousSibling(flatList, index);
    return { taskId: id, newParent };
  });

  // 3. Apply all changes atomically
  changes.forEach(change => {
    if (isValid(change)) {
      moveTaskToParent(change.taskId, change.newParent);
    }
  });
}
```

**Benefits**:
- Prevents cascade errors during hierarchy modifications
- All operations based on consistent snapshot
- Enables safe bulk operations on multiple selected tasks
- Clear separation: snapshot → calculate → validate → apply

**Files**:
- `/src/store/slices/taskSlice.ts` - indentSelectedTasks, outdentSelectedTasks
- `/src/utils/hierarchy.ts` - buildFlattenedTaskList

#### Computed Properties Pattern

**Pattern**: Don't store derived data - calculate on-the-fly.

**Example**: Summary task dates are computed, not stored:
```typescript
// ❌ DON'T store summary dates
task.startDate = calculateSummaryStart(children);

// ✅ DO compute on render
const displayStartDate = task.type === 'summary'
  ? calculateSummaryDates(task, allTasks).start
  : task.startDate;
```

**Benefits**:
- Single source of truth (children's dates)
- No sync issues between summary and children dates
- Simpler state management
- Automatic updates when children change

**Files**:
- `/src/components/TaskList/TaskTableRow.tsx` - Uses calculateSummaryDates on render
- `/src/utils/hierarchy.ts` - calculateSummaryDates utility

---

## 4. Data Flow

### 4.1 Command Pattern for Actions

All user actions flow through command objects for undo/redo support:

```typescript
interface Command {
  execute(): void;
  undo(): void;
  redo(): void;
  description: string;
}

// Example: Add Task Command
class AddTaskCommand implements Command {
  constructor(private task: Task) {}

  execute() {
    store.addTask(this.task);
    historyService.recordChange(this);
  }

  undo() {
    store.removeTask(this.task.id);
  }

  redo() {
    store.addTask(this.task);
  }

  description = "Add task";
}
```

### 4.2 Event Flow Diagram

```
User Action → Command → Store Update → React Re-render → DOM Update
                ↓
         History Service → IndexedDB (Auto-save)
```

---

## 5. Key Technical Features

### 5.1 History System

**Implementation Approach**: Event Sourcing + Snapshots

```typescript
interface HistoryEntry {
  id: string;
  timestamp: number;
  command: Command;
  description: string;
  stateSnapshot?: ChartState; // Full snapshot every N changes
}

// Create snapshot every 50 changes for fast scrubbing
const SNAPSHOT_INTERVAL = 50;

// Reconstruct state at any point:
function getStateAtIndex(index: number): ChartState {
  // Find nearest snapshot before index
  const nearestSnapshot = findNearestSnapshot(index);

  // Replay commands from snapshot to target
  let state = nearestSnapshot.state;
  for (let i = nearestSnapshot.index + 1; i <= index; i++) {
    state = applyCommand(state, history[i].command);
  }

  return state;
}
```

### 5.2 File Format

**Format**: JSON with versioning

```typescript
interface GanttFile {
  version: string;           // File format version
  appVersion: string;        // App version that created it
  created: string;           // ISO timestamp
  modified: string;          // ISO timestamp
  chart: ChartData;          // Current chart state
  history: HistoryEntry[];   // Full change history
  snapshots: Snapshot[];     // Named snapshots
  settings: UserSettings;    // User preferences
}
```

### 5.3 Rendering Pipeline

1. **Data → Layout Calculation**
   - Calculate task bar positions based on dates
   - Compute dependency arrow paths
   - Determine visible viewport

2. **Layout → SVG Generation**
   - Generate SVG elements for visible tasks
   - Add interaction handlers
   - Apply styling

3. **Optimization**
   - Virtual rendering: Only render visible tasks
   - Memoization: Cache expensive calculations
   - RequestAnimationFrame for smooth updates

### 5.4 Virtualization Strategy

**Critical Performance Requirement**: The application must render up to 1000 tasks smoothly at 60fps.

**Implementation Approach**: Windowing/Virtualization from Day 1

```typescript
// Use react-window or react-virtualized for task list and chart canvas
import { VariableSizeList } from 'react-window';

interface VirtualizedChartProps {
  tasks: Task[];
  viewportHeight: number;
  viewportWidth: number;
}

// Only render tasks visible in viewport + small buffer
function VirtualizedGanttChart({ tasks, viewportHeight, viewportWidth }: VirtualizedChartProps) {
  const rowHeight = 40; // pixels per task row

  return (
    <VariableSizeList
      height={viewportHeight}
      itemCount={tasks.length}
      itemSize={(index) => rowHeight}
      width={viewportWidth}
      overscanCount={5} // Render 5 extra rows above/below viewport
    >
      {({ index, style }) => (
        <TaskTableRow task={tasks[index]} style={style} />
      )}
    </VariableSizeList>
  );
}
```

**Benefits**:
- DOM nodes limited to ~50 elements instead of 1000+
- Smooth scrolling even with large datasets
- Reduced memory footprint
- Instant initial render

**Rendering Strategy by Chart Size**:

| Task Count | Rendering Approach | Expected FPS | DOM Nodes |
|------------|-------------------|--------------|-----------|
| 1-100      | Full render       | 60fps        | ~100      |
| 100-500    | Virtualized       | 60fps        | ~50       |
| 500-1000   | Virtualized + Canvas fallback for dependencies | 50-60fps | ~50 |
| 1000+      | Warn user, suggest filtering | 30-60fps | ~50 |

**Dependency Arrow Optimization**:
- For virtualized view, only render arrows for visible tasks
- Use canvas overlay for dependency lines when > 500 tasks
- Cache arrow path calculations

**Timeline Optimization**:
- Render timeline header separately (not virtualized)
- Use CSS transforms for pan/zoom (GPU accelerated)
- Debounce timeline updates during rapid scrolling

### 5.5 Export Implementation & Fidelity

#### 5.5.1 Export Strategy Overview

**Preferred Approach**: SVG-first, with fallbacks

```
Export Format Decision Tree:
├─ SVG Export
│  └─ Direct DOM extraction (cleanest, fastest)
│
├─ PDF Export
│  ├─ Primary: SVG → PDF (vector, jsPDF)
│  └─ Fallback: Canvas → PDF (raster, if SVG fails)
│
└─ PNG Export
   ├─ Primary: SVG → Canvas → PNG (html2canvas)
   └─ Fallback: Manual canvas rendering
```

#### 5.5.2 SVG Export (Cleanest)

**Implementation**:
```typescript
async function exportToSVG(options: ExportOptions): Promise<Blob> {
  // 1. Clone the chart SVG element
  const svgElement = document.querySelector('.ownchart-chart-svg') as SVGSVGElement;
  const svgClone = svgElement.cloneNode(true) as SVGSVGElement;

  // 2. Inline all CSS styles (external stylesheets won't work in standalone SVG)
  await inlineStyles(svgClone);

  // 3. Embed fonts (if custom fonts used)
  if (options.embedFonts) {
    await embedFonts(svgClone);
  }

  // 4. Add XML declaration and namespace
  svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svgClone.setAttribute('xmlns:xlink', 'http://www.w3.org/1999/xlink');

  // 5. Set explicit dimensions
  const bbox = svgElement.getBBox();
  svgClone.setAttribute('viewBox', `0 0 ${bbox.width} ${bbox.height}`);
  svgClone.setAttribute('width', bbox.width.toString());
  svgClone.setAttribute('height', bbox.height.toString());

  // 6. Serialize to string
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgClone);

  // 7. Create blob
  const blob = new Blob(
    ['<?xml version="1.0" encoding="UTF-8"?>\n', svgString],
    { type: 'image/svg+xml;charset=utf-8' }
  );

  return blob;
}

/**
 * Inline all computed CSS styles into style attributes
 * Required because external stylesheets don't work in standalone SVG
 */
async function inlineStyles(svgElement: SVGSVGElement): Promise<void> {
  const elements = svgElement.querySelectorAll('*');

  elements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);
    const styleString = Array.from(computedStyle)
      .map(prop => `${prop}:${computedStyle.getPropertyValue(prop)}`)
      .join(';');

    element.setAttribute('style', styleString);
  });
}

/**
 * Embed custom fonts as base64 data URIs
 */
async function embedFonts(svgElement: SVGSVGElement): Promise<void> {
  const fontFaces = Array.from(document.fonts);
  const fontDataUrls = await Promise.all(
    fontFaces.map(font => convertFontToDataUrl(font))
  );

  // Add <defs> with embedded fonts
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  style.textContent = fontDataUrls.join('\n');
  defs.appendChild(style);
  svgElement.insertBefore(defs, svgElement.firstChild);
}
```

**Caveats**:
- External images must be converted to data URIs
- CSS animations won't work in static SVG
- Some SVG filters may not render correctly in all viewers

#### 5.5.3 PDF Export (Vector Quality)

**Primary Method: SVG → PDF (jsPDF)**:
```typescript
async function exportToPDF_SVG(options: ExportOptions): Promise<Blob> {
  try {
    // 1. Export to SVG first
    const svgBlob = await exportToSVG({ embedFonts: true });
    const svgString = await svgBlob.text();

    // 2. Create PDF document
    const pdf = new jsPDF({
      orientation: options.orientation || 'landscape',
      unit: 'mm',
      format: options.pageSize || 'a4',
      compress: true
    });

    // 3. Add SVG to PDF (preserves vector quality)
    await pdf.svg(svgString, {
      x: options.margins?.left || 10,
      y: options.margins?.top || 10,
      width: pdf.internal.pageSize.getWidth() - 20,
      height: pdf.internal.pageSize.getHeight() - 20
    });

    // 4. Add metadata
    pdf.setProperties({
      title: options.chartName || 'Gantt Chart',
      subject: 'Project Timeline',
      author: 'Gantt Chart App',
      creator: 'Gantt Chart App v' + APP_VERSION,
      creationDate: new Date()
    });

    return pdf.output('blob');

  } catch (error) {
    console.warn('SVG → PDF failed, falling back to Canvas → PDF', error);
    return exportToPDF_Canvas(options);
  }
}
```

**Fallback Method: Canvas → PDF**:
```typescript
async function exportToPDF_Canvas(options: ExportOptions): Promise<Blob> {
  // 1. Convert chart to canvas (raster)
  const canvas = await convertSVGToCanvas(options);

  // 2. Create PDF
  const pdf = new jsPDF({
    orientation: options.orientation || 'landscape',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  // 3. Add canvas as image (loses vector quality)
  const imgData = canvas.toDataURL('image/png');
  pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);

  return pdf.output('blob');
}
```

**Known jsPDF + SVG Limitations**:
- **Custom fonts**: May not embed correctly → Convert text to paths or use web-safe fonts
- **CSS filters**: `drop-shadow`, `blur` often ignored → Remove or pre-rasterize
- **foreignObject**: Not supported → Replace with native SVG elements
- **Large SVGs**: May timeout (> 5000 elements) → Simplify or use canvas fallback

**Mitigation Strategy**:
```typescript
interface ExportPreflightCheck {
  hasForeignObjects: boolean;
  hasComplexFilters: boolean;
  elementCount: number;
  estimatedPDFSize: number;
  warnings: string[];
}

function preflightSVGForPDF(svgElement: SVGSVGElement): ExportPreflightCheck {
  const foreignObjects = svgElement.querySelectorAll('foreignObject');
  const filters = svgElement.querySelectorAll('[filter]');
  const elementCount = svgElement.querySelectorAll('*').length;

  const warnings: string[] = [];

  if (foreignObjects.length > 0) {
    warnings.push(`${foreignObjects.length} foreignObject elements will be omitted`);
  }

  if (filters.length > 0) {
    warnings.push(`${filters.length} filter effects may not render correctly`);
  }

  if (elementCount > 5000) {
    warnings.push('Large chart may take 10-30 seconds to export');
  }

  return {
    hasForeignObjects: foreignObjects.length > 0,
    hasComplexFilters: filters.length > 0,
    elementCount,
    estimatedPDFSize: elementCount * 100, // rough estimate
    warnings
  };
}

// Use preflight check before export
const preflight = preflightSVGForPDF(svgElement);
if (preflight.warnings.length > 0) {
  showExportWarningDialog(preflight.warnings, {
    onProceed: () => exportToPDF_SVG(options),
    onUseCanvas: () => exportToPDF_Canvas(options)
  });
}
```

#### 5.5.4 PNG Export (Raster)

**Primary Method: html2canvas**:
```typescript
async function exportToPNG(options: ExportOptions): Promise<Blob> {
  const chartContainer = document.querySelector('.ownchart-chart-container');

  try {
    // html2canvas options
    const canvas = await html2canvas(chartContainer, {
      scale: options.dpi / 96,  // 2 for retina, 3.125 for 300 DPI
      useCORS: true,
      allowTaint: false,
      backgroundColor: options.backgroundColor || '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        // Apply export-specific styles to clone
        const clonedChart = clonedDoc.querySelector('.ownchart-chart-container');
        clonedChart.classList.add('export-mode');
      }
    });

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/png', options.quality || 0.95);
    });

  } catch (error) {
    console.warn('html2canvas failed, using manual canvas rendering', error);
    return exportToPNG_Manual(options);
  }
}
```

**html2canvas Known Limitations**:
- **CSS Grid/Flexbox**: Sometimes renders incorrectly → Use absolute positioning for export
- **Web Fonts**: May not load → Ensure fonts loaded before export
- **SVG foreignObject**: Not supported → Avoid or replace
- **CSS transforms**: 3D transforms ignored → Use 2D only
- **Cross-origin images**: Blocked by CORS → Use data URIs or proxy
- **Very large canvases**: Browser limits (usually 8192×8192px) → Split or scale down

**Fallback Method: Manual Canvas Rendering**:
```typescript
async function exportToPNG_Manual(options: ExportOptions): Promise<Blob> {
  const { tasks, dependencies, viewSettings } = store.getState();

  // Create offscreen canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Calculate dimensions
  const width = calculateChartWidth(tasks, viewSettings);
  const height = tasks.length * ROW_HEIGHT + HEADER_HEIGHT;

  canvas.width = width * (options.dpi / 96);
  canvas.height = height * (options.dpi / 96);
  ctx.scale(options.dpi / 96, options.dpi / 96);

  // Manually render each element
  renderTimeline(ctx, viewSettings);
  renderGrid(ctx, tasks.length, viewSettings);
  renderTasks(ctx, tasks, viewSettings);
  renderDependencies(ctx, dependencies, tasks, viewSettings);
  renderMilestones(ctx, milestones, viewSettings);

  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png', options.quality || 0.95);
  });
}
```

#### 5.5.5 Export Testing & Validation

**Automated Export Tests**:
```typescript
describe('Export Fidelity', () => {
  it('should export SVG with all elements present', async () => {
    const svgBlob = await exportToSVG(defaultOptions);
    const svgText = await svgBlob.text();

    // Verify structure
    expect(svgText).toContain('<svg');
    expect(svgText).toContain('xmlns="http://www.w3.org/2000/svg"');

    // Verify all tasks rendered
    const taskCount = (svgText.match(/<rect.*task-bar/g) || []).length;
    expect(taskCount).toBe(testChart.tasks.length);
  });

  it('should maintain aspect ratio in PNG export', async () => {
    const pngBlob = await exportToPNG({ dpi: 96 });
    const img = await createImageBitmap(pngBlob);

    const expectedRatio = chartWidth / chartHeight;
    const actualRatio = img.width / img.height;

    expect(actualRatio).toBeCloseTo(expectedRatio, 2);
  });

  it('should embed fonts in PDF', async () => {
    const pdfBlob = await exportToPDF({ embedFonts: true });
    const pdfText = await pdfBlob.text();

    // Check for font embedding markers
    expect(pdfText).toContain('/FontFile');
  });
});
```

**Visual Regression Testing**:
```typescript
// Use Playwright + pixelmatch for visual diffs
test('exported PNG matches reference', async ({ page }) => {
  await page.goto('/chart/test-chart-1');

  // Export PNG
  await page.click('[data-testid="export-png"]');
  const download = await page.waitForEvent('download');
  const buffer = await download.createReadStream();

  // Compare with reference image
  const diff = pixelmatch(
    buffer,
    fs.readFileSync('test/fixtures/chart-1-reference.png'),
    null,
    1280,
    720,
    { threshold: 0.1 }
  );

  expect(diff).toBeLessThan(100); // Allow < 100 pixels different
});
```

#### 5.5.6 Export Performance Benchmarks

**Target Performance**:
- Small chart (< 50 tasks): < 1 second
- Medium chart (50-200 tasks): < 3 seconds
- Large chart (200-1000 tasks): < 10 seconds

**Optimization Strategies**:
- Use Web Workers for heavy rendering
- Show progress indicator for exports > 2 seconds
- Implement streaming for very large exports
- Cache rendered layers for repeated exports

```typescript
async function exportWithProgress(
  format: 'svg' | 'pdf' | 'png',
  options: ExportOptions,
  onProgress: (percent: number) => void
): Promise<Blob> {

  onProgress(0);

  // Stage 1: Prepare data (20%)
  const data = prepareExportData();
  onProgress(20);

  // Stage 2: Render (50%)
  const rendered = await renderForExport(format, data, (subProgress) => {
    onProgress(20 + subProgress * 0.5);
  });
  onProgress(70);

  // Stage 3: Generate file (20%)
  const blob = await generateBlob(format, rendered);
  onProgress(90);

  // Stage 4: Finalize (10%)
  await finalizeExport(blob);
  onProgress(100);

  return blob;
}
```

#### 5.5.7 Acceptance Criteria

- ✓ SVG export preserves all visual elements
- ✓ PDF export maintains vector quality when possible
- ✓ PNG export matches on-screen rendering (within 1% tolerance)
- ✓ Custom fonts either embedded or converted to paths
- ✓ Export works for charts with 1000+ tasks (may take time)
- ✓ Known limitations documented and warned before export
- ✓ Fallback methods used gracefully when primary fails
- ✓ Visual regression tests pass for all formats
- ✓ Performance targets met for typical chart sizes

---

## 6. Performance Considerations

### 6.1 Rendering Performance

**Target**: 60 FPS (16.67ms per frame)

**Strategies**:
- Virtual scrolling for task lists > 100 items
- Canvas fallback for charts > 500 tasks
- Lazy loading of dependency arrows
- Debounced timeline scrubbing
- Web Workers for heavy calculations

### 6.2 Memory Management

**Concerns**:
- Large history arrays
- Multiple chart states in memory
- SVG DOM nodes

**Mitigation**:
- Limit history to 1000 entries (configurable)
- Compress old history entries
- Use object pooling for frequently created objects
- Detach unused DOM nodes

### 6.3 File Size Optimization

**Target**: < 1MB for typical chart (50 tasks, 500 history entries)

**Strategies**:
- Optional gzip compression
- Prune redundant history data
- Store diffs instead of full states
- Lazy-load old history on demand

---

## 7. Browser Compatibility

### 7.1 Target Browsers

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- No IE support

### 7.2 Required APIs

- ES6+ JavaScript
- File API (save/load)
- IndexedDB (auto-save)
- Local Storage (preferences)
- SVG 2
- Canvas API
- Web Workers (optional, for performance)

### 7.3 Polyfills

Minimal polyfills via Vite's automatic detection:
- No IE polyfills needed
- Modern browsers have all required APIs

---

## 8. Security Considerations

### 8.1 Threat Model

**Attack Surface Analysis**:

Since this is a client-only application with no server component:

**Not Vulnerable To**:
- Server-side injection (SQL, command injection)
- CSRF attacks
- Authentication/authorization bypass
- Session hijacking

**Vulnerable To**:
1. **Malicious File Import** - Crafted .ownchart files causing:
   - XSS via unsanitized strings
   - DoS via enormous payloads
   - Memory exhaustion
   - Code execution via prototype pollution

2. **XSS from User Input** - User-entered data (task names, descriptions) rendered without escaping

3. **Storage Attacks** - localStorage/IndexedDB manipulation or overflow

4. **Prototype Pollution** - Malicious JSON exploiting object prototype

### 8.2 File Import Security

#### 8.2.1 Multi-Layer Validation Strategy

**Defense in Depth Approach**:
```
Layer 1: Size & Format Check (immediate)
   ↓
Layer 2: Web Worker Isolation (parse in sandbox)
   ↓
Layer 3: JSON Schema Validation (strict schema)
   ↓
Layer 4: Semantic Validation (business logic)
   ↓
Layer 5: Sanitization (clean all strings)
   ↓
Layer 6: Safe Deserialization (prevent prototype pollution)
```

#### 8.2.2 Implementation

**Layer 1: Pre-Parse Checks**:
```typescript
async function preValidateFile(file: File): Promise<void> {
  // Size limit: 50MB
  const MAX_SIZE = 50 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    throw new SecurityError(
      `File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB (max 50MB)`
    );
  }

  // Extension check
  if (!file.name.endsWith('.ownchart')) {
    throw new SecurityError('Invalid file extension. Expected .ownchart');
  }

  // MIME type check (advisory only, can be spoofed)
  if (file.type && file.type !== 'application/json') {
    console.warn('Unexpected MIME type:', file.type);
  }
}
```

**Layer 2: Isolated Parsing in Web Worker**:
```typescript
// validation.worker.ts
self.onmessage = async (event) => {
  const { fileContent } = event.data;

  try {
    // Parse in isolated context (worker)
    const data = JSON.parse(fileContent);

    // Validate schema
    const result = await validateGanttFile(data);

    // Send result back to main thread
    self.postMessage({ success: true, data, result });

  } catch (error) {
    self.postMessage({
      success: false,
      error: {
        name: error.name,
        message: error.message
      }
    });
  }
};

// In main thread:
async function validateInWorker(content: string): Promise<ValidationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('/workers/validation.worker.js');

    // Timeout protection (kill worker after 30s)
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Validation timeout'));
    }, 30000);

    worker.onmessage = (event) => {
      clearTimeout(timeout);
      worker.terminate();

      if (event.data.success) {
        resolve(event.data.result);
      } else {
        reject(new Error(event.data.error.message));
      }
    };

    worker.postMessage({ fileContent: content });
  });
}
```

**Layer 3: JSON Schema Validation**:
```typescript
// See DATA_MODEL.md Section 6 for full schema

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({
  strict: true,
  allErrors: true,
  removeAdditional: false,  // Reject unknown fields
  maxItems: 10000,          // Prevent array DoS
  maxProperties: 100        // Prevent object DoS
});

addFormats(ajv);
const validate = ajv.compile(ganttSchema);
```

**Layer 4: Business Logic Validation**:
```typescript
function semanticValidation(data: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for circular dependencies
  const cycles = detectCircularDependencies(data.chart.dependencies);
  if (cycles.length > 0) {
    errors.push({
      path: '$.chart.dependencies',
      message: `Circular dependencies: ${cycles.join(', ')}`
    });
  }

  // Check task date logic
  for (const task of data.chart.tasks) {
    if (new Date(task.endDate) < new Date(task.startDate)) {
      errors.push({
        path: `$.chart.tasks[${task.id}]`,
        message: `Invalid dates: end before start`
      });
    }
  }

  // Check for dangling references
  const taskIds = new Set(data.chart.tasks.map(t => t.id));
  for (const dep of data.chart.dependencies) {
    if (!taskIds.has(dep.fromTaskId) || !taskIds.has(dep.toTaskId)) {
      errors.push({
        path: `$.chart.dependencies[${dep.id}]`,
        message: `References non-existent task`
      });
    }
  }

  return errors;
}
```

**Layer 5: String Sanitization**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeChartData(data: GanttFile): GanttFile {
  return {
    ...data,
    chart: {
      ...data.chart,
      name: sanitizeString(data.chart.name),
      description: sanitizeString(data.chart.description),
      tasks: data.chart.tasks.map(task => ({
        ...task,
        name: sanitizeString(task.name),
        description: sanitizeString(task.description),
        tags: task.tags?.map(tag => sanitizeString(tag))
      })),
      milestones: data.chart.milestones.map(milestone => ({
        ...milestone,
        name: sanitizeString(milestone.name),
        description: sanitizeString(milestone.description)
      }))
    }
  };
}

function sanitizeString(str: string | undefined): string {
  if (!str) return '';

  // Remove potentially dangerous content
  const cleaned = DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    KEEP_CONTENT: true // Keep text content
  });

  // Limit length
  return cleaned.substring(0, 2000);
}
```

**Layer 6: Safe Deserialization (Prototype Pollution Prevention)**:
```typescript
function safeJSONParse(text: string): any {
  // Parse with reviver to prevent __proto__ pollution
  return JSON.parse(text, (key, value) => {
    // Reject dangerous keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      console.warn(`Rejected dangerous key: ${key}`);
      return undefined;
    }

    return value;
  });
}

// Alternative: Use a safe JSON parser
import { parse } from 'secure-json-parse';

function safeParse(text: string): any {
  try {
    return parse(text, null, {
      protoAction: 'remove',    // Remove __proto__
      constructorAction: 'remove' // Remove constructor
    });
  } catch (error) {
    throw new SecurityError('Invalid or malicious JSON');
  }
}
```

#### 8.2.3 Complete Secure File Load Flow

```typescript
async function secureLoadFile(file: File): Promise<void> {
  try {
    // Layer 1: Pre-validation
    await preValidateFile(file);

    // Layer 2: Read file
    const content = await file.text();

    // Layer 3: Parse safely in worker
    const validationResult = await validateInWorker(content);

    if (!validationResult.valid) {
      showSecurityErrorDialog({
        title: 'Invalid File',
        errors: validationResult.errors,
        recommendation: 'This file may be corrupted or malicious.'
      });
      return;
    }

    // Layer 4: Safe parse
    const data = safeParse(content);

    // Layer 5: Sanitize all strings
    const sanitized = sanitizeChartData(data);

    // Layer 6: Load into application
    loadChartData(sanitized);

    // Log successful import (for security auditing)
    logSecurityEvent('file_imported', {
      filename: file.name,
      size: file.size,
      taskCount: sanitized.chart.tasks.length
    });

  } catch (error) {
    if (error instanceof SecurityError) {
      showSecurityErrorDialog({
        title: 'Security Error',
        message: error.message,
        recommendation: 'Do not open files from untrusted sources.'
      });
    } else {
      throw error;
    }
  }
}
```

### 8.3 Output Sanitization (XSS Prevention)

**Rendering Strategy**: Always use safe rendering methods

```typescript
// ✅ SAFE: Use textContent (React does this automatically)
<div className="task-name">{task.name}</div>

// ✅ SAFE: Explicit sanitization before dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(task.description)
}} />

// ❌ DANGEROUS: Never use innerHTML directly
element.innerHTML = task.name; // XSS risk!

// ✅ SAFE: Use textContent
element.textContent = task.name;
```

**SVG Rendering Safety**:
```typescript
// When dynamically creating SVG elements:
function createTaskBar(task: Task): SVGRectElement {
  const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');

  // Safe: setAttribute escapes automatically
  rect.setAttribute('data-task-name', task.name);

  // ❌ DANGEROUS: Direct property assignment can be risky
  // rect.innerHTML = task.name;

  return rect;
}

// For task labels, use <text> elements with textContent
function createTaskLabel(task: Task): SVGTextElement {
  const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  text.textContent = task.name; // Safe: auto-escaped
  return text;
}
```

### 8.4 Content Security Policy (CSP)

**Status**: **REQUIRED for MVP** (not optional)

**Implementation**: CSP must be enforced via meta tag in `index.html` for MVP. Future: HTTP headers via hosting platform.

**Required CSP Configuration**:
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  font-src 'self' data:;
  connect-src 'none';
  worker-src 'self' blob:;
  object-src 'none';
  base-uri 'self';
  form-action 'none';
  frame-ancestors 'none';
  report-uri /csp-violation-report;
"/>
```

**Directive Justification**:

| Directive | Value | Reason |
|-----------|-------|--------|
| `default-src` | `'self'` | Only load resources from same origin (defense-in-depth) |
| `script-src` | `'self'` | **Critical**: No inline scripts or `eval()`, only bundled JS from same origin |
| `style-src` | `'self' 'unsafe-inline'` | Allow inline styles (React CSS-in-JS requires it) |
| `img-src` | `'self' data: blob:` | Allow images from origin + data URIs (PNG export) + blobs |
| `font-src` | `'self' data:` | Allow fonts from origin + data URIs (embedded fonts) |
| `connect-src` | `'none'` | **Critical**: No network requests (offline-first, prevent data exfiltration) |
| `worker-src` | `'self' blob:` | Allow Web Workers from origin + blobs (file parsing isolation) |
| `object-src` | `'none'` | Disable plugins (Flash, Java applets, etc.) |
| `base-uri` | `'self'` | Prevent `<base>` tag injection attacks |
| `form-action` | `'none'` | No forms in this app (prevent form hijacking) |
| `frame-ancestors` | `'none'` | **Critical**: Prevent clickjacking (cannot be embedded in iframe) |
| `report-uri` | `/csp-violation-report` | Log CSP violations for monitoring (V1.1) |

**Enforcement Strategy**:

1. **Development**: Use CSP report-only mode initially
   ```html
   <meta http-equiv="Content-Security-Policy-Report-Only" content="...">
   ```

2. **Testing**: Run full test suite with CSP enforced
   - Verify no console errors: `Refused to load...`
   - All features work correctly
   - Export functionality not blocked

3. **Production**: Enable full CSP enforcement (remove `-Report-Only`)

**CSP Violation Handling**:

```typescript
// Monitor CSP violations in development
window.addEventListener('securitypolicyviolation', (e) => {
  console.error('CSP Violation:', {
    blockedURI: e.blockedURI,
    violatedDirective: e.violatedDirective,
    originalPolicy: e.originalPolicy,
    sourceFile: e.sourceFile,
    lineNumber: e.lineNumber
  });

  // In production, send to error tracking (Sentry, etc.)
  if (import.meta.env.PROD) {
    reportCSPViolation(e);
  }
});
```

**Testing CSP Compliance**:

```typescript
// Unit test to verify CSP compliance
describe('CSP Compliance', () => {
  it('does not use eval() or Function() constructor', () => {
    // Grep codebase for dangerous patterns
    const dangerousPatterns = ['eval(', 'new Function(', 'innerHTML ='];
    // Fail if found
  });

  it('does not use inline event handlers', () => {
    // Check HTML for onclick=, onload=, etc.
    // Fail if found
  });
});
```

**CSP Acceptance Criteria** (MVP):
- ✅ CSP meta tag present in index.html
- ✅ All MVP features work with CSP enforced
- ✅ Zero CSP violations in browser console
- ✅ PNG export works with `img-src blob:`
- ✅ File parsing Web Worker works with `worker-src blob:`
- ✅ No use of `eval()`, `Function()`, `innerHTML` in codebase

### 8.5 Storage Security

**IndexedDB/LocalStorage Protection**:
```typescript
// Namespace all storage keys
const STORAGE_PREFIX = 'gantt_chart_app_';

function getStorageKey(key: string): string {
  return `${STORAGE_PREFIX}${key}`;
}

// Validate data before storing
async function secureStore(key: string, data: any): Promise<void> {
  // Size check
  const serialized = JSON.stringify(data);
  if (serialized.length > 10 * 1024 * 1024) { // 10MB
    throw new Error('Data too large for storage');
  }

  // Store with versioning
  await db.put('autoSave', {
    id: getStorageKey(key),
    version: STORAGE_VERSION,
    data: data,
    timestamp: Date.now()
  });
}

// Validate data when loading
async function secureLoad(key: string): Promise<any> {
  const record = await db.get('autoSave', getStorageKey(key));

  if (!record) return null;

  // Version check
  if (record.version !== STORAGE_VERSION) {
    console.warn('Storage version mismatch');
    return null;
  }

  // Validate structure before returning
  if (!isValidStorageRecord(record.data)) {
    console.error('Corrupted storage data');
    return null;
  }

  return record.data;
}
```

### 8.6 Security Checklist

**Pre-Launch Security Audit**:
- [ ] All user input sanitized before rendering
- [ ] JSON Schema validation enforced for file imports
- [ ] File size limits enforced (50MB)
- [ ] Prototype pollution prevention implemented
- [ ] Web Worker isolation for file parsing
- [ ] CSP headers configured (if hosted)
- [ ] No use of `eval()`, `Function()`, or `innerHTML`
- [ ] All SVG/DOM manipulation uses safe APIs
- [ ] Storage quota management prevents overflow
- [ ] No sensitive data logged to console in production
- [ ] Error messages don't leak implementation details
- [ ] Dependencies audited for known vulnerabilities (`npm audit`)

**Ongoing Security Practices**:
- Regular dependency updates
- Security-focused code reviews
- Penetration testing with malicious files
- Monitor for new XSS vectors
- User education about file sources

---

### 8.7 Dependency Security Scanning

**Status**: **REQUIRED for MVP and ongoing**

**Strategy**: Multi-layered approach to prevent vulnerable dependencies from reaching production.

#### 8.7.1 Automated Dependency Scanning

**Tools** (all free tier):

1. **npm audit** (built-in, free)
   - Runs on every `npm install`
   - Checks for known vulnerabilities in dependencies
   - Enforced in CI/CD pipeline

2. **Snyk** (free tier for open source)
   - More comprehensive than npm audit
   - Scans for security, license, and dependency issues
   - Provides fix suggestions and PRs
   - Runs automatically on every PR

3. **GitHub Dependabot** (free)
   - Auto-generates PRs for dependency updates
   - Security patches prioritized
   - Can auto-merge low-risk updates

**CI/CD Integration**:

```yaml
# .github/workflows/ci.yml
security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4

    # Fail build on high/critical vulnerabilities
    - name: npm audit
      run: npm audit --audit-level=high

    # Snyk scan (continue on error to not block build)
    - name: Snyk security scan
      uses: snyk/actions/node@master
      env:
        SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
      with:
        args: --severity-threshold=high
```

#### 8.7.2 Dependency Update Strategy

**Weekly Routine**:
```bash
# 1. Check for outdated dependencies
npm outdated

# 2. Update patch versions (low risk)
npm update

# 3. Test after updates
npm run test:unit
npm run test:e2e

# 4. Commit if tests pass
git commit -am "chore: update dependencies"
```

**Monthly Routine**:
```bash
# Update minor/major versions (higher risk)
npm install <package>@latest

# Full regression testing
npm run ci:local

# Create PR for review
```

**Dependabot Configuration** (`.github/dependabot.yml`):
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
    open-pull-requests-limit: 10
    versioning-strategy: increase-if-necessary

    # Auto-merge security patches
    groups:
      security-patches:
        patterns:
          - "*"
        update-types:
          - "security"
```

#### 8.7.3 Vulnerability Response SLA

| Severity | Response Time | Fix Time | Communication |
|----------|---------------|----------|---------------|
| Critical | 2 hours | 24 hours | Immediate user notification + blog post |
| High | 24 hours | 72 hours | User notification via in-app banner |
| Medium | 1 week | 2 weeks | Include in next release notes |
| Low | As needed | Next release | Release notes only |

#### 8.7.4 Dependency Pinning Strategy

**Lock file**: `package-lock.json` committed to repository

**Version constraints** in `package.json`:
```json
{
  "dependencies": {
    "react": "^18.2.0",           // Caret: allow minor/patch updates
    "zustand": "^4.4.0"           // Caret: allow minor/patch updates
  },
  "devDependencies": {
    "vite": "~5.0.0",             // Tilde: allow patch updates only
    "@types/react": "^18.2.0"
  }
}
```

**Critical dependencies** (require manual review before updating):
- React (core framework)
- Vite (build tool)
- D3.js (visualization)
- Ajv (validation - security critical)

#### 8.7.5 Supply Chain Security

**Package verification**:
```bash
# Before adding new dependency
npm view <package> homepage
npm view <package> repository
npm view <package> maintainers

# Check for suspicious indicators:
# - Newly created packages
# - Packages with very few downloads
# - Typosquatting (lodash vs loadash)
# - No GitHub repository or homepage
```

**License compliance**:
```bash
# Check licenses of all dependencies
npx license-checker --summary

# Allowed licenses:
# - MIT, Apache-2.0, BSD-3-Clause, ISC
# Blocked: GPL (copyleft), unlicensed
```

#### 8.7.6 Monitoring & Alerts

**Automated alerts** (GitHub Security Advisories):
- Email notification on new CVE affecting dependencies
- Dependabot auto-creates PR for security fixes
- Security tab shows all advisories

**Manual monitoring**:
- Subscribe to security mailing lists for critical deps
- Monitor CVE databases (https://nvd.nist.gov)
- Follow security researchers on Twitter/Mastodon

#### 8.7.7 Acceptance Criteria

**MVP Requirements**:
- ✅ npm audit runs on every CI build
- ✅ Snyk scan integrated in CI
- ✅ Dependabot enabled and configured
- ✅ Zero known high/critical vulnerabilities at launch
- ✅ All dependencies have permissive licenses (MIT, Apache, BSD)

**V1.0 Requirements**:
- ✅ Weekly dependency review process
- ✅ Documented response SLA
- ✅ Security advisory mailing list
- ✅ Auto-merge for security patches

---

### 8.8 Incident Response Plan

**Status**: **REQUIRED for V1.0** (basic version for MVP)

**Purpose**: Structured process for responding to security vulnerabilities discovered in production or reported by users.

---

#### 8.8.1 Severity Classification

**Severity Levels**:

| Level | Definition | Examples | Impact |
|-------|------------|----------|--------|
| **P0 (Critical)** | Active exploitation or data loss | RCE, XSS allowing code execution, mass data exfiltration | All users affected immediately |
| **P1 (High)** | Exploitable vulnerability | Stored XSS, file upload bypass, auth bypass | Significant subset of users at risk |
| **P2 (Medium)** | Vulnerability requiring user action | CSRF, open redirect, information disclosure | Limited risk, requires user action |
| **P3 (Low)** | Theoretical or hard-to-exploit | Clickjacking, verbose error messages | Minimal real-world risk |

---

#### 8.8.2 Response Workflow

**Phase 1: Detection & Triage** (0-2 hours)

```
1. Security issue reported or discovered
   ├─ Via: security@ganttchart.app email
   ├─ Via: GitHub Security Advisory
   ├─ Via: Automated scanning (Snyk, npm audit)
   └─ Via: User report in issue tracker

2. Acknowledge receipt
   ├─ Respond within 2 hours (business hours)
   ├─ Respond within 24 hours (off-hours)
   └─ Assign incident ID: SEC-YYYY-MM-NNN

3. Initial triage
   ├─ Classify severity (P0-P3)
   ├─ Assess scope (affected versions, users)
   ├─ Determine exploitability
   └─ Create private GitHub Security Advisory
```

**Phase 2: Containment & Investigation** (2-24 hours)

```
4. Immediate containment (P0/P1 only)
   ├─ Disable affected feature if possible
   ├─ Deploy temporary workaround
   └─ Notify users of temporary mitigation

5. Deep investigation
   ├─ Reproduce vulnerability locally
   ├─ Identify root cause
   ├─ Determine if actively exploited
   ├─ Assess data exposure
   └─ Document findings in advisory

6. Develop patch
   ├─ Implement fix in private fork
   ├─ Write regression test
   ├─ Peer review fix
   └─ Test thoroughly (unit + E2E)
```

**Phase 3: Remediation & Release** (24-72 hours)

```
7. Prepare security release
   ├─ Version bump (patch for hotfix)
   ├─ Update CHANGELOG.md with security notice
   ├─ Prepare release notes (non-technical)
   └─ Tag release in git

8. Coordinate disclosure
   ├─ Draft public advisory
   ├─ Coordinate with reporter (if external)
   ├─ Set disclosure date (7-90 days, default 30)
   └─ Prepare FAQ

9. Deploy fix
   ├─ Merge patch to main
   ├─ CI/CD auto-deploys to production
   ├─ Verify fix in production
   └─ Monitor for issues
```

**Phase 4: Communication & Post-Mortem** (72+ hours)

```
10. User communication
    ├─ Publish security advisory
    ├─ Update GitHub Security tab
    ├─ In-app banner (P0/P1 only)
    ├─ Email notification (if we have emails)
    └─ Social media / blog post (P0 only)

11. Post-mortem
    ├─ Write incident report (internal)
    ├─ Identify process failures
    ├─ Update security checklist
    ├─ Plan preventive measures
    └─ Schedule team retro
```

---

#### 8.8.3 Communication Templates

**Acknowledgment Email** (within 2-24 hours):
```
Subject: [SEC-2025-01-001] Security Report Received

Hi [Reporter],

Thank you for reporting this security issue to us. We have received your
report and assigned it incident ID: SEC-2025-01-001.

Initial triage:
- Severity: High (P1)
- Affected versions: v1.0.0 - v1.2.3
- Status: Under investigation

We will keep you updated as we investigate. We aim to:
- Develop a patch within 72 hours
- Release a fix within 1 week
- Publicly disclose 30 days after fix is released

If you have any questions, please reply to this email.

Best regards,
Security Team
```

**Security Advisory** (public, after fix):
```
# Security Advisory: XSS Vulnerability in File Name Handling

**Severity**: High (P1)
**Affected Versions**: v1.0.0 - v1.2.3
**Fixed in**: v1.2.4
**CVE**: CVE-2025-XXXXX (pending)
**Date**: 2025-01-15

## Summary
A cross-site scripting (XSS) vulnerability was discovered in the file name
display functionality. An attacker could craft a malicious .ownchart file with
a specially crafted task name containing JavaScript code.

## Impact
If a user opens a malicious .ownchart file, arbitrary JavaScript could execute
in their browser. This could potentially:
- Steal data from other charts
- Modify charts without user knowledge
- Access browser storage

## Affected Users
Users who opened .ownchart files from untrusted sources between v1.0.0 and v1.2.3.

## Remediation
Update to v1.2.4 or later immediately. Clear browser cache after updating.

## Workaround (if unable to update)
Only open .ownchart files from trusted sources.

## Timeline
- 2025-01-01: Vulnerability reported by Jane Doe
- 2025-01-01: Acknowledged and assigned SEC-2025-01-001
- 2025-01-02: Fix developed and tested
- 2025-01-03: v1.2.4 released with fix
- 2025-01-15: Public disclosure (12 days after fix)

## Credit
Thank you to Jane Doe for responsibly disclosing this vulnerability.

## References
- Commit: https://github.com/.../commit/abc123
- CVE: CVE-2025-XXXXX
- CWE: CWE-79 (Cross-site Scripting)
```

---

#### 8.8.4 Responsible Disclosure Policy

**Published at**: `/SECURITY.md` in repository

```markdown
# Security Policy

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability,
please report it privately.

**Email**: security@ganttchart.app

**What to include**:
- Description of the vulnerability
- Steps to reproduce
- Affected versions
- Potential impact
- Proof-of-concept (if applicable)

**What NOT to do**:
- Do not create a public GitHub issue
- Do not disclose publicly before we've fixed it
- Do not exploit the vulnerability beyond PoC

## Our Commitment

- **Acknowledgment**: Within 24 hours (business days)
- **Initial triage**: Within 48 hours
- **Fix timeline**:
  - Critical: 24-48 hours
  - High: 72 hours - 1 week
  - Medium: 2-4 weeks
  - Low: Next release
- **Public disclosure**: 30 days after fix (negotiable)

## Bug Bounty

We do not currently offer a bug bounty program. However, we deeply
appreciate security researchers who help keep our users safe. We will:
- Credit you in the security advisory (if desired)
- Send you a thank-you note
- Add you to our Hall of Fame page

## Safe Harbor

We will not pursue legal action against security researchers who:
- Report vulnerabilities responsibly
- Do not exploit beyond proof-of-concept
- Do not access or modify user data
- Keep findings confidential until disclosure
```

---

#### 8.8.5 Incident Response Roles

**MVP** (solo developer or small team):
- **Security Lead**: Person who receives security@email
- **Developer**: Person who implements fix
- **Tester**: Person who verifies fix
- **Communicator**: Person who writes advisories

(Same person can fill multiple roles for MVP)

**V1.0** (larger team):
- **Security Lead**: Coordinates response, makes severity calls
- **On-call Developer**: Implements fixes (rotates weekly)
- **QA Lead**: Verifies fixes, runs regression tests
- **Product Manager**: Handles user communication
- **Legal** (if needed): Reviews disclosure, coordinates with lawyers

---

#### 8.8.6 Runbook Checklist

**P0 (Critical) - Use this checklist**:

```
[ ] 0h: Incident detected/reported
[ ] 0h: Acknowledge reporter (if external)
[ ] 1h: Severity confirmed as P0
[ ] 1h: Security Lead notified
[ ] 2h: All hands meeting scheduled
[ ] 2h: Private GitHub Security Advisory created
[ ] 4h: Vulnerability reproduced locally
[ ] 4h: Root cause identified
[ ] 6h: Fix developed in private fork
[ ] 8h: Fix peer-reviewed
[ ] 12h: Fix tested (unit + E2E + manual)
[ ] 16h: Hotfix version prepared (v1.2.3 → v1.2.4)
[ ] 18h: CHANGELOG updated with security notice
[ ] 20h: Release notes prepared
[ ] 22h: Hotfix deployed to production
[ ] 24h: Fix verified in production
[ ] 24h: In-app banner deployed
[ ] 24h: Public advisory drafted
[ ] 24h: Users notified via all channels
[ ] 48h: Post-mortem meeting scheduled
[ ] 7d: Public disclosure (if safe)
[ ] 30d: Post-mortem document published
```

---

#### 8.8.7 Acceptance Criteria

**MVP Requirements**:
- ✅ SECURITY.md file in repository
- ✅ security@email address configured
- ✅ Basic incident response workflow documented
- ✅ Severity classification defined
- ✅ Communication templates prepared

**V1.0 Requirements**:
- ✅ Full runbook for P0-P3 incidents
- ✅ On-call rotation schedule
- ✅ Post-mortem template
- ✅ Security advisory Hall of Fame page
- ✅ Annual security audit scheduled

---

## 9. Testing Strategy

### 9.1 Unit Tests

**Tool**: Vitest (faster than Jest)

**Coverage**:
- Utility functions (date, color, geometry)
- State management logic
- Validation functions
- Command pattern implementations

**Target**: > 80% coverage

### 9.2 Integration Tests

**Tool**: React Testing Library

**Focus**:
- Component interactions
- State updates
- File I/O operations
- Export functionality

### 9.3 E2E Tests

**Tool**: Playwright

**Scenarios**:
- Complete user workflows
- File save/load cycle
- Export to all formats
- History navigation
- Keyboard shortcuts

**Target**: All critical paths covered

### 9.4 Performance Tests

**Tool**: Lighthouse + Custom benchmarks

**Metrics**:
- Initial load time < 2s
- Time to interactive < 3s
- Rendering 100 tasks < 500ms
- Rendering 1000 tasks < 2s
- History scrubbing < 100ms per frame

---

## 10. Deployment

### 10.1 Build Process

```bash
# Development
npm run dev          # Start Vite dev server

# Production
npm run build        # TypeScript + Vite build
npm run preview      # Preview production build
```

### 10.2 Hosting Options

**Static Hosting** (recommended):
- Netlify
- Vercel
- GitHub Pages
- Cloudflare Pages
- AWS S3 + CloudFront

**Requirements**:
- Single index.html
- Static assets (JS, CSS, images)
- No server-side rendering needed
- No backend required

### 10.3 CI/CD Pipeline

```yaml
# Example GitHub Actions
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

---

## 11. Future Technical Considerations

### 11.1 Potential Enhancements

1. **WebAssembly**: For rendering > 10k tasks
2. **Service Workers**: Better offline support, caching
3. **Web Workers**: Parallel processing for exports
4. **WebRTC**: Real-time collaboration (if added)
5. **Progressive Web App**: Installable, native-like

### 11.2 Synced Copies Feature (Post-MVP)

**Status**: Planned for V1.x or V2.0

**Technical Design**:

```typescript
// Data Model Extension
interface Task {
  // ... existing fields ...
  syncGroupId?: string;  // Reference to sync group
}

interface TaskGroup {
  // ... existing fields ...
  syncGroupId?: string;
}

interface SyncGroup {
  id: string;
  name: string;
  createdAt: Date;
  lastSyncedAt: Date;
  memberIds: string[];  // Task/Group IDs in this sync group
  syncedFields: SyncField[];
  version: number;  // For conflict detection
}

enum SyncField {
  NAME = 'name',
  DESCRIPTION = 'description',
  TAGS = 'tags',
  COLOR = 'color',
  DURATION = 'duration',
  CUSTOM_FIELDS = 'customFields'
}

interface SyncOperation {
  syncGroupId: string;
  field: SyncField;
  newValue: any;
  timestamp: number;
  sourceMemberId: string;
}
```

**State Management**:
```typescript
// Zustand store extension
interface AppState {
  // ... existing state ...

  syncGroups: {
    groups: Map<string, SyncGroup>;
    operations: SyncOperation[];  // Queue for offline sync
    conflicts: SyncConflict[];
  };
}

// Middleware for sync propagation
const syncMiddleware = (config) => (set, get, api) => {
  return config(
    (args) => {
      set(args);

      // After state change, check for sync groups
      const state = get();
      const changedTask = args.tasks?.find(t => t.id === args.changedId);

      if (changedTask?.syncGroupId) {
        propagateSync(changedTask, state);
      }
    },
    get,
    api
  );
};
```

**Sync Propagation Algorithm**:
```typescript
/**
 * Propagate changes from one synced member to all others
 * Complexity: O(n * f) where n = members, f = synced fields
 */
function propagateSync(
  changedTask: Task,
  state: AppState
): void {
  const syncGroup = state.syncGroups.groups.get(changedTask.syncGroupId);
  if (!syncGroup) return;

  const updates: TaskUpdate[] = [];

  // For each synced field, update all other members
  for (const field of syncGroup.syncedFields) {
    const newValue = changedTask[field];

    for (const memberId of syncGroup.memberIds) {
      if (memberId === changedTask.id) continue; // Skip source

      const member = state.chart.tasks.find(t => t.id === memberId);
      if (!member) continue;

      // Special handling for duration (affects end date)
      if (field === SyncField.DURATION) {
        const newEndDate = addDays(member.startDate, newValue);
        updates.push({
          taskId: memberId,
          field: 'duration',
          value: newValue
        });
        updates.push({
          taskId: memberId,
          field: 'endDate',
          value: newEndDate
        });
      } else {
        updates.push({
          taskId: memberId,
          field,
          value: newValue
        });
      }
    }
  }

  // Apply all updates atomically
  batchUpdateTasks(updates);

  // Update sync timestamp
  syncGroup.lastSyncedAt = new Date();

  // Record in history
  recordHistory({
    action: 'sync_propagation',
    syncGroupId: syncGroup.id,
    sourceTaskId: changedTask.id,
    affectedTaskIds: updates.map(u => u.taskId)
  });
}
```

**Decouple Implementation**:
```typescript
function decoupleTask(
  taskId: string,
  mode: 'single' | 'recursive' | 'dissolve'
): DecoupleResult {
  const task = getTask(taskId);
  const syncGroup = getSyncGroup(task.syncGroupId);

  switch (mode) {
    case 'single':
      return decoupleSingle(task, syncGroup);

    case 'recursive':
      const subtree = getTaskSubtree(taskId);
      return subtree.map(t => decoupleSingle(t, getSyncGroup(t.syncGroupId)));

    case 'dissolve':
      return syncGroup.memberIds.map(id =>
        decoupleSingle(getTask(id), syncGroup)
      );
  }
}

function decoupleSingle(task: Task, syncGroup: SyncGroup): void {
  // Remove from sync group
  syncGroup.memberIds = syncGroup.memberIds.filter(id => id !== task.id);

  // Clear sync reference
  task.syncGroupId = null;

  // Delete empty sync groups
  if (syncGroup.memberIds.length === 0) {
    deleteSyncGroup(syncGroup.id);
  }

  // Update UI
  notifySyncIndicatorChange(task.id);
}
```

**Performance Considerations**:
- **Sync propagation**: O(n * f) where n = members, f = fields
  - Optimized: Batch updates, single re-render
  - Target: < 100ms for 50 members
- **Decouple recursive**: O(n) where n = subtree size
  - Progress indicator for > 50 tasks
- **Sync group lookup**: O(1) using Map
- **Visual indicators**: Memoized, only re-render affected tasks

**Memory Impact**:
- Per sync group: ~500 bytes
- 100 sync groups: ~50 KB
- Negligible compared to task data

**Conflict Detection** (for future collaboration):
```typescript
interface SyncConflict {
  syncGroupId: string;
  field: SyncField;
  conflictingValues: Array<{
    memberId: string;
    value: any;
    timestamp: number;
  }>;
}

function detectConflicts(syncGroup: SyncGroup): SyncConflict[] {
  const conflicts: SyncConflict[] = [];

  for (const field of syncGroup.syncedFields) {
    const values = new Map<any, string[]>();

    // Group members by field value
    for (const memberId of syncGroup.memberIds) {
      const member = getTask(memberId);
      const value = member[field];
      const key = JSON.stringify(value);

      if (!values.has(key)) values.set(key, []);
      values.get(key).push(memberId);
    }

    // If more than one unique value, conflict detected
    if (values.size > 1) {
      conflicts.push({
        syncGroupId: syncGroup.id,
        field,
        conflictingValues: Array.from(values.entries()).map(([value, ids]) => ({
          memberId: ids[0],
          value: JSON.parse(value),
          timestamp: getTask(ids[0]).lastModified
        }))
      });
    }
  }

  return conflicts;
}
```

**File Format Extension**:
```typescript
interface GanttFile {
  // ... existing fields ...
  syncGroups?: SyncGroup[];  // Optional for backwards compatibility
}
```

**Migration Strategy**:
- V1.0 files without syncGroups: Load normally
- V2.0 files with syncGroups: Load and validate references
- Downgrade: Remove syncGroups on save if saving to V1.0 format

**Acceptance Criteria**:
- ✓ Sync propagation < 100ms for 50 members
- ✓ No performance degradation with 100 sync groups
- ✓ Conflict detection identifies all mismatches
- ✓ Decouple operations are undoable
- ✓ File format backwards compatible
- ✓ Memory usage < 1MB for 100 sync groups

---

### 11.3 Scalability Path

Current architecture supports:
- Up to 1000 tasks smoothly
- 10000 tasks with optimization
- 100MB+ files (with streaming parser)

For larger scale:
- Switch to Canvas rendering
- Implement virtualization
- Add backend for storage (breaks privacy model)

---

## 12. Extensibility & Future-Proofing

**See [EXTENSIBILITY_ARCHITECTURE.md](./EXTENSIBILITY_ARCHITECTURE.md) for complete details.**

### 12.1 Key Extensibility Patterns

**Built into MVP**:
1. **Custom Fields System**: Task data model includes `customFields` map for user-defined metadata
2. **Plugin Architecture**: Event bus and plugin registration API
3. **View Abstraction**: Rendering decoupled from data for alternative views
4. **File Versioning**: Schema version tracking and migration system
5. **Multi-Project IDs**: Data model supports project context from day one
6. **Collaboration Fields**: Optional user IDs, assignments (unused in MVP)

**Benefits**:
- Add features without file format breaking changes
- Users' data remains compatible across versions
- No rebuild required for common feature requests
- Plugin ecosystem possible

### 12.2 Future Features Supported

The architecture enables these features without major refactoring:

| Feature | Implementation Effort | Timeline |
|---------|----------------------|----------|
| Custom Fields UI | Low - data model ready | V1.1 |
| Multiple Projects | Low - IDs already in model | V1.1 |
| Resource Management | Medium - fields present | V1.2 |
| Alternative Views (Kanban) | Medium - view abstraction | V1.2 |
| Plugins | Medium - API exists | V1.2 |
| Collaboration | High - requires backend | V2.0 |
| Import/Export Adapters | Low - adapter pattern | V1.1+ |

### 12.3 Extensibility Checklist

**MVP Requirements**:
- ✅ Task model includes optional extensibility fields
- ✅ File format has version and schema version fields
- ✅ Unknown fields preserved when loading files
- ✅ Event bus emits core events
- ✅ Plugin registration API exists
- ✅ View layer abstracted from data

**This ensures no breaking changes when adding**:
- Custom fields
- Resources/assignments
- Collaboration features
- Alternative visualizations
- Integrations/plugins

---

## 13. Development Setup

### 13.1 Prerequisites

- Node.js 18+
- npm 9+ or pnpm 8+
- Modern code editor (VS Code recommended)
- Git

### 13.2 Project Setup

```bash
# Create project
npm create vite@latest gantt-chart -- --template react-ts

# Install dependencies
npm install zustand date-fns d3 @radix-ui/react-*
npm install -D tailwindcss postcss autoprefixer
npm install -D vitest @testing-library/react playwright

# Setup Tailwind
npx tailwindcss init -p
```

### 13.3 Development Workflow

1. Feature branch → Implementation → Tests → PR
2. Code review → CI checks → Merge to main
3. Automated deployment to staging
4. Manual QA → Production release

---

**Document Version**: 1.5
**Last Updated**: 2025-12-12
**Status**: Draft

**Recent Updates (v1.5)** - Extensibility & Future-Proofing:
- Added Section 12: Extensibility & Future-Proofing
- Added architecture principle for extensibility
- Added reference to EXTENSIBILITY_ARCHITECTURE.md
- Added table of future features with implementation effort
- Added extensibility checklist for MVP requirements

**Previous Updates (v1.4)** - Synced Copies Technical Design:
- Added comprehensive Synced Copies feature architecture (Section 11.2):
  - Data model extensions (SyncGroup, SyncField, SyncOperation)
  - State management with Zustand middleware for sync propagation
  - Sync propagation algorithm with O(n * f) complexity
  - Decouple implementation (single, recursive, dissolve modes)
  - Conflict detection for future collaboration features
  - Performance considerations (< 100ms for 50 members)
  - File format extension with backwards compatibility
  - Memory impact analysis (~50 KB for 100 sync groups)

**Previous Updates (v1.3)** - Based on Second Professional Review:
- Enhanced Export Implementation & Fidelity (Section 5.5) with:
  - SVG-first export strategy with fallbacks
  - Detailed limitations of html2canvas and jsPDF
  - Font embedding and style inlining procedures
  - Export preflight checks and warnings
  - Visual regression testing strategy
- Comprehensive Security Considerations (Section 8) with:
  - Multi-layer file validation strategy (6 layers)
  - Web Worker isolation for parsing
  - Prototype pollution prevention
  - Output sanitization (XSS prevention)
  - Content Security Policy recommendations
  - Complete security checklist

**Previous Updates (v1.2)** - Based on First Professional Review:
- Added comprehensive virtualization strategy (Section 5.4) for rendering up to 1000 tasks
- Detailed rendering approach by chart size with performance targets
- Dependency arrow optimization for virtualized views
- Timeline optimization strategies

**Previous Updates (v1.1)**:
- Added TaskGroup component and hierarchy support
- New settings for UI density/compactness
- Task name position configuration
- Show/hide history timeline option
- Duplicate timeline at bottom feature
- First day of week and date format settings
