# Phase 1: MVP (Minimum Viable Product) - Implementation Concept

## Overview

This document outlines **Phase 1** of building the Gantt Chart application: implementing all core features for a production-ready MVP. Phase 1 builds upon the infrastructure established in Phase 0, delivering a fully functional Gantt chart application with all essential features.

**Goal:** Ship a complete, production-ready MVP (v1.0.0) with task management, timeline visualization, dependencies, file operations, undo/redo, and PNG export.

**Duration Estimate:** 6-8 weeks (solo, 20hrs/wk) or 3-4 weeks (team, full-time)

**Success Criteria:**
- ✅ User can create 20-task chart with dependencies in < 5 minutes
- ✅ Charts look professional with zero configuration
- ✅ Save/load works 100% reliably (no data loss)
- ✅ Undo/redo provides safety net for all operations
- ✅ Dependency creation is discoverable (connection handles)
- ✅ PNG export produces presentation-quality output
- ✅ Performance: 100 tasks @ 60fps, 500 tasks @ 30fps minimum
- ✅ WCAG 2.1 AA compliance verified
- ✅ 70%+ test coverage (unit 70%, integration 20%, E2E 10%)
- ✅ Zero critical bugs
 
---

## Phase 1 Deliverables

Phase 1 is divided into **8 Sprints**, each delivering a complete feature set:

### Sprint 1.1: Basic Task Management (Week 1-1.5) ✅ COMPLETE
### Sprint 1.1.1: Task Groups & Hierarchical Organization (Week 1.5-2) ✅ COMPLETE
### Sprint 1.1.2: Hierarchy Indent/Outdent (Week 2-2.5) ✅ COMPLETE
### Sprint 1.2: Timeline & Visualization (Week 2.5-4)
### Sprint 1.3: File Operations (Week 4-5) **[Moved up - was 1.4]**
### Sprint 1.4: Dependencies (Finish-to-Start) (Week 5-6.5) **[Moved down - was 1.3]**
### Sprint 1.5: Basic Undo/Redo (Week 6.5-7.5)
### Sprint 1.6: PNG Export & Polish (Week 7.5-9)

---

## Sprint 1.1: Basic Task Management

**Duration:** 1-1.5 weeks
**Goal:** Enable users to create, edit, delete, and reorder tasks.

### Deliverables

#### 1.1.1 Data Models & Types (3 tasks)

**Files to Create:**
- `src/types/chart.types.ts` - Task, Dependency, Chart interfaces

**Task Interface** (from DATA_MODEL.md):
```typescript
interface Task {
  id: string;              // UUID v4
  name: string;            // 1-200 chars
  startDate: string;       // ISO date (YYYY-MM-DD)
  endDate: string;         // ISO date
  duration: number;        // Calculated in days
  progress: number;        // 0-100
  color: string;           // Hex code
  order: number;           // For reordering
  metadata: Record<string, unknown>;  // Extensibility
}
```

**Key Decisions:**
- Use **ISO date strings** (YYYY-MM-DD), not Date objects (for serialization)
- UUID v4 for all IDs (`crypto.randomUUID()`)
- Include extensibility fields (`metadata`) for future-proofing
- Keep interfaces in sync with DATA_MODEL.md specifications

**Acceptance Criteria:**
- ✓ All types compile without errors
- ✓ JSDoc comments for all interfaces
- ✓ Aligns with DATA_MODEL.md Section 3.1

---

#### 1.1.2 Validation Utilities (2 tasks)

**Files to Create:**
- `src/utils/validation.ts` - Task validation functions

**Functions:**
```typescript
validateTaskName(name: string): ValidationResult
validateDateString(date: string): ValidationResult
validateTask(task: Partial<Task>): ValidationResult
```

**Validation Rules** (from FEATURE_SPECIFICATIONS.md Section 2.2):
- Name: 1-200 characters, required
- Dates: Valid ISO format, endDate >= startDate
- Duration: Auto-calculated from dates
- Color: Valid hex code with fallback
- Progress: 0-100

**Tests:** 30 test cases covering all validation rules

**Acceptance Criteria:**
- ✓ All validation rules enforced
- ✓ Clear error messages returned
- ✓ 80%+ test coverage

---

#### 1.1.3 Zustand Store (3 tasks)

**Files to Create:**
- `src/store/slices/taskSlice.ts` - Task CRUD operations

**Store Structure:**
```typescript
interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
}

interface TaskActions {
  addTask: (taskData: Omit<Task, 'id'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  reorderTasks: (fromIndex: number, toIndex: number) => void;
  selectTask: (id: string | null) => void;
}
```

**Key Patterns:**
- Use Zustand with immer middleware for immutable updates
- Generate UUIDs with `crypto.randomUUID()`
- Emit events for extensibility (plugin system)
- Direct mutation functions (for commands) + public actions

**Tests:** 20 test cases for all CRUD operations

**Acceptance Criteria:**
- ✓ All CRUD operations work correctly
- ✓ State updates trigger re-renders
- ✓ Tests pass

---

#### 1.1.4 Task Table UI Components (6 tasks)

**Files to Create:**
- `src/components/TaskList/TaskTable.tsx` - Spreadsheet-like table container
- `src/components/TaskList/TaskTableRow.tsx` - Individual table row with cells
- `src/components/TaskList/Cell.tsx` - Excel-like cell with inline editing

**Features:**
1. **Display Mode:**
   - List of all tasks
   - Task name, dates, duration displayed
   - Row selection on click
   - Empty state when no tasks

2. **Inline Editing** (from FEATURE_SPECIFICATIONS.md Section 2.2):
   - Double-click or F2 to edit
   - Edit mode with input fields
   - Save on Enter, cancel on Escape
   - Validation applied on save

3. **Add Task:**
   - "+" button to add new task
   - Creates task with default values
   - Auto-focus name field

4. **Delete Task:**
   - Trash icon on hover
   - Confirmation dialog (optional)
   - Remove from store

5. **Drag-and-Drop Reordering:**
   - Install @dnd-kit/core and @dnd-kit/sortable
   - Drag handle (≡) on each row
   - Visual feedback during drag
   - Update order on drop

**Default Task Values** (from FEATURE_SPECIFICATIONS.md Section 2.1):
```typescript
{
  id: crypto.randomUUID(),
  name: "New Task",
  startDate: formatISO(new Date(), { representation: 'date' }),
  endDate: formatISO(addDays(new Date(), 7), { representation: 'date' }),
  duration: 7,
  color: nextColorInPalette(),
  order: tasks.length,
  progress: 0,
  metadata: {}
}
```

**Acceptance Criteria:**
- ✓ Can add/edit/delete tasks
- ✓ Inline editing works smoothly
- ✓ Drag-and-drop reordering functional
- ✓ Validation prevents invalid data
- ✓ Empty state shows when no tasks

---

### Atomic Task Breakdown (14 Tasks)

This section breaks Sprint 1.1 into small, testable, committable tasks. Each task takes 1-3 hours and results in a single atomic commit.

#### Phase 1.1.1: Data Models & Types (3 tasks)
- [ ] **Task 1.1.1a:** Create `src/types/chart.types.ts` with Task interface
  - Define Task interface with all fields
  - Add JSDoc comments
  - Export types
  - **Test:** TypeScript compiles without errors
  - **Commit:** `feat(types): add Task interface definition`

- [ ] **Task 1.1.1b:** Add Dependency interface to `chart.types.ts`
  - Define Dependency interface (FS type only for MVP)
  - Add DependencyType enum
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add Dependency interface`

- [ ] **Task 1.1.1c:** Add Chart and AppState interfaces
  - Define Chart interface (tasks, dependencies, metadata)
  - Define AppState for Zustand
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add Chart and AppState interfaces`

#### Phase 1.1.2: Validation Utilities (2 tasks)
- [ ] **Task 1.1.2a:** Create `src/utils/validation.ts` with basic validators
  - `validateTaskName(name: string): ValidationResult`
  - `validateDateString(date: string): ValidationResult`
  - Add unit tests (10 test cases)
  - **Test:** `npm run test:unit -- validation.test.ts`
  - **Commit:** `feat(utils): add basic validation functions`

- [ ] **Task 1.1.2b:** Add task validation function
  - `validateTask(task: Partial<Task>): ValidationResult`
  - Validate all fields, endDate >= startDate
  - Add unit tests (20 test cases)
  - **Test:** All tests passing
  - **Commit:** `feat(utils): add validateTask function`

#### Phase 1.1.3: Zustand Store (3 tasks)
- [ ] **Task 1.1.3a:** Create `src/store/slices/taskSlice.ts` with basic structure
  - Set up Zustand store with immer middleware
  - Add initial state: `{ tasks: [], selectedTaskId: null }`
  - Export useTaskStore hook
  - **Test:** Import in App.tsx, verify no errors
  - **Commit:** `feat(store): initialize task store with Zustand`

- [ ] **Task 1.1.3b:** Add task CRUD operations to store
  - `addTask(taskData)`
  - `updateTask(id, updates)`
  - `deleteTask(id)`
  - Add unit tests (15 test cases)
  - **Test:** All store operations work correctly
  - **Commit:** `feat(store): add task CRUD operations`

