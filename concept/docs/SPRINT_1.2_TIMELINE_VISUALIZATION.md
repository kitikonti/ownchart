# Sprint 1.2: Timeline & Visualization

**Date:** 2025-12-27
**Status:** Planning
**Duration Estimate:** 1.5 weeks (solo, 20hrs/wk) or 3-5 days (based on actual velocity)
**Goal:** Render tasks as bars on an SVG-based Gantt timeline with pan/zoom interactions

---

## Context

After completing Sprint 1.1 (Basic Task Management), Sprint 1.15 (Hierarchical Organization), and Sprint 1.16 (Hierarchy Navigation), we now have a sophisticated Excel-like task management spreadsheet with full CRUD operations and hierarchical task organization. The next critical step is to add the **Gantt chart timeline visualization** - the core value proposition of the application.

**Current Situation:**
- ✅ Task CRUD with full validation
- ✅ Hierarchical task organization (3 levels, SVAR pattern)
- ✅ Multi-selection and bulk operations
- ✅ Drag-and-drop reordering
- ✅ Indent/outdent with Tab/Shift+Tab
- ✅ Task types: task, summary, milestone
- ❌ No timeline visualization (D3.js installed but unused)
- ❌ No visual Gantt chart rendering
- ❌ No date-based task positioning

**Why This Sprint is Critical:**
- Without timeline, the app is just a task list (not a Gantt chart)
- Timeline unlocks the visual project planning value
- Required foundation for Sprint 1.4 (Dependencies) - arrows need task bars
- Enables date-based project visualization

---

## Goals

1. **Date Utilities**: Core date calculation functions using date-fns
2. **Timeline Scale System**: Coordinate mapping (dates ↔ pixels)
3. **SVG-Based Chart**: Render timeline with tasks as bars
4. **Pan & Zoom**: Interactive timeline navigation
5. **Today Marker**: Visual indicator for current date
6. **Performance**: 100 tasks @ 60fps, smooth interactions

---

## Technical Architecture

### Component Structure

```
App.tsx
└── Main Layout (TaskTable + GanttChart side-by-side)
    ├── TaskTable (Left panel - existing)
    └── GanttChart (Right panel - NEW)
        └── ChartCanvas (SVG container)
            ├── TimelineHeader (Date axis)
            ├── GridLines (Background grid)
            ├── TaskBars (Task rendering)
            │   └── TaskBar × N (One per visible task)
            └── TodayMarker (Current date line)
```

### Data Flow

```
Tasks (from taskSlice)
  ↓
getDateRange(tasks) → { minDate, maxDate }
  ↓
getTimelineScale(minDate, maxDate, width) → TimelineScale
  ↓
For each task:
  getTaskBarGeometry(task, scale) → { x, y, width, height }
  ↓
  Render TaskBar at position
```

### State Management

**New Store Slice** (`chartSlice.ts`):
```typescript
interface ChartState {
  // Timeline scale
  scale: TimelineScale | null;
  zoom: number;                    // 0.5 to 3.0
  scrollX: number;                 // Horizontal scroll position
  scrollY: number;                 // Vertical scroll position

  // View settings
  showWeekends: boolean;           // Toggle weekend visibility
  showTodayMarker: boolean;        // Toggle today line

  // Actions
  setZoom: (zoom: number) => void;
  setScroll: (x: number, y: number) => void;
  resetView: () => void;           // Fit all tasks
}
```

**Integration with taskSlice**:
- Chart reads tasks from `useTaskStore(state => state.tasks)`
- Selection state synchronized between table and chart
- Hover/click events update shared selection

---

## Implementation Plan

### Phase 1: Date & Timeline Utilities (2-3 days)

#### Task 1.2.1: Date Utilities

**File:** `src/utils/dateUtils.ts`

**Dependencies:**
```bash
npm install date-fns
```

