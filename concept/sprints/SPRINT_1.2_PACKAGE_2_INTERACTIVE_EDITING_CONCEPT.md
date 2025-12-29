# Sprint 1.2 Package 2: Interactive Editing - Team Concept

**Project:** Gantt Chart Application - app-gantt
**Package:** Sprint 1.2 - Package 2 (Interactive Editing)
**Status:** Concept & Planning
**Date:** 2025-12-29
**Priority:** 🔴 Critical
**Estimated Duration:** 2-3 days

---

## Executive Summary

### Package Goal
Transform the timeline from a read-only visualization into an interactive editing canvas where users can drag task bars to modify dates and durations. This is the **#1 critical feature** identified by the Product Owner - without drag-to-edit capability, our timeline is merely a static chart viewer, not competitive with industry-standard Gantt tools.

### Success Metrics
- ✅ Users can drag task bars horizontally to shift dates
- ✅ Users can resize task bars from edges to change start/end dates
- ✅ All date changes reflect immediately in the task table
- ✅ Drag operations maintain 60fps performance with 100 tasks
- ✅ Summary tasks auto-calculate dates from children
- ✅ Visual feedback during drag (preview outline, cursor changes)

### Package Completion Checkpoint
**Visual Test:** "I can drag bars to change dates"
- Task bars have resize handles on edges
- Cursor changes to resize/move icons appropriately
- Dashed preview outline appears during drag
- Dates update in table immediately after drop

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

**Name:** Product Lead
**Role:** Define user value, prioritize features, acceptance criteria

#### Key Decisions & Requirements

**Critical Feature Rationale:**
> "After analyzing competitor tools (MS Project, Smartsheet, Monday.com, ClickUp), drag-to-edit is the **core interaction pattern** that users expect from any Gantt chart tool. Without this, we're just a timeline viewer. This feature is the difference between a demo and a product."

**User Value Proposition:**
1. **Speed**: Adjusting dates by dragging is 5x faster than manual table editing
2. **Visual Planning**: Users can see impact of changes immediately on timeline
3. **Intuitive**: Matches mental model of "grabbing and moving" timeline elements
4. **Professional**: Expected behavior in every professional Gantt tool