- [ ] **Task 1.1.3c:** Add task selection and reordering to store
  - `selectTask(id)`
  - `reorderTasks(fromIndex, toIndex)`
  - Add tests (5 test cases)
  - **Test:** Selection and reordering work
  - **Commit:** `feat(store): add task selection and reordering`

#### Phase 1.1.4: Task Table UI Components (6 tasks)
- [x] **Task 1.1.4a:** Create basic TaskTable container component
  - Create `src/components/TaskList/TaskTable.tsx`
  - Render empty state and header with grid layout
  - Connect to useTaskStore
  - **Test:** Component renders without errors
  - **Commit:** `feat(ui): add TaskTable container component`

- [x] **Task 1.1.4b:** Create TaskTableRow component with grid cells
  - Create `src/components/TaskList/TaskTableRow.tsx`
  - Display task fields in grid columns (drag handle, checkbox, name, dates, duration, progress, color, delete)
  - Add row selection via checkbox
  - **Test:** Renders task data correctly
  - **Commit:** `feat(ui): add TaskTableRow display component`

- [x] **Task 1.1.4c:** Add Cell component with Excel-like editing
  - Create `src/components/TaskList/Cell.tsx`
  - Click to activate, click again or F2 or type to edit
  - Save on Enter/Tab, cancel on Escape
  - Excel-like keyboard navigation (arrows, Tab)
  - **Test:** Inline editing works, validation applied
  - **Commit:** `feat(ui): add Cell component with Excel-like editing`

- [x] **Task 1.1.4d:** Add task creation button
  - Button to add new task in TaskTable header
  - Creates task with default values
  - **Test:** Can add new task
  - **Commit:** `feat(ui): add task creation button`

- [x] **Task 1.1.4e:** Add drag-and-drop reordering with @dnd-kit
  - Install @dnd-kit/core and @dnd-kit/sortable
  - Wrap TaskTable rows with DndContext
  - Enable drag handles on TaskTableRow
  - **Test:** Can reorder tasks via drag-drop
  - **Commit:** `feat(ui): add drag-and-drop task reordering`

- [x] **Task 1.1.4f:** Add delete task functionality
  - Delete button on TaskTableRow (trash icon)
  - Remove from store on click
  - **Test:** Can delete tasks
  - **Commit:** `feat(ui): add task deletion`

---

### Sprint 1.1 Quality Gates

**Before Moving to Sprint 1.1.1:**
- [x] All 14 tasks complete and committed ✅
- [x] 80%+ test coverage for Sprint 1.1 code ✅
- [x] All tests passing ✅
- [x] TypeScript strict mode, zero errors ✅
- [x] ESLint clean, zero warnings ✅
- [x] Can add 10 tasks in < 1 minute ✅
- [x] Manual QA: Create, edit, delete, reorder all work ✅

**Status:** ✅ COMPLETE (2025-12-19)

---

## Sprint 1.1.1: Task Groups & Hierarchical Organization

**Duration:** 2 days
**Goal:** Add hierarchical task organization with collapsible groups.

**Status:** ✅ COMPLETE (2025-12-24)

> **Note:** This sprint was added between Sprint 1.1 and 1.2 to establish hierarchical data structure before timeline rendering. See [SPRINT_1.1.1_TASK_GROUPS.md](../sprints/SPRINT_1.1.1_TASK_GROUPS.md) for detailed implementation plan.

**Key Features:**
- Task groups/phases for organization using SVAR pattern
- Collapsible sections (3 levels deep)
- Nested drag-and-drop with drop zones (BEFORE/INTO/AFTER)
- Summary date auto-calculation
- Visual hierarchy with indentation
- **Key Innovation:** Adopted SVAR pattern - type and hierarchy are independent. Regular tasks CAN have children (manual dates), summaries auto-calculate dates from children.

**Deliverables:** See [SPRINT_1.1.1_TASK_GROUPS.md](../sprints/SPRINT_1.1.1_TASK_GROUPS.md) for complete task breakdown.

---

## Sprint 1.1.2: Hierarchy Indent/Outdent

**Duration:** 2 days
**Goal:** Add UI controls and keyboard shortcuts for hierarchy navigation.

**Status:** ✅ COMPLETE (2025-12-27)

> **Note:** This sprint emerged naturally during Sprint 1.1.1 implementation as a necessary UX enhancement for hierarchy management. See [SPRINT_1.1.2_HIERARCHY_INDENT_OUTDENT.md](../sprints/SPRINT_1.1.2_HIERARCHY_INDENT_OUTDENT.md) for detailed implementation plan.

**Key Features:**
- Indent button (→) - make task child of previous sibling
- Outdent button (←) - make task sibling of parent
- Keyboard shortcuts (Tab/Shift+Tab)
- Multi-selection support for bulk operations
- Smart validation (buttons disabled when invalid)
- Snapshot-based hierarchy operations to prevent cascading bugs

**Technical Work:**
- `indentSelectedTasks()` store action
- `outdentSelectedTasks()` store action
- `canIndentSelection()` validator
- `canOutdentSelection()` validator
- HierarchyButtons component

**Deliverables:** See [SPRINT_1.1.2_HIERARCHY_INDENT_OUTDENT.md](../sprints/SPRINT_1.1.2_HIERARCHY_INDENT_OUTDENT.md) for complete task breakdown.

---

## Sprint 1.2: Timeline & Visualization

**Duration:** 1.5 weeks
**Goal:** Render tasks as bars on an SVG-based Gantt timeline with pan/zoom.

### Deliverables

#### 1.2.1 Date Utilities (2 tasks)

**Files to Create:**
- `src/utils/dateUtils.ts` - Date calculation functions

**Dependencies:** Install `date-fns`

**Functions:**
```typescript
calculateDuration(start: string, end: string): number
addDays(dateStr: string, days: number): string
formatDate(dateStr: string, format: string): string
getDateRange(tasks: Task[]): { min: string, max: string }
isWeekend(dateStr: string): boolean
getBusinessDays(start: string, end: string): number
```

**Implementation Notes:**
- Use `date-fns` for all date operations (not native Date)
- All functions accept/return ISO date strings (YYYY-MM-DD)
- Handle edge cases (weekends, month boundaries)

**Tests:** 30 test cases

**Acceptance Criteria:**
- ✓ All date functions accurate
- ✓ Edge cases handled (leap years, month boundaries)
- ✓ Tests pass

---

#### 1.2.2 Timeline Utilities (3 tasks)

**Files to Create:**
- `src/utils/timelineUtils.ts` - Coordinate mapping

**Functions:**
```typescript
getTimelineScale(minDate: string, maxDate: string, width: number): TimelineScale
dateToPixel(date: string, scale: TimelineScale): number
pixelToDate(x: number, scale: TimelineScale): string
getTaskBarGeometry(task: Task, scale: TimelineScale): { x, y, width, height }
getVisibleDateRange(scale: TimelineScale, scrollX: number, viewportWidth: number)
```

**TimelineScale Interface:**
```typescript
interface TimelineScale {
  minDate: string;
  maxDate: string;
  pixelsPerDay: number;
  totalWidth: number;
}
```

**Key Calculations:**
- `pixelsPerDay = totalWidth / durationInDays`
- `x = (date - minDate) * pixelsPerDay`
- `width = duration * pixelsPerDay`

**Tests:** 33 test cases

**Acceptance Criteria:**
- ✓ Scale calculations accurate
- ✓ Coordinate mapping bijective (reversible)
- ✓ Geometry calculations correct

---

#### 1.2.3 Timeline Components (7 tasks)

**Files to Create:**
- `src/components/GanttChart/ChartCanvas.tsx` - Main SVG container
- `src/components/GanttChart/TimelineHeader.tsx` - Date axis
- `src/components/GanttChart/GridLines.tsx` - Background grid
- `src/components/GanttChart/TaskBar.tsx` - Individual task bar
- `src/hooks/usePanZoom.ts` - Pan/zoom interaction

**SVG Structure:**
```xml
<svg viewBox="..." className="gantt-canvas">
  <TimelineHeader scale={scale} />
  <GridLines scale={scale} />
  <g className="task-bars">
    {tasks.map(task => <TaskBar key={task.id} task={task} scale={scale} />)}
  </g>
  <line className="today-marker" x1={todayX} y1={0} x2={todayX} y2={height} />
</svg>
```

**ChartCanvas Component:**
- Calculate dimensions from tasks (width, height)
- Manage scale state
- Handle pan/zoom interactions
- Render all child components

**TimelineHeader Component:**
- Render date axis (day/week/month labels)
- Adjust label density based on zoom level
- Show different time units at different zooms (from FEATURE_SPECIFICATIONS.md FR-065)

**TaskBar Component:**
- Render SVG rect for task
- Position using `getTaskBarGeometry`
- Style with task color
- Show progress indicator (filled portion)
- Click to select task

**Pan/Zoom Hook:**
- Pan: Mouse drag on background
- Zoom: Mouse wheel (Ctrl+wheel)
- Reset: Ctrl+0 or fit button
- Constrain: Prevent zooming out too far

