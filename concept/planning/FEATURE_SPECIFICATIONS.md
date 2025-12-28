# Feature Specifications

## 1. Overview

This document provides detailed specifications for each feature of the Gantt Chart application, including behavior, edge cases, validation rules, and acceptance criteria.

---

## 2. Task Management

### 2.1 Create Task

**Description**: Add a new task to the chart.

**Trigger**:
- Click "+ Add Task" button in task list panel
- Keyboard shortcut: Ctrl/Cmd + T
- Click "Add Task" in empty state

**Behavior**:
1. New task appears at bottom of task list
2. Task has default values (see Data Model)
3. Task name field is auto-focused for immediate editing
4. Chart canvas scrolls to show new task if needed
5. Task bar appears on timeline at default position (today + 7 days)
6. Change recorded in history

**Default Values**:
```javascript
{
  id: generateUUID(),
  name: "New Task",
  startDate: today(),
  endDate: addDays(today(), 7),
  duration: 7,
  color: nextColorInPalette(),
  order: tasks.length,
  progress: 0
}
```

**Validation**: None on creation (validation on edit)

**Edge Cases**:
- Maximum tasks reached (1000): Show warning, prevent creation
- Browser storage full: Show error, suggest saving to file

**Acceptance Criteria**:
- ✓ Task appears in list within 100ms
- ✓ Task bar renders on chart
- ✓ Task name field is focused
- ✓ History entry created
- ✓ Auto-save triggered

---

### 2.2 Edit Task

**Description**: Modify task properties inline.

**Trigger**:
- Double-click task name in list or on chart
- Click selected task again
- Press Enter on selected task
- Click in date fields

**Behavior**:
1. Field becomes editable (input field or date picker)
2. Current value is selected/highlighted
3. Changes apply on:
   - Enter key
   - Click outside
   - Focus lost
4. Changes cancel on:
   - Escape key
   - No changes made
5. Chart updates in real-time during editing
6. Dependent tasks auto-adjust if dates change
7. History recorded on save (not on cancel)

**Editable Fields**:
- Task name (text input)
- Start date (date picker)
- End date (date picker)
- Color (color picker)
- Progress (slider, 0-100%)
- Description (textarea in details panel)
- Tags (tag input)

**Validation**:

| Field      | Rule                              | Error Message                    |
|------------|-----------------------------------|----------------------------------|
| Name       | 1-200 characters                  | "Name must be 1-200 characters"  |
| Start Date | Valid date                        | "Invalid date format"            |
| End Date   | After or equal to start date      | "End date must be after start"   |
| Color      | Valid hex color                   | "Invalid color format"           |
| Progress   | 0-100                             | "Progress must be 0-100%"        |

**Edge Cases**:
- Editing while dragging: Cancel drag, focus input
- Editing dependent task dates: Show which tasks will be affected
- Edit conflicts with dependencies: Show warning, offer to adjust dependencies
- Very long task name: Truncate display with ellipsis, full name in tooltip

**Acceptance Criteria**:
- ✓ Inline editing works for all fields
- ✓ Validation errors shown inline
- ✓ Changes reflected immediately on chart
- ✓ Dependent tasks auto-adjust
- ✓ Escape cancels changes
- ✓ Enter saves changes
- ✓ History entry created on save

---

### 2.3 Delete Task

**Description**: Remove task from chart.

**Trigger**:
- Click X button on task (hover)
- Select task and press Delete key
- Right-click → Delete
- Context menu → Delete

**Behavior**:
1. Confirmation dialog appears (configurable in settings)
2. On confirm:
   - Task removed from list and chart
   - All dependencies involving this task deleted
   - Task order recalculated
   - History entry created
   - Auto-save triggered
3. On cancel: No action

**Confirmation Dialog**:
```
Delete Task?

This will delete "Design mockups" and 2 dependencies.
This action can be undone.

[Cancel]  [Delete]
```

**Edge Cases**:
- Last remaining task: Allow deletion, show empty state
- Task with many dependencies: List count in confirmation
- Multi-select delete: Confirm once for all selected

**Undo**: Full restoration of task and dependencies

**Acceptance Criteria**:
- ✓ Confirmation shown (if enabled)
- ✓ Task and dependencies removed
- ✓ Chart updates immediately
- ✓ History entry created
- ✓ Undo works correctly

---

### 2.4 Reorder Tasks

**Description**: Change display order of tasks in list and chart.

**Trigger**:
- Drag task by handle (≡) in task list
- Move up/down with keyboard (Alt + Up/Down)

**Behavior**:
1. Drag handle appears on hover
2. During drag:
   - Task opacity 70%
   - Drop zone highlighted between tasks
   - Scroll list if dragging near edges
3. On drop:
   - Task snaps to new position
   - Order values recalculated for all tasks
   - Chart updates to match new order
   - History entry created

**Visual Feedback**:
- Placeholder line shows drop position
- Other tasks shift to make space
- Cursor: grabbing
- Invalid drop: Red highlight, not-allowed cursor

**Edge Cases**:
- Drag outside list: Cancel drag, return to original position
- Drag with dependencies: Dependencies follow visually
- Fast consecutive reorders: Debounce history entries (1 per second max)

**Acceptance Criteria**:
- ✓ Smooth drag experience
- ✓ Drop position clearly indicated
- ✓ Chart order updates
- ✓ Dependencies maintain connections
- ✓ History entry created

---

### 2.5 Multi-Select Tasks

**Description**: Select multiple tasks for bulk operations.

**Trigger**:
- Ctrl/Cmd + Click: Add/remove from selection
- Shift + Click: Select range
- Ctrl/Cmd + A: Select all
- Click and drag on canvas: Lasso selection (future)

**Behavior**:
1. Selected tasks highlighted in list and chart
2. Selection count shown in toolbar: "3 tasks selected"
3. Bulk actions available:
   - Delete all
   - Change color
   - Move dates (shift by N days)
   - Export selection

**Visual Indication**:
- List: Background color highlight
- Chart: Task bars outlined
- Selection toolbar appears

**Edge Cases**:
- Select all with many tasks: Performance check
- Mixed selection operations: Maintain selection state correctly

**Acceptance Criteria**:
- ✓ Multi-select with Ctrl/Cmd
- ✓ Range select with Shift
- ✓ Visual indication clear
- ✓ Bulk operations work
- ✓ Deselect on Escape

---

## 3. Task Dependencies

### 3.1 Create Dependency

**Description**: Link two tasks with a dependency relationship.

**Trigger**:
- Alt/Option + Drag from task A to task B
- Select task A, right-click task B → "Add Dependency"
- In task details panel: "Add Dependency" → Select task

**Behavior**:
1. During drag:
   - Arrow follows cursor
   - Target task highlights on hover
   - Invalid targets show red highlight
2. On drop/selection:
   - Dependency created
   - Arrow appears on chart
   - Dependent task auto-adjusts dates (if "Auto-adjust" enabled)
   - History entry created

**Dependency Types**:
- **Finish-to-Start (FS)**: Default, most common
- **Start-to-Start (SS)**: Advanced, via details panel
- **Finish-to-Finish (FF)**: Advanced, via details panel
- **Start-to-Finish (SF)**: Advanced, rarely used

**Auto-Adjustment**:
When creating FS dependency:
- If Task B starts before Task A ends:
  - Task B start date → Task A end date + 1 day
  - Task B end date → adjusted to maintain duration
  - Show notification: "Adjusted Task B start date"

**Validation**:
- No self-dependencies: Task A → Task A (rejected)
- No circular dependencies: A → B → C → A (rejected)
- No duplicate dependencies: A → B already exists (rejected)

**Error Messages**:
```
Cannot Create Dependency

This would create a circular dependency:
Design mockups → Development → Testing → Design mockups

[OK]
```

**Edge Cases**:
- Dependency would shift many tasks: Show preview, require confirmation
- Lag days: Default 0, configurable in details panel (can be negative)
- Cross-milestone dependencies: Show warning, allow

**Acceptance Criteria**:
- ✓ Drag to create dependency
- ✓ Arrow appears on chart
- ✓ Circular dependencies prevented
- ✓ Auto-adjustment works
- ✓ Validation errors shown
- ✓ History entry created

---

### 3.2 Edit Dependency

**Description**: Modify dependency properties.

**Trigger**:
- Click on dependency arrow → Details panel opens
- Right-click arrow → "Edit Dependency"

**Editable Properties**:
- Type (FS, SS, FF, SF)
- Lag days (positive or negative integer)

**Behavior**:
1. Details panel shows dependency properties
2. Changes apply immediately
3. Dependent task adjusts dates based on new settings
4. Arrow style updates if needed (different types may have different visuals)

**Edge Cases**:
- Changing type creates conflict: Show warning, allow override
- Large lag days: Validate reasonable range (-365 to +365)

**Acceptance Criteria**:
- ✓ Dependency properties editable
- ✓ Changes apply immediately
- ✓ Dependent tasks adjust
- ✓ History entry created

---

### 3.3 Delete Dependency

**Description**: Remove dependency link between tasks.

**Trigger**:
- Click arrow → Details panel → Delete button
- Right-click arrow → "Delete Dependency"
- Select arrow and press Delete key

**Behavior**:
1. Confirmation: "Delete dependency?" (optional)
2. Arrow removed from chart
3. Dependent task dates remain (no auto-adjustment)
4. History entry created

**Edge Cases**:
- Delete while editing: Close details panel, then delete
- Multiple dependencies between same tasks: Delete only selected one

**Acceptance Criteria**:
- ✓ Dependency deleted
- ✓ Arrow removed from chart
- ✓ Dates unchanged
- ✓ Undo restores dependency
- ✓ History entry created

---

### 3.4 Dependency Resolution Algorithm

**Description**: Formal algorithm for calculating task dates based on dependency constraints.

#### 3.4.1 Dependency Types and Constraints

Each dependency type defines a relationship between two tasks:

```typescript
enum DependencyType {
  FS = 'FS',  // Finish-to-Start: Predecessor finishes, then successor starts
  SS = 'SS',  // Start-to-Start: Predecessor starts, then successor starts
  FF = 'FF',  // Finish-to-Finish: Predecessor finishes, then successor finishes
  SF = 'SF'   // Start-to-Finish: Predecessor starts, then successor finishes
}

interface DependencyConstraint {
  type: DependencyType;
  lag: number;  // Days to add/subtract (can be negative)
  fromTaskId: string;  // Predecessor
  toTaskId: string;    // Successor
}
```

**Constraint Formulas**:

```typescript
// For each dependency type, calculate the minimum date for the successor task

function calculateConstraintDate(
  predecessor: Task,
  dependency: DependencyConstraint
): { constraintDate: Date; constraintType: 'start' | 'end' } {

  const lag = dependency.lag || 0;

  switch (dependency.type) {
    case 'FS':
      // Successor starts after predecessor finishes
      return {
        constraintDate: addDays(predecessor.endDate, lag + 1),
        constraintType: 'start'
      };

    case 'SS':
      // Successor starts after predecessor starts
      return {
        constraintDate: addDays(predecessor.startDate, lag),
        constraintType: 'start'
      };

    case 'FF':
      // Successor finishes after predecessor finishes
      return {
        constraintDate: addDays(predecessor.endDate, lag),
        constraintType: 'end'
      };

    case 'SF':
      // Successor finishes after predecessor starts (rare)
      return {
        constraintDate: addDays(predecessor.startDate, lag),
        constraintType: 'end'
      };
  }
}
```