**Functions to Implement:**
```typescript
/**
 * Calculate duration between two dates in days (inclusive)
 * @example calculateDuration('2025-01-01', '2025-01-05') // 5
 */
export function calculateDuration(
  startDate: string,
  endDate: string
): number {
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  return differenceInDays(end, start) + 1; // +1 for inclusive
}

/**
 * Add days to a date string
 * @example addDays('2025-01-01', 5) // '2025-01-06'
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseISO(dateStr);
  const result = addDaysDateFns(date, days);
  return format(result, 'yyyy-MM-dd');
}

/**
 * Format date for display
 * @example formatDate('2025-01-15', 'MMM dd') // 'Jan 15'
 */
export function formatDate(dateStr: string, formatStr: string): string {
  const date = parseISO(dateStr);
  return format(date, formatStr);
}

/**
 * Get min and max dates from task list
 * @returns { min: string, max: string } in ISO format
 */
export function getDateRange(tasks: Task[]): { min: string; max: string } {
  if (tasks.length === 0) {
    const today = format(new Date(), 'yyyy-MM-dd');
    return { min: today, max: addDays(today, 30) };
  }

  let minDate = tasks[0].startDate;
  let maxDate = tasks[0].endDate;

  tasks.forEach(task => {
    if (task.startDate < minDate) minDate = task.startDate;
    if (task.endDate > maxDate) maxDate = task.endDate;
  });

  // Add padding (1 week before/after)
  return {
    min: addDays(minDate, -7),
    max: addDays(maxDate, 7)
  };
}

/**
 * Check if date is weekend
 */
export function isWeekend(dateStr: string): boolean {
  const date = parseISO(dateStr);
  const day = getDay(date);
  return day === 0 || day === 6; // Sunday or Saturday
}

/**
 * Get business days between dates (excluding weekends)
 */
export function getBusinessDays(start: string, end: string): number {
  const startDate = parseISO(start);
  const endDate = parseISO(end);
  let count = 0;

  let current = startDate;
  while (current <= endDate) {
    if (!isWeekend(format(current, 'yyyy-MM-dd'))) {
      count++;
    }
    current = addDaysDateFns(current, 1);
  }

  return count;
}
```

**Tests:** 30 test cases
- Duration calculation (normal, same day, leap year)
- Add days (positive, negative, month boundaries)
- Date formatting (various formats)
- Date range (empty tasks, single task, multiple tasks)
- Weekend detection (all days of week)
- Business days (various ranges, week boundaries)

**Acceptance Criteria:**
- ✓ All date functions accurate to the day
- ✓ Handles edge cases (leap years, month/year boundaries)
- ✓ All 30 tests passing
- ✓ No timezone issues (all operations in UTC/local consistent)

---

#### Task 1.2.2: Timeline Scale System

**File:** `src/utils/timelineUtils.ts`

**Interfaces:**
```typescript
export interface TimelineScale {
  minDate: string;           // ISO date
  maxDate: string;           // ISO date
  pixelsPerDay: number;      // Horizontal scale factor
  totalWidth: number;        // Total SVG width in pixels
  totalDays: number;         // Duration in days
}

export interface TaskBarGeometry {
  x: number;                 // Left edge position
  y: number;                 // Top edge position
  width: number;             // Bar width
  height: number;            // Bar height (typically 32px)
}
```

**Functions:**
```typescript
/**
 * Calculate timeline scale from date range and available width
 */
export function getTimelineScale(
  minDate: string,
  maxDate: string,
  containerWidth: number
): TimelineScale {
  const totalDays = calculateDuration(minDate, maxDate);
  const pixelsPerDay = containerWidth / totalDays;

  return {
    minDate,
    maxDate,
    pixelsPerDay,
    totalWidth: containerWidth,
    totalDays
  };
}

/**
 * Convert date to pixel position on timeline
 * @returns X coordinate in pixels
 */
export function dateToPixel(
  dateStr: string,
  scale: TimelineScale
): number {
  const daysFromStart = calculateDuration(scale.minDate, dateStr) - 1;
  return daysFromStart * scale.pixelsPerDay;
}

/**
 * Convert pixel position to date
 * @returns ISO date string
 */
export function pixelToDate(
  x: number,
  scale: TimelineScale
): string {
  const daysFromStart = Math.floor(x / scale.pixelsPerDay);
  return addDays(scale.minDate, daysFromStart);
}

/**
 * Get task bar geometry for rendering
 */
export function getTaskBarGeometry(
  task: Task,
  scale: TimelineScale,
  rowIndex: number,
  rowHeight: number = 40
): TaskBarGeometry {
  const x = dateToPixel(task.startDate, scale);
  const duration = calculateDuration(task.startDate, task.endDate);
  const width = duration * scale.pixelsPerDay;

  return {
    x,
    y: rowIndex * rowHeight + 4,  // 4px top padding
    width,
    height: 32                     // Task bar height
  };
}

/**
 * Get visible date range based on scroll position
 */
export function getVisibleDateRange(
  scale: TimelineScale,
  scrollX: number,
  viewportWidth: number
): { start: string; end: string } {
  const start = pixelToDate(scrollX, scale);
  const end = pixelToDate(scrollX + viewportWidth, scale);
  return { start, end };
}

/**
 * Calculate zoom-adjusted scale
 */
export function applyZoom(
  scale: TimelineScale,
  zoomFactor: number
): TimelineScale {
  return {
    ...scale,
    pixelsPerDay: scale.pixelsPerDay * zoomFactor,
    totalWidth: scale.totalWidth * zoomFactor
  };
}
```