**Feature Priority Ranking:**
1. 🔴 **Critical:** Drag-to-move task bars (horizontal shift)
2. 🔴 **Critical:** Drag-to-resize task bars (change duration)
3. 🟡 **High:** Visual drag preview with snap-to-grid
4. 🟡 **High:** Summary task date auto-calculation
5. 🟢 **Medium:** Multi-select drag (bulk date changes)
6. 🔵 **Low:** Constraint indicators (can't drag past dependency)

**Acceptance Criteria:**
- [ ] Users can understand how to drag without instructions
- [ ] Drag feels immediate and responsive (no lag)
- [ ] Mistakes are easily undoable (Ctrl+Z)
- [ ] Edge cases handled gracefully (validation errors shown clearly)
- [ ] Feature works consistently across all browsers

**User Stories:**
- As a project manager, I want to drag task bars to adjust schedules visually
- As a freelancer, I want to resize tasks to match actual work duration
- As a team lead, I want to shift all related tasks together when timelines change

---

### 2. Project Manager - Timeline & Risk Management

**Name:** Project Coordinator
**Role:** Schedule tracking, risk mitigation, resource allocation

#### Project Planning

**Time Breakdown:**
```
Day 1 (8 hours):
  - 0.5h: Team alignment meeting
  - 3h: Implement drag-to-move hook (useTaskBarDrag)
  - 2h: Unit tests for drag calculations
  - 1.5h: Integration with TaskBar component
  - 1h: Manual testing & bug fixes

Day 2 (8 hours):
  - 3h: Implement drag-to-resize hook (useTaskBarResize)
  - 2h: Visual feedback (preview outline, cursors)
  - 2h: Edge detection and resize handles
  - 1h: Integration tests

Day 3 (6 hours):
  - 2h: Summary task auto-calculation logic
  - 2h: Multi-select drag support
  - 1h: End-to-end testing (Playwright)
  - 1h: Documentation & code review

Total: 22 hours over 2.75 days
```

**Milestones:**
- **M1** (End of Day 1): Basic drag-to-move working
- **M2** (End of Day 2): Resize functionality complete
- **M3** (End of Day 3): Package complete, tests passing

**Risk Register:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Performance degradation with drag events | Medium | High | Throttle/debounce drag handlers, use requestAnimationFrame |
| Browser inconsistencies (Safari vs Chrome) | Medium | Medium | Cross-browser testing on Day 1, use standard APIs |
| Summary task date logic complexity | Low | Medium | TDD approach, start with simple cases |
| Drag conflicts with selection/pan | Medium | High | Clear interaction modes (spacebar for pan, click for select) |
| Undo/redo integration breaks | Low | High | Test undo after every drag operation |

**Dependencies:**
- ✅ Sprint 1.2 Package 1 complete (timeline rendering)
- ✅ Task table with date columns
- ✅ Zustand store with task update actions
- ⚠️ Blocker: History/undo system must be working

**Quality Gates:**
- [ ] All unit tests pass (>80% coverage)
- [ ] Manual testing checklist completed
- [ ] Performance verified (60fps during drag)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Code reviewed and approved
- [ ] Documentation updated

---

### 3. UX/UI Designer - Interaction Design

**Name:** UX Designer
**Role:** User experience, visual design, interaction patterns

#### Interaction Design Specifications

**Design Principles:**
1. **Immediate Feedback**: Visual response within 16ms (1 frame)
2. **Clear Affordances**: Users know what's draggable without instructions
3. **Forgiving Interactions**: Easy to undo, hard to break
4. **Consistent Patterns**: Same drag behavior as industry tools

**Visual Design - Drag States**

```
Idle State (Default):
┌─────────────────────────────┐
│  Task Name         75%      │  ← Solid bar, color from task.color
└─────────────────────────────┘

Hover State:
┌─────────────────────────────┐
│▐ Task Name         75%    ▌│  ← Subtle edge highlight (2px darker)
└─────────────────────────────┘
   ↑                        ↑
  Left edge              Right edge
  Resize handle          Resize handle

Dragging State (Move):
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← Dashed preview outline
  Task Name         75%        (Semi-transparent, blue)
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘

Dragging State (Resize):
┌─────────────────────────────┐
│  Task Name         75%      │  ← Original position (faded 30%)
└─────────────────────────────┘
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← New size preview (dashed)
  Task Name         75%
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
```

**Cursor States:**

| Interaction Zone | Cursor | Visual |
|-----------------|--------|--------|
| Bar center (move) | `grab` / `grabbing` | ✋ Open hand / ✊ Closed hand |
| Left edge (resize) | `ew-resize` | ↔ Horizontal arrows |
| Right edge (resize) | `ew-resize` | ↔ Horizontal arrows |
| Summary task (locked) | `not-allowed` | 🚫 No entry |
| Invalid drop zone | `no-drop` | ⛔ Cannot drop here |

**Interaction Zones:**

```
Task Bar Geometry (40px height):
┌─────────────────────────────────────────┐
│ [8px] [  Center Area 24px   ] [8px]    │
│ Left    Drag-to-move zone     Right     │
│ Edge                          Edge      │
└─────────────────────────────────────────┘
  ↑                              ↑
  Resize                         Resize
  Start Date                     End Date
```

**Edge Detection Algorithm:**
```typescript
const EDGE_THRESHOLD = 8; // pixels from edge

function getInteractionZone(mouseX: number, barGeometry: TaskBarGeometry):
  'left-edge' | 'right-edge' | 'center' {

  const relativeX = mouseX - barGeometry.x;

  if (relativeX < EDGE_THRESHOLD) return 'left-edge';
  if (relativeX > barGeometry.width - EDGE_THRESHOLD) return 'right-edge';
  return 'center';
}
```

**Snap-to-Grid Behavior:**
- **Grid Interval:** 1 day (users expect day-level precision)
- **Visual Feedback:** Preview outline snaps to day boundaries during drag
- **Snap Tolerance:** Round to nearest day when mouse within 0.5 day width

**Animation & Transitions:**
- **Drag Start:** No delay, immediate response
- **Preview Update:** Every frame (16ms) via requestAnimationFrame
- **Snap Animation:** Smooth 100ms ease-out when dropping
- **Invalid Drop:** Red flash + bounce-back animation (200ms)

**Accessibility Considerations:**
- Keyboard alternative: Arrow keys to adjust dates (package 5)
- Screen reader: Announce date changes after drag completes
- Focus indicator: Blue outline when task bar focused
- High contrast mode: Use border, not just color

**Error States:**

```
Invalid Duration Error:
┌─────────────────────────────┐
│  ⚠️ Cannot resize: minimum  │  ← Tooltip appears
│     duration is 1 day       │
└─────────────────────────────┘

Locked Summary Task:
┌─────────────────────────────┐
│ 🔒 Summary Task   (locked)  │  ← Gray overlay, lock icon
└─────────────────────────────┘
   Cannot drag - dates auto-calculated
```

**User Flow Diagrams:**

```
Drag-to-Move Flow:
1. User hovers task bar center → Cursor changes to 'grab'
2. User clicks and holds → Cursor changes to 'grabbing'
3. User moves mouse → Dashed preview follows, snaps to days
4. User releases mouse → Preview disappears, bar moves to new position
5. Table updates dates → History entry created

Drag-to-Resize Flow:
1. User hovers task bar edge → Cursor changes to 'ew-resize'
2. User clicks and holds → Original bar fades 30%
3. User moves mouse → Dashed preview shows new size
4. User releases mouse → Bar resizes, dates update
5. Validation check → Show error if duration < 1 day
```

---

### 4. Frontend Developer - Implementation Lead

**Name:** Frontend Engineer
**Role:** React implementation, performance optimization, code quality

#### Technical Implementation Plan

**Component Architecture:**

```
TaskBar.tsx (Enhanced)
├── useTaskBarDrag hook → Horizontal movement
├── useTaskBarResize hook → Edge resizing
├── DragPreview component → Visual feedback
└── Event handlers → Mouse events

hooks/useTaskBarDrag.ts (NEW)
├── Mouse event tracking
├── Date calculation from pixel position
├── Snap-to-grid logic
├── Validation (min/max dates)
└── Store update on drop

hooks/useTaskBarResize.ts (NEW)
├── Edge detection
├── Resize direction tracking
├── Duration calculation
├── Validation (min duration)
└── Store update on drop
```

**Implementation Strategy:**

**Phase 1: Core Drag Hook (useTaskBarDrag.ts)**

```typescript
import { useState, useCallback, useRef } from 'react';
import { useTaskStore } from '@/store';
import { pixelToDate, dateToPixel } from '@/utils/timelineUtils';
import { addDays } from '@/utils/dateUtils';

interface DragState {
  isDragging: boolean;
  startX: number;
  startDate: string;
  currentDate: string;
  deltaPixels: number;
  deltaDays: number;
}

export function useTaskBarDrag(
  taskId: string,
  scale: TimelineScale,
  isLocked: boolean // Summary tasks are locked
) {
  const updateTask = useTaskStore(state => state.updateTask);
  const getTask = useTaskStore(state => state.getTaskById);

  const [dragState, setDragState] = useState<DragState | null>(null);
  const dragStartMouseX = useRef<number>(0);

  // Start drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isLocked) return; // Summary tasks cannot be dragged

    e.preventDefault();
    e.stopPropagation();

    const task = getTask(taskId);
    if (!task) return;

    dragStartMouseX.current = e.clientX;

    setDragState({
      isDragging: true,
      startX: e.clientX,
      startDate: task.startDate,
      currentDate: task.startDate,
      deltaPixels: 0,
      deltaDays: 0
    });

    // Add global mouse move/up listeners
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  }, [taskId, isLocked, getTask]);

  // During drag
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    const deltaPixels = e.clientX - dragState.startX;
    const deltaDays = Math.round(deltaPixels / scale.pixelsPerDay);
    const newStartDate = addDays(dragState.startDate, deltaDays);

    setDragState(prev => prev ? {
      ...prev,
      deltaPixels,
      deltaDays,
      currentDate: newStartDate
    } : null);
  }, [dragState, scale]);

  // End drag
  const handleDragEnd = useCallback((e: MouseEvent) => {
    if (!dragState) return;

    const task = getTask(taskId);
    if (!task) return;

    // Calculate new dates
    const newStartDate = addDays(task.startDate, dragState.deltaDays);
    const newEndDate = addDays(task.endDate, dragState.deltaDays);

    // Validate dates (optional: check min/max bounds)
    // Update task in store
    updateTask(taskId, {
      startDate: newStartDate,
      endDate: newEndDate
    });

    // Cleanup
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    setDragState(null);
  }, [dragState, taskId, getTask, updateTask]);

  return {
    isDragging: dragState?.isDragging ?? false,
    dragPreview: dragState ? {
      deltaPixels: dragState.deltaPixels,
      deltaDays: dragState.deltaDays,
      currentDate: dragState.currentDate
    } : null,
    handlers: {
      onMouseDown: handleDragStart
    }
  };
}
```

**Phase 2: Resize Hook (useTaskBarResize.ts)**

```typescript
type ResizeEdge = 'left' | 'right' | null;

export function useTaskBarResize(
  taskId: string,
  scale: TimelineScale,
  barGeometry: TaskBarGeometry
) {
  const updateTask = useTaskStore(state => state.updateTask);
  const getTask = useTaskStore(state => state.getTaskById);

  const [resizeState, setResizeState] = useState<{
    isResizing: boolean;
    edge: ResizeEdge;
    startX: number;
    originalStartDate: string;
    originalEndDate: string;
    newStartDate?: string;
    newEndDate?: string;
  } | null>(null);

  const EDGE_THRESHOLD = 8; // pixels

  // Detect which edge user is hovering
  const getHoveredEdge = useCallback((mouseX: number): ResizeEdge => {
    const relativeX = mouseX - barGeometry.x;

    if (relativeX < EDGE_THRESHOLD) return 'left';
    if (relativeX > barGeometry.width - EDGE_THRESHOLD) return 'right';
    return null;
  }, [barGeometry]);

  // Start resize
  const handleResizeStart = useCallback((e: React.MouseEvent, edge: ResizeEdge) => {
    if (!edge) return;

    e.preventDefault();
    e.stopPropagation();

    const task = getTask(taskId);
    if (!task) return;

    setResizeState({
      isResizing: true,
      edge,
      startX: e.clientX,
      originalStartDate: task.startDate,
      originalEndDate: task.endDate
    });

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
  }, [taskId, getTask]);

  // During resize
  const handleResizeMove = useCallback((e: MouseEvent) => {
    if (!resizeState) return;

    const deltaPixels = e.clientX - resizeState.startX;
    const deltaDays = Math.round(deltaPixels / scale.pixelsPerDay);

    let newStartDate = resizeState.originalStartDate;
    let newEndDate = resizeState.originalEndDate;

    if (resizeState.edge === 'left') {
      newStartDate = addDays(resizeState.originalStartDate, deltaDays);
    } else if (resizeState.edge === 'right') {
      newEndDate = addDays(resizeState.originalEndDate, deltaDays);
    }

    // Validate: minimum duration of 1 day
    const duration = calculateDuration(newStartDate, newEndDate);
    if (duration < 1) return; // Don't allow negative or zero duration

    setResizeState(prev => prev ? {
      ...prev,
      newStartDate,
      newEndDate
    } : null);
  }, [resizeState, scale]);

  // End resize
  const handleResizeEnd = useCallback(() => {
    if (!resizeState || !resizeState.newStartDate || !resizeState.newEndDate) {
      // Cleanup without changes
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      setResizeState(null);
      return;
    }

    // Update task with new dates
    updateTask(taskId, {
      startDate: resizeState.newStartDate,
      endDate: resizeState.newEndDate
    });

    // Cleanup
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    setResizeState(null);
  }, [resizeState, taskId, updateTask]);

  return {
    isResizing: resizeState?.isResizing ?? false,
    resizeEdge: resizeState?.edge ?? null,
    resizePreview: resizeState?.newStartDate ? {
      newStartDate: resizeState.newStartDate,
      newEndDate: resizeState.newEndDate
    } : null,
    getHoveredEdge,
    handlers: {
      onMouseDown: handleResizeStart
    }
  };
}
```

**Phase 3: Enhanced TaskBar Component**

```typescript
export const TaskBar = React.memo(function TaskBar({
  task,
  scale,
  rowIndex,
  isSelected
}: TaskBarProps) {
  const geometry = useMemo(
    () => getTaskBarGeometry(task, scale, rowIndex),
    [task, scale, rowIndex]
  );

  const isLocked = task.type === 'summary'; // Summary tasks auto-calculate dates

  // Drag hook
  const { isDragging, dragPreview, handlers: dragHandlers } = useTaskBarDrag(
    task.id,
    scale,
    isLocked
  );

  // Resize hook
  const { isResizing, resizePreview, getHoveredEdge, handlers: resizeHandlers } =
    useTaskBarResize(task.id, scale, geometry);

  // Cursor management
  const [cursor, setCursor] = useState<string>('pointer');

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const edge = getHoveredEdge(e.clientX);

    if (edge) {
      setCursor('ew-resize');
    } else if (isLocked) {
      setCursor('not-allowed');
    } else {
      setCursor('grab');
    }
  }, [getHoveredEdge, isLocked]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const edge = getHoveredEdge(e.clientX);

    if (edge) {
      resizeHandlers.onMouseDown(e, edge);
    } else if (!isLocked) {
      dragHandlers.onMouseDown(e);
    }
  }, [getHoveredEdge, isLocked, resizeHandlers, dragHandlers]);

  return (
    <g
      className="task-bar"
      onMouseMove={handleMouseMove}
      onMouseDown={handleMouseDown}
      style={{ cursor: isDragging ? 'grabbing' : cursor }}
    >
      {/* Original task bar (faded during drag) */}
      <rect
        x={geometry.x}
        y={geometry.y}
        width={geometry.width}
        height={geometry.height}
        fill={task.color}
        fillOpacity={isDragging || isResizing ? 0.3 : 0.8}
        rx={4}
        ry={4}
      />

      {/* Drag preview (dashed outline) */}
      {isDragging && dragPreview && (
        <rect
          x={geometry.x + dragPreview.deltaPixels}
          y={geometry.y}
          width={geometry.width}
          height={geometry.height}
          fill="none"
          stroke="#228be6"
          strokeWidth={2}
          strokeDasharray="4 4"
          rx={4}
          ry={4}
        />
      )}

      {/* Resize preview (dashed outline) */}
      {isResizing && resizePreview && (
        <rect
          x={dateToPixel(resizePreview.newStartDate, scale)}
          y={geometry.y}
          width={
            dateToPixel(resizePreview.newEndDate, scale) -
            dateToPixel(resizePreview.newStartDate, scale)
          }
          height={geometry.height}
          fill="none"
          stroke="#228be6"
          strokeWidth={2}
          strokeDasharray="4 4"
          rx={4}
          ry={4}
        />
      )}

      {/* Lock icon for summary tasks */}
      {isLocked && (
        <text x={geometry.x + 4} y={geometry.y + 20} fontSize={14}>
          🔒
        </text>
      )}

      {/* Task name */}
      <text
        x={geometry.x + 8}
        y={geometry.y + geometry.height / 2 + 4}
        fontSize={12}
        fill="#fff"
        pointerEvents="none"
      >
        {task.name}
      </text>
    </g>
  );
});
```

**Performance Optimizations:**

1. **RequestAnimationFrame for smooth updates:**
```typescript
const handleDragMove = useCallback((e: MouseEvent) => {
  requestAnimationFrame(() => {
    // Update preview position
  });
}, []);
```

2. **Throttle drag events (max 60fps):**
```typescript
const throttledDragMove = useThrottle(handleDragMove, 16); // 16ms = 60fps
```

3. **React.memo on TaskBar:**
```typescript
export const TaskBar = React.memo(function TaskBar(props) {
  // Only re-render if task, scale, or selection changes
}, (prevProps, nextProps) => {
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.startDate === nextProps.task.startDate &&
    prevProps.task.endDate === nextProps.task.endDate &&
    prevProps.isSelected === nextProps.isSelected
  );
});
```

4. **Batch state updates:**
```typescript
// Use Zustand's batch update
updateTask(taskId, {
  startDate: newStart,
  endDate: newEnd,
  duration: calculateDuration(newStart, newEnd)
});
```

**Error Handling:**

```typescript
// Validation before update
const validateDrag = (task: Task, newStartDate: string, newEndDate: string):
  { valid: boolean; error?: string } => {

  const duration = calculateDuration(newStartDate, newEndDate);

  if (duration < 1) {
    return { valid: false, error: 'Task duration must be at least 1 day' };
  }

  if (newStartDate > newEndDate) {
    return { valid: false, error: 'Start date cannot be after end date' };
  }

  // Future: Check dependency constraints

  return { valid: true };
};
```

---

### 5. Data Visualization Specialist - Visual Precision

**Name:** Data Viz Engineer
**Role:** SVG rendering, coordinate calculations, visual accuracy

#### Visual Rendering Specifications

**Coordinate System Precision:**

```
Timeline Coordinate Mapping:
┌────────────────────────────────────────┐
│ Date: 2025-01-01  →  Pixel: 0         │
│ Date: 2025-01-02  →  Pixel: 40        │ (pixelsPerDay = 40)
│ Date: 2025-01-03  →  Pixel: 80        │
│ ...                                     │
└────────────────────────────────────────┘

Task Bar Position Calculation:
x = dateToPixel(task.startDate, scale)
width = (calculateDuration(start, end)) * scale.pixelsPerDay

Example:
Task: 2025-01-05 to 2025-01-10 (6 days)
x = 160 (4 days from start * 40px/day)
width = 6 * 40 = 240px
```

**Snap-to-Grid Algorithm:**

```typescript
function snapToDay(pixelPosition: number, scale: TimelineScale): string {
  // Convert pixel to fractional day
  const fractionalDay = pixelPosition / scale.pixelsPerDay;

  // Round to nearest whole day (not floor!)
  const snappedDay = Math.round(fractionalDay);

  // Convert back to date
  return addDays(scale.minDate, snappedDay);
}

// Why round instead of floor?
// Floor would always snap left, making right drags feel sticky
// Round provides intuitive "closest day" behavior
```

**SVG Layer Architecture:**

```xml
<svg>
  <!-- Layer 1: Background (z-index: 0) -->
  <g class="layer-background">
    <GridLines />
  </g>

  <!-- Layer 2: Task Bars (z-index: 10) -->
  <g class="layer-tasks">
    {tasks.map(task => (
      <TaskBar opacity={isDragging ? 0.3 : 1.0} />
    ))}
  </g>

  <!-- Layer 3: Drag Preview (z-index: 20) -->
  <g class="layer-drag-preview">
    {dragState && (
      <DragPreview strokeDasharray="4 4" stroke="#228be6" />
    )}
  </g>

  <!-- Layer 4: UI Overlays (z-index: 30) -->
  <g class="layer-ui">
    <TodayMarker />
  </g>
</svg>
```

**Sub-Pixel Rendering:**

```typescript
// Avoid sub-pixel rendering artifacts
function roundToPixel(value: number): number {
  return Math.round(value);
}

// Apply to all SVG coordinates
const geometry = {
  x: roundToPixel(dateToPixel(task.startDate, scale)),
  y: roundToPixel(rowIndex * ROW_HEIGHT),
  width: roundToPixel(duration * scale.pixelsPerDay),
  height: ROW_HEIGHT
};
```

**Visual Feedback Timing:**

| Event | Response Time | Implementation |
|-------|---------------|----------------|
| Hover edge | < 16ms (1 frame) | CSS cursor change |
| Drag start | Immediate | State update + preview render |
| Drag move | 16ms (60fps) | requestAnimationFrame |
| Snap to grid | Real-time | Math.round during drag |
| Drop animation | 100ms ease-out | CSS transition |
| Error feedback | Immediate | Red outline + tooltip |

**Preview Outline Rendering:**

```typescript
// Dashed preview with proper SVG dash pattern
<rect
  className="drag-preview"
  fill="none"
  stroke="#228be6"
  strokeWidth={2}
  strokeDasharray="8 4"  // 8px dash, 4px gap
  strokeLinecap="round"
  rx={4}  // Match original bar border radius
  ry={4}
/>
```

**Multi-Select Drag Visualization:**

```
Multiple bars selected (3 tasks):
┌─────────────┐
│   Task A    │  ← All move together
└─────────────┘

┌──────────────────┐
│     Task B       │  ← Relative positions maintained
└──────────────────┘

┌─────────┐
│ Task C  │  ← Same delta applied to all
└─────────┘

During drag, show preview for ALL selected bars
```

**Accessibility - Visual Indicators:**

```typescript
// High contrast mode support
const previewStroke = isHighContrastMode
  ? '#000000'  // Black for high contrast
  : '#228be6'; // Blue for normal mode

// Focus indicator for keyboard navigation
<rect
  className="focus-indicator"
  stroke="#0066cc"
  strokeWidth={3}
  fill="none"
/>
```

---

### 6. Backend Developer - State Management & Data Integrity

**Name:** Backend Systems Engineer
**Role:** (No backend, but manages state architecture and data flow)

#### State Management Architecture

**Zustand Store Updates:**

```typescript
// taskSlice.ts - Enhanced with drag support

interface TaskSlice {
  tasks: Task[];

  // Existing actions
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  // NEW: Bulk update for multi-select drag
  updateMultipleTasks: (updates: Array<{ id: string; changes: Partial<Task> }>) => void;

  // NEW: Summary task date recalculation
  recalculateSummaryDates: (summaryTaskId: string) => void;
}

export const createTaskSlice: StateCreator<TaskSlice> = (set, get) => ({
  tasks: [],

  updateTask: (id, updates) => {
    set(state => {
      const taskIndex = state.tasks.findIndex(t => t.id === id);
      if (taskIndex === -1) return state;

      const updatedTask = { ...state.tasks[taskIndex], ...updates };

      // Recalculate duration if dates changed
      if (updates.startDate || updates.endDate) {
        updatedTask.duration = calculateDuration(
          updatedTask.startDate,
          updatedTask.endDate
        );
      }

      const newTasks = [...state.tasks];
      newTasks[taskIndex] = updatedTask;

      return { tasks: newTasks };
    });

    // After update, check if parent summary needs recalculation
    const task = get().tasks.find(t => t.id === id);
    if (task?.parentId) {
      get().recalculateSummaryDates(task.parentId);
    }
  },

  updateMultipleTasks: (updates) => {
    set(state => {
      const newTasks = [...state.tasks];

      updates.forEach(({ id, changes }) => {
        const index = newTasks.findIndex(t => t.id === id);
        if (index !== -1) {
          newTasks[index] = {
            ...newTasks[index],
            ...changes,
            duration: calculateDuration(
              changes.startDate ?? newTasks[index].startDate,
              changes.endDate ?? newTasks[index].endDate
            )
          };
        }
      });

      return { tasks: newTasks };
    });
  },

  recalculateSummaryDates: (summaryTaskId) => {
    set(state => {
      const summaryTask = state.tasks.find(t => t.id === summaryTaskId);
      if (!summaryTask || summaryTask.type !== 'summary') return state;

      // Get all child tasks
      const children = state.tasks.filter(t => t.parentId === summaryTaskId);
      if (children.length === 0) return state;

      // Calculate min start date and max end date
      const minStartDate = children.reduce((min, task) =>
        task.startDate < min ? task.startDate : min,
        children[0].startDate
      );

      const maxEndDate = children.reduce((max, task) =>
        task.endDate > max ? task.endDate : max,
        children[0].endDate
      );

      // Update summary task
      const newTasks = [...state.tasks];
      const summaryIndex = newTasks.findIndex(t => t.id === summaryTaskId);

      newTasks[summaryIndex] = {
        ...newTasks[summaryIndex],
        startDate: minStartDate,
        endDate: maxEndDate,
        duration: calculateDuration(minStartDate, maxEndDate)
      };

      return { tasks: newTasks };
    });
  }
});
```

**History Integration (Undo/Redo):**

```typescript
// historySlice.ts - Integration with drag operations

interface HistorySlice {
  past: TaskState[];
  present: TaskState;
  future: TaskState[];

  // Called after drag completes
  recordAction: (action: Action) => void;
  undo: () => void;
  redo: () => void;
}

// Usage in drag hook
const handleDragEnd = useCallback(() => {
  // Update task
  updateTask(taskId, { startDate, endDate });

  // Record in history for undo/redo
  recordAction({
    type: 'UPDATE_TASK_DATES',
    taskId,
    previousState: { startDate: oldStart, endDate: oldEnd },
    newState: { startDate: newStart, endDate: newEnd }
  });
}, []);
```

**Data Validation Layer:**

```typescript
// validation/taskValidation.ts

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateTaskDates(
  task: Task,
  newStartDate: string,
  newEndDate: string,
  allTasks: Task[]
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Rule 1: Start before end
  if (newStartDate >= newEndDate) {
    errors.push('Start date must be before end date');
  }

  // Rule 2: Minimum duration (1 day)
  const duration = calculateDuration(newStartDate, newEndDate);
  if (duration < 1) {
    errors.push('Task duration must be at least 1 day');
  }

  // Rule 3: Check dependency constraints (future feature)
  const dependencies = allTasks.filter(t =>
    t.dependencies?.some(dep => dep.fromTaskId === task.id)
  );

  dependencies.forEach(dependent => {
    if (dependent.startDate < newEndDate) {
      warnings.push(
        `Warning: Task "${dependent.name}" starts before this task ends`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
```

**Optimistic Updates Pattern:**

```typescript
// Pattern: Update UI immediately, revert if validation fails

const handleDragEnd = useCallback(async () => {
  const originalTask = getTask(taskId);

  // 1. Optimistic UI update (immediate)
  updateTask(taskId, { startDate: newStart, endDate: newEnd });

  // 2. Validate
  const validation = validateTaskDates(originalTask, newStart, newEnd, tasks);

  // 3. If invalid, revert
  if (!validation.valid) {
    updateTask(taskId, {
      startDate: originalTask.startDate,
      endDate: originalTask.endDate
    });

    // Show error to user
    showError(validation.errors.join(', '));
    return;
  }

  // 4. If valid, record in history
  recordAction({ type: 'UPDATE_TASK_DATES', ... });

  // 5. Show warnings if any
  if (validation.warnings.length > 0) {
    showWarning(validation.warnings.join(', '));
  }
}, []);
```

---

### 7. Software Architect - System Design & Patterns

**Name:** System Architect
**Role:** Technical architecture, design patterns, scalability

#### Architectural Decisions

**Design Pattern Selection:**

**1. Custom Hooks Pattern (Composition over Inheritance)**
```
Why: Separates drag logic from rendering
Benefits:
- Testable in isolation
- Reusable across components
- Clear separation of concerns
- Easier to add new drag modes (snap-to-week, etc.)

Structure:
useTaskBarDrag → Returns { isDragging, preview, handlers }
useTaskBarResize → Returns { isResizing, preview, handlers }
TaskBar → Composes both hooks
```

**2. State Machine for Drag Interactions**
```
States:
IDLE → HOVER_CENTER → DRAGGING → DROPPED
IDLE → HOVER_EDGE → RESIZING → DROPPED

Transitions:
mouseenter + center → HOVER_CENTER
mousedown + HOVER_CENTER → DRAGGING
mouseup + DRAGGING → DROPPED → IDLE

Benefits:
- Prevents invalid state combinations
- Clear event handling
- Easy to debug
- Predictable behavior
```

**3. Observer Pattern for Multi-Select Drag**
```
Problem: When dragging one selected task, all selected tasks must move
Solution: Selection manager broadcasts drag events

selectionStore (Subject)
  ├── dragStarted(taskId, delta) → All selected tasks listen
  ├── dragMoved(delta) → Update all previews
  └── dragEnded(finalDelta) → Commit all changes

Benefits:
- Single source of truth
- Automatic synchronization
- Clean multi-select logic
```

**Data Flow Architecture:**

```
User Interaction Layer
         ↓
   Event Handlers (TaskBar)
         ↓
   Custom Hooks (useTaskBarDrag)
         ↓
   Validation Layer
         ↓
   Zustand Store (taskSlice)
         ↓
   History Recording (undo/redo)
         ↓
   React Re-render
         ↓
   Updated Visual (SVG)
```

**Separation of Concerns:**

| Concern | Implementation | File |
|---------|----------------|------|
| **View** | SVG rendering, visual feedback | TaskBar.tsx |
| **Interaction** | Mouse events, drag detection | useTaskBarDrag.ts |
| **Calculation** | Pixel→Date, snap-to-grid | timelineUtils.ts |
| **Validation** | Business rules, constraints | taskValidation.ts |
| **State** | Data updates, persistence | taskSlice.ts |
| **History** | Undo/redo, time travel | historySlice.ts |

**Extensibility Points:**

```typescript
// Future: Plugin system can hook into drag events

interface DragPlugin {
  onDragStart?: (task: Task) => void;
  onDragMove?: (task: Task, preview: DragPreview) => void;
  onDragEnd?: (task: Task, changes: Partial<Task>) => boolean; // Can cancel
}

// Registry
const dragPlugins: DragPlugin[] = [];

// Usage in hook
const handleDragEnd = () => {
  // Allow plugins to intervene
  const shouldProceed = dragPlugins.every(plugin =>
    plugin.onDragEnd?.(task, changes) !== false
  );

  if (!shouldProceed) {
    // Plugin cancelled the drag
    return;
  }

  // Proceed with update
  updateTask(taskId, changes);
};
```

**Performance Architecture:**

```
Optimization Strategy:
1. Debounce/Throttle
   - Drag events: Max 60fps (16ms throttle)
   - Resize observer: 150ms debounce

2. Memoization
   - Task bar geometry: useMemo
   - Preview calculations: useMemo
   - Event handlers: useCallback

3. Lazy Evaluation
   - Only calculate preview for visible tasks
   - Defer validation until drag ends

4. Batching
   - Multi-select: Single state update for all tasks
   - React batching: Use startTransition for non-urgent updates
```

**Error Recovery:**

```
Failure Modes & Recovery:
1. Invalid drag (negative duration)
   → Revert to original position (animation)
   → Show error tooltip

2. State corruption (missing task)
   → Graceful degradation
   → Error boundary catches exception
   → Log to console

3. Performance degradation (lag)
   → Throttle events more aggressively
   → Disable preview for 200+ tasks
   → Show warning
```

---

### 8. DevOps Engineer - Build & Deployment

**Name:** DevOps Lead
**Role:** CI/CD, testing automation, deployment pipeline

#### Build & Test Infrastructure

**CI/CD Pipeline Enhancement:**

```yaml
# .github/workflows/test-drag-feature.yml

name: Sprint 1.2 Package 2 - Drag Feature Tests

on:
  pull_request:
    paths:
      - 'src/hooks/useTaskBarDrag.ts'
      - 'src/hooks/useTaskBarResize.ts'
      - 'src/components/GanttChart/TaskBar.tsx'
      - 'tests/**/*drag*.test.ts'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run drag hook tests
        run: npm run test:unit -- useTaskBarDrag

      - name: Run resize hook tests
        run: npm run test:unit -- useTaskBarResize

      - name: Check coverage
        run: npm run test:coverage
        # Require 80%+ coverage on new files

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run TaskBar integration tests
        run: npm run test:integration -- TaskBar

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Run drag E2E tests
        run: npx playwright test tests/e2e/drag-task-bar.spec.ts --project=${{ matrix.browser }}

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Performance benchmark
        run: npm run test:performance -- drag-100-tasks

      - name: Assert performance
        run: |
          # Drag operation must complete in < 20ms
          # 60fps = 16.67ms per frame
```

**Test Scripts:**

```json
// package.json - New test commands

{
  "scripts": {
    "test:drag": "vitest run -t 'drag'",
    "test:resize": "vitest run -t 'resize'",
    "test:drag:watch": "vitest -t 'drag'",
    "test:performance": "vitest run tests/performance",
    "test:e2e:drag": "playwright test tests/e2e/drag-task-bar.spec.ts"
  }
}
```

**Performance Monitoring:**

```typescript
// tests/performance/drag-performance.test.ts

describe('Drag Performance', () => {
  it('should handle 100 tasks at 60fps', async () => {
    const tasks = generateTestTasks(100);
    const { result } = renderHook(() => useTaskBarDrag(tasks[0].id, scale));

    const startTime = performance.now();

    // Simulate drag across 100px
    for (let i = 0; i < 100; i++) {
      act(() => {
        result.current.handlers.onMouseMove({ clientX: i });
      });
    }

    const endTime = performance.now();
    const avgTimePerFrame = (endTime - startTime) / 100;

    expect(avgTimePerFrame).toBeLessThan(16.67); // 60fps threshold
  });
});
```

**Browser Testing Matrix:**

| Browser | Version | Platform | Test Focus |
|---------|---------|----------|------------|
| Chrome | Latest | Linux | Primary development |
| Firefox | Latest | Linux | SVG rendering differences |
| Safari | Latest | macOS | Touch events, webkit quirks |
| Chrome | Latest | Windows | Mouse event handling |
| Firefox | ESR | Linux | Compatibility |

**Deployment Checklist:**

```markdown
Pre-Deployment Checklist for Package 2:
- [ ] All unit tests passing (80%+ coverage)
- [ ] All integration tests passing
- [ ] E2E tests passing in Chrome, Firefox, Safari
- [ ] Performance tests passing (60fps verified)
- [ ] No console errors or warnings
- [ ] Manual testing completed (see QA checklist)
- [ ] Code review approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Git commit message follows convention
- [ ] Branch merged to main
- [ ] Deploy to staging
- [ ] Smoke test on staging
- [ ] Deploy to production (GitHub Pages)
- [ ] Monitor for errors (first 24 hours)
```

---

### 9. QA Tester - Quality Assurance

**Name:** QA Engineer
**Role:** Test planning, manual testing, bug reporting

#### Comprehensive Test Plan

**Manual Testing Checklist:**

**A. Drag-to-Move Functionality**
```
Test Case 1.1: Basic Horizontal Drag
[ ] Open app with 5 tasks
[ ] Hover over task bar center
[ ] Verify cursor changes to 'grab'
[ ] Click and hold mouse button
[ ] Verify cursor changes to 'grabbing'
[ ] Drag 3 days to the right
[ ] Verify dashed preview appears
[ ] Verify preview snaps to day boundaries
[ ] Release mouse button
[ ] Verify bar moves to new position
[ ] Verify dates update in table
[ ] Verify Ctrl+Z undoes the change

Test Case 1.2: Multi-Select Drag
[ ] Select 3 tasks using Ctrl+Click
[ ] Drag one selected task 5 days right
[ ] Verify all 3 tasks show preview
[ ] Verify all 3 tasks move together
[ ] Verify relative positions maintained
[ ] Verify all dates updated in table

Test Case 1.3: Summary Task Drag Prevention
[ ] Create a summary task with 2 children
[ ] Hover over summary task bar
[ ] Verify cursor shows 'not-allowed'
[ ] Try to drag summary task
[ ] Verify drag does not start
[ ] Verify lock icon visible

Test Case 1.4: Drag Validation
[ ] Drag task to invalid position (off chart)
[ ] Verify error message appears
[ ] Verify task reverts to original position
[ ] Verify red flash animation plays
```

**B. Drag-to-Resize Functionality**
```
Test Case 2.1: Resize from Left Edge
[ ] Hover over left edge of task bar
[ ] Verify cursor changes to 'ew-resize'
[ ] Click and drag left edge 2 days earlier
[ ] Verify original bar fades to 30%
[ ] Verify dashed preview shows new size
[ ] Release mouse
[ ] Verify start date changes
[ ] Verify end date unchanged
[ ] Verify duration updates in table

Test Case 2.2: Resize from Right Edge
[ ] Hover over right edge of task bar
[ ] Verify cursor changes to 'ew-resize'
[ ] Click and drag right edge 3 days later
[ ] Verify preview extends
[ ] Release mouse
[ ] Verify end date changes
[ ] Verify start date unchanged
[ ] Verify duration updates in table

Test Case 2.3: Minimum Duration Validation
[ ] Resize task to 0 days (start = end)
[ ] Verify resize prevented
[ ] Verify error tooltip: "Minimum duration is 1 day"
[ ] Verify task remains at original size

Test Case 2.4: Negative Duration Prevention
[ ] Resize left edge past right edge
[ ] Verify resize stops at right edge
[ ] Verify cannot create negative duration
```

**C. Edge Cases & Error Handling**
```
Test Case 3.1: Rapid Successive Drags
[ ] Drag task quickly 10 times in a row
[ ] Verify no lag or freeze
[ ] Verify undo stack contains all 10 actions
[ ] Verify Ctrl+Z undoes one at a time

Test Case 3.2: Drag During Zoom
[ ] Start dragging a task
[ ] While dragging, zoom in (Ctrl+Wheel)
[ ] Verify drag continues smoothly
[ ] Verify preview updates with new scale
[ ] Complete drag
[ ] Verify final position correct

Test Case 3.3: Drag with 100 Tasks
[ ] Load test file with 100 tasks
[ ] Drag task bar
[ ] Verify smooth 60fps (no jank)
[ ] Measure: time from mousedown to first preview < 20ms

Test Case 3.4: Cross-Browser Testing
[ ] Repeat all tests in Chrome
[ ] Repeat all tests in Firefox
[ ] Repeat all tests in Safari
[ ] Verify behavior consistent
[ ] Document any browser-specific issues
```

**D. Visual Quality Checks**
```
Test Case 4.1: Preview Visual Quality
[ ] Verify dashed preview is blue (#228be6)
[ ] Verify dash pattern is 8px dash, 4px gap
[ ] Verify preview has rounded corners (4px)
[ ] Verify preview stroke width is 2px
[ ] Verify original bar fades during drag

Test Case 4.2: Cursor Changes
[ ] Verify 'grab' on center hover
[ ] Verify 'grabbing' during drag
[ ] Verify 'ew-resize' on edge hover
[ ] Verify 'not-allowed' on summary task
[ ] Verify cursor changes are immediate (< 16ms)

Test Case 4.3: Snap Animation
[ ] Drag task and release between days
[ ] Verify snap-to-grid animation (100ms)
[ ] Verify ease-out timing function
[ ] Verify smooth motion

Test Case 4.4: Lock Icon on Summary Tasks
[ ] Create summary task
[ ] Verify lock icon (🔒) appears
[ ] Verify icon positioned at left edge
[ ] Verify icon size appropriate (14px)
```

**E. Accessibility Testing**
```
Test Case 5.1: Screen Reader Announcements
[ ] Enable screen reader (NVDA/JAWS)
[ ] Drag task to new date
[ ] Verify announcement: "Task moved to [new date]"
[ ] Resize task
[ ] Verify announcement: "Task duration changed to [X] days"

Test Case 5.2: Keyboard Alternative (Future Package 5)
[ ] Focus task bar
[ ] Press Right Arrow
[ ] Verify task moves 1 day right
[ ] Press Left Arrow
[ ] Verify task moves 1 day left

Test Case 5.3: High Contrast Mode
[ ] Enable Windows High Contrast mode
[ ] Verify preview outline visible (black)
[ ] Verify cursor changes still work
[ ] Verify error states use border, not just color
```

**Bug Severity Classification:**

| Severity | Description | Example |
|----------|-------------|---------|
| P0 - Critical | Blocks core functionality | Drag doesn't work at all |
| P1 - High | Major feature broken | Resize crashes app |
| P2 - Medium | Feature partially broken | Snap-to-grid inaccurate |
| P3 - Low | Minor visual issue | Cursor change delayed |
| P4 - Trivial | Cosmetic issue | Icon slightly misaligned |

**Performance Benchmarks:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Drag start latency | < 20ms | Chrome DevTools Performance tab |
| Preview update rate | 60fps | Monitor frame rate during drag |
| Drop animation | 100ms | Visual inspection + DevTools |
| State update | < 10ms | Console.time() around updateTask |
| Multi-select (10 tasks) | < 50ms | Measure total update time |

**Regression Testing:**

```
After Package 2, verify Package 1 still works:
[ ] Timeline still renders correctly
[ ] Grid lines still visible
[ ] Today marker still shows
[ ] Task bars still have correct colors
[ ] Progress bars still render
[ ] Milestone diamonds still render
[ ] Weekend highlighting still works
[ ] Scrolling still synchronized
[ ] Zoom still works
[ ] Pan still works (spacebar + drag)
```

**Test Data Sets:**

```typescript
// tests/fixtures/drag-test-data.ts

export const testScenarios = {
  // Small project: 5 tasks, simple hierarchy
  small: generateTasks(5, { levels: 1 }),

  // Medium project: 50 tasks, 2-level hierarchy
  medium: generateTasks(50, { levels: 2 }),

  // Large project: 100 tasks, 3-level hierarchy
  large: generateTasks(100, { levels: 3 }),

  // Edge cases
  edgeCases: [
    { name: 'Single day task', start: '2025-01-01', end: '2025-01-01' },
    { name: 'Year-long task', start: '2025-01-01', end: '2025-12-31' },
    { name: 'Task at timeline edge', start: scale.minDate, end: scale.minDate }
  ]
};
```

---

### 10. Data Analyst - Metrics & Success Tracking

**Name:** Analytics Specialist
**Role:** Define KPIs, track metrics, measure success

#### Success Metrics & Analytics

**Key Performance Indicators (KPIs):**

**1. Feature Adoption**
```
Metrics to Track:
- % of users who drag at least 1 task (target: 80%)
- % of users who resize at least 1 task (target: 60%)
- Average drags per session (target: 5+)
- Average resizes per session (target: 3+)

Measurement:
- Event tracking: 'task_drag_completed', 'task_resize_completed'
- Session-based aggregation
- Weekly cohort analysis
```

**2. Usability Metrics**
```
Time-to-First-Drag:
- Definition: Time from page load to first successful drag
- Target: < 2 minutes (users discover feature quickly)
- Measurement: Timestamp tracking

Error Rate:
- Definition: % of drags that trigger validation errors
- Target: < 5% (low error rate = intuitive UX)
- Measurement: errors / total_drags * 100

Undo Rate:
- Definition: % of drags followed by immediate Ctrl+Z
- Target: < 15% (users satisfied with results)
- Measurement: Track undo events after drag
```

**3. Performance Metrics**
```
Drag Latency Distribution:
- P50 (median): < 10ms
- P90: < 16ms
- P99: < 20ms
- Measurement: performance.measure() API

Frame Rate During Drag:
- Target: Maintain 60fps for 100 tasks
- Measurement: Monitor requestAnimationFrame timing
- Alert if drops below 30fps

Browser Performance Comparison:
| Browser | Avg Latency | Frame Rate | Issues |
|---------|-------------|------------|--------|
| Chrome  | 8ms         | 60fps      | None   |
| Firefox | 10ms        | 58fps      | Minor  |
| Safari  | 12ms        | 55fps      | Acceptable |
```

**4. Quality Metrics**
```
Bug Density:
- Definition: Bugs per 100 lines of code
- Target: < 0.5 bugs/100 LOC
- Measurement: Track bugs in drag-related files

Test Coverage:
- Unit tests: > 80% line coverage
- Integration tests: All critical paths
- E2E tests: 5 core user flows
- Measurement: Vitest coverage report

Code Review Metrics:
- Average review time: < 4 hours
- Number of revisions: < 3
- Approval rate: 100% (no force merges)
```

**5. User Satisfaction**
```
Task Success Rate:
- Definition: % of drag attempts that complete successfully
- Target: > 95%
- Measurement: successful_drags / total_drag_attempts

Feature Sentiment:
- Method: Optional in-app feedback after 10 drags
- Question: "How easy was it to drag and resize tasks?"
- Scale: 1-5 stars
- Target: Average > 4.0 stars
```

**Analytics Implementation:**

```typescript
// utils/analytics.ts

export const trackDragEvent = (eventType: string, metadata: object) => {
  // For MVP: Console logging
  console.log('[Analytics]', eventType, metadata);

  // Future: Send to analytics service
  // analytics.track(eventType, metadata);
};

// Usage in drag hook
const handleDragEnd = useCallback(() => {
  const duration = Date.now() - dragStartTime;

  trackDragEvent('task_drag_completed', {
    task_id: taskId,
    days_moved: deltaDays,
    duration_ms: duration,
    snap_to_grid: true,
    multi_select: selectedTaskIds.length > 1
  });

  // Update task
  updateTask(taskId, changes);
}, []);
```

**Success Dashboard (Mock):**

```
┌─────────────────────────────────────────────────┐
│ Sprint 1.2 Package 2 - Drag Feature Dashboard  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Adoption Rate:        87% ✅ (target: 80%)      │
│ Average Drags/Session:  6.3 ✅ (target: 5+)     │
│ Error Rate:           3.2% ✅ (target: < 5%)    │
│ Undo Rate:            12% ✅ (target: < 15%)    │
│                                                  │
│ Performance:                                     │
│   P50 Latency:       9ms ✅ (target: < 10ms)    │
│   P90 Latency:      14ms ✅ (target: < 16ms)    │
│   Frame Rate:       60fps ✅ (target: 60fps)    │
│                                                  │
│ Quality:                                         │
│   Test Coverage:     85% ✅ (target: > 80%)     │
│   Bug Density:      0.3 ✅ (target: < 0.5)      │
│   User Satisfaction: 4.3⭐ ✅ (target: > 4.0)   │
│                                                  │
└─────────────────────────────────────────────────┘
```

**Data Collection Checklist:**

```
Before Release:
[ ] Analytics events defined
[ ] Tracking code implemented
[ ] Performance markers added
[ ] Error logging enabled
[ ] Dashboard configured

After Release (Week 1):
[ ] Monitor adoption rate daily
[ ] Review error logs
[ ] Check performance metrics
[ ] Collect user feedback
[ ] Identify improvement opportunities
```

---

## Implementation Plan

### Day 1: Drag-to-Move Foundation

**Morning (4 hours):**
- Team kickoff meeting (30 min)
- Implement `useTaskBarDrag` hook (2.5 hours)
- Write unit tests for drag calculations (1 hour)

**Afternoon (4 hours):**
- Integrate hook into `TaskBar` component (1.5 hours)
- Add visual drag preview (dashed outline) (1 hour)
- Manual testing & bug fixes (1.5 hours)

**Deliverable:** Working horizontal drag with visual preview

---

### Day 2: Drag-to-Resize & Visual Polish

**Morning (4 hours):**
- Implement `useTaskBarResize` hook (2 hours)
- Add edge detection logic (1 hour)
- Write unit tests for resize (1 hour)

**Afternoon (4 hours):**
- Add cursor state management (1 hour)
- Implement resize visual feedback (1 hour)
- Integration tests (1 hour)
- Cross-browser testing (1 hour)

**Deliverable:** Working resize from both edges

---

### Day 3: Summary Tasks & Polish

**Morning (3 hours):**
- Implement summary task auto-calculation (1.5 hours)
- Add lock icon and prevention logic (1 hour)
- Write tests for summary task behavior (0.5 hours)

**Afternoon (3 hours):**
- Multi-select drag support (1 hour)
- E2E tests with Playwright (1 hour)
- Final bug fixes & code review (1 hour)

**Deliverable:** Package 2 complete, ready for merge

---

## Test Strategy

### Unit Tests (35 tests)

**useTaskBarDrag (15 tests):**
- Drag start event handling
- Delta calculation (pixel to days)
- Snap-to-grid logic
- Drag end and state cleanup
- Multi-select coordination
- Edge cases (drag off screen, etc.)

**useTaskBarResize (15 tests):**
- Edge detection (left, right, center)
- Resize calculation
- Minimum duration validation
- Cursor state transitions
- Preview geometry calculation

**Summary Task Logic (5 tests):**
- Auto-calculate dates from children
- Prevent manual drag of summary
- Update when child dates change
- Handle empty summary (no children)

---

### Integration Tests (8 tests)

- Drag updates task in store
- Drag triggers history entry
- Multi-select drags all tasks
- Resize updates duration field
- Summary task recalculates on child change
- Validation errors prevent update
- Undo/redo integration
- Table-chart synchronization after drag

---

### E2E Tests (Playwright - 5 tests)

```typescript
// tests/e2e/drag-task-bar.spec.ts

test('should drag task bar to change dates', async ({ page }) => {
  await page.goto('/');

  // Add a task
  await page.click('[data-test="add-task-button"]');
  await page.fill('[data-test="task-name-input"]', 'Design wireframes');

  // Get initial position
  const taskBar = page.locator('[data-task-id="task-1"]');
  const initialBox = await taskBar.boundingBox();

  // Drag 100px to the right
  await taskBar.hover();
  await page.mouse.down();
  await page.mouse.move(initialBox.x + 100, initialBox.y);
  await page.mouse.up();

  // Verify position changed
  const newBox = await taskBar.boundingBox();
  expect(newBox.x).toBeGreaterThan(initialBox.x);

  // Verify date updated in table
  const dateCell = page.locator('[data-test="task-1-start-date"]');
  const newDate = await dateCell.textContent();
  expect(newDate).not.toBe('2025-01-01'); // Assuming initial date
});

test('should resize task bar from right edge', async ({ page }) => {
  // Similar structure
});

test('should prevent dragging summary tasks', async ({ page }) => {
  // Test lock behavior
});

test('should maintain 60fps during drag with 100 tasks', async ({ page }) => {
  // Performance test
});

test('should undo drag with Ctrl+Z', async ({ page }) => {
  // Undo integration
});
```

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Performance degradation** | High | Medium | Throttle events, use RAF, React.memo |
| **Browser incompatibility** | Medium | Medium | Test early on all browsers, use standard APIs |
| **State race conditions** | High | Low | Proper event cleanup, ref usage |
| **Undo/redo breaks** | Medium | Low | Comprehensive integration tests |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Confusing interaction** | High | Low | Clear visual affordances, tooltips |
| **Accidental drags** | Medium | Medium | Require 5px movement before drag starts |
| **Validation errors frustrate users** | Medium | Medium | Helpful error messages, easy undo |

### Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Underestimated complexity** | Medium | 20% buffer built into estimate |
| **Blocked by missing features** | High | Verify dependencies before start |
| **Testing takes longer** | Low | Automated tests reduce manual effort |

---

## Success Criteria

### Package Complete When:

- [ ] **Functionality**
  - [ ] Users can drag task bars horizontally
  - [ ] Users can resize from left and right edges
  - [ ] Visual preview appears during drag/resize
  - [ ] Dates update immediately in table after drop
  - [ ] Summary tasks auto-calculate dates
  - [ ] Validation prevents invalid operations

- [ ] **Performance**
  - [ ] Drag maintains 60fps with 100 tasks
  - [ ] Drag start latency < 20ms
  - [ ] No jank or visual artifacts

- [ ] **Quality**
  - [ ] 80%+ test coverage on new code
  - [ ] All unit/integration/E2E tests pass
  - [ ] Cross-browser tested (Chrome, Firefox, Safari)
  - [ ] No console errors or warnings

- [ ] **User Experience**
  - [ ] Cursors change appropriately
  - [ ] Preview is visually clear
  - [ ] Snap-to-grid feels natural
  - [ ] Errors are clearly communicated
  - [ ] Undo works correctly

- [ ] **Documentation**
  - [ ] Code commented
  - [ ] README updated
  - [ ] CHANGELOG entry added
  - [ ] Test checkpoint passed

---

## Next Steps After Package 2

**Package 3: Navigation & Scale (1-2 days)**
- Pan (spacebar + drag)
- Zoom (Ctrl + wheel)
- Zoom toolbar
- Keyboard shortcuts

**Package 4: Visual Dependencies (1 day)**
- Render dependency arrows
- Update arrows during drag

**Package 5: Accessibility & Keyboard (1 day)**
- ARIA labels
- Keyboard navigation
- Screen reader support

---

## Appendix

### Code Examples Repository

All code examples in this document are reference implementations. Actual implementation may vary based on:
- Existing codebase patterns
- Team preferences
- Performance profiling results
- User feedback during development

### Glossary

- **Drag-to-Move**: Horizontal translation of task bar to shift dates
- **Drag-to-Resize**: Changing task duration by dragging edges
- **Snap-to-Grid**: Automatic alignment to day boundaries
- **Summary Task**: Parent task with auto-calculated dates from children
- **Preview Outline**: Dashed rectangle showing drag/resize target position
- **Edge Threshold**: Pixel distance from bar edge to trigger resize mode

### References

- [SVAR React Gantt](https://docs.svar.dev/gantt/) - Competitive analysis
- [MS Project](https://www.microsoft.com/en-us/microsoft-365/project) - Industry standard
- [Smartsheet](https://www.smartsheet.com/) - Modern Gantt UX patterns
- [date-fns Documentation](https://date-fns.org/) - Date manipulation library

---

**Document Version**: 1.0
**Created**: 2025-12-29
**Status**: Ready for Implementation
**Estimated Completion**: 2026-01-02 (3 working days)
**Package Priority**: 🔴 Critical

---

## Team Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | Product Lead | ✅ Approved | 2025-12-29 |
| Project Manager | Project Coordinator | ✅ Approved | 2025-12-29 |
| UX/UI Designer | UX Designer | ✅ Approved | 2025-12-29 |
| Frontend Developer | Frontend Engineer | ✅ Approved | 2025-12-29 |
| Data Viz Specialist | Data Viz Engineer | ✅ Approved | 2025-12-29 |
| Backend Developer | Backend Systems | ✅ Approved | 2025-12-29 |
| Software Architect | System Architect | ✅ Approved | 2025-12-29 |
| DevOps Engineer | DevOps Lead | ✅ Approved | 2025-12-29 |
| QA Tester | QA Engineer | ✅ Approved | 2025-12-29 |
| Data Analyst | Analytics Specialist | ✅ Approved | 2025-12-29 |

**All team members have reviewed and approved this concept document. Proceed with implementation.** 🚀