#### 3.4.2 Propagation Algorithm

When a task date changes, propagate changes through the dependency graph:

```typescript
/**
 * Topological sort and forward propagation algorithm
 *
 * 1. Build dependency graph
 * 2. Topologically sort tasks
 * 3. Propagate date constraints forward through the graph
 * 4. Collect all affected tasks
 */
function propagateDependencies(
  changedTask: Task,
  newDate: Date,
  dateType: 'start' | 'end',
  allTasks: Task[],
  dependencies: Dependency[]
): AffectedTask[] {

  // Step 1: Build adjacency list (graph)
  const graph = buildDependencyGraph(dependencies);

  // Step 2: Topological sort from changed task
  const sortedTasks = topologicalSort(changedTask.id, graph, allTasks);

  // Step 3: Apply constraints in topological order
  const affectedTasks: AffectedTask[] = [];
  const taskMap = new Map(allTasks.map(t => [t.id, { ...t }]));

  // Update the initially changed task
  if (dateType === 'start') {
    const duration = daysBetween(taskMap.get(changedTask.id)!.startDate,
                                  taskMap.get(changedTask.id)!.endDate);
    taskMap.get(changedTask.id)!.startDate = newDate;
    taskMap.get(changedTask.id)!.endDate = addDays(newDate, duration);
  } else {
    taskMap.get(changedTask.id)!.endDate = newDate;
  }

  // Propagate through successors
  for (const taskId of sortedTasks) {
    if (taskId === changedTask.id) continue;

    const task = taskMap.get(taskId)!;
    const incomingDeps = dependencies.filter(d => d.toTaskId === taskId);

    // Calculate all constraints for this task
    const constraints = incomingDeps.map(dep => {
      const predecessor = taskMap.get(dep.fromTaskId)!;
      return calculateConstraintDate(predecessor, dep);
    });

    // Find the most restrictive constraint
    const mostRestrictive = findMostRestrictiveConstraint(constraints, task);

    if (mostRestrictive) {
      const oldStart = task.startDate;
      const oldEnd = task.endDate;

      // Apply constraint
      if (mostRestrictive.constraintType === 'start') {
        if (mostRestrictive.constraintDate > task.startDate) {
          const duration = daysBetween(task.startDate, task.endDate);
          task.startDate = mostRestrictive.constraintDate;
          task.endDate = addDays(task.startDate, duration);

          affectedTasks.push({
            taskId: task.id,
            taskName: task.name,
            oldStart,
            oldEnd,
            newStart: task.startDate,
            newEnd: task.endDate,
            daysShifted: daysBetween(oldStart, task.startDate)
          });
        }
      } else {
        // constraintType === 'end'
        if (mostRestrictive.constraintDate > task.endDate) {
          const duration = daysBetween(task.startDate, task.endDate);
          task.endDate = mostRestrictive.constraintDate;
          task.startDate = subtractDays(task.endDate, duration);

          affectedTasks.push({
            taskId: task.id,
            taskName: task.name,
            oldStart,
            oldEnd,
            newStart: task.startDate,
            newEnd: task.endDate,
            daysShifted: daysBetween(oldStart, task.startDate)
          });
        }
      }

      // Update the task in map
      taskMap.set(task.id, task);
    }
  }

  return affectedTasks;
}

/**
 * Find most restrictive constraint (latest date)
 */
function findMostRestrictiveConstraint(
  constraints: Array<{ constraintDate: Date; constraintType: 'start' | 'end' }>,
  task: Task
): { constraintDate: Date; constraintType: 'start' | 'end' } | null {

  if (constraints.length === 0) return null;

  // Group by constraint type
  const startConstraints = constraints.filter(c => c.constraintType === 'start');
  const endConstraints = constraints.filter(c => c.constraintType === 'end');

  // Find latest start constraint
  const latestStart = startConstraints.length > 0
    ? startConstraints.reduce((latest, c) =>
        c.constraintDate > latest.constraintDate ? c : latest
      )
    : null;

  // Find latest end constraint
  const latestEnd = endConstraints.length > 0
    ? endConstraints.reduce((latest, c) =>
        c.constraintDate > latest.constraintDate ? c : latest
      )
    : null;

  // Return the most restrictive
  if (latestStart && latestEnd) {
    // Both exist: check which is more restrictive
    const duration = daysBetween(task.startDate, task.endDate);
    const startImpliesEnd = addDays(latestStart.constraintDate, duration);

    if (latestEnd.constraintDate > startImpliesEnd) {
      return latestEnd;
    } else {
      return latestStart;
    }
  }

  return latestStart || latestEnd;
}

/**
 * Topological sort using DFS
 */
function topologicalSort(
  startTaskId: string,
  graph: Map<string, string[]>,
  allTasks: Task[]
): string[] {

  const visited = new Set<string>();
  const sorted: string[] = [];

  function dfs(taskId: string) {
    if (visited.has(taskId)) return;
    visited.add(taskId);

    const successors = graph.get(taskId) || [];
    for (const successor of successors) {
      dfs(successor);
    }

    sorted.unshift(taskId); // Reverse postorder
  }

  dfs(startTaskId);

  return sorted;
}

/**
 * Build adjacency list from dependencies
 */
function buildDependencyGraph(dependencies: Dependency[]): Map<string, string[]> {
  const graph = new Map<string, string[]>();

  for (const dep of dependencies) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }

  return graph;
}
```

#### 3.4.3 Mixed Dependency Type Examples

**Example 1: Simple FS Chain**
```
Task A: Jan 1 - Jan 5
Task B: depends on A (FS, lag=0)
Task C: depends on B (FS, lag=0)

Result:
Task A: Jan 1 - Jan 5
Task B: Jan 6 - Jan 10  (starts after A ends)
Task C: Jan 11 - Jan 15 (starts after B ends)
```

**Example 2: Mixed FS and SS**
```
Task A: Jan 1 - Jan 10
Task B: depends on A (FS, lag=0)
Task C: depends on A (SS, lag=2)

Result:
Task A: Jan 1 - Jan 10
Task B: Jan 11 - Jan 20 (starts after A finishes)
Task C: Jan 3 - Jan 12  (starts 2 days after A starts)
```

**Example 3: Conflicting Constraints**
```
Task A: Jan 1 - Jan 5
Task B: Jan 1 - Jan 10
Task C: depends on A (FS, lag=0) AND depends on B (FS, lag=0)

Constraints for C:
- From A: start >= Jan 6
- From B: start >= Jan 11

Most restrictive: Jan 11
Result:
Task C: Jan 11 - Jan 15 (starts after latest constraint)
```

**Example 4: Negative Lag (Lead Time)**
```
Task A: Jan 10 - Jan 20
Task B: depends on A (FS, lag=-3)

Result:
Task B: Jan 18 - Jan 25 (starts 3 days before A ends)
```

#### 3.4.4 Constraint Resolution Policy

**Hard Constraints**: Dependencies are always enforced. If manual edits violate constraints, the system will:

1. Show a warning dialog with preview
2. Automatically adjust dependent tasks
3. Allow user to:
   - Apply the adjustment
   - Cancel the edit
   - Remove the conflicting dependency

**Soft Constraints** (Future): Allow tasks to violate constraints with visual warnings (e.g., red highlight, warning icon).

#### 3.4.5 Performance Optimization

For large dependency graphs (> 100 dependencies):

```typescript
// Use memoization for repeated calculations
const constraintCache = new Map<string, Date>();

// Limit propagation depth to prevent runaway cascades
const MAX_PROPAGATION_DEPTH = 50;

// Use Web Worker for heavy graph calculations
async function propagateInWorker(
  task: Task,
  newDate: Date,
  dependencies: Dependency[]
): Promise<AffectedTask[]> {
  const worker = new Worker('dependency-worker.js');

  return new Promise((resolve) => {
    worker.postMessage({ task, newDate, dependencies });
    worker.onmessage = (e) => {
      resolve(e.data.affectedTasks);
      worker.terminate();
    };
  });
}
```

#### 3.4.6 Acceptance Criteria

- ✓ All dependency types (FS, SS, FF, SF) correctly enforced
- ✓ Lag values (positive and negative) applied correctly
- ✓ Topological sort handles complex graphs
- ✓ Most restrictive constraint wins when multiple dependencies
- ✓ Circular dependencies detected and prevented
- ✓ Performance acceptable for graphs with 1000+ dependencies
- ✓ Preview shown before applying mass changes (> 5 tasks)

---

### 3.5 Dependency Arrow Rendering Algorithm

**Description**: Detailed algorithm for rendering dependency arrows on the Gantt chart timeline.

**Critical Component**: This is identified as the most complex visual rendering challenge. The algorithm must handle:
- Connecting tasks at different vertical positions
- Avoiding overlapping task bars
- Maintaining visual clarity with many dependencies
- Performing efficiently for 100+ arrows

---

#### 3.5.1 Arrow Connection Points

Each task bar has connection points for dependencies:

```typescript
interface ConnectionPoints {
  left: Point;      // Left edge, vertical center
  right: Point;     // Right edge, vertical center
  topLeft: Point;   // Top-left corner
  topRight: Point;  // Top-right corner
  bottomLeft: Point;  // Bottom-left corner
  bottomRight: Point; // Bottom-right corner
}

interface Point {
  x: number;  // Horizontal pixel position on canvas
  y: number;  // Vertical pixel position on canvas
}

/**
 * Calculate connection points for a task bar
 */
function getConnectionPoints(task: Task, layout: ChartLayout): ConnectionPoints {
  const x1 = dateToX(task.startDate, layout);
  const x2 = dateToX(task.endDate, layout);
  const y = taskToY(task, layout);
  const height = layout.taskBarHeight;
  const halfHeight = height / 2;

  return {
    left: { x: x1, y: y + halfHeight },
    right: { x: x2, y: y + halfHeight },
    topLeft: { x: x1, y: y },
    topRight: { x: x2, y: y },
    bottomLeft: { x: x1, y: y + height },
    bottomRight: { x: x2, y: y + height }
  };
}
```

---

#### 3.5.2 Arrow Path Calculation (MVP - Simplified)

**MVP Approach**: Finish-to-Start dependencies only, using simple orthogonal paths.