**Performance Optimization:**
- Use `React.memo` for TaskBar components
- `useMemo` for geometry calculations
- Virtualize if > 100 tasks (only render visible + buffer)

**Acceptance Criteria:**
- ✓ Tasks render as bars on timeline
- ✓ Timeline shows appropriate date range
- ✓ Pan/zoom works smoothly
- ✓ Visual quality matches design
- ✓ Performance: 100 tasks @ 60fps

### Atomic Task Breakdown (12 Tasks)

#### Phase 1.2.1: Date Utilities (2 tasks)
- [ ] **Task 1.2.1a:** Create `src/utils/dateUtils.ts` with basic functions
  - Install date-fns
  - `calculateDuration(start, end): number`
  - `addDays(date, days): string`
  - `formatDate(date, format): string`
  - Add unit tests (20 test cases)
  - **Test:** All date functions work correctly
  - **Commit:** `feat(utils): add date utility functions`

- [ ] **Task 1.2.1b:** Add date range utilities
  - `getDateRange(tasks): { min, max }`
  - `isWeekend(date): boolean`
  - `getBusinessDays(start, end): number`
  - Add tests (10 test cases)
  - **Test:** Range calculations correct
  - **Commit:** `feat(utils): add date range utilities`

#### Phase 1.2.2: Timeline Utilities (3 tasks)
- [ ] **Task 1.2.2a:** Create `src/utils/timelineUtils.ts` with scale calculation
  - `getTimelineScale(minDate, maxDate, width)`
  - Returns scale with pixels per day
  - Add tests (8 test cases)
  - **Test:** Scale calculations accurate
  - **Commit:** `feat(utils): add timeline scale calculation`

- [ ] **Task 1.2.2b:** Add coordinate mapping functions
  - `dateToPixel(date, scale): number`
  - `pixelToDate(x, scale): string`
  - Add tests (15 test cases)
  - **Test:** Coordinate mapping bijective
  - **Commit:** `feat(utils): add coordinate mapping functions`

- [ ] **Task 1.2.2c:** Add timeline geometry helpers
  - `getTaskBarGeometry(task, scale): { x, y, width, height }`
  - `getVisibleDateRange(scale, scrollX, viewportWidth)`
  - Add tests (10 test cases)
  - **Test:** Geometry calculations correct
  - **Commit:** `feat(utils): add timeline geometry helpers`

#### Phase 1.2.3: Timeline Components (7 tasks)
- [ ] **Task 1.2.3a:** Create basic ChartCanvas component
  - Create `src/components/GanttChart/ChartCanvas.tsx`
  - Render SVG with viewBox
  - Calculate dimensions from tasks
  - **Test:** SVG renders correctly
  - **Commit:** `feat(ui): add ChartCanvas SVG container`

- [ ] **Task 1.2.3b:** Create TimelineHeader component
  - Create `src/components/GanttChart/TimelineHeader.tsx`
  - Render date axis (day/week/month labels)
  - Use timelineUtils for positioning
  - **Test:** Header shows correct dates
  - **Commit:** `feat(ui): add TimelineHeader component`

- [ ] **Task 1.2.3c:** Create GridLines component
  - Create `src/components/GanttChart/GridLines.tsx`
  - Render vertical lines for days
  - Render horizontal lines for task rows
  - **Test:** Grid renders correctly
  - **Commit:** `feat(ui): add GridLines component`

- [ ] **Task 1.2.3d:** Create TaskBar component
  - Create `src/components/GanttChart/TaskBar.tsx`
  - Render SVG rect for task
  - Position using getTaskBarGeometry
  - Style with task color
  - **Test:** Task bars render at correct positions
  - **Commit:** `feat(ui): add TaskBar component`

- [ ] **Task 1.2.3e:** Add today marker line
  - Vertical line at current date
  - Distinct color (red or blue)
  - **Test:** Marker shows at correct position
  - **Commit:** `feat(ui): add today marker to timeline`

- [ ] **Task 1.2.3f:** Create usePanZoom hook
  - Create `src/hooks/usePanZoom.ts`
  - Handle mouse drag for pan
  - Handle wheel for zoom
  - Update scale state
  - **Test:** Pan and zoom work smoothly
  - **Commit:** `feat(hooks): add usePanZoom hook`

- [ ] **Task 1.2.3g:** Integrate pan/zoom with ChartCanvas
  - Apply usePanZoom to ChartCanvas
  - Add zoom reset button (Ctrl+0)
  - Constrain zoom (min/max)
  - **Test:** Pan/zoom functional, no jank
  - **Commit:** `feat(ui): integrate pan and zoom controls`

---

### Sprint 1.2 Quality Gates

**Before Moving to Sprint 1.3:**
- [ ] All 12 tasks complete and committed
- [ ] 80%+ test coverage for Sprint 1.2 code
- [ ] All tests passing
- [ ] 100 tasks render at 60fps
- [ ] Pan/zoom responsive (no jank)
- [ ] TaskList and Timeline in sync (selection, scroll)

---

## Sprint 1.4: Dependencies (Finish-to-Start) **[Moved from 1.3]**

**Duration:** 1.5 weeks
**Goal:** Create FS dependencies with circular detection and auto-date adjustment.

⚠️ **CRITICAL SPRINT** - Most complex, requires extensive testing (50-100 test cases).

> **Note:** This sprint was moved after Sprint 1.3 (File Operations) to prioritize data persistence before complex dependency features.

### Deliverables

#### 1.3.1 Graph Algorithms (5 tasks - HIGHEST PRIORITY)

**Files to Create:**
- `src/utils/dependencyUtils.ts` - **CRITICAL: Graph algorithms**

**Functions:**
```typescript
// DFS algorithm, O(V+E) complexity
detectCircularDependency(
  deps: Dependency[],
  newDep: Dependency
): boolean

// Kahn's algorithm for ordering
topologicalSort(
  tasks: Task[],
  deps: Dependency[]
): Task[]

// Get all downstream tasks
getTaskChain(taskId: string, deps: Dependency[]): Task[]
getUpstreamTasks(taskId: string, deps: Dependency[]): Task[]
getDownstreamTasks(taskId: string, deps: Dependency[]): Task[]
```

**Implementation Notes:**

**Circular Detection (DFS):**
```typescript
function detectCircularDependency(deps: Dependency[], newDep: Dependency): boolean {
  const graph = buildAdjacencyList([...deps, newDep]);
  const visited = new Set<string>();
  const stack = new Set<string>();

  function dfs(node: string): boolean {
    if (stack.has(node)) return true;  // Cycle detected
    if (visited.has(node)) return false;

    visited.add(node);
    stack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (dfs(neighbor)) return true;
    }

    stack.delete(node);
    return false;
  }

  return dfs(newDep.fromTaskId);
}
```

**Validation Flow** (from FEATURE_SPECIFICATIONS.md Section 3.3):
```typescript
function createDependency(fromId: string, toId: string) {
  // 1. Check self-dependency
  if (fromId === toId) throw new Error("Self-dependency not allowed");

  // 2. Check circular
  const newDep = { fromTaskId: fromId, toTaskId: toId, type: 'FS' };
  if (detectCircularDependency(deps, newDep)) {
    throw new Error("Circular dependency detected");
  }

  // 3. Create + adjust dates
  addDependency(newDep);
  adjustDependentDates(fromTask, allTasks, deps);
}
```

**Test Cases** (50-100 required):
- Simple chains: A→B, A→B→C→D
- Circular detection: A→B→A, A→B→C→A, A→B→C→D→A
- Diamond patterns: A→B, A→C, B→D, C→D
- Self-dependencies: A→A (reject)
- Reverse dependencies: A→B exists, reject B→A
- Complex scenarios: 10+ tasks with multiple dependency chains

**Acceptance Criteria:**
- ✓ All 50+ tests pass
- ✓ DFS algorithm correct (no false positives/negatives)
- ✓ Topological sort produces valid ordering
- ✓ Performance: O(V+E) complexity maintained

---

#### 1.3.2 Date Adjustment Logic (3 tasks)

**Files to Create:**
- `src/utils/dateAdjustment.ts` - Auto-adjustment algorithm

**Functions:**
```typescript
calculateMinStartDate(task: Task, predecessors: Task[]): string
adjustDependentDates(changedTask: Task, tasks: Task[], deps: Dependency[]): Task[]
```

**Auto-Adjustment Algorithm** (from FEATURE_SPECIFICATIONS.md Section 4.1):
```typescript
function adjustDependentDates(
  changedTask: Task,
  allTasks: Task[],
  deps: Dependency[]
): Task[] {
  // 1. Get topological order
  const sorted = topologicalSort(allTasks, deps);

  // 2. For each task in order
  for (const task of sorted) {
    const predecessors = deps
      .filter(d => d.toTaskId === task.id)
      .map(d => allTasks.find(t => t.id === d.fromTaskId)!);

    // 3. For FS: task.startDate = max(pred.endDate + 1)
    if (predecessors.length > 0) {
      const minStart = max(
        predecessors.map(p => addDays(p.endDate, 1))
      );

      if (task.startDate < minStart) {
        task.startDate = minStart;
        task.endDate = addDays(minStart, task.duration - 1);
      }
    }
  }

  return sorted;
}
```