**Tests:** 33 test cases
- Scale calculation (various ranges and widths)
- Date to pixel (start date, mid date, end date)
- Pixel to date (various positions)
- Coordinate mapping reversibility (date → pixel → date)
- Task bar geometry (various positions and durations)
- Visible range calculation
- Zoom calculations

**Acceptance Criteria:**
- ✓ Scale calculations mathematically correct
- ✓ Coordinate mapping bijective (reversible within 1 pixel)
- ✓ Task bars positioned accurately
- ✓ Zoom maintains relative positioning

---

### Phase 2: SVG Components (3-4 days)

#### Task 1.2.3: ChartCanvas Container

**File:** `src/components/GanttChart/ChartCanvas.tsx`

**Component Structure:**
```typescript
interface ChartCanvasProps {
  tasks: Task[];
  selectedTaskIds: string[];
  onTaskClick?: (taskId: string) => void;
  onTaskDoubleClick?: (taskId: string) => void;
}

export function ChartCanvas({
  tasks,
  selectedTaskIds,
  onTaskClick,
  onTaskDoubleClick
}: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);

  // Calculate date range from tasks
  const dateRange = useMemo(() => getDateRange(tasks), [tasks]);

  // Calculate timeline scale
  const scale = useMemo(() =>
    getTimelineScale(dateRange.min, dateRange.max, containerWidth),
    [dateRange, containerWidth]
  );

  // Handle container resize
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0].contentRect.width;
      setContainerWidth(width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Calculate SVG dimensions
  const svgHeight = tasks.length * 40 + 80; // 40px per row + header

  return (
    <div ref={containerRef} className="chart-canvas-container">
      <svg
        width={scale.totalWidth}
        height={svgHeight}
        className="gantt-chart"
      >
        <TimelineHeader scale={scale} />
        <GridLines scale={scale} taskCount={tasks.length} />
        <g className="task-bars">
          {tasks.map((task, index) => (
            <TaskBar
              key={task.id}
              task={task}
              scale={scale}
              rowIndex={index}
              isSelected={selectedTaskIds.includes(task.id)}
              onClick={() => onTaskClick?.(task.id)}
              onDoubleClick={() => onTaskDoubleClick?.(task.id)}
            />
          ))}
        </g>
        <TodayMarker scale={scale} />
      </svg>
    </div>
  );
}
```

**Styling:**
```css
.chart-canvas-container {
  overflow: auto;
  height: 100%;
  background: #fafafa;
}

.gantt-chart {
  display: block;
  user-select: none;
}
```

**Acceptance Criteria:**
- ✓ SVG renders with correct dimensions
- ✓ Resizes with container
- ✓ All child components render
- ✓ No flickering or layout shifts

---

#### Task 1.2.4: TimelineHeader Component

**File:** `src/components/GanttChart/TimelineHeader.tsx`

**Component:**
```typescript
interface TimelineHeaderProps {
  scale: TimelineScale;
}

export function TimelineHeader({ scale }: TimelineHeaderProps) {
  // Generate date labels based on scale
  const dateLabels = useMemo(() => {
    const labels: Array<{ date: string; x: number; label: string }> = [];

    // Determine label frequency based on pixels per day
    const labelEveryNDays = scale.pixelsPerDay < 20 ? 7 : 1;

    let currentDate = scale.minDate;
    let dayIndex = 0;

    while (currentDate <= scale.maxDate) {
      if (dayIndex % labelEveryNDays === 0) {
        labels.push({
          date: currentDate,
          x: dateToPixel(currentDate, scale),
          label: formatDate(currentDate, 'MMM dd')
        });
      }

      currentDate = addDays(currentDate, 1);
      dayIndex++;
    }

    return labels;
  }, [scale]);

  return (
    <g className="timeline-header">
      <rect
        x={0}
        y={0}
        width={scale.totalWidth}
        height={60}
        fill="#f8f9fa"
      />
      {dateLabels.map(({ date, x, label }) => (
        <text
          key={date}
          x={x}
          y={40}
          fontSize={12}
          fill="#495057"
          textAnchor="middle"
        >
          {label}
        </text>
      ))}
      <line
        x1={0}
        y1={60}
        x2={scale.totalWidth}
        y2={60}
        stroke="#dee2e6"
        strokeWidth={1}
      />
    </g>
  );
}
```