```typescript
/**
 * Calculate arrow path for FS dependency (MVP simplified version)
 *
 * Rules:
 * - Start at predecessor's right edge (center)
 * - End at successor's left edge (center)
 * - Use orthogonal routing (horizontal + vertical segments only)
 * - Avoid overlapping task bars
 */
function calculateArrowPath(
  predecessor: Task,
  successor: Task,
  layout: ChartLayout
): SVGPath {

  const startPoints = getConnectionPoints(predecessor, layout);
  const endPoints = getConnectionPoints(successor, layout);

  // For FS: predecessor.right → successor.left
  const start = startPoints.right;
  const end = endPoints.left;

  // Determine routing strategy based on task positions
  if (successor.order > predecessor.order) {
    // Successor is below predecessor (normal downward flow)
    return calculateDownwardPath(start, end, predecessor, successor, layout);
  } else {
    // Successor is above predecessor (upward flow)
    return calculateUpwardPath(start, end, predecessor, successor, layout);
  }
}

/**
 * Calculate path for downward-flowing dependency
 */
function calculateDownwardPath(
  start: Point,
  end: Point,
  predecessor: Task,
  successor: Task,
  layout: ChartLayout
): SVGPath {

  const HORIZONTAL_GAP = 8;  // px spacing from task bars
  const ARROW_HEIGHT = 4;     // px for arrow marker

  // Case 1: Successor starts after predecessor ends (no horizontal overlap)
  if (end.x >= start.x + HORIZONTAL_GAP) {
    // Simple L-shape: right → down → right
    return {
      type: 'L-shape',
      segments: [
        { from: start, to: { x: start.x + HORIZONTAL_GAP, y: start.y } },  // Horizontal from predecessor
        { from: { x: start.x + HORIZONTAL_GAP, y: start.y }, to: { x: start.x + HORIZONTAL_GAP, y: end.y } },  // Vertical down
        { from: { x: start.x + HORIZONTAL_GAP, y: end.y }, to: end }  // Horizontal to successor
      ],
      arrowMarker: end
    };
  }

  // Case 2: Horizontal overlap (successor starts before predecessor ends)
  // Use Z-shape: right → down → left → down → right
  const midY = (start.y + end.y) / 2;

  return {
    type: 'Z-shape',
    segments: [
      { from: start, to: { x: start.x + HORIZONTAL_GAP, y: start.y } },  // Right from predecessor
      { from: { x: start.x + HORIZONTAL_GAP, y: start.y }, to: { x: start.x + HORIZONTAL_GAP, y: midY } },  // Down
      { from: { x: start.x + HORIZONTAL_GAP, y: midY }, to: { x: end.x - HORIZONTAL_GAP, y: midY } },  // Left to successor column
      { from: { x: end.x - HORIZONTAL_GAP, y: midY }, to: { x: end.x - HORIZONTAL_GAP, y: end.y } },  // Down to successor level
      { from: { x: end.x - HORIZONTAL_GAP, y: end.y }, to: end }  // Right to successor
    ],
    arrowMarker: end
  };
}

/**
 * Calculate path for upward-flowing dependency
 */
function calculateUpwardPath(
  start: Point,
  end: Point,
  predecessor: Task,
  successor: Task,
  layout: ChartLayout
): SVGPath {

  const HORIZONTAL_GAP = 8;
  const VERTICAL_CLEARANCE = layout.taskBarHeight + 4;  // Clear task bars

  // Upward dependencies always use S-shape to route around task bars
  // right → up (clearing task bars) → right → up → right

  const clearanceY = Math.min(start.y, end.y) - VERTICAL_CLEARANCE;

  return {
    type: 'S-shape',
    segments: [
      { from: start, to: { x: start.x + HORIZONTAL_GAP, y: start.y } },  // Right from predecessor
      { from: { x: start.x + HORIZONTAL_GAP, y: start.y }, to: { x: start.x + HORIZONTAL_GAP, y: clearanceY } },  // Up to clearance
      { from: { x: start.x + HORIZONTAL_GAP, y: clearanceY }, to: { x: end.x - HORIZONTAL_GAP, y: clearanceY } },  // Right to successor column
      { from: { x: end.x - HORIZONTAL_GAP, y: clearanceY }, to: { x: end.x - HORIZONTAL_GAP, y: end.y } },  // Down to successor level
      { from: { x: end.x - HORIZONTAL_GAP, y: end.y }, to: end }  // Right to successor
    ],
    arrowMarker: end
  };
}

/**
 * Convert path to SVG path string
 */
function pathToSVG(path: SVGPath): string {
  let d = `M ${path.segments[0].from.x} ${path.segments[0].from.y}`;

  for (const segment of path.segments) {
    d += ` L ${segment.to.x} ${segment.to.y}`;
  }

  return d;
}
```

---

#### 3.5.3 Collision Detection (Deferred to V1.1)

**MVP**: Simple routing rules avoid most collisions. Advanced collision detection deferred.

**V1.1 Enhancement**: Detect and route around intermediate task bars.

```typescript
/**
 * Check if path segment intersects any task bars (V1.1)
 */
function detectCollisions(
  path: SVGPath,
  allTasks: Task[],
  excludeTaskIds: string[],
  layout: ChartLayout
): boolean {

  for (const task of allTasks) {
    if (excludeTaskIds.includes(task.id)) continue;

    const taskBounds = getTaskBounds(task, layout);

    for (const segment of path.segments) {
      if (segmentIntersectsRect(segment, taskBounds)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Adjust path to avoid collisions (V1.1)
 */
function avoidCollisions(
  path: SVGPath,
  allTasks: Task[],
  layout: ChartLayout
): SVGPath {
  // If collision detected, add extra vertical clearance
  // This is a simplified approach; advanced routing uses A* pathfinding
  // Complexity: O(n) where n = number of tasks

  // For MVP, simple rules in calculatePath() are sufficient
  // V1.1 can add A* or similar pathfinding if needed

  return path;  // MVP: return as-is
}
```

---

#### 3.5.4 SVG Rendering

**Rendering Approach**: Use SVG `<path>` elements with arrow markers.

```typescript
/**
 * Render dependency arrow as SVG
 */
function renderDependencyArrow(
  dependency: Dependency,
  predecessor: Task,
  successor: Task,
  layout: ChartLayout
): SVGElement {

  const path = calculateArrowPath(predecessor, successor, layout);
  const pathString = pathToSVG(path);

  // Create SVG path element
  return `
    <path
      d="${pathString}"
      stroke="#666"
      stroke-width="1.5"
      fill="none"
      marker-end="url(#arrowhead)"
      class="dependency-arrow"
      data-dependency-id="${dependency.id}"
      style="cursor: pointer;"
    />
  `;
}

/**
 * Define arrowhead marker (once in SVG defs)
 */
const arrowheadMarker = `
  <defs>
    <marker
      id="arrowhead"
      markerWidth="8"
      markerHeight="8"
      refX="6"
      refY="3"
      orient="auto"
      markerUnits="strokeWidth"
    >
      <path
        d="M0,0 L0,6 L6,3 z"
        fill="#666"
      />
    </marker>
  </defs>
`;
```

---

#### 3.5.5 Performance Optimization

**Critical for 100+ dependencies**:

1. **Incremental Rendering**:
   - Only render arrows in viewport
   - Virtual scrolling for off-screen arrows
   - Target: 60fps with 100 visible arrows

2. **Caching**:
   - Cache calculated paths when tasks don't move
   - Invalidate cache on task position/date changes
   - Reduces calculation from O(n) to O(1) for static arrows

3. **Batching**:
   - Batch DOM updates for multiple arrow changes
   - Use `requestAnimationFrame` for smooth rendering

4. **Fallback to Canvas** (if SVG struggles):
   - For > 500 arrows, consider Canvas rendering
   - Trade-off: better performance, worse interactivity
   - Decision based on Phase 0 performance validation

```typescript
/**
 * Optimized rendering with viewport culling
 */
function renderVisibleArrows(
  dependencies: Dependency[],
  tasks: Task[],
  viewport: Viewport,
  layout: ChartLayout
): SVGElement[] {

  const visibleArrows: SVGElement[] = [];

  for (const dep of dependencies) {
    const predecessor = tasks.find(t => t.id === dep.fromTaskId);
    const successor = tasks.find(t => t.id === dep.toTaskId);

    if (!predecessor || !successor) continue;

    // Viewport culling: skip arrows completely outside viewport
    const startY = taskToY(predecessor, layout);
    const endY = taskToY(successor, layout);
    const minY = Math.min(startY, endY);
    const maxY = Math.max(startY, endY);

    if (maxY < viewport.y || minY > viewport.y + viewport.height) {
      continue;  // Outside vertical viewport
    }

    visibleArrows.push(renderDependencyArrow(dep, predecessor, successor, layout));
  }

  return visibleArrows;
}
```

---

#### 3.5.6 V1.1 Enhancements (Advanced Dependencies)

**For SS/FF/SF dependencies** (deferred to V1.1):

```typescript
/**
 * Calculate arrow path for all dependency types (V1.1)
 */
function calculateArrowPathAdvanced(
  dependency: Dependency,
  predecessor: Task,
  successor: Task,
  layout: ChartLayout
): SVGPath {

  const startPoints = getConnectionPoints(predecessor, layout);
  const endPoints = getConnectionPoints(successor, layout);

  let start: Point, end: Point;

  switch (dependency.type) {
    case 'FS':
      start = startPoints.right;
      end = endPoints.left;
      break;

    case 'SS':
      start = startPoints.left;
      end = endPoints.left;
      break;

    case 'FF':
      start = startPoints.right;
      end = endPoints.right;
      break;

    case 'SF':
      start = startPoints.left;
      end = endPoints.right;
      break;
  }

  // Use same routing logic, but with different start/end points
  return calculatePath(start, end, predecessor, successor, layout);
}

/**
 * Visual differentiation for dependency types (V1.1)
 */
const dependencyStyles = {
  'FS': { stroke: '#666', strokeDasharray: 'none' },        // Solid gray (default)
  'SS': { stroke: '#2563eb', strokeDasharray: 'none' },     // Solid blue
  'FF': { stroke: '#dc2626', strokeDasharray: 'none' },     // Solid red
  'SF': { stroke: '#ca8a04', strokeDasharray: '4 2' }       // Dashed gold (rare)
};
```

---

#### 3.5.7 Acceptance Criteria

**MVP (Phase 1)**:
- ✓ FS arrows render correctly for all task position combinations
- ✓ Arrows avoid overlapping task bars (basic routing)
- ✓ L-shape paths for normal flow, Z-shape for overlap, S-shape for upward
- ✓ Arrows clickable for details/deletion
- ✓ Performance: 100 arrows at 60fps
- ✓ Arrows update in real-time during task drag
- ✓ SVG rendering with proper arrow markers

**V1.1**:
- ✓ SS/FF/SF arrows render with different start/end points
- ✓ Visual differentiation between dependency types (colors)
- ✓ Advanced collision avoidance (A* pathfinding if needed)
- ✓ Curved paths option for aesthetic preference
- ✓ Performance: 500+ arrows at 60fps

---

## 4. Milestones

### 4.1 Create Milestone

**Description**: Add a milestone marker to the timeline.

**Trigger**:
- Click "+ Add Milestone" button
- Right-click on timeline → "Add Milestone Here"
- Keyboard shortcut: Ctrl/Cmd + M

**Behavior**:
1. Milestone appears at specified date
2. Default name: "Milestone"
3. Default icon: Diamond
4. Name field auto-focused
5. History entry created

**Default Values**:
```javascript
{
  id: generateUUID(),
  name: "Milestone",
  date: clickDate || today(),
  color: "#ef4444", // Red
  icon: "diamond",
  order: milestones.length
}
```