**Edge Cases:**
- Weekend/holiday skipping (if enabled in settings)
- Manual overrides (user can disable auto-adjust per task)
- Concurrent changes (multiple tasks updated simultaneously)

**Tests:** 40 test cases (chains of 2-5 tasks)

**Acceptance Criteria:**
- ✓ All downstream tasks adjusted correctly
- ✓ No infinite loops
- ✓ Edge cases handled

---

#### 1.3.3 Dependency Store (2 tasks)

**Files to Create:**
- `src/store/slices/dependencySlice.ts` - Dependency CRUD

**Store Structure:**
```typescript
interface DependencyState {
  dependencies: Dependency[];
}

interface DependencyActions {
  addDependency: (dep: Omit<Dependency, 'id'>) => void;
  removeDependency: (id: string) => void;
}
```

**Integration with Task Updates:**
- When task dates change, trigger `adjustDependentDates`
- Update all affected tasks in store
- Emit events for plugins

**Acceptance Criteria:**
- ✓ Can add/remove dependencies
- ✓ Circular check works
- ✓ Auto-adjustment runs on task update

---

#### 1.3.4 Arrow Rendering (4 tasks)

**Files to Create:**
- `src/components/GanttChart/DependencyArrow.tsx` - SVG arrow

**Arrow Path Calculation:**
```typescript
function calculateArrowPath(
  fromTask: Task,
  toTask: Task,
  scale: TimelineScale
): string {
  const from = getTaskBarGeometry(fromTask, scale);
  const to = getTaskBarGeometry(toTask, scale);

  // 3-segment path: horizontal → vertical → horizontal
  const x1 = from.x + from.width;  // Right edge of from task
  const y1 = from.y + from.height / 2;
  const x2 = to.x;  // Left edge of to task
  const y2 = to.y + to.height / 2;

  const midX = (x1 + x2) / 2;

  return `M ${x1},${y1} L ${midX},${y1} L ${midX},${y2} L ${x2},${y2}`;
}
```

**Arrow Component:**
```tsx
<g className="dependency-arrow">
  <path d={path} stroke={color} strokeWidth={2} fill="none" />
  <polygon points={arrowhead} fill={color} />
</g>
```

**Acceptance Criteria:**
- ✓ Arrows render between tasks
- ✓ Paths avoid overlapping task bars
- ✓ Arrowheads visible and pointing correctly

---

#### 1.3.5 Interaction (4 tasks)

**Files to Create:**
- `src/components/GanttChart/ConnectionHandles.tsx` - Drag handles

**Two Methods** (from FEATURE_SPECIFICATIONS.md Section 3.2):

1. **Alt+Drag:**
   - Click task A
   - Hold Alt key
   - Drag to task B
   - Release to create dependency

2. **Connection Handles:**
   - Hover task → show handles (left and right edges)
   - Drag from right handle → preview arrow
   - Drop on another task → create dependency

**Validation on Creation:**
- Check circular before creating
- Show error toast if circular detected
- Show error toast if self-dependency

**Acceptance Criteria:**
- ✓ Both methods work
- ✓ Preview arrow shows during drag
- ✓ Invalid dependencies rejected with error message

### Atomic Task Breakdown (18 Tasks)

⚠️ **CRITICAL SPRINT** - Most complex, requires extensive testing