**Features:**
- Adaptive label frequency (sparse when zoomed out, dense when zoomed in)
- Month/week/day labels based on zoom level
- Clear visual separation from chart area

**Acceptance Criteria:**
- ✓ Labels show correct dates
- ✓ Labels don't overlap
- ✓ Adapts to zoom level
- ✓ Readable at all zoom levels

---

#### Task 1.2.5: GridLines Component

**File:** `src/components/GanttChart/GridLines.tsx`

**Component:**
```typescript
interface GridLinesProps {
  scale: TimelineScale;
  taskCount: number;
}

export function GridLines({ scale, taskCount }: GridLinesProps) {
  const rowHeight = 40;
  const headerHeight = 60;

  // Vertical lines (one per day)
  const verticalLines = useMemo(() => {
    const lines: Array<{ x: number; date: string }> = [];
    let currentDate = scale.minDate;

    while (currentDate <= scale.maxDate) {
      lines.push({
        x: dateToPixel(currentDate, scale),
        date: currentDate
      });
      currentDate = addDays(currentDate, 1);
    }

    return lines;
  }, [scale]);

  // Horizontal lines (one per task row)
  const horizontalLines = useMemo(() => {
    return Array.from({ length: taskCount + 1 }, (_, i) => ({
      y: headerHeight + i * rowHeight
    }));
  }, [taskCount]);

  return (
    <g className="grid-lines">
      {/* Vertical lines */}
      {verticalLines.map(({ x, date }) => (
        <line
          key={date}
          x1={x}
          y1={headerHeight}
          x2={x}
          y2={headerHeight + taskCount * rowHeight}
          stroke={isWeekend(date) ? '#f1f3f5' : '#e9ecef'}
          strokeWidth={isWeekend(date) ? 2 : 1}
          className={isWeekend(date) ? 'weekend-line' : 'day-line'}
        />
      ))}

      {/* Horizontal lines */}
      {horizontalLines.map(({ y }, i) => (
        <line
          key={i}
          x1={0}
          y1={y}
          x2={scale.totalWidth}
          y2={y}
          stroke="#e9ecef"
          strokeWidth={1}
        />
      ))}
    </g>
  );
}
```