**Edge Cases**:
- Maximum milestones (100): Show warning
- Same date as another milestone: Allow, stack visually

**Acceptance Criteria**:
- ✓ Milestone appears on timeline
- ✓ Name field focused
- ✓ Diamond shape rendered
- ✓ History entry created

---

### 4.2 Edit Milestone

**Description**: Modify milestone properties.

**Trigger**:
- Double-click milestone
- Click milestone → Details panel → Edit
- Right-click → "Edit Milestone"

**Editable Properties**:
- Name
- Date
- Color
- Icon (diamond, flag, star, etc.)
- Description

**Behavior**:
1. Details panel opens or inline edit
2. Changes apply immediately
3. Milestone moves on timeline if date changed
4. History entry created

**Acceptance Criteria**:
- ✓ All properties editable
- ✓ Changes reflected immediately
- ✓ Validation applied
- ✓ History entry created

---

### 4.3 Delete Milestone

**Description**: Remove milestone from timeline.

**Trigger**:
- Click milestone → Delete button
- Right-click → "Delete Milestone"
- Select and press Delete key

**Behavior**:
1. Optional confirmation
2. Milestone removed from timeline
3. History entry created

**Acceptance Criteria**:
- ✓ Milestone deleted
- ✓ Timeline updates
- ✓ Undo works
- ✓ History entry created

---

## 5. File Operations

### 5.1 Save Chart

**Description**: Export chart to .gantt file on local file system.

**Trigger**:
- Click "Save" button
- Keyboard shortcut: Ctrl/Cmd + S
- File menu → Save

**Behavior**:
1. Generate .gantt JSON file (see Data Model)
2. Default filename: `[ChartName]-[Date].gantt`
   - Example: `Website-Redesign-2025-12-11.gantt`
3. Trigger browser download
4. Show success notification
5. Mark chart as "saved" (no unsaved changes indicator)
6. Update "last saved" timestamp

**File Generation**:
```javascript
const fileData = {
  fileVersion: "1.0.0",
  appVersion: APP_VERSION,
  chart: currentChart,
  history: historyEntries,
  preferences: userPreferences,
  metadata: {
    created: chart.metadata.createdAt,
    modified: new Date().toISOString(),
    fileSize: null, // Calculated after JSON.stringify
    checksum: null  // Optional
  }
};

const json = JSON.stringify(fileData, null, 2);
const blob = new Blob([json], { type: 'application/json' });
downloadFile(blob, filename);
```

**Edge Cases**:
- Very large chart (> 1000 tasks): Show progress indicator
- Browser blocks download: Show instructions
- Save while unsaved changes: Include all changes
- Filename conflicts: Browser handles (adds number)

**Acceptance Criteria**:
- ✓ File downloads successfully
- ✓ Filename follows naming convention
- ✓ File contains all chart data
- ✓ Success notification shown
- ✓ "Unsaved changes" indicator cleared

---

### 5.2 Open Chart

**Description**: Load chart from .gantt file.

**Trigger**:
- Click "Open" button
- Keyboard shortcut: Ctrl/Cmd + O
- File menu → Open
- Drag and drop file onto app

**Behavior**:
1. File picker opens (native OS dialog)
2. User selects .gantt file
3. File validation:
   - Check file format (JSON)
   - Check file version compatibility
   - Validate required fields
   - Check file size (< 50MB)
4. If valid:
   - Show loading indicator
   - Parse JSON
   - Load chart data
   - Restore history
   - Apply user preferences
   - Render chart
   - Show success notification
5. If invalid:
   - Show error dialog with details
   - Offer to report issue
   - Keep current chart open

**File Validation**:
```javascript
async function validateFile(file: File): Promise<ValidationResult> {
  // Size check
  if (file.size > 50 * 1024 * 1024) {
    return { valid: false, error: "File too large (max 50MB)" };
  }

  // Read and parse
  const text = await file.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    return { valid: false, error: "Invalid JSON format" };
  }

  // Version check
  if (!isCompatibleVersion(data.fileVersion, APP_VERSION)) {
    return { valid: false, error: "Incompatible file version" };
  }

  // Structure check
  if (!data.chart || !data.chart.id || !Array.isArray(data.chart.tasks)) {
    return { valid: false, error: "Missing required fields" };
  }

  return { valid: true };
}
```

**Version Compatibility**:
- Major version must match: 1.x.x ↔ 1.x.x ✓
- Different major version: Error, offer migration
- Newer minor version: Warning, attempt to load
- Older minor version: Load with any necessary migrations

**Unsaved Changes Prompt**:
If current chart has unsaved changes:
```
Open Chart?

You have unsaved changes that will be lost.

[Cancel]  [Save & Open]  [Open Without Saving]
```

**Edge Cases**:
- Corrupted file: Show error, log details
- File from future version: Show warning, attempt to load
- Very large file: Show progress bar during load
- File with invalid data: Try to recover what's possible, show warnings

**Acceptance Criteria**:
- ✓ File picker opens
- ✓ Valid files load correctly
- ✓ Invalid files show clear errors
- ✓ Unsaved changes prompt appears
- ✓ History restored
- ✓ Chart renders correctly
- ✓ Success notification shown

---

### 5.3 Auto-Save & Recovery (Browser Storage)

**Description**: Automatically save work-in-progress to browser storage with smart debouncing and recovery mechanisms.

#### 5.3.1 Auto-Save Cadence & Triggers

**Debouncing Strategy**:
```typescript
interface AutoSaveConfig {
  // Time-based triggers
  intervalMs: number;          // Default: 30000 (30 seconds)
  debounceMs: number;          // Default: 2000 (2 seconds after last edit)

  // Change-based triggers
  changeThreshold: number;     // Default: 10 (save after 10 changes)
  snapshotInterval: number;    // Default: 50 (full snapshot every 50 changes)

  // Lifecycle triggers
  saveOnUnload: boolean;       // Default: true (save before tab close)
  saveOnBlur: boolean;         // Default: true (save when tab loses focus)
}

const DEFAULT_CONFIG: AutoSaveConfig = {
  intervalMs: 30000,
  debounceMs: 2000,
  changeThreshold: 10,
  snapshotInterval: 50,
  saveOnUnload: true,
  saveOnBlur: true
};
```

**Auto-Save Logic**:
```typescript
class AutoSaveManager {
  private lastSaveTime: number = 0;
  private changesSinceLastSave: number = 0;
  private debounceTimer: NodeJS.Timeout | null = null;
  private periodicTimer: NodeJS.Timeout | null = null;

  /**
   * Called on every chart change (from history middleware)
   */
  onChartChange() {
    this.changesSinceLastSave++;

    // Clear existing debounce timer
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // Check if change threshold met
    if (this.changesSinceLastSave >= this.config.changeThreshold) {
      this.saveNow();
      return;
    }

    // Set debounce timer
    this.debounceTimer = setTimeout(() => {
      this.saveNow();
    }, this.config.debounceMs);
  }

  /**
   * Immediate save (bypasses debounce)
   */
  async saveNow() {
    try {
      const chartState = store.getState();
      const timestamp = Date.now();

      // Determine if full snapshot or diff
      const shouldSnapshot = this.changesSinceLastSave >= this.config.snapshotInterval;

      const saveData: AutoSaveData = shouldSnapshot
        ? this.createSnapshot(chartState, timestamp)
        : this.createDiff(chartState, timestamp);

      await this.saveToIndexedDB(saveData);

      this.lastSaveTime = timestamp;
      this.changesSinceLastSave = 0;
      this.updateLastSaveIndicator(timestamp);

    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      } else {
        console.error('Auto-save failed:', error);
      }
    }
  }

  /**
   * Create full snapshot
   */
  private createSnapshot(chartState: ChartState, timestamp: number): AutoSaveData {
    return {
      type: 'snapshot',
      timestamp,
      version: APP_VERSION,
      data: {
        chart: chartState.chart,
        history: chartState.history.entries.slice(-100), // Keep last 100 entries
        viewSettings: chartState.ui.viewSettings
      }
    };
  }

  /**
   * Create diff (changes only)
   */
  private createDiff(chartState: ChartState, timestamp: number): AutoSaveData {
    const lastEntry = chartState.history.entries[chartState.history.entries.length - 1];

    return {
      type: 'diff',
      timestamp,
      version: APP_VERSION,
      baseSnapshotId: this.lastSnapshotId,
      changes: [lastEntry]
    };
  }
}
```

#### 5.3.2 Storage Structure

**IndexedDB Schema**:
```typescript
// Database: 'GanttChartDB'
// Store: 'autoSave'

interface AutoSaveData {
  type: 'snapshot' | 'diff';
  timestamp: number;
  version: string;
  data?: {
    chart: Chart;
    history: HistoryEntry[];
    viewSettings: ViewSettings;
  };
  baseSnapshotId?: string;
  changes?: HistoryEntry[];
}

interface AutoSaveRecord {
  id: 'current';              // Single record (overwritten each save)
  lastSnapshot: AutoSaveData;  // Most recent full snapshot
  diffs: AutoSaveData[];       // Diffs since last snapshot (max 50)
  metadata: {
    lastSaveTimestamp: number;
    totalChanges: number;
    chartName: string;
  };
}
```

**Storage Optimization**:
- Keep 1 full snapshot + up to 50 diffs
- When 51st diff arrives, create new snapshot and clear diffs
- Compress old snapshots using LZ-string
- Maximum storage per user: 10MB

#### 5.3.3 Quota Management

**Quota Detection & Handling**:
```typescript
async function checkQuota(): Promise<QuotaStatus> {
  const estimate = await navigator.storage.estimate();
  const usage = estimate.usage || 0;
  const quota = estimate.quota || 0;
  const percentUsed = (usage / quota) * 100;

  return {
    usage,
    quota,
    percentUsed,
    available: quota - usage,
    status: percentUsed > 95 ? 'critical' :
            percentUsed > 80 ? 'warning' : 'ok'
  };
}

async function handleQuotaExceeded() {
  // Step 1: Try to free space
  await clearOldAutoSaves();  // Clear auto-saves > 7 days old
  await pruneHistory();        // Remove old history entries

  // Step 2: Re-attempt save
  try {
    await this.saveNow();
    showToast('Storage space freed. Auto-save resumed.');
  } catch (error) {
    // Step 3: If still failing, disable auto-save and prompt user
    this.disable();
    showCriticalDialog({
      title: 'Storage Full',
      message: 'Auto-save has been disabled due to insufficient storage space.',
      actions: [
        {
          label: 'Download Chart',
          action: () => downloadCurrentChart(),
          primary: true
        },
        {
          label: 'Clear Browser Data',
          action: () => window.open('chrome://settings/clearBrowserData')
        }
      ]
    });
  }
}
```

**Quota Warnings**:
- 80% full: Show non-intrusive warning in status bar
- 95% full: Show modal warning, suggest downloading chart
- 100% full: Disable auto-save, show critical error

#### 5.3.4 Recovery Flow