#### Phase 1.3.1: Graph Algorithms (5 tasks - HIGHEST PRIORITY)
- [ ] **Task 1.3.1a:** Create basic dependency types
  - Create `src/types/dependency.types.ts`
  - Define Dependency interface
  - Define DependencyType enum (FS only for MVP)
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add Dependency types`

- [ ] **Task 1.3.1b:** Implement circular dependency detection (DFS)
  - Create `src/utils/dependencyUtils.ts`
  - `detectCircularDependency(deps, newDep): boolean`
  - DFS algorithm implementation
  - Add 25 unit tests (simple cycles)
  - **Test:** All simple cycle tests pass
  - **Commit:** `feat(utils): add circular dependency detection (DFS)`

- [ ] **Task 1.3.1c:** Add complex circular dependency test cases
  - Add 25 more tests (complex cycles, diamond patterns)
  - Test A→B→C→A, A→B→C→D→A patterns
  - Test self-dependencies (A→A)
  - **Test:** All 50 tests pass
  - **Commit:** `test(utils): add complex circular dependency tests`

- [ ] **Task 1.3.1d:** Implement topological sort
  - `topologicalSort(tasks, deps): Task[]`
  - Kahn's algorithm implementation
  - Add 15 unit tests
  - **Test:** Topological ordering correct
  - **Commit:** `feat(utils): add topological sort (Kahn's algorithm)`

- [ ] **Task 1.3.1e:** Add dependency chain utilities
  - `getTaskChain(taskId, deps): Task[]`
  - `getUpstreamTasks(taskId, deps): Task[]`
  - `getDownstreamTasks(taskId, deps): Task[]`
  - Add 10 tests
  - **Test:** Chain traversal correct
  - **Commit:** `feat(utils): add dependency chain utilities`

#### Phase 1.3.2: Date Adjustment Logic (3 tasks)
- [ ] **Task 1.3.2a:** Create date adjustment utilities
  - Create `src/utils/dateAdjustment.ts`
  - `calculateMinStartDate(task, predecessors): string`
  - For FS: max(pred.endDate + 1)
  - Add 10 tests
  - **Test:** Min start date calculated correctly
  - **Commit:** `feat(utils): add date adjustment utilities`

- [ ] **Task 1.3.2b:** Implement auto-adjustment algorithm
  - `adjustDependentDates(changedTask, tasks, deps): Task[]`
  - Use topological sort for correct order
  - Adjust all downstream tasks
  - Add 20 tests (chains of 2-5 tasks)
  - **Test:** All downstream tasks adjusted correctly
  - **Commit:** `feat(utils): add auto-adjustment algorithm`

- [ ] **Task 1.3.2c:** Add edge case handling for auto-adjustment
  - Handle weekend/holiday skipping (if enabled)
  - Handle manual overrides (user can disable auto-adjust per task)
  - Add 10 edge case tests
  - **Test:** Edge cases handled gracefully
  - **Commit:** `feat(utils): handle auto-adjustment edge cases`

#### Phase 1.3.3: Dependency Store (2 tasks)
- [ ] **Task 1.3.3a:** Create dependency store slice
  - Create `src/store/slices/dependencySlice.ts`
  - Add state: `{ dependencies: [] }`
  - Add actions: `addDependency, removeDependency`
  - Integrate with detectCircularDependency
  - **Test:** Can add/remove dependencies, circular check works
  - **Commit:** `feat(store): add dependency store slice`

- [ ] **Task 1.3.3b:** Integrate auto-adjustment with task updates
  - When task dates change, trigger adjustDependentDates
  - Update all affected tasks in store
  - Add integration tests (8 test cases)
  - **Test:** Auto-adjustment runs on task update
  - **Commit:** `feat(store): integrate auto-adjustment with task updates`

#### Phase 1.3.4: Arrow Rendering (4 tasks)
- [ ] **Task 1.3.4a:** Create basic DependencyArrow component
  - Create `src/components/GanttChart/DependencyArrow.tsx`
  - Render simple SVG line from task A to task B
  - **Test:** Line renders between tasks
  - **Commit:** `feat(ui): add basic DependencyArrow component`

- [ ] **Task 1.3.4b:** Implement arrow path calculation
  - `calculateArrowPath(fromTask, toTask, scale): string`
  - 3-segment path: horizontal → vertical → horizontal
  - Avoid overlapping task bars
  - Add tests (10 test cases)
  - **Test:** Paths calculated correctly
  - **Commit:** `feat(ui): add arrow path calculation`

- [ ] **Task 1.3.4c:** Add arrowhead to dependency arrows
  - Render filled triangle at end of arrow
  - SVG polygon or marker
  - **Test:** Arrowheads visible and pointing correctly
  - **Commit:** `feat(ui): add arrowheads to dependency arrows`

- [ ] **Task 1.3.4d:** Style arrows and add hover states
  - Different colors for different states (normal, selected, invalid)
  - Highlight on hover
  - Show tooltip with dependency info
  - **Test:** Styling and hover work
  - **Commit:** `feat(ui): style dependency arrows with hover states`

#### Phase 1.3.5: Interaction (4 tasks)
- [ ] **Task 1.3.5a:** Add connection handles to TaskBar
  - Create `src/components/GanttChart/ConnectionHandles.tsx`
  - Show handles on hover (left and right edges)
  - Style as small circles
  - **Test:** Handles appear on hover
  - **Commit:** `feat(ui): add connection handles to task bars`

- [ ] **Task 1.3.5b:** Implement drag from connection handle
  - Start drag on mousedown on handle
  - Show preview line during drag
  - End drag on mouseup over another task
  - **Test:** Drag creates preview line
  - **Commit:** `feat(ui): implement connection handle drag`

- [ ] **Task 1.3.5c:** Implement Alt+Drag dependency creation
  - Detect Alt key + drag from task
  - Show preview arrow during drag
  - Create dependency on drop
  - **Test:** Alt+drag creates dependencies
  - **Commit:** `feat(ui): add Alt+drag dependency creation`

- [ ] **Task 1.3.5d:** Add dependency validation on creation
  - Check circular before creating
  - Show error toast if circular detected
  - Show error toast if self-dependency
  - **Test:** Invalid dependencies rejected with error message
  - **Commit:** `feat(ui): add dependency validation on creation`

---

### Sprint 1.3 Quality Gates

**Before Moving to Sprint 1.4:**
- [ ] All 18 tasks complete and committed
- [ ] 100% test coverage for dependency logic (50-100 tests)
- [ ] All tests passing
- [ ] Circular detection works (no false positives/negatives)
- [ ] Auto-adjustment updates all downstream tasks
- [ ] Performance: 100 tasks with 50 deps @ 60fps

---

## Sprint 1.3: File Operations ✅ COMPLETE

**Duration:** 1 week
**Status:** ✅ COMPLETE (2026-01-03)
**Goal:** Save/load charts as .ownchart files with 6-layer validation.

> **Note:** This sprint was completed with comprehensive security validation, browser compatibility, and 112 automated tests achieving 90%+ coverage.

### Deliverables

#### 1.4.1 File Format & Types (2 tasks)

**Files to Create:**
- `src/types/file.types.ts` - GanttFile interface

**File Format** (from DATA_MODEL.md Section 4.1):
```json
{
  "fileVersion": "1.0.0",
  "appVersion": "1.0.0",
  "chart": {
    "id": "uuid",
    "name": "Project Name",
    "tasks": [...],
    "dependencies": [...],
    "metadata": {}
  },
  "history": {
    "entries": [],
    "maxEntries": 1000,
    "snapshots": []
  },
  "metadata": {
    "created": "2025-12-13T10:00:00Z",
    "modified": "2025-12-13T15:30:00Z"
  }
}
```

**File Extension:** `.ownchart.json`

**Versioning:** Semantic versioning for schema changes

**Acceptance Criteria:**
- ✓ Types align with DATA_MODEL.md
- ✓ File format documented

---

#### 1.4.2 Validation Service (4 tasks)

**Files to Create:**
- `src/services/validationService.ts` - 6-layer validation

**6-Layer Validation Pipeline** (from TECHNICAL_ARCHITECTURE.md Section 8.2):

**Layer 1: Pre-parse validation**
- File size < 50MB
- Extension is `.ownchart` or `.ownchart.json`
- MIME type check

**Layer 2: Safe JSON parsing**
- Wrap in try-catch
- Reject if contains `__proto__`, `constructor`, `prototype` keys
- Use `JSON.parse` with reviver to sanitize

**Layer 3: Structure validation**
- Required fields present: fileVersion, chart, tasks, dependencies
- Arrays are valid arrays
- UUIDs are valid UUIDs

**Layer 4: Semantic validation**
- No circular dependencies (run `detectCircularDependency`)
- All dependency task IDs exist in tasks array
- Dates are valid ISO strings
- endDate >= startDate for all tasks

**Layer 5: String sanitization**
- Use DOMPurify to strip HTML from task names
- Sanitize user-entered strings
- Prevent XSS attacks

**Layer 6: Version compatibility**
- Check major version match (1.x.x compatible with 1.y.y)
- Run migrations if minor version differs
- Reject if major version incompatible

**Tests:** 45 test cases (10+15+10+20)

**Acceptance Criteria:**
- ✓ All layers work correctly
- ✓ Valid files pass
- ✓ Invalid files rejected with clear error
- ✓ Security vulnerabilities prevented

---

#### 1.4.3 File Service (2 tasks)

**Files to Create:**
- `src/services/fileService.ts` - Save/load logic

**Save Flow:**
```typescript
async function saveChart() {
  const fileData: GanttFile = {
    fileVersion: "1.0.0",
    appVersion: packageJson.version,
    chart: serializeChart(store.getState()),
    history: serializeHistory(historyStore.getState()),
    metadata: {
      created,
      modified: new Date().toISOString()
    }
  };

  const blob = new Blob([JSON.stringify(fileData, null, 2)], {
    type: 'application/json'
  });

  const url = URL.createObjectURL(blob);
  downloadFile(url, `${chart.name}.ownchart.json`);
}
```

**Load Flow:**
```typescript
async function loadChart(file: File) {
  // 1-6: Validation pipeline
  const validated = await validate6Layers(file);

  // 7. Load into state
  store.setState({ tasks: validated.chart.tasks, ... });
  historyStore.clear();

  // 8. Mark as saved
  setUnsavedChanges(false);
}
```

**Acceptance Criteria:**
- ✓ Can save chart as .ownchart.json
- ✓ Can load valid files
- ✓ Rejects invalid files
- ✓ Zero data loss in save/load cycle

---

#### 1.4.4 File Menu UI (2 tasks)

**Files to Create:**
- `src/components/FileMenu/FileMenu.tsx` - New/Open/Save buttons
- `src/components/FileMenu/UnsavedChangesDialog.tsx` - Warning dialog

**Unsaved Changes Dialog:**
```
Unsaved Changes

You have unsaved changes. What would you like to do?

[Cancel]  [Don't Save]  [Save]
```

**Acceptance Criteria:**
- ✓ Buttons trigger file operations
- ✓ Dialog shows when appropriate
- ✓ Dirty state tracked correctly

### Atomic Task Breakdown (10 Tasks)

#### Phase 1.4.1: File Format & Types (2 tasks)
- [ ] **Task 1.4.1a:** Create file format types
  - Create `src/types/file.types.ts`
  - Define GanttFile interface (fileVersion, chart, history, metadata)
  - Add FileMetadata interface
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add file format types`

- [ ] **Task 1.4.1b:** Add validation error types
  - Define ValidationError interface
  - Define ValidationResult type
  - Add error codes enum
  - **Test:** Types compile
  - **Commit:** `feat(types): add validation error types`

#### Phase 1.4.2: Validation Service (4 tasks)
- [ ] **Task 1.4.2a:** Create validation service with layer 1-2
  - Create `src/services/validationService.ts`
  - Layer 1: Pre-parse (size, extension)
  - Layer 2: Safe JSON parse (prevent prototype pollution)
  - Add tests (10 test cases)
  - **Test:** Layers 1-2 work correctly
  - **Commit:** `feat(services): add file validation layers 1-2`

- [ ] **Task 1.4.2b:** Add validation layers 3-4
  - Layer 3: Structure validation (required fields)
  - Layer 4: Semantic validation (circular deps, valid refs)
  - Add tests (15 test cases)
  - **Test:** Layers 3-4 work correctly
  - **Commit:** `feat(services): add file validation layers 3-4`

- [ ] **Task 1.4.2c:** Add validation layers 5-6
  - Layer 5: String sanitization (DOMPurify)
  - Layer 6: Version compatibility
  - Add tests (10 test cases)
  - **Test:** Layers 5-6 work correctly
  - **Commit:** `feat(services): add file validation layers 5-6`

- [ ] **Task 1.4.2d:** Add integration tests for full validation pipeline
  - Test valid files (should pass)
  - Test corrupted files (should fail at correct layer)
  - Test XSS attempts (should sanitize)
  - Add 20 integration tests
  - **Test:** All validation tests pass
  - **Commit:** `test(services): add validation pipeline integration tests`

#### Phase 1.4.3: File Service (2 tasks)
- [ ] **Task 1.4.3a:** Create file service with save functionality
  - Create `src/services/fileService.ts`
  - `saveChart(chart): void` - serialize and download
  - Use Blob API for download
  - Add tests (5 test cases)
  - **Test:** Can save chart as .ownchart.json
  - **Commit:** `feat(services): add chart save functionality`

- [ ] **Task 1.4.3b:** Add load functionality to file service
  - `loadChart(file): Promise<GanttFile>` - validate and parse
  - Use 6-layer validation
  - Add tests (10 test cases)
  - **Test:** Can load valid files, rejects invalid files
  - **Commit:** `feat(services): add chart load functionality`

#### Phase 1.4.4: File Menu UI (2 tasks)
- [ ] **Task 1.4.4a:** Create FileMenu component
  - Create `src/components/FileMenu/FileMenu.tsx`
  - New, Open, Save buttons
  - File input for Open
  - Integrate with fileService
  - **Test:** Buttons trigger file operations
  - **Commit:** `feat(ui): add FileMenu component`

- [ ] **Task 1.4.4b:** Add unsaved changes dialog
  - Create `src/components/FileMenu/UnsavedChangesDialog.tsx`
  - Prompt before New/Open if unsaved changes
  - Save, Don't Save, Cancel options
  - Track dirty state in store
  - **Test:** Dialog shows when appropriate
  - **Commit:** `feat(ui): add unsaved changes dialog`

---

### Sprint 1.3 Quality Gates

**Before Moving to Sprint 1.4:**
- [x] All 10 tasks complete and committed ✅
- [x] 80%+ test coverage ✅ (90%+ achieved with 112 tests)
- [x] Save/load cycle preserves all data ✅ (round-trip tests passing)
- [x] Invalid files rejected gracefully ✅ (6-layer validation)
- [x] Unsaved changes prompt works ✅ (beforeunload + dialogs)

---

## Sprint 1.5: Basic Undo/Redo

**Duration:** 1 week
**Goal:** Implement command pattern for undo/redo with auto-recording.

### Deliverables

#### 1.5.1 Command Types & Pattern (3 tasks)

**Files to Create:**
- `src/types/command.types.ts` - Command interface
- `src/commands/BaseCommand.ts` - Abstract base class
- `src/commands/commandFactory.ts` - Command creation

**Command Pattern:**
```typescript
interface Command {
  type: string;
  execute(): void;
  undo(): void;
  redo(): void;
  canMerge(other: Command): boolean;
  merge(other: Command): Command;
  description: string;
}
```

**Acceptance Criteria:**
- ✓ Command interface defined
- ✓ Base class works
- ✓ Factory creates commands

---

#### 1.5.2 Task Commands (3 tasks)

**Files to Create:**
- `src/commands/taskCommands.ts` - AddTaskCommand, UpdateTaskCommand, DeleteTaskCommand

**Example - AddTaskCommand:**
```typescript
class AddTaskCommand implements Command {
  type = 'ADD_TASK';

  constructor(private task: Task) {}

  execute() {
    taskStore.addTaskDirect(this.task);
  }

  undo() {
    taskStore.deleteTaskDirect(this.task.id);
  }

  redo() {
    this.execute();
  }

  canMerge() { return false; }

  get description() {
    return `Add task: ${this.task.name}`;
  }
}
```

**UpdateTaskCommand with Merging:**
```typescript
class UpdateTaskCommand implements Command {
  canMerge(other: Command): boolean {
    return (
      other.type === 'UPDATE_TASK' &&
      other.taskId === this.taskId &&
      Date.now() - this.timestamp < 2000  // Within 2 seconds
    );
  }

  merge(other: UpdateTaskCommand): Command {
    return new UpdateTaskCommand({
      taskId: this.taskId,
      oldData: this.oldData,       // Keep original
      newData: other.newData,      // Use latest
      timestamp: other.timestamp
    });
  }
}
```

**Acceptance Criteria:**
- ✓ Can undo/redo task creation
- ✓ Can undo/redo task updates
- ✓ Can undo/redo task deletion
- ✓ Merging works for consecutive updates

---

#### 1.5.3 Dependency Commands (2 tasks)

**Files to Create:**
- `src/commands/dependencyCommands.ts` - AddDependencyCommand, RemoveDependencyCommand

**Acceptance Criteria:**
- ✓ Can undo/redo dependency creation
- ✓ Can undo/redo dependency removal

---

#### 1.5.4 History Store (3 tasks)

**Files to Create:**
- `src/store/slices/historySlice.ts` - History state

**History State:**
```typescript
interface HistoryState {
  past: Command[];       // Executed commands
  future: Command[];     // Undone commands
  snapshots: Array<{    // Every 50 commands
    index: number;
    state: AppState;
  }>;
  maxEntries: number;    // 1000 (configurable)
}
```

**Snapshot System:**
- Create snapshot every 50 commands
- Prune history at 1000 entries
- Merge consecutive commands (via canMerge)

**Acceptance Criteria:**
- ✓ Store holds commands correctly
- ✓ Snapshots created and restored correctly
- ✓ Pruning and merging work

---

#### 1.5.5 Integration & UI (2 tasks)

**Refactor All Actions:**

Before (direct mutation):
```typescript
function addTask(data: TaskData) {
  const task = { id: uuid(), ...data };
  setState(state => ({ tasks: [...state.tasks, task] }));
}
```

After (command pattern):
```typescript
function addTask(data: TaskData) {
  const command = new AddTaskCommand({ id: uuid(), ...data });
  executeCommand(command);
}

function executeCommand(command: Command) {
  command.execute();
  historyStore.push(command);

  // Create snapshot every 50 commands
  if (historyStore.past.length % 50 === 0) {
    historyStore.createSnapshot(store.getState());
  }
}
```

**UI:**
- Create `src/components/Toolbar/UndoRedoButtons.tsx`
- Undo/Redo buttons with disabled states
- Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- Show toast on undo/redo

**Acceptance Criteria:**
- ✓ All actions use commands
- ✓ Buttons and shortcuts work
- ✓ Toast shows action description

### Atomic Task Breakdown (13 Tasks)

#### Phase 1.5.1: Command Types & Pattern (3 tasks)
- [ ] **Task 1.5.1a:** Create command interface and types
  - Create `src/types/command.types.ts`
  - Define Command interface (execute, undo, redo)
  - Add CommandType enum
  - **Test:** Types compile
  - **Commit:** `feat(types): add command pattern types`

- [ ] **Task 1.5.1b:** Create base command class
  - Create `src/commands/BaseCommand.ts`
  - Abstract base with common functionality
  - Implement canMerge/merge logic
  - **Test:** Base class works
  - **Commit:** `feat(commands): add BaseCommand abstract class`

- [ ] **Task 1.5.1c:** Create command factory
  - Create `src/commands/commandFactory.ts`
  - Factory function to create commands
  - Type-safe command creation
  - **Test:** Factory creates correct command types
  - **Commit:** `feat(commands): add command factory`

#### Phase 1.5.2: Task Commands (3 tasks)
- [ ] **Task 1.5.2a:** Implement AddTaskCommand
  - Create `src/commands/taskCommands.ts`
  - AddTaskCommand with execute/undo/redo
  - Add tests (8 test cases)
  - **Test:** Can undo/redo task creation
  - **Commit:** `feat(commands): add AddTaskCommand`

- [ ] **Task 1.5.2b:** Implement UpdateTaskCommand
  - UpdateTaskCommand with execute/undo/redo
  - Implement merge logic (consecutive updates)
  - Add tests (12 test cases)
  - **Test:** Can undo/redo task updates, merging works
  - **Commit:** `feat(commands): add UpdateTaskCommand with merging`

- [ ] **Task 1.5.2c:** Implement DeleteTaskCommand
  - DeleteTaskCommand with execute/undo/redo
  - Handle cascade delete (dependencies)
  - Add tests (10 test cases)
  - **Test:** Can undo/redo task deletion
  - **Commit:** `feat(commands): add DeleteTaskCommand`

#### Phase 1.5.3: Dependency Commands (2 tasks)
- [ ] **Task 1.5.3a:** Implement AddDependencyCommand
  - Create `src/commands/dependencyCommands.ts`
  - AddDependencyCommand with execute/undo/redo
  - Add tests (8 test cases)
  - **Test:** Can undo/redo dependency creation
  - **Commit:** `feat(commands): add AddDependencyCommand`

- [ ] **Task 1.5.3b:** Implement RemoveDependencyCommand
  - RemoveDependencyCommand with execute/undo/redo
  - Add tests (6 test cases)
  - **Test:** Can undo/redo dependency removal
  - **Commit:** `feat(commands): add RemoveDependencyCommand`

#### Phase 1.5.4: History Store (3 tasks)
- [ ] **Task 1.5.4a:** Create history store with state
  - Create `src/store/slices/historySlice.ts`
  - State: past[], future[], snapshots[]
  - Basic actions: push, undo, redo
  - **Test:** Store holds commands correctly
  - **Commit:** `feat(store): add history store`

- [ ] **Task 1.5.4b:** Add snapshot system to history store
  - Create snapshot every 50 commands
  - `createSnapshot(state)`, `restoreFromSnapshot(index)`
  - Add tests (5 test cases)
  - **Test:** Snapshots created and restored correctly
  - **Commit:** `feat(store): add snapshot system to history`

- [ ] **Task 1.5.4c:** Add history pruning and merging
  - Prune history at 1000 entries
  - Merge consecutive commands (via canMerge)
  - Add tests (8 test cases)
  - **Test:** Pruning and merging work correctly
  - **Commit:** `feat(store): add history pruning and command merging`

#### Phase 1.5.5: Integration & UI (2 tasks)
- [ ] **Task 1.5.5a:** Refactor all actions to use commands
  - Update taskSlice to execute commands instead of direct mutations
  - Add `executeCommand(cmd)` to history store
  - Refactor addTask, updateTask, deleteTask
  - **Test:** All actions still work, now recordable
  - **Commit:** `refactor(store): integrate command pattern with all actions`

- [ ] **Task 1.5.5b:** Add UndoRedoButtons to Toolbar
  - Create `src/components/Toolbar/UndoRedoButtons.tsx`
  - Undo/Redo buttons with disabled states
  - Keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - Show toast on undo/redo
  - **Test:** Buttons and shortcuts work
  - **Commit:** `feat(ui): add undo/redo buttons and keyboard shortcuts`

---

### Sprint 1.5 Quality Gates

**Before Moving to Sprint 1.6:**
- [ ] All 13 tasks complete and committed
- [ ] 80%+ test coverage
- [ ] Undo/redo works for all operations
- [ ] Can undo/redo 100+ changes
- [ ] Memory efficient (snapshots + pruning)

---

## Sprint 1.6: PNG Export & Polish

**Duration:** 1.5 weeks
**Goal:** Export to PNG, add keyboard shortcuts, help system, and welcome tour.

### Deliverables

#### 1.6.1 Export Service (4 tasks)

**Files to Create:**
- `src/services/exportService.ts` - Manual canvas rendering

**PNG Export Strategy** (from TECHNICAL_ARCHITECTURE.md Section 5.5):

```typescript
async function exportToPNG(options: ExportOptions): Promise<Blob> {
  const { dpi = 2, includeTaskList = true, backgroundColor = '#ffffff' } = options;

  // 1. Calculate dimensions
  const width = calculateChartWidth(tasks);
  const height = tasks.length * ROW_HEIGHT + HEADER_HEIGHT;

  // 2. Create offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = width * dpi;
  canvas.height = height * dpi;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(dpi, dpi);

  // 3. Render components
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  renderTimelineHeader(ctx, scale);
  renderGridLines(ctx, scale);
  renderTaskBars(ctx, tasks, scale);
  renderDependencyArrows(ctx, dependencies, tasks, scale);

  if (includeTaskList) {
    renderTaskList(ctx, tasks);
  }

  // 4. Convert to blob
  return new Promise(resolve => {
    canvas.toBlob(blob => resolve(blob!), 'image/png');
  });
}
```

**Export Options:**
- DPI: 1 (standard 96 DPI), 2 (retina 192 DPI), 3.125 (print 300 DPI)
- Include task list: Yes/No
- Background color: White (default), Transparent, Custom

**Acceptance Criteria:**
- ✓ PNG export produces high-quality images
- ✓ Export options work
- ✓ Preview matches exported PNG

---

#### 1.6.2 Export Dialog (2 tasks)

**Files to Create:**
- `src/components/ExportDialog/ExportDialog.tsx` - Settings modal
- `src/components/ExportDialog/ExportPreview.tsx` - Preview component

**Acceptance Criteria:**
- ✓ Dialog shows with all options
- ✓ Preview updates on settings change

---

#### 1.6.3 Keyboard Shortcuts (2 tasks)

**Files to Create:**
- `src/constants/shortcuts.ts` - All shortcuts
- `src/hooks/useKeyboardShortcuts.ts` - Global shortcuts hook

**Shortcuts** (from FEATURE_SPECIFICATIONS.md and claude.md):
- Ctrl+N: New chart
- Ctrl+O: Open
- Ctrl+S: Save
- Ctrl+Z/Shift+Z: Undo/Redo
- Ctrl+Plus/Minus/0: Zoom in/out/reset
- F2: Edit task
- Delete: Delete task
- ?: Show help
- Ctrl+Shift+E: Export

**Acceptance Criteria:**
- ✓ All shortcuts work
- ✓ Platform-specific (Ctrl/Cmd)

---

#### 1.6.4 Help & Tour (3 tasks)

**Files to Create:**
- `src/components/HelpPanel/HelpPanel.tsx` - Help modal with tabs
- `src/components/WelcomeTour/WelcomeTour.tsx` - Tour container

**Help Panel:**
- 2 tabs: Getting Started, Keyboard Shortcuts
- Accessible via `?` key
- Clear, concise instructions

**Welcome Tour:**
- Show on first visit (`localStorage.getItem('tour-completed')`)
- 4 steps: Task List → Timeline → Toolbar → Help
- Skip/Dismiss buttons
- Mark as completed in localStorage

**Final Polish:**
- Loading states for async operations
- Toast notifications for all actions
- Error boundaries
- Focus management
- ARIA labels

**Acceptance Criteria:**
- ✓ Help panel opens and displays content
- ✓ Tour shows on first visit
- ✓ All polish items working

### Atomic Task Breakdown (11 Tasks)

#### Phase 1.6.1: Export Service (4 tasks)
- [ ] **Task 1.6.1a:** Create export service with canvas setup
  - Create `src/services/exportService.ts`
  - `createExportCanvas(width, height, dpi): HTMLCanvasElement`
  - Basic canvas rendering
  - **Test:** Canvas created correctly
  - **Commit:** `feat(services): add export canvas setup`

- [ ] **Task 1.6.1b:** Implement timeline rendering on canvas
  - `renderTimelineHeader(ctx, scale)`
  - `renderGridLines(ctx, scale)`
  - Add tests (manual visual verification)
  - **Test:** Timeline renders on canvas
  - **Commit:** `feat(services): add timeline rendering to canvas`

- [ ] **Task 1.6.1c:** Implement task bar rendering on canvas
  - `renderTaskBars(ctx, tasks, scale)`
  - Match visual style of SVG timeline
  - **Test:** Task bars render correctly
  - **Commit:** `feat(services): add task bar rendering to canvas`

- [ ] **Task 1.6.1d:** Implement dependency arrow rendering on canvas
  - `renderDependencyArrows(ctx, deps, tasks, scale)`
  - Match arrow paths from SVG
  - Add arrowheads
  - **Test:** Arrows render correctly on canvas
  - **Commit:** `feat(services): add dependency arrow rendering to canvas`

#### Phase 1.6.2: Export Dialog (2 tasks)
- [ ] **Task 1.6.2a:** Create ExportDialog component
  - Create `src/components/ExportDialog/ExportDialog.tsx`
  - Settings: DPI, include task list, background color
  - Export button
  - **Test:** Dialog shows with all options
  - **Commit:** `feat(ui): add ExportDialog component`

- [ ] **Task 1.6.2b:** Add export preview
  - Create `src/components/ExportDialog/ExportPreview.tsx`
  - Show preview of export before download
  - Update on settings change
  - **Test:** Preview matches exported PNG
  - **Commit:** `feat(ui): add export preview`

#### Phase 1.6.3: Keyboard Shortcuts (2 tasks)
- [ ] **Task 1.6.3a:** Create keyboard shortcuts system
  - Create `src/constants/shortcuts.ts`
  - Define all shortcuts (file, edit, view, help)
  - Create `src/hooks/useKeyboardShortcuts.ts`
  - **Test:** Hook detects key combinations correctly
  - **Commit:** `feat(hooks): add keyboard shortcuts system`

- [ ] **Task 1.6.3b:** Integrate shortcuts with all actions
  - Connect shortcuts to file operations (Ctrl+N/O/S)
  - Connect to edit operations (Ctrl+Z, Delete, F2)
  - Connect to view operations (Ctrl+Plus/Minus/0)
  - **Test:** All shortcuts work
  - **Commit:** `feat(ui): integrate keyboard shortcuts with actions`

#### Phase 1.6.4: Help & Tour (3 tasks)
- [ ] **Task 1.6.4a:** Create HelpPanel component
  - Create `src/components/HelpPanel/HelpPanel.tsx`
  - 2 tabs: Getting Started, Keyboard Shortcuts
  - Accessible via ? key
  - **Test:** Help panel opens and displays content
  - **Commit:** `feat(ui): add HelpPanel component`

- [ ] **Task 1.6.4b:** Create WelcomeTour component
  - Create `src/components/WelcomeTour/WelcomeTour.tsx`
  - 4 steps with tooltips (Task List → Timeline → Toolbar → Help)
  - Show on first visit (localStorage check)
  - Skip/Dismiss buttons
  - **Test:** Tour shows on first visit, can skip
  - **Commit:** `feat(ui): add WelcomeTour component`

- [ ] **Task 1.6.4c:** Add final polish
  - Loading states for async operations
  - Toast notifications for all actions
  - Error boundaries
  - Focus management
  - ARIA labels
  - **Test:** All polish items working
  - **Commit:** `feat(ui): add final polish and accessibility`

---

### Sprint 1.6 Quality Gates

**Before Release:**
- [ ] All 11 tasks complete and committed
- [ ] PNG export works
- [ ] All shortcuts work
- [ ] Help system complete
- [ ] Welcome tour functional
- [ ] Polish complete

---

## Integration & Testing Buffer (Week 8-9)

### Integration Verification

**Cross-Feature Integration:**
1. TaskList ↔ Timeline Sync
2. Dependencies ↔ Auto-Adjustment
3. Undo/Redo ↔ All Operations
4. File Save/Load ↔ All Data

### Performance Validation

**Benchmark Tests:**
- 100 tasks, 50 dependencies → 60fps
- 500 tasks, 200 dependencies → 30fps minimum
- Memory leak test: create/delete 1000 tasks → no memory growth

### Quality Gates (All Must Pass)

**Code Quality:**
- [ ] Zero TypeScript errors (strict mode)
- [ ] Zero ESLint errors/warnings
- [ ] All files formatted with Prettier
- [ ] No console.log in production build

**Testing:**
- [ ] 70%+ overall test coverage
- [ ] All tests passing (0 failures)
- [ ] No flaky tests

**Performance:**
- [ ] 100 tasks @ 60fps
- [ ] 500 tasks @ 30fps minimum
- [ ] Initial load < 2 seconds
- [ ] Bundle size < 500KB (gzipped)

**Accessibility:**
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation works
- [ ] Screen reader tested
- [ ] Focus indicators visible
- [ ] Color contrast ≥ 4.5:1 (text), ≥ 3:1 (UI)

**Security:**
- [ ] XSS prevention verified
- [ ] Prototype pollution prevented
- [ ] File upload size limits enforced
- [ ] User input sanitized (DOMPurify)

---

## Atomic Task Breakdown (78 Tasks)

All atomic tasks are embedded within each sprint section above. Summary:

- **Sprint 1.1:** 14 tasks (Task Management)
- **Sprint 1.2:** 12 tasks (Timeline & Visualization)
- **Sprint 1.3:** 18 tasks (Dependencies) ⚠️ **CRITICAL SPRINT**
- **Sprint 1.4:** 10 tasks (File Operations)
- **Sprint 1.5:** 13 tasks (Undo/Redo)
- **Sprint 1.6:** 11 tasks (Export & Polish)

Each task:
- Takes 1-3 hours
- Has clear test criterion
- Results in one atomic git commit
- Has conventional commit message format
- Located in the "Atomic Task Breakdown" section of each sprint

---

## Progress Tracking

### Using TodoWrite Tool

During implementation, use the TodoWrite tool to track active sprint progress:

```typescript
// Example: Starting Sprint 1.1
TodoWrite({
  todos: [
    { content: "Create Task interface", status: "in_progress", activeForm: "Creating Task interface" },
    { content: "Add Dependency interface", status: "pending", activeForm: "Adding Dependency interface" },
    { content: "Add validation functions", status: "pending", activeForm: "Adding validation functions" },
    // ... more tasks
  ]
});

// After completing first task
TodoWrite({
  todos: [
    { content: "Create Task interface", status: "completed", activeForm: "Creating Task interface" },
    { content: "Add Dependency interface", status: "in_progress", activeForm: "Adding Dependency interface" },
    // ... rest
  ]
});
```

**Important:**
- Exactly ONE task must be `in_progress` at any time
- Mark tasks `completed` IMMEDIATELY after finishing
- Use clear, actionable task descriptions

### Git Workflow for Atomic Commits

Each task results in one commit:

```bash
# 1. Work on task
# 2. Test
npm run type-check
npm run test:unit

# 3. Commit
git add src/types/chart.types.ts
git commit -m "feat(types): add Task interface definition

- Define Task interface with id, name, dates, duration, color, order
- Add JSDoc comments for all fields
- Export Task type for use in components

Closes #1"
```

### Progress Checklist

Keep checklist in PROJECT_STATUS.md or use GitHub Issues:

**Sprint 1.1 Progress: 3/14 tasks complete (21%)**
- [x] Task 1.1.1a: Create Task interface ✅
- [x] Task 1.1.1b: Add Dependency interface ✅
- [x] Task 1.1.1c: Add Chart interfaces ✅
- [ ] Task 1.1.2a: Create validation.ts
- [ ] ...

---

## Critical Files to Implement First

**Top 10 Files** (foundation for everything):

1. **`src/types/chart.types.ts`** - Task, Dependency, Chart interfaces
2. **`src/store/slices/taskSlice.ts`** - Task CRUD operations
3. **`src/utils/validation.ts`** - validateTask, validateDateRange
4. **`src/utils/dateUtils.ts`** - Date calculations
5. **`src/utils/dependencyUtils.ts`** ⚠️ HIGHEST RISK - Graph algorithms
6. **`src/utils/timelineUtils.ts`** - Coordinate mapping
7. **`src/components/TaskList/TaskTable.tsx`** - Spreadsheet table (first visible feature)
8. **`src/components/GanttChart/ChartCanvas.tsx`** - Core visualization
9. **`src/services/fileService.ts`** - Save/load
10. **`src/store/slices/historySlice.ts`** - Undo/redo state

---

## Risk Management

### High-Risk Areas

**1. Dependency Graph Algorithms (Sprint 1.3)**
- **Risk:** Circular detection bugs, infinite loops
- **Mitigation:** 50-100 unit tests, code review
- **Fallback:** Disable auto-adjustment if too buggy

**2. Performance with 500+ Tasks**
- **Risk:** Rendering too slow
- **Mitigation:** Virtualization from Day 1, benchmarks each sprint
- **Fallback:** Warn users, suggest filtering

**3. File Format Compatibility**
- **Risk:** Breaking changes between versions
- **Mitigation:** Migration system, preserve unknown fields
- **Fallback:** Version warning, manual migration

**4. Undo/Redo Memory Leaks**
- **Risk:** Memory grows unbounded
- **Mitigation:** Snapshot system, pruning
- **Fallback:** Clear history button

---

## Success Criteria (MVP Launch Checklist)

### User Experience
- [ ] User can create 20-task chart with dependencies in < 5 minutes
- [ ] Charts look professional with zero configuration
- [ ] Dependency creation is discoverable
- [ ] Help system enables self-service
- [ ] Welcome tour guides first-time users

### Functionality
- [ ] All 6 sprints features working
- [ ] Save/load works 100% reliably
- [ ] Undo/redo provides safety net
- [ ] PNG export produces presentation-quality output
- [ ] Keyboard shortcuts all functional

### Quality
- [ ] Zero critical bugs
- [ ] 70%+ test coverage
- [ ] WCAG 2.1 AA compliance verified
- [ ] Performance: 100 @ 60fps, 500 @ 30fps
- [ ] All CI/CD checks passing

### Documentation
- [ ] README.md updated
- [ ] CHANGELOG.md updated for v1.0.0
- [ ] PROJECT_STATUS.md marked Phase 1 complete
- [ ] User documentation complete

### Deployment
- [ ] Production build verified
- [ ] Deployed to GitHub Pages
- [ ] URL accessible and working
- [ ] No console errors

---

## Post-MVP (Phase 1.5 - V1.1)

**Deferred Features** (not in MVP):
- History timeline slider (basic undo/redo only in MVP)
- Advanced dependency types (SS, FF, SF) - FS only in MVP
- Task groups/phases - flat structure in MVP
- Copy/paste with multi-select - single selection in MVP
- PDF/SVG export - PNG only in MVP
- Named snapshots - removed from MVP

**V1.1 Roadmap** (4-6 weeks after MVP):
1. History timeline slider with real-time scrubbing
2. Advanced dependencies (SS, FF, SF)
3. ~~Task groups & phases~~ → ✅ COMPLETE (Sprint 1.1.1)
4. ~~Copy/paste & multi-select~~ → ✅ COMPLETE (Sprint 1.5.4)
5. ~~PDF/SVG export~~ → ✅ COMPLETE (Sprint 1.5.5)
6. Named snapshots

---

## Commit Strategy for Phase 1

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `test` - Adding tests
- `refactor` - Code refactoring
- `docs` - Documentation
- `style` - Code formatting
- `perf` - Performance improvement

**Example Commits:**
```
feat(types): add Task interface definition
feat(store): add task CRUD operations
feat(ui): add TaskTable spreadsheet component
feat(utils): add circular dependency detection (DFS)
test(utils): add complex circular dependency tests
feat(services): add chart save functionality
feat(ui): add undo/redo buttons and keyboard shortcuts
release: Phase 1 MVP complete v1.0.0
```

**Versioning:**
- v0.0.1 - Phase 0 complete
- v0.2.0 - Sprint 1.1 complete (Task management)
- v0.3.0 - Sprint 1.2 complete (Timeline)
- v0.4.0 - Sprint 1.3 complete (Dependencies)
- v0.5.0 - Sprint 1.4 complete (File operations)
- v0.6.0 - Sprint 1.5 complete (Undo/redo)
- v0.7.0 - Sprint 1.6 complete (Export & polish)
- v1.0.0 - Phase 1 MVP complete ✨

---

## Review Checklist (Before Release)

**Code Quality:**
- [ ] All files follow ESLint rules
- [ ] All files formatted with Prettier
- [ ] TypeScript strict mode with no errors
- [ ] No console errors in browser

**Testing:**
- [ ] All tests passing
- [ ] 70%+ overall coverage
- [ ] 100% coverage for dependency logic
- [ ] E2E tests pass in all browsers

**CI/CD:**
- [ ] All CI checks pass on main branch
- [ ] Deploy workflow succeeds
- [ ] Site accessible on GitHub Pages

**Documentation:**
- [ ] README.md updated
- [ ] CHANGELOG.md complete
- [ ] PROJECT_STATUS.md updated
- [ ] All concept docs reviewed

**User Testing:**
- [ ] 5 users can create chart in < 5 minutes
- [ ] No critical bugs reported
- [ ] Positive feedback on usability

---

**This document serves as the comprehensive blueprint for Phase 1 MVP. Once reviewed and approved, implementation can begin with confidence that all features, technical decisions, and quality requirements have been thoroughly planned.**

**Status:** Ready for Review and Implementation
**Version:** 1.0
**Created:** 2025-12-13
**Next Action:** User review and approval, then begin Sprint 1.1