**Features:**
- Weekend highlighting (thicker/different color lines)
- Crisp 1px lines
- Subtle coloring (don't distract from task bars)

**Acceptance Criteria:**
- ✓ Grid renders correctly
- ✓ Weekends visually distinct
- ✓ Lines align with dates/rows
- ✓ Performance: renders 100+ lines smoothly

---

#### Task 1.2.6: TaskBar Component

**File:** `src/components/GanttChart/TaskBar.tsx`

**Component:**
```typescript
interface TaskBarProps {
  task: Task;
  scale: TimelineScale;
  rowIndex: number;
  isSelected: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
}

export const TaskBar = React.memo(function TaskBar({
  task,
  scale,
  rowIndex,
  isSelected,
  onClick,
  onDoubleClick
}: TaskBarProps) {
  const geometry = useMemo(
    () => getTaskBarGeometry(task, scale, rowIndex),
    [task, scale, rowIndex]
  );

  // Progress bar width
  const progressWidth = (geometry.width * task.progress) / 100;

  // Handle different task types
  if (task.type === 'milestone') {
    return (
      <g className="task-bar milestone" onClick={onClick}>
        {/* Diamond shape for milestone */}
        <path
          d={`M ${geometry.x} ${geometry.y + 16}
              L ${geometry.x + 8} ${geometry.y + 8}
              L ${geometry.x + 16} ${geometry.y + 16}
              L ${geometry.x + 8} ${geometry.y + 24}
              Z`}
          fill={task.color}
          stroke={isSelected ? '#228be6' : '#495057'}
          strokeWidth={isSelected ? 2 : 1}
        />
      </g>
    );
  }

  return (
    <g
      className={`task-bar ${task.type}`}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Main task bar */}
      <rect
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        fill={task.color}
        fillOpacity={task.type === 'summary' ? 0.3 : 0.8}
        stroke={isSelected ? '#228be6' : 'none'}
        strokeWidth={isSelected ? 2 : 0}
        rx={4}
        ry={4}
      />

      {/* Progress indicator */}
      {task.progress > 0 && task.type !== 'summary' && (
        <rect
          x={geometry.x}
          y={geometry.y}
          width={progressWidth}
          height={geometry.height}
          fill={task.color}
          fillOpacity={1}
          rx={4}
          ry={4}
        />
      )}

      {/* Task name label */}
      <text
        x={geometry.x + 8}
        y={geometry.y + geometry.height / 2 + 4}
        fontSize={12}
        fill="#fff"
        fontWeight={task.type === 'summary' ? 600 : 400}
      >
        {task.name}
      </text>
    </g>
  );
});
```

**Features:**
- Task type visual differentiation:
  - Regular task: Solid colored bar
  - Summary task: Semi-transparent bar
  - Milestone: Diamond shape
- Progress indicator (filled portion of bar)
- Selection highlight (blue border)
- Task name overlay
- Rounded corners for polish

**Acceptance Criteria:**
- ✓ Tasks render at correct positions
- ✓ Progress shown accurately
- ✓ Click/double-click events work
- ✓ Selection state visible
- ✓ Performance: React.memo prevents unnecessary re-renders

---

#### Task 1.2.7: TodayMarker Component

**File:** `src/components/GanttChart/TodayMarker.tsx`

**Component:**
```typescript
interface TodayMarkerProps {
  scale: TimelineScale;
}

export function TodayMarker({ scale }: TodayMarkerProps) {
  const today = format(new Date(), 'yyyy-MM-dd');

  // Don't render if today is outside visible range
  if (today < scale.minDate || today > scale.maxDate) {
    return null;
  }

  const x = dateToPixel(today, scale);

  return (
    <g className="today-marker">
      <line
        x1={x}
        y1={0}
        x2={x}
        y2="100%"
        stroke="#fa5252"
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <text
        x={x + 4}
        y={20}
        fontSize={11}
        fill="#fa5252"
        fontWeight={600}
      >
        TODAY
      </text>
    </g>
  );
}
```

**Acceptance Criteria:**
- ✓ Marker shows at current date
- ✓ Spans full chart height
- ✓ Visually distinct (red, dashed)
- ✓ Hidden when today is out of range

---

### Phase 3: Pan & Zoom (2 days)

#### Task 1.2.8: usePanZoom Hook

**File:** `src/hooks/usePanZoom.ts`

**Hook Implementation:**
```typescript
interface PanZoomState {
  zoom: number;
  offsetX: number;
  offsetY: number;
}

interface UsePanZoomReturn {
  zoom: number;
  transform: string;
  handlers: {
    onMouseDown: (e: React.MouseEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
  };
  reset: () => void;
}

export function usePanZoom(
  containerRef: React.RefObject<HTMLElement>
): UsePanZoomReturn {
  const [state, setState] = useState<PanZoomState>({
    zoom: 1,
    offsetX: 0,
    offsetY: 0
  });

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Mouse down - start panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 0) { // Left click only
      setIsPanning(true);
      setPanStart({ x: e.clientX - state.offsetX, y: e.clientY - state.offsetY });
    }
  }, [state.offsetX, state.offsetY]);

  // Mouse move - pan
  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      setState(prev => ({
        ...prev,
        offsetX: e.clientX - panStart.x,
        offsetY: e.clientY - panStart.y
      }));
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, panStart]);

  // Wheel - zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // Only zoom with Ctrl/Cmd

    e.preventDefault();

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.5, Math.min(3, state.zoom * delta));

    setState(prev => ({ ...prev, zoom: newZoom }));
  }, [state.zoom]);

  // Reset view
  const reset = useCallback(() => {
    setState({ zoom: 1, offsetX: 0, offsetY: 0 });
  }, []);

  const transform = `translate(${state.offsetX}px, ${state.offsetY}px) scale(${state.zoom})`;

  return {
    zoom: state.zoom,
    transform,
    handlers: {
      onMouseDown: handleMouseDown,
      onWheel: handleWheel
    },
    reset
  };
}
```

**Features:**
- Mouse drag to pan (left click + drag)
- Ctrl+Wheel to zoom
- Zoom range: 0.5x to 3.0x
- Smooth transformations
- Reset to default view

**Acceptance Criteria:**
- ✓ Panning works smoothly
- ✓ Zoom centers on mouse position
- ✓ No jank or lag
- ✓ Works on both Windows (Ctrl) and Mac (Cmd)

---

### Phase 4: Integration & Polish (1 day)

#### Task 1.2.9: Integrate Chart with TaskTable

**Files to Modify:**
- `src/App.tsx` - Add GanttChart panel
- `src/components/TaskList/TaskTable.tsx` - Sync selection

**Layout:**
```typescript
// App.tsx
function App() {
  const tasks = useTaskStore(state => state.tasks);
  const selectedTaskIds = useTaskStore(state => state.selectedTaskIds);
  const selectTask = useTaskStore(state => state.selectTask);

  return (
    <div className="app">
      <Header />
      <div className="main-layout">
        {/* Left panel: Task table */}
        <div className="task-panel">
          <TaskTable />
        </div>

        {/* Right panel: Gantt chart */}
        <div className="chart-panel">
          <ChartCanvas
            tasks={tasks}
            selectedTaskIds={selectedTaskIds}
            onTaskClick={selectTask}
          />
        </div>
      </div>
    </div>
  );
}
```

**Styling:**
```css
.main-layout {
  display: grid;
  grid-template-columns: 600px 1fr;
  height: calc(100vh - 60px);
  gap: 0;
}

.task-panel {
  overflow: auto;
  border-right: 1px solid #dee2e6;
}

.chart-panel {
  overflow: auto;
  background: #fafafa;
}
```

**Synchronization:**
- Task selection synced between table and chart
- Scroll position independent
- Hover states synchronized (optional)

**Acceptance Criteria:**
- ✓ Table and chart side-by-side
- ✓ Selection synced bidirectionally
- ✓ Both panels scroll independently
- ✓ Layout responsive (resizable panels)

---

## Testing Strategy

### Unit Tests (70% coverage target)

**dateUtils.ts** (30 tests):
- `calculateDuration`: 8 cases (normal, same day, leap year, negative)
- `addDays`: 6 cases (positive, negative, month/year boundaries)
- `formatDate`: 4 cases (various formats)
- `getDateRange`: 6 cases (empty, single, multiple, padding)
- `isWeekend`: 7 cases (all days of week)
- `getBusinessDays`: 5 cases (various ranges)

**timelineUtils.ts** (33 tests):
- `getTimelineScale`: 5 cases (various ranges/widths)
- `dateToPixel`: 8 cases (start, mid, end, edge cases)
- `pixelToDate`: 8 cases (various positions)
- `getTaskBarGeometry`: 8 cases (various positions/durations)
- `applyZoom`: 4 cases (zoom in, out, limits)

**Components** (React Testing Library):
- `ChartCanvas`: Renders correctly, handles resize
- `TimelineHeader`: Shows correct dates, adapts to zoom
- `TaskBar`: Renders at correct position, shows progress
- `TodayMarker`: Shows/hides correctly

### Integration Tests

- Chart updates when tasks change
- Selection syncs between table and chart
- Pan/zoom doesn't break rendering
- Resize updates layout correctly

### E2E Tests (Playwright)

- User can view tasks on timeline
- User can pan timeline
- User can zoom timeline
- User can click task bar to select
- Selection syncs with table

---

## Performance Requirements

### Targets

- **100 tasks @ 60fps**: Smooth rendering and interactions
- **500 tasks @ 30fps**: Acceptable with virtual scrolling
- **Pan/Zoom latency**: < 16ms (one frame)
- **Initial render**: < 500ms

### Optimization Strategies

1. **React.memo on TaskBar**: Prevent unnecessary re-renders
2. **useMemo for calculations**: Cache geometry calculations
3. **Virtual scrolling** (if > 100 tasks): Only render visible tasks
4. **Debounce resize**: Don't recalculate on every pixel
5. **RequestAnimationFrame for pan**: Smooth 60fps panning

### Performance Testing

```typescript
// Performance test utility
function measureRenderTime(taskCount: number) {
  const start = performance.now();
  const tasks = generateTestTasks(taskCount);
  render(<ChartCanvas tasks={tasks} />);
  const end = performance.now();
  console.log(`${taskCount} tasks rendered in ${end - start}ms`);
}

measureRenderTime(100); // Should be < 100ms
measureRenderTime(500); // Should be < 500ms
```

---

## Quality Gates

**Before Marking Sprint 1.2 Complete:**

- [ ] All 9 tasks implemented and committed
- [ ] 70%+ test coverage on new code
- [ ] All tests passing (unit + integration + E2E)
- [ ] Performance: 100 tasks render at 60fps
- [ ] Pan and zoom responsive (no jank)
- [ ] Timeline shows correct date range
- [ ] Task bars positioned accurately
- [ ] Selection syncs between table and chart
- [ ] Visual quality matches design expectations
- [ ] No console errors or warnings
- [ ] Code reviewed and approved

---

## Sprint 1.2 Deliverables Summary

### New Files Created (9 files)
1. `src/utils/dateUtils.ts` - Date calculation functions
2. `src/utils/timelineUtils.ts` - Timeline scale and geometry
3. `src/components/GanttChart/ChartCanvas.tsx` - SVG container
4. `src/components/GanttChart/TimelineHeader.tsx` - Date axis
5. `src/components/GanttChart/GridLines.tsx` - Background grid
6. `src/components/GanttChart/TaskBar.tsx` - Task rendering
7. `src/components/GanttChart/TodayMarker.tsx` - Current date line
8. `src/hooks/usePanZoom.ts` - Pan/zoom interaction
9. `src/store/slices/chartSlice.ts` - Chart state management

### Modified Files (2 files)
1. `src/App.tsx` - Add chart panel to layout
2. `package.json` - Add date-fns dependency

### Tests Added (~80 tests)
- 30 date utility tests
- 33 timeline utility tests
- 12 component tests
- 5 integration tests

### Lines of Code: ~1,200 LOC

---

## Dependencies

**NPM Packages:**
```bash
npm install date-fns
```

**Version:** date-fns@^3.0.0

**Why date-fns:**
- Modular (tree-shakeable) - only import what you use
- TypeScript-first with excellent types
- Immutable (doesn't mutate dates)
- Widely used and well-maintained
- Lighter than Moment.js

---

## Risks & Mitigation

### Risk 1: Performance with Large Task Lists

**Mitigation:**
- Implement React.memo and useMemo from the start
- Add virtual scrolling if > 100 tasks
- Profile early and often
- Set performance budgets (targets above)

### Risk 2: SVG Rendering Issues in Different Browsers

**Mitigation:**
- Test in Chrome, Firefox, Safari early
- Use standard SVG features (avoid browser-specific)
- Provide fallback for old browsers (show message)

### Risk 3: Pan/Zoom Complexity

**Mitigation:**
- Start simple (CSS transform)
- Add constraints (min/max zoom)
- Test on different input devices (mouse, trackpad, touch)

### Risk 4: Date Calculation Edge Cases

**Mitigation:**
- Comprehensive test coverage (30+ tests)
- Use date-fns (battle-tested library)
- Test leap years, DST, month boundaries

---

## Success Criteria

### MVP Complete When:

1. ✅ Tasks render as bars on timeline
2. ✅ Timeline shows appropriate date range (auto-calculated from tasks)
3. ✅ Pan and zoom work smoothly
4. ✅ Today marker visible
5. ✅ Selection syncs between table and chart
6. ✅ Visual quality professional
7. ✅ Performance: 100 tasks @ 60fps

### User Can:

- View all tasks on visual timeline
- See task duration and timing at a glance
- Identify current date easily
- Pan to see different time periods
- Zoom to see more/less detail
- Click tasks to select them
- Understand project timeline visually

---

## Next Steps After Sprint 1.2

**Sprint 1.3: File Operations** (prioritized before dependencies)
- Save/load .gantt.json files
- Data persistence critical before adding complex features
- Enables user testing with real projects

**Sprint 1.4: Dependencies** (requires timeline from 1.2)
- Dependency arrows need task bars to connect
- FS dependencies with circular detection
- Auto-date adjustment

---

**Document Version**: 1.0
**Created**: 2025-12-27
**Status**: Ready for Implementation
**Estimated Completion**: 2025-12-30 to 2026-01-03 (based on actual velocity)