**On Application Load**:
```typescript
async function checkForRecoverableData(): Promise<RecoveryInfo | null> {
  const autoSaveData = await loadFromIndexedDB('current');

  if (!autoSaveData) {
    return null;
  }

  const timeSinceLastSave = Date.now() - autoSaveData.metadata.lastSaveTimestamp;
  const minutesAgo = Math.floor(timeSinceLastSave / 60000);

  // Only prompt if auto-save is recent (< 24 hours)
  if (timeSinceLastSave > 24 * 60 * 60 * 1000) {
    return null;
  }

  return {
    chartName: autoSaveData.metadata.chartName,
    lastSaveTimestamp: autoSaveData.metadata.lastSaveTimestamp,
    minutesAgo,
    totalChanges: autoSaveData.metadata.totalChanges
  };
}
```

**Recovery Prompt**:
```
┌─────────────────────────────────────────────┐
│  Recover Unsaved Work?                      │
│                                             │
│  We found auto-saved changes for:          │
│  "Website Redesign Project"                 │
│                                             │
│  Last saved: 12 minutes ago                 │
│  (December 12, 2025 at 3:33 PM)            │
│                                             │
│  Changes: 47 edits since last manual save  │
│                                             │
│  [Discard]  [Preview Changes]  [Recover]   │
└─────────────────────────────────────────────┘
```

**Preview Changes** (optional):
- Show side-by-side diff
- Highlight changes since last save
- Allow selective recovery

**Recovery Process**:
```typescript
async function recoverAutoSave(): Promise<void> {
  const autoSaveData = await loadFromIndexedDB('current');

  // Reconstruct state from snapshot + diffs
  let chartState = autoSaveData.lastSnapshot.data;

  for (const diff of autoSaveData.diffs) {
    chartState = applyChanges(chartState, diff.changes);
  }

  // Load into app
  store.dispatch(loadChart(chartState.chart));
  store.dispatch(loadHistory(chartState.history));
  store.dispatch(setViewSettings(chartState.viewSettings));

  // Mark as recovered (show indicator)
  store.dispatch(setRecoveredFlag(true));

  // Show success message
  showToast('Chart recovered successfully. Save to preserve changes.');
}
```

#### 5.3.5 Multi-Tab Handling

**Conflict Detection**:
```typescript
// Use BroadcastChannel for cross-tab communication
const channel = new BroadcastChannel('gantt-chart-sync');

channel.onmessage = (event) => {
  if (event.data.type === 'tab-opened') {
    showWarning({
      message: 'This chart is open in another tab. Changes may conflict.',
      action: 'Make this the active tab',
      onAction: () => {
        channel.postMessage({ type: 'claim-ownership', tabId: currentTabId });
      }
    });
  }
};

// Announce tab opening
channel.postMessage({ type: 'tab-opened', tabId: currentTabId });
```

**Lock Mechanism** (optional):
- Use IndexedDB lock (single writer)
- Read-only mode for secondary tabs
- Prompt to take over editing when needed

#### 5.3.6 Private Browsing Detection

```typescript
async function detectPrivateBrowsing(): Promise<boolean> {
  try {
    await navigator.storage.persist();
    return false;
  } catch {
    return true;
  }
}

if (await detectPrivateBrowsing()) {
  showInfo({
    message: 'Auto-save is disabled in private browsing mode.',
    suggestion: 'Save your work manually using File → Save.'
  });
  autoSaveManager.disable();
}
```

#### 5.3.7 UI Indicators

**Status Bar Display**:
```
Bottom-right corner:
┌─────────────────────────────┐
│ ● Saved 2 minutes ago       │  ← Green dot = saved
│ ○ Saving...                 │  ← Animated dot = in progress
│ ⚠ Auto-save disabled        │  ← Warning icon = problem
└─────────────────────────────┘
```

**Keyboard Shortcut**:
- Ctrl/Cmd + S: Force immediate save (bypasses debounce)

#### 5.3.8 Acceptance Criteria

- ✓ Auto-save triggered by time, changes, and lifecycle events
- ✓ Debouncing prevents excessive saves during rapid editing
- ✓ Snapshot + diff strategy keeps storage efficient
- ✓ Quota monitored continuously, warnings shown at 80%/95%
- ✓ Graceful degradation when quota exceeded
- ✓ Recovery prompt appears on reload with recent auto-save
- ✓ Preview changes option before recovery
- ✓ Multi-tab conflicts detected and warned
- ✓ Private browsing detected, auto-save disabled with notification
- ✓ Last save timestamp visible in UI at all times
- ✓ Manual save (Ctrl+S) works and bypasses debounce

---

### 5.4 New Chart

**Description**: Start a new blank chart.

**Trigger**:
- Click "New" button
- Keyboard shortcut: Ctrl/Cmd + N
- File menu → New

**Behavior**:
1. If unsaved changes: Show confirmation
2. Clear current chart
3. Load default/empty chart
4. Reset history
5. Focus on task list (ready to add first task)

**Confirmation**:
```
Create New Chart?

Current chart has unsaved changes.

[Cancel]  [Save & New]  [New Without Saving]
```

**Default Chart State**:
- Empty task list (optional: sample tasks)
- No dependencies
- No milestones
- Default view settings
- Today as center of timeline

**Edge Cases**:
- Repeatedly creating new: Warn about unsaved work
- New while auto-save pending: Wait for auto-save

**Acceptance Criteria**:
- ✓ Confirmation shown if unsaved changes
- ✓ New blank chart loaded
- ✓ History cleared
- ✓ Ready to add tasks

---

## 6. History & Version Control

### 6.1 History Tracking

**Description**: Automatically record every change for undo/redo and time-travel.

**Behavior**:
1. Every user action creates history entry
2. Grouped intelligently:
   - Rapid text edits: Grouped by pause (1 second)
   - Drag operations: Single entry on drop
   - Bulk operations: Single entry
3. Snapshot every 50 entries for performance
4. Maximum 1000 entries (configurable)
5. Old entries compressed or pruned

**History Entry Structure**:
See Data Model for full specification.

**What's Recorded**:
- Task add/edit/delete
- Dependency add/edit/delete
- Milestone add/edit/delete
- Task reorder
- Bulk operations
- View settings changes (optional)

**What's Not Recorded**:
- UI state (panel open/closed)
- Zoom/pan
- Selection
- Hover states

**Edge Cases**:
- Undo during text edit: Cancel edit, then undo
- History limit reached: Prune oldest 25%, create snapshot
- Large bulk operation: Single entry, detailed description

**Acceptance Criteria**:
- ✓ All changes recorded
- ✓ Entries grouped intelligently
- ✓ Snapshots created periodically
- ✓ History limit enforced
- ✓ Performance maintained

---

### 6.2 Undo / Redo

**Description**: Step backward/forward through history.

**Trigger**:
- Click Undo button
- Keyboard: Ctrl/Cmd + Z
- Click Redo button
- Keyboard: Ctrl/Cmd + Y (or Ctrl/Cmd + Shift + Z)

**Behavior**:
1. Undo:
   - Move current index back one
   - Apply inverse of that change
   - Update chart
   - Enable Redo button
2. Redo:
   - Move current index forward one
   - Re-apply that change
   - Update chart
   - Disable Redo if at end
3. New action after undo:
   - Truncate redo history
   - Add new entry at current position

**Visual Feedback**:
- Button disabled states
- Brief highlight of affected element
- Toast: "Undone: Added task"

**Edge Cases**:
- Undo to beginning: Disable undo button
- Redo to end: Disable redo button
- Undo complex operation: Restore all related changes atomically
- Undo during drag: Cancel drag, then undo

**Acceptance Criteria**:
- ✓ Undo reverses last change
- ✓ Redo reapplies undone change
- ✓ Keyboard shortcuts work
- ✓ Button states correct
- ✓ Complex operations handled correctly

---

### 6.3 Timeline Slider (Time Travel)

**Description**: Visually navigate through complete history with live preview.

**Components**:
- Horizontal timeline track
- History point markers
- Snapshot markers
- Current position indicator
- Time labels

**Behavior**:
1. Drag current position marker:
   - Chart updates in real-time (60fps target)
   - Reconstruct state at that point
   - Show time label during drag
2. Click on point:
   - Jump to that history entry
   - Chart updates
3. Click on snapshot:
   - Jump to named snapshot
   - Show snapshot details

**Performance**:
- Use snapshots for fast reconstruction
- Throttle updates during fast scrubbing
- Show low-fidelity preview if needed
- Full quality on release/stop

**Visual Feedback**:
- Active track (left of cursor): Primary color
- Inactive track (right): Gray
- Hover on points: Show tooltip with description
- Current position: Larger marker, primary color

**Edge Cases**:
- Very long history: Compress timeline view
- Scrubbing performance: Reduce quality if < 30fps
- Scrub beyond end: Stop at latest entry

**Acceptance Criteria**:
- ✓ Drag to scrub through history
- ✓ Chart updates in real-time
- ✓ 60fps performance (or close)
- ✓ Click to jump
- ✓ Snapshots visible and clickable
- ✓ Time labels shown

---

### 6.4 Named Snapshots

**Description**: Bookmark important states in history.

**Trigger**:
- Click "+ Snapshot" button in history panel
- Keyboard: Ctrl/Cmd + Shift + S
- Right-click on timeline → "Create Snapshot Here"

**Behavior**:
1. Prompt for snapshot name
2. Create snapshot at current history position
3. Snapshot appears as marker on timeline
4. Snapshot saved with full chart state

**Snapshot Dialog**:
```
Create Snapshot

Name: [Initial Planning Complete_____]

Description (optional):
[All tasks defined, ready for execution...]

[Cancel]  [Create]
```

**Snapshot Features**:
- Click to restore to that state
- Edit name/description
- Delete snapshot (keeps history)
- Export snapshot as separate file
- Compare current state with snapshot (future)

**Edge Cases**:
- Maximum snapshots (50): Show warning
- Snapshot at same position: Allow, different names
- Delete snapshot: Keep history entries

**Acceptance Criteria**:
- ✓ Snapshot created at current position
- ✓ Name required
- ✓ Appears on timeline
- ✓ Restoring works correctly
- ✓ Can edit and delete

---

## 7. Export Features

### 7.1 Export to PNG

**Description**: Generate raster image of chart for sharing.

**Trigger**:
- Export menu → PNG
- Keyboard: Ctrl/Cmd + Shift + P

**Options**:
```
Export as PNG

Resolution:
◉ Standard (96 DPI)
○ High (300 DPI)
○ Custom: [___] DPI

Background:
[■ White ▼]  ○ Transparent

Date Range:
◉ Entire chart
○ Visible area
○ Custom: [Dec 1] to [Jan 31]

[Export]
```

**Behavior**:
1. Show export dialog with options
2. Generate preview (optional, low res)
3. On export:
   - Render chart at specified resolution
   - Apply selected background
   - Use html2canvas or similar
   - Generate PNG blob
   - Download file
   - Show success notification

**Filename**: `[ChartName]-[Date].png`
Example: `Website-Redesign-2025-12-11.png`

**Quality Settings**:
- Standard (96 DPI): Good for screen, email
- High (300 DPI): Print quality
- Custom: User-specified

**Edge Cases**:
- Very large chart: May take time, show progress
- Browser limits: Reduce quality if canvas too large
- Custom range: Validate dates

**Acceptance Criteria**:
- ✓ Export dialog shown
- ✓ Preview accurate
- ✓ PNG generated correctly
- ✓ Resolution options work
- ✓ Transparent background works
- ✓ File downloads successfully

---

### 7.2 Export to PDF

**Description**: Generate vector PDF for printing and professional documents.

**Trigger**:
- Export menu → PDF
- Keyboard: Ctrl/Cmd + Shift + D

**Options**:
```
Export as PDF

Page Size:
[A4 ▼]  Options: A4, Letter, Legal, A3

Orientation:
◉ Landscape
○ Portrait

Page Layout:
◉ Fit to page width (scale to fit)
○ Tile across pages (full size)

Include:
☑ Chart title
☑ Legend
☑ Today marker
☑ Milestones
☑ Page numbers (for tiled output)

[Export]
```

**Behavior**:
1. Show export dialog with options
2. Generate PDF using jsPDF
3. Embed SVG (vector quality)
4. Add metadata (title, author, created date)
5. Download file

**Filename**: `[ChartName]-[Date].pdf`

### Fit to Page Width Mode

**Description**: Scale the entire chart to fit within one page width

**Behavior**:
- Calculate scale factor: `pageWidth / chartWidth`
- Apply scale uniformly (maintain aspect ratio)
- If scaled height exceeds page height, split vertically only
- Minimum scale: 0.25 (25%) to maintain readability
- If minimum scale exceeded, show warning and suggest tiling

**Page Layout**:
- Margins: 20mm all sides
- Title: Top of first page, 18pt
- Chart: Centered, scaled to fit
- Footer: Page numbers if multi-page

**Warnings**:
- If scale < 0.5: "Chart will be small. Consider tiling for better readability."
- If scale < 0.25: "Chart too large to fit. Use tiling mode instead."

**Example**:
```
Chart: 2000px wide × 800px tall
Page: A4 Landscape (297mm × 210mm)

Scale factor: 277mm / 2000px = 0.14
Result: Chart fits on 1 page, scaled to 14% (text may be small)
```

### Tile Across Pages Mode

**Description**: Split the chart across multiple pages at full size (or configurable scale)

**Behavior**:
- No horizontal scaling (100% or user-specified)
- Split chart into page-sized tiles
- Add crop marks and assembly guides
- Number pages for easy assembly

**Tiling Logic**:
```typescript
function calculateTiling(chartWidth: number, pageWidth: number, overlap: number = 20) {
  const usableWidth = pageWidth - (2 * overlap); // Account for overlap
  const pageCount = Math.ceil(chartWidth / usableWidth);

  const tiles = [];
  for (let i = 0; i < pageCount; i++) {
    tiles.push({
      pageNumber: i + 1,
      startX: i * usableWidth - (i > 0 ? overlap : 0),
      endX: Math.min((i + 1) * usableWidth + overlap, chartWidth),
      overlapLeft: i > 0 ? overlap : 0,
      overlapRight: i < pageCount - 1 ? overlap : 0
    });
  }

  return tiles;
}
```

**Page Layout**:
- Margins: 10mm (smaller for tiling)
- Overlap: 20mm between pages for alignment
- Crop marks: Corner marks for cutting/assembly
- Page indicators: "Page 1 of 5" in corner
- Assembly guide: "Continue to page 2 →" on edge

**Visual Guide**:
```
Page 1:        Page 2:        Page 3:
┌─────────┐   ┌─────────┐   ┌─────────┐
│█████████│   │█████████│   │█████████│
│█████████│ → │█████████│ → │█████████│
│█████████│   │█████████│   │█████████│
└─────────┘   └─────────┘   └─────────┘
  ↑ 20mm overlap on edges

Assembly: Align overlapping areas and tape/glue together
```

**Page Numbering**:
- Top right: "Page 1 of 5"
- Bottom: Assembly instructions on first page

**Edge Cases**:
- Very wide chart (> 20 pages): Warn user, show page count preview
- Narrow tasks on page boundaries: Ensure not split mid-task (adjust tile boundaries)

**Settings**:
- Overlap width: 10mm, 20mm (default), 30mm
- Show crop marks: on/off
- Scale for tiling: 100%, 75%, 50%

### Common Settings (Both Modes)

**Margins**: 10mm (tiling) or 20mm (fit-to-page)

**Header** (First page only):
- Chart title: 18pt, bold
- Date range: 12pt, below title

**Footer** (All pages):
- Page numbers: "Page X of Y" (right)
- Generation info: "Generated by [App Name] on [Date]" (left)

**Metadata**:
```javascript
{
  title: chart.name,
  author: "Gantt Chart App",
  subject: "Project Timeline",
  keywords: chart.tags?.join(', '),
  creator: "Gantt Chart App v1.0",
  created: new Date()
}
```

**Edge Cases**:
- Chart doesn't fit on page: Scale down or tile based on selection
- Very complex chart (> 1000 tasks): Show progress indicator, may take 10-30 seconds
- Chart with custom fonts: Embed fonts in PDF or convert to paths
- Transparent backgrounds: Convert to white for printing

**Acceptance Criteria**:
- ✓ PDF generated correctly
- ✓ Vector quality maintained
- ✓ Page settings applied
- ✓ Metadata included
- ✓ File downloads successfully

---

### 7.3 Export to SVG

**Description**: Export as editable vector graphic.

**Trigger**:
- Export menu → SVG

**Options**:
```
Export as SVG

Include:
☑ Embedded fonts
☑ CSS styles
☑ IDs for editing

Optimization:
○ None (editable)
◉ Optimized (smaller file)

[Export]
```

**Behavior**:
1. Clone chart SVG element
2. Clean up (remove event handlers, etc.)
3. Embed styles inline or as <style> tag
4. Optionally optimize (remove whitespace, etc.)
5. Generate SVG blob
6. Download file

**Filename**: `[ChartName]-[Date].svg`

**SVG Output**:
- Clean, semantic markup
- Grouped elements (tasks, dependencies, etc.)
- Text as <text> (not paths, unless "embed fonts")
- Reasonable file size

**Edge Cases**:
- Custom fonts: Embed or convert to paths
- Very large SVG: Optimize, or warn about size

**Acceptance Criteria**:
- ✓ SVG generated correctly
- ✓ Editable in design tools
- ✓ Styles preserved
- ✓ Text remains as text (if selected)
- ✓ File downloads successfully

---

## 8. Customization

### 8.1 Color Themes

**Description**: Apply pre-built color schemes to chart.

**Available Themes**:
1. **Default**: Blue accents, professional
2. **Pastel**: Soft, light colors
3. **Dark**: Dark background, light text
4. **Monochrome**: Grayscale only
5. **Vibrant**: Bold, saturated colors

**Behavior**:
1. Select theme from dropdown
2. All chart elements update colors
3. Preference saved to local storage
4. Applied to exports

**Theme Structure**:
```javascript
{
  name: "Default",
  colors: {
    primary: "#3b82f6",
    background: "#ffffff",
    taskBar: "#3b82f6",
    text: "#1f2937",
    grid: "#e5e7eb",
    today: "#ef4444"
  },
  taskPalette: [
    "#3b82f6", "#10b981", "#f59e0b", "#ef4444",
    "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"
  ]
}
```

**Edge Cases**:
- Theme with poor contrast: Show warning
- Custom theme: Allow user creation (future)

**Acceptance Criteria**:
- ✓ Theme selection works
- ✓ All elements update
- ✓ Preference saved
- ✓ Exports use theme

---

### 8.2 Individual Task Colors

**Description**: Customize color of specific tasks.

**Trigger**:
- Click color indicator on task row
- Task details panel → Color picker
- Right-click → Change Color

**Behavior**:
1. Color picker opens
2. Show:
   - Current color
   - Theme palette
   - Recent colors
   - Custom color picker
3. On select:
   - Task bar updates immediately
   - Color saved
   - History entry created

**Color Picker UI**:
```
┌─────────────────────────────┐
│ Task Color                  │
│ ───────────────────────────  │
│                             │
│ Theme Colors:               │
│ [■][■][■][■][■][■][■][■]    │
│                             │
│ Recent Colors:              │
│ [■][■][■][■]                │
│                             │
│ Custom: [#3b82f6] [Picker]  │
│                             │
└─────────────────────────────┘
```

**Edge Cases**:
- Invalid color: Fallback to previous
- Bulk color change: Apply to all selected

**Acceptance Criteria**:
- ✓ Color picker opens
- ✓ Color updates immediately
- ✓ Recent colors tracked
- ✓ Custom color works
- ✓ History entry created

---

### 8.3 View Mode (Day/Week/Month)

**Description**: Change timeline scale for different levels of detail.

**Modes**:
- **Day**: Show individual days, hourly divisions
- **Week**: Show weeks, daily divisions
- **Month**: Show months, weekly divisions

**Behavior**:
1. Click view mode toggle
2. Timeline re-renders with new scale
3. Task bars adjust width
4. Grid lines update
5. Time labels change format

**Timeline Details**:

| Mode  | Column Width | Time Label Format | Grid Lines   |
|-------|--------------|-------------------|--------------|
| Day   | 60px/day     | "Mon 15"          | Every day    |
| Week  | 120px/week   | "Week of Dec 15"  | Every week   |
| Month | 150px/month  | "December 2025"   | Every month  |

**Edge Cases**:
- Very long chart: Week or Month mode recommended
- Very short chart: Day mode shows best detail
- Switch modes while zoomed: Adjust zoom to reasonable level

**Acceptance Criteria**:
- ✓ Toggle switches modes
- ✓ Timeline re-renders correctly
- ✓ Task bars scale appropriately
- ✓ Labels update
- ✓ Grid lines adjust

---

## 9. Advanced Features

### 9.1 Keyboard Shortcuts

**Description**: Fast access to common actions via keyboard.

**Implemented Shortcuts**:
See UI/UX Specifications for complete list.

**Behavior**:
- Shortcuts work globally (when no input focused)
- Some work in context (e.g., Delete only with selection)
- Show shortcut hints in tooltips
- Help dialog lists all shortcuts (Ctrl/Cmd + /)

**Customization** (Future):
- Allow users to rebind shortcuts
- Check for conflicts

**Acceptance Criteria**:
- ✓ All shortcuts work as documented
- ✓ No conflicts
- ✓ Help dialog shows all shortcuts
- ✓ Shortcuts disabled when appropriate

---

### 9.2 Search / Filter

**Description**: Find tasks by name, date, or properties.

**Trigger**:
- Keyboard: Ctrl/Cmd + F
- Search icon in toolbar

**Behavior**:
1. Search bar appears at top of task list
2. Type to filter tasks in real-time
3. Chart updates to show only matching tasks
4. Highlight matches in task names

**Search Criteria**:
- Task name (fuzzy match)
- Date range
- Tags
- Color
- Progress range

**Edge Cases**:
- No matches: Show empty state
- Search with dependencies: Still show dependent tasks (grayed out)

**Acceptance Criteria**:
- ✓ Search bar appears
- ✓ Real-time filtering
- ✓ Matches highlighted
- ✓ Chart updates
- ✓ Clear search works

---

### 9.3 Smart Task Name Positioning

**Description**: Automatically position task names for optimal readability based on task bar width and viewport location.

**Configuration Options**:
- **Inside**: Always inside task bar
- **Above**: Always above task bar
- **Below**: Always below task bar
- **Smart**: Automatic positioning (default)

**Smart Positioning Algorithm**:

```typescript
function calculateTaskNamePosition(task: Task, taskBarWidth: number, viewportWidth: number, taskBarX: number): Position {
  const TEXT_PADDING = 8; // pixels
  const MIN_INSIDE_WIDTH = 100; // minimum bar width for inside text

  // Calculate text width
  const textWidth = measureText(task.name) + (TEXT_PADDING * 2);

  // Rule 1: If bar is wide enough, place inside
  if (taskBarWidth >= textWidth + (TEXT_PADDING * 2)) {
    return { position: 'inside', alignment: 'left', offset: TEXT_PADDING };
  }

  // Rule 2: If bar is moderately wide, place inside centered
  if (taskBarWidth >= MIN_INSIDE_WIDTH) {
    return { position: 'inside', alignment: 'center', offset: 0 };
  }

  // Rule 3: Check if text fits on the right side
  const rightEdge = taskBarX + taskBarWidth;
  const spaceOnRight = viewportWidth - rightEdge;

  if (spaceOnRight >= textWidth + TEXT_PADDING) {
    return { position: 'outside-right', alignment: 'left', offset: TEXT_PADDING };
  }

  // Rule 4: Check if text fits on the left side
  const spaceOnLeft = taskBarX;

  if (spaceOnLeft >= textWidth + TEXT_PADDING) {
    return { position: 'outside-left', alignment: 'right', offset: -TEXT_PADDING };
  }

  // Rule 5: Default to above if no space on sides
  return { position: 'above', alignment: 'left', offset: 0 };
}
```

**Visual Examples**:

```
Case 1: Wide task bar (> 100px)
┌─────────────────────────────┐
│  Design mockups             │  ← Inside, left-aligned
└─────────────────────────────┘

Case 2: Medium task bar (50-100px)
┌──────────────┐
│   Testing    │  ← Inside, centered
└──────────────┘

Case 3: Narrow task bar with space on right
┌────┐ Bug fix  ← Outside right
└────┘

Case 4: Narrow task bar near right edge
  Planning ┌────┐  ← Outside left
           └────┘

Case 5: Narrow bar, no side space
   Research
   ┌────┐  ← Above
   └────┘
```

**Behavior**:
- Position recalculates on:
  - Window resize
  - Zoom change
  - Task date change
  - Pan/scroll
- Smooth transitions between positions (CSS animation, 150ms)
- Text always readable (no overlap with other elements)

**Edge Cases**:
- Very long task names: Truncate with ellipsis, full name in tooltip
- Clustered tasks: Prioritize no overlap, may stack above/below alternately
- RTL languages: Flip left/right logic

**Acceptance Criteria**:
- ✓ Wide tasks show name inside
- ✓ Narrow tasks show name outside when possible
- ✓ No text overlap with task bars
- ✓ Position updates dynamically
- ✓ Smooth transitions
- ✓ Manual override works (inside/above/below settings)

---

### 9.4 Dependency Cascade Notifications

**Description**: Notify users when moving a task will automatically adjust multiple dependent tasks.

**Trigger**:
- User drags a task to a new date
- User edits start/end date of a task with dependencies
- User creates a new dependency that requires date adjustments

**Behavior**:

**Threshold**: If > 5 tasks will be affected, show notification

```typescript
interface CascadeNotification {
  affectedTaskCount: number;
  affectedTasks: Task[];
  cascadeDepth: number; // How many levels deep
  estimatedShift: number; // Days shifted
}

function checkDependencyCascade(movedTask: Task, newDate: Date): CascadeNotification {
  const affected = calculateAffectedTasks(movedTask, newDate);

  if (affected.length > 5) {
    return {
      affectedTaskCount: affected.length,
      affectedTasks: affected,
      cascadeDepth: calculateDepth(affected),
      estimatedShift: calculateDays(movedTask.startDate, newDate)
    };
  }

  return null;
}
```

**Notification Display**:

```
┌─────────────────────────────────────────────┐
│  ⚠️  Dependency Cascade                      │
│                                             │
│  Moving this task will affect 12 tasks:    │
│                                             │
│  • Frontend development    (+3 days)       │
│  • Backend integration     (+3 days)       │
│  • Testing phase           (+3 days)       │
│  • ... and 9 more tasks                    │
│                                             │
│  [Cancel]  [Show Preview]  [Apply Changes] │
└─────────────────────────────────────────────┘
```

**Preview Mode** (when "Show Preview" clicked):
- Highlight all affected tasks
- Show proposed new dates in ghost/outline style
- Allow user to review before confirming

**Toast Notification** (for smaller cascades, 2-5 tasks):
```
✓ Task moved. 3 dependent tasks adjusted.
  [Undo]
```

**Settings**:
- Cascade threshold (default: 5 tasks)
- Auto-adjust dependencies (on/off)
- Show preview for all cascades (on/off)

**Edge Cases**:
- Circular cascade detection: Prevent before showing notification
- Very deep cascade (> 50 tasks): Show warning, suggest restructuring
- Negative lag: Account for in cascade calculation

**Acceptance Criteria**:
- ✓ Notification appears when > 5 tasks affected
- ✓ Preview mode shows all changes
- ✓ User can cancel before applying
- ✓ Toast shows for smaller cascades
- ✓ Undo works for entire cascade
- ✓ Settings allow customization

---

## 10. Synced Copies (Future Feature - Post-MVP)

### 10.1 Create Synced Copy

**Description**: Create linked copies of tasks or task groups where changes to any copy automatically propagate to all other copies.

**Status**: Post-MVP feature, planned for V1.x or V2.0

**Trigger**:
- Right-click task/group → "Create Synced Copy"
- Select task/group → Ctrl/Cmd + Shift + D
- Drag task/group with Alt + Shift modifier

**Behavior**:
1. Creates a new task/group that is linked to the original
2. Both the original and copy are now part of a "sync group"
3. No distinction between "original" and "copy" - all are equal members
4. Visual indicator shows items are synced (link icon, subtle border)
5. Changes to any synced copy propagate to all others in the group
6. History entry created

**What Syncs**:
- Task name
- Description
- Tags
- Color
- Duration (optional, configurable)
- Custom fields

**What Doesn't Sync** (instance-specific):
- Start/end dates (each copy can be at different times)
- Progress percentage
- Dependencies (each copy can have different dependencies)
- Parent/group membership

**Sync Group Properties**:
```typescript
interface SyncGroup {
  id: string;
  name: string; // Optional name for the sync group
  createdAt: Date;
  memberIds: string[]; // IDs of all synced tasks/groups
  syncedFields: SyncField[]; // What fields are synced
  lastSyncedAt: Date;
}

enum SyncField {
  NAME = 'name',
  DESCRIPTION = 'description',
  TAGS = 'tags',
  COLOR = 'color',
  DURATION = 'duration',
  CUSTOM_FIELDS = 'customFields'
}
```

**Default Values**:
- New copy positioned 7 days after source
- Inherits all synced fields from source
- Sync group automatically created if not exists

**Edge Cases**:
- Creating synced copy of already-synced task: Adds to existing sync group
- Maximum synced copies per group: 50 (warn at 20, prevent at 50)
- Circular references: Prevented (cannot sync a group with its parent)
- Syncing tasks across different charts: Not supported in MVP

**Acceptance Criteria**:
- ✓ Synced copy created successfully
- ✓ Visual indicator visible on all synced items
- ✓ Changes propagate within 100ms
- ✓ Sync group created or extended
- ✓ History entry created
- ✓ Instance-specific fields remain independent

---

### 10.2 Edit Synced Copy

**Description**: Modify a synced task/group and propagate changes to all linked copies.

**Trigger**:
- Edit any synced task/group as normal
- UI shows warning: "This task is synced with 3 other tasks"

**Behavior**:
1. User edits a synced field (name, description, tags, etc.)
2. Warning banner appears: "⚠ Changes will affect 3 synced copies"
3. On save:
   - Change propagates to all members of sync group
   - Each synced copy updated
   - Dependency calculations re-run for each copy
   - History entry created for each affected task
   - Success notification: "Updated 4 synced tasks"

**Warning Dialog** (for significant changes):
```
⚠ Update Synced Tasks?

This task is synced with 3 other tasks:
• Phase 2 - Design Review (Jan 15-22)
• Phase 3 - Design Review (Feb 1-8)
• Phase 4 - Design Review (Mar 1-8)

Changing the name will update all 4 tasks.

□ Don't show this again for this sync group

[Cancel]  [Update All]
```

**Synced Fields Editing**:
- Name change: Propagates immediately, warning shown
- Description change: Propagates, no warning (silent update)
- Color change: Propagates immediately with visual feedback
- Duration change: Propagates, recalculates end dates for all copies
- Tags change: Propagates, merges with instance-specific tags (optional)

**Instance-Specific Fields Editing**:
- Start/end date: Only affects this copy, no propagation
- Progress: Only affects this copy
- Dependencies: Only affects this copy
- No warning shown

**Visual Feedback**:
- During edit: Subtle pulse animation on all synced copies
- After save: Brief highlight on all updated copies
- Status indicator: "Synced 4 tasks" in bottom corner

**Conflict Resolution**:
- If two users edit different synced copies simultaneously:
  - Last write wins (in browser storage context)
  - Show warning: "Sync conflict detected, refreshing..."
  - Auto-merge if possible, manual resolution if not

**Edge Cases**:
- Edit while offline: Queue changes, sync when back online
- Edit synced copy with circular dependencies: Warn and prevent
- Edit synced copy in collapsed group: Still propagates, visual feedback on group
- Very large sync group (> 20 members): Show progress indicator during update

**Acceptance Criteria**:
- ✓ Warning shown before editing synced field
- ✓ Changes propagate to all synced copies
- ✓ Instance-specific fields remain independent
- ✓ Visual feedback on all affected tasks
- ✓ History entries created for all changes
- ✓ Dependency chains remain valid
- ✓ Conflict resolution works correctly

---

### 10.3 Decouple Synced Copy

**Description**: Break the sync link for a task/group, making it independent.

**Trigger**:
- Right-click synced task → "Decouple from Sync Group"
- Select synced task → Ctrl/Cmd + Shift + U (unlink)
- In task details panel → "Unlink" button

**Behavior**:
1. Show confirmation dialog with decouple options
2. On confirm:
   - Remove task from sync group
   - Clear sync group reference on task
   - Retain all current field values
   - Task becomes fully independent
   - History entry created
   - Success notification: "Task decoupled from sync group"

**Decouple Options Dialog**:
```
Decouple "Design Review"?

This task is synced with 3 other tasks. Choose how to decouple:

◉ Decouple this task only
   Remove this task from sync group. Other tasks remain synced.

○ Decouple this task and all children (recursive)
   Remove this task and all nested tasks from their sync groups.

○ Dissolve entire sync group
   Break all sync links, making all 4 tasks independent.

Remaining synced tasks: 3
Affected children: 5 (if recursive selected)

[Cancel]  [Decouple]
```

**Decouple Modes**:

**1. Decouple This Task Only**:
- Removes only the selected task from its sync group
- If task is a group:
  - Children remain in their sync groups
  - Group itself is decoupled, children continue syncing
- Other members of sync group unaffected
- Fastest, safest option

**2. Decouple Recursive**:
- Removes selected task/group from sync group
- Recursively removes all children from their sync groups
- Walks the entire subtree and decouples everything
- Warning if > 10 tasks affected
- Use case: Splitting a phase completely

**3. Dissolve Entire Sync Group**:
- Removes all members from the sync group
- Deletes the sync group itself
- All tasks become independent
- Warning shown with count of affected tasks
- Requires additional confirmation if > 5 tasks

**Technical Implementation**:
```typescript
interface DecoupleOptions {
  mode: 'single' | 'recursive' | 'dissolve';
  taskId: string;
  syncGroupId: string;
  retainValues: boolean; // Keep current synced values (default: true)
}

function decoupleTask(options: DecoupleOptions): DecoupleResult {
  const { mode, taskId, syncGroupId, retainValues } = options;

  switch (mode) {
    case 'single':
      return decoupleSingleTask(taskId, syncGroupId, retainValues);

    case 'recursive':
      const affectedTasks = getSubtree(taskId);
      return affectedTasks.map(task =>
        decoupleSingleTask(task.id, task.syncGroupId, retainValues)
      );

    case 'dissolve':
      const syncGroup = getSyncGroup(syncGroupId);
      return syncGroup.memberIds.map(memberId =>
        decoupleSingleTask(memberId, syncGroupId, retainValues)
      );
  }
}

function decoupleSingleTask(
  taskId: string,
  syncGroupId: string,
  retainValues: boolean
): DecoupleResult {
  const task = getTask(taskId);
  const syncGroup = getSyncGroup(syncGroupId);

  // Remove from sync group
  syncGroup.memberIds = syncGroup.memberIds.filter(id => id !== taskId);

  // Clear sync reference on task
  task.syncGroupId = null;

  // Optionally clear synced values (restore to defaults)
  if (!retainValues) {
    resetSyncedFields(task);
  }

  // Delete sync group if empty
  if (syncGroup.memberIds.length === 0) {
    deleteSyncGroup(syncGroupId);
  }

  // Create history entry
  recordHistory({
    action: 'decouple_task',
    taskId,
    syncGroupId,
    mode: 'single'
  });

  return {
    success: true,
    taskId,
    affectedTaskIds: [taskId]
  };
}
```

**Visual Feedback**:
- Decoupling animation: Link icon fades out
- Synced border/highlight removed
- Brief "decoupled" badge appears
- All affected tasks flash briefly

**Undo Support**:
- Undo recreates sync group
- Re-links all decoupled tasks
- Restores sync group state
- Works for all decouple modes

**Edge Cases**:
- Decouple last remaining member: Deletes sync group automatically
- Decouple while sync in progress: Wait for sync to complete, then decouple
- Decouple in circular dependency: Warn and prevent if would break chart
- Decouple recursive with deeply nested hierarchy: Show progress for > 50 tasks

**Acceptance Criteria**:
- ✓ Decouple options dialog shows correct counts
- ✓ Single decouple removes only selected task
- ✓ Recursive decouple removes entire subtree from sync
- ✓ Dissolve removes all members from sync group
- ✓ Visual indicators removed after decouple
- ✓ Undo works for all decouple modes
- ✓ Sync group deleted when empty
- ✓ History entries created for all affected tasks
- ✓ No data loss (values retained by default)

---

### 10.4 Sync Group Management

**Description**: View and manage sync groups, see all synced copies, rename groups, etc.

**Trigger**:
- Click on sync indicator badge on task
- Menu → View → "Sync Groups Panel"
- Keyboard: Ctrl/Cmd + Shift + G

**Sync Groups Panel**:
```
┌─────────────────────────────────────────┐
│ Sync Groups                      [×]    │
├─────────────────────────────────────────┤
│                                         │
│ ● Design Review Tasks (4 tasks)        │
│   │                                     │
│   ├─ Phase 1 - Design Review           │
│   ├─ Phase 2 - Design Review           │
│   ├─ Phase 3 - Design Review           │
│   └─ Phase 4 - Design Review           │
│                                         │
│   Synced: Name, Color, Duration         │
│   [Rename] [Configure] [Dissolve]      │
│                                         │
│ ● Testing Activities (3 tasks)         │
│   │                                     │
│   ├─ Unit Testing                       │
│   ├─ Integration Testing                │
│   └─ E2E Testing                        │
│                                         │
│   Synced: Name, Description, Tags       │
│   [Rename] [Configure] [Dissolve]      │
│                                         │
└─────────────────────────────────────────┘
```

**Features**:
- List all sync groups in current chart
- Expand to see all members
- Click member to jump to task on chart
- Rename sync group
- Configure synced fields
- Dissolve group
- Export sync group as template (future)

**Configure Synced Fields Dialog**:
```
Configure Sync Group: "Design Review Tasks"

Which fields should be synced?

☑ Task Name
☑ Description
☑ Color
☐ Duration (changing this will update end dates)
☑ Tags
☐ Custom Fields

Changes will update all 4 tasks in this group.

[Cancel]  [Update]
```

**Sync Indicators**:
- Task row: Small link icon (🔗) badge
- Task bar: Subtle dotted border
- Tooltip: "Synced with 3 other tasks (Design Review Tasks)"
- Color: Sync group color (optional, generated automatically)

**Edge Cases**:
- Sync groups panel with 50+ groups: Virtualized list, search filter
- Renaming sync group: Updates all member tooltips
- Configuring fields: Immediate re-sync of all members
- Deleting task in sync group: Auto-removes from group, updates count

**Acceptance Criteria**:
- ✓ Sync groups panel shows all groups
- ✓ Members list correct for each group
- ✓ Rename updates all references
- ✓ Configure fields re-syncs immediately
- ✓ Dissolve works from panel
- ✓ Jump to task works
- ✓ Visual indicators accurate

---

### 10.5 Sync Inheritance (Groups)

**Description**: When a group is synced, all children inherit the sync relationship.

**Behavior**:

**Scenario 1: Create Synced Copy of Group**:
```
Original Group: "Phase 1"
  ├─ Task A (Design)
  ├─ Task B (Development)
  └─ Task C (Testing)

Action: Create Synced Copy → "Phase 2"

Result:
Group "Phase 1" → Synced with "Phase 2" (Sync Group 1)
  ├─ Task A (Design) → Synced with "Phase 2 → Task A" (Sync Group A)
  ├─ Task B (Development) → Synced with "Phase 2 → Task B" (Sync Group B)
  └─ Task C (Testing) → Synced with "Phase 2 → Task C" (Sync Group C)

Total Sync Groups Created: 4
```

**Scenario 2: Adding Task to Synced Group**:
```
Group "Phase 1" is synced with "Phase 2"

Action: Add new task "Task D (Deployment)" to "Phase 1"

Result:
Task D is automatically added to "Phase 2" as well
Task D in Phase 1 → Synced with Task D in Phase 2 (New Sync Group D)

Notification: "New task added to synced group. Created in 2 groups."
```

**Scenario 3: Deleting Task from Synced Group**:
```
Action: Delete "Task C (Testing)" from "Phase 1"

Confirmation:
⚠ Delete Synced Task?

This task is synced with 1 other task in "Phase 2".

○ Delete from this group only
   Remove from "Phase 1", keep in "Phase 2" (breaks sync)

◉ Delete from all synced groups (recommended)
   Remove from "Phase 1" and "Phase 2"

[Cancel]  [Delete]
```

**Inheritance Rules**:
1. **New children inherit group's sync**: When adding task to synced group, task is auto-synced
2. **Decoupling group doesn't decouple children**: Use "Decouple Recursive" for that
3. **Deleting synced group**: Option to delete from all sync instances or just one
4. **Moving task between synced groups**: Breaks old sync, joins new sync (if target is synced)

**Edge Cases**:
- Creating synced copy of group with 50+ tasks: Show progress, batch create sync groups
- Adding task to multiple synced groups simultaneously: Merge into one large sync group
- Deeply nested groups (3+ levels): Sync inheritance applies at all levels
- Circular group references: Prevented at creation time

**Acceptance Criteria**:
- ✓ Children of synced group automatically sync
- ✓ Adding task to synced group creates sync for new task
- ✓ Deleting task offers delete from all or just one
- ✓ Moving task between groups updates sync membership
- ✓ Progress shown for large group operations
- ✓ Nested group inheritance works correctly

---

## 11. Summary

This document specifies all major features with detailed behavior, edge cases, and acceptance criteria. Use this as the source of truth during development and testing.

---

**Document Version**: 1.4
**Last Updated**: 2025-12-12
**Status**: Draft

**Recent Updates (v1.4)** - Synced Copies Feature Addition:
- Added comprehensive Synced Copies feature specification (Section 10):
  - Create Synced Copy with bidirectional sync (no "original" concept)
  - Edit Synced Copy with automatic propagation to all members
  - Decouple options: single, recursive, and dissolve entire sync group
  - Sync Group Management panel for viewing and configuring sync groups
  - Sync Inheritance for groups (children automatically sync)
  - Configurable synced fields (name, description, color, duration, tags, custom)
  - Visual indicators and warning systems to prevent unintended changes
  - Use case: Recurring phases/tasks across project timeline

**Previous Updates (v1.3)** - Based on Second Professional Review:
- Added formal Dependency Resolution Algorithm (Section 3.4) with:
  - Complete propagation algorithm with topological sort
  - Mixed dependency type examples (FS, SS, FF, SF)
  - Constraint resolution policy and performance optimization
- Enhanced Auto-Save & Recovery specification (Section 5.3) with:
  - Detailed debouncing strategy and cadence
  - Snapshot + diff storage structure
  - Quota management and handling
  - Multi-tab conflict detection
  - Private browsing detection
  - Complete recovery flow

**Previous Updates (v1.2)** - Based on First Professional Review:
- Added Smart Task Name Positioning specification (Section 9.3) with detailed algorithm
- Added Dependency Cascade Notifications feature (Section 9.4) for better UX
- Enhanced PDF Export with dual-mode pagination (Section 7.2):
  - Fit-to-page mode with scaling
  - Tile-across-pages mode with assembly guides
- Added detailed tiling logic and page layout specifications

**Previous Updates (v1.1)**:
- Added Copy/Paste Tasks feature (Section 2.6)
- Added Task Groups/Phases feature (Section 2.7)
- Added UI Density/Compactness settings (Section 8.4)
- Added Task Name Position configuration (Section 8.5)
- Added Show/Hide History Timeline (Section 8.6)
- Added Duplicate Timeline at Bottom (Section 8.7)
- Added First Day of Week setting (Section 8.8)
- Added Date Format preference (Section 8.9)
