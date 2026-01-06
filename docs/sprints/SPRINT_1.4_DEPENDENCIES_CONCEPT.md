# Sprint 1.4: Dependencies (Finish-to-Start) - Team Concept

**Project:** Gantt Chart Application - app-gantt
**Sprint:** Sprint 1.4 - Dependencies (FS Only)
**Status:** ✅ COMPLETE
**Date:** 2026-01-03 (Concept Created)
**Completed:** 2026-01-04
**Priority:** Critical (Core MVP Feature)
**Estimated Duration:** 1.5 weeks (7-8 working days)

---

## Executive Summary

### Sprint Goal
Implement task dependencies allowing users to define relationships between tasks. This sprint focuses exclusively on **Finish-to-Start (FS)** dependencies - the most common and intuitive type where one task must finish before another can start. Users can create dependencies via drag interaction or connection handles, with visual arrows on the timeline and automatic date adjustment for dependent tasks.

### Success Metrics
- [ ] Users can create FS dependencies between any two tasks
- [ ] Dependency arrows render clearly on the timeline (no overlapping tasks)
- [ ] Circular dependencies are detected and blocked with clear error
- [ ] Dependent task dates auto-adjust when predecessor changes
- [ ] Performance: 100 tasks with 50 dependencies at 60fps
- [ ] Dependencies persist in .ownchart file format
- [ ] Full undo/redo support for dependency operations

### Sprint Completion Checkpoint
**Visual Test:** "I can link tasks together"
- User selects a task bar on timeline
- User drags from connection handle to another task
- Dependency arrow appears between tasks
- Successor task dates shift automatically if needed
- User tries to create circular dependency (A→B→C→A)
- Clear error message appears, dependency rejected
- User presses Ctrl+Z, dependency is undone

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

**Name:** Product Lead
**Role:** Define user value, prioritize features, acceptance criteria

#### Key Decisions & Requirements

**Critical Feature Rationale:**
> "Dependencies are the heart of project planning. Without them, a Gantt chart is just a list of colored bars. The ability to say 'Task B cannot start until Task A finishes' is what transforms our tool from a simple timeline into a real project management solution. This is non-negotiable for MVP - every competitor has dependencies."

**User Value Proposition:**
1. **Project Logic**: Express real-world task relationships
2. **Automatic Scheduling**: Dependent tasks adjust when predecessors change
3. **Risk Visualization**: See cascading delays before they happen
4. **Professional Standard**: Expected feature in all Gantt tools
5. **Planning Confidence**: Understand project critical path (future)

**Feature Priority Ranking:**
1. **Critical:** Create FS dependency via drag (Alt+Drag or connection handles)
2. **Critical:** Visual dependency arrows on timeline
3. **Critical:** Circular dependency prevention with clear error
4. **Critical:** Auto-adjust successor dates when predecessor changes
5. **High:** Delete dependency (right-click menu or select+Delete)
6. **High:** Dependency persists in file format
7. **High:** Full undo/redo support
8. **Medium:** Lag/lead time input (offset days) - defer if time-constrained
9. **Low:** Dependency list panel (V1.1)
10. **Deferred:** Advanced types (SS, FF, SF) - V1.1 Premium feature

**Acceptance Criteria:**
- [ ] Connection handles appear when hovering task bar (small circles at start/end)
- [ ] Dragging from handle to another task creates dependency
- [ ] Alt+Drag from task to task creates dependency (power user shortcut)
- [ ] Arrow renders from predecessor end to successor start
- [ ] Arrow path avoids crossing task bars where possible
- [ ] Creating A→B dependency shifts B forward if B starts before A ends
- [ ] Creating circular dependency shows error toast, operation rejected
- [ ] Dependency stored in file, loads correctly
- [ ] Ctrl+Z undoes dependency creation
- [ ] Performance: Smooth 60fps with 50+ dependencies visible

**User Stories:**
- As a project manager, I want to link tasks so I can see which tasks depend on others
- As a planner, I want to see delays cascade through dependent tasks
- As a careful user, I want to be warned when I create an impossible circular dependency
- As a new user, I want to discover dependency creation through visible handles

---

### 2. Project Manager - Timeline & Risk Management

**Name:** Project Coordinator
**Role:** Schedule tracking, risk mitigation, resource allocation

#### Project Planning

**Time Breakdown:**
```
Day 1 (6 hours):
  - 0.5h: Team alignment meeting
  - 2h: Dependency data model & TypeScript types
  - 2h: dependencySlice store with CRUD operations
  - 1h: Unit tests for store operations
  - 0.5h: Code review

Day 2 (6 hours):
  - 2h: Graph traversal utilities (topological sort, cycle detection)
  - 2h: Date adjustment algorithm (cascade propagation)
  - 1.5h: Unit tests for graph algorithms
  - 0.5h: Code review

Day 3 (6 hours):
  - 2h: Connection handle UI components (TaskBar enhancement)
  - 2h: Drag interaction for creating dependencies
  - 1h: Alt+Drag keyboard shortcut
  - 1h: Integration tests

Day 4 (6 hours):
  - 3h: SVG arrow path calculation (Bézier curves)
  - 2h: DependencyArrows component rendering
  - 1h: Arrow styling and optimization

Day 5 (6 hours):
  - 2h: Auto-date adjustment integration
  - 2h: Circular dependency detection & error handling
  - 1h: Toast notifications for operations
  - 1h: Undo/redo integration

Day 6 (5 hours):
  - 2h: File format integration (serialize/deserialize)
  - 1.5h: Cross-browser testing
  - 1h: Performance testing (100 tasks, 50 dependencies)
  - 0.5h: Bug fixes

Day 7 (4 hours):
  - 1h: Edge case testing
  - 1h: Documentation updates
  - 1h: Final code review
  - 1h: README & CHANGELOG

Total: 39 hours over 7 days
```

**Milestones:**
- **M1** (End of Day 2): Dependency store & algorithms complete
- **M2** (End of Day 4): Visual dependencies working (arrows render)
- **M3** (End of Day 5): Full interaction complete (create, auto-adjust, validation)
- **M4** (End of Day 7): Sprint complete, all tests passing

**Risk Register:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Arrow path calculation too complex | Medium | High | Use proven Bézier curve approach from SVAR analysis |
| Performance with many dependencies | Medium | High | Optimize SVG rendering, test early |
| Cycle detection algorithm incorrect | Low | Critical | Comprehensive test cases, proven DFS approach |
| Date adjustment cascades infinitely | Low | Critical | Topological sort ensures finite iterations |
| User confused by circular dep error | Medium | Medium | Clear error message with involved tasks listed |
| Connection handles not discoverable | Medium | Medium | Subtle animation on hover, tooltip hint |

**Dependencies:**
- Sprint 1.3 complete (file operations for persistence)
- Sprint 1.5 complete (undo/redo for dependency operations)
- Sprint 1.2 complete (timeline for arrow rendering)
- DATA_MODEL.md Dependency interface specification

**Quality Gates:**
- [ ] All unit tests pass (>85% coverage on new code)
- [ ] All algorithm tests pass (cycle detection, topological sort)
- [ ] Manual testing checklist completed
- [ ] Performance verified (60fps with 50 dependencies)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Code reviewed and approved
- [ ] Documentation updated (README, CHANGELOG)

---

### 3. UX/UI Designer - Interaction Design

**Name:** UX Designer
**Role:** User experience, visual design, interaction patterns

#### Interaction Design Specifications

**Design Principles:**
1. **Discoverable**: Connection handles visible on hover
2. **Intuitive**: Drag naturally creates relationship
3. **Clear Feedback**: Arrow shows relationship direction
4. **Error Prevention**: Circular deps blocked immediately
5. **Reversible**: Easy undo with Ctrl+Z

**Connection Handle Design:**

```
Task Bar (normal state):
┌─────────────────────────────────────────┐
│  Design mockups                         │
└─────────────────────────────────────────┘

Task Bar (hover state - handles appear):
  ○────────────────────────────────────────○
┌─┼─────────────────────────────────────┼─┐
│  Design mockups                         │
└─────────────────────────────────────────┘
  ↑                                       ↑
  Start handle                     End handle
  (gray circle, 8px)              (gray circle, 8px)
```

**Handle States:**
```
Normal:          ○   (gray, 8px, 50% opacity)
Hover:           ●   (blue, 10px, 100% opacity)
Dragging:        ●   (blue with pulse animation)
Drop Target:     ◉   (blue ring, 12px)
Invalid Target:  ◉   (red ring - would create cycle)
```

**Dependency Arrow Design:**

```
Predecessor Task                    Successor Task
┌──────────────────────┐            ┌──────────────────────┐
│  Design mockups      │            │  Development         │
└──────────────────────┼────────────┼──────────────────────┘
                       │            │
                       └─────●──────→
                       Bézier curve with arrowhead

Arrow Specifications:
- Color: #64748b (slate-500)
- Stroke width: 2px
- Arrowhead: Filled triangle (8px)
- Curve: Smooth Bézier, not straight line
- Hover: Stroke width 3px, cursor pointer
```

**Arrow Path Routing:**

```
Case 1: Simple horizontal (no overlap)
┌────────────────┐
│ Task A         │──────────●────→┌────────────────┐
└────────────────┘                │ Task B         │
                                  └────────────────┘

Case 2: Tasks overlap vertically (curve around)
┌────────────────┐
│ Task A         │────┐
└────────────────┘    │
                      └─────────●────→┌────────────────┐
                                      │ Task B         │
                                      └────────────────┘

Case 3: Successor before predecessor (wrap down and around)
                      ┌────────────────┐
                      │ Task B         │←────────┐
                      └────────────────┘         │
                                                 │
┌────────────────┐                               │
│ Task A         │───────────────────────────────┘
└────────────────┘
```

**Drag Interaction Flow:**

```
1. User hovers task bar
   → Connection handles fade in (both ends)

2. User clicks and drags from END handle
   → Temporary arrow follows cursor
   → Valid drop targets highlight (blue ring)
   → Invalid targets highlight (red ring - would create cycle)

3. User drops on valid target task
   → Dependency created
   → Arrow renders
   → Toast: "Dependency created: Task A → Task B"
   → If dates conflict: "Task B shifted to [date] due to dependency"

4. User drops on invalid target (cycle)
   → Arrow disappears
   → Toast error: "Cannot create dependency: Would create circular dependency"
   → Error lists involved tasks: "Task A → Task B → Task C → Task A"

5. User releases without valid target
   → Temporary arrow disappears
   → No action taken
```

**Alt+Drag Shortcut:**

```
Power User Flow:
1. User holds Alt key
2. Cursor changes to "link" cursor
3. User clicks and drags from any task bar (no need to hit handle)
4. Same drop validation as handle drag
5. Release Alt to cancel

Visual Indicator:
- Cursor: "alias" (link icon)
- Task bar shows subtle highlight while Alt held
```

**Delete Dependency Interaction:**

```
Method 1: Click arrow + Delete key
1. User clicks dependency arrow
   → Arrow highlights (thicker, brighter color)
   → Keyboard focus moves to arrow
2. User presses Delete or Backspace
   → Dependency removed
   → Toast: "Dependency removed: Task A → Task B"

Method 2: Right-click context menu
1. User right-clicks dependency arrow
2. Context menu appears:
   ┌─────────────────────────┐
   │ Delete Dependency       │
   │ ─────────────────────── │
   │ Task A → Task B         │ (informational)
   └─────────────────────────┘
3. User clicks "Delete Dependency"
   → Dependency removed

Method 3: Right-click on task
1. User right-clicks task bar
2. Context menu includes dependency section:
   ┌─────────────────────────┐
   │ Edit Task               │
   │ Delete Task             │
   │ ─────────────────────── │
   │ Dependencies:           │
   │   ← From: Design        │ [x]
   │   → To: Testing         │ [x]
   └─────────────────────────┘
3. User clicks [x] to remove specific dependency
```

**Circular Dependency Error:**

```
Error Toast (red background):
┌────────────────────────────────────────────────────────┐
│ ⚠️  Cannot create dependency                           │
│                                                        │
│ This would create a circular dependency:               │
│ Design → Development → Testing → Design                │
│                                                        │
│ A task cannot depend on itself through a chain.        │
└────────────────────────────────────────────────────────┘
```

**Date Adjustment Notification:**

```
Info Toast (blue background):
┌────────────────────────────────────────────────────────┐
│ ℹ️  Task dates adjusted                                 │
│                                                        │
│ "Development" moved to Jan 15 - Jan 22                 │
│ (shifted 3 days forward due to dependency)             │
│                                        [Undo]          │
└────────────────────────────────────────────────────────┘
```

**Keyboard Shortcuts:**

| Action | Shortcut | Notes |
|--------|----------|-------|
| Create dependency | Alt+Drag | From any part of task bar |
| Delete dependency | Delete/Backspace | When arrow is selected |
| Select arrow | Click | Single click selects |
| Cancel drag | Escape | While dragging |
| Undo | Ctrl+Z | Works for dependency operations |

**Accessibility Considerations:**
- Arrows have ARIA labels: "Dependency from [Task A] to [Task B]"
- Keyboard navigation to select arrows (Tab through timeline elements)
- Screen reader announces dependency creation/deletion
- High contrast mode: Arrows use distinct color (not just gray)
- Focus indicator on selected arrow (dashed outline)

---

### 4. Software Architect - System Design

**Name:** System Architect
**Role:** Technical architecture, algorithms, data structures

#### Architecture Overview

**Data Model (from DATA_MODEL.md):**

```typescript
interface Dependency {
  id: string;                    // UUID v4
  fromTaskId: string;            // Predecessor task ID
  toTaskId: string;              // Successor task ID
  type: DependencyType;          // 'FS' for this sprint
  lag?: number;                  // Offset days (positive = gap, negative = overlap)
  createdAt: string;             // ISO 8601 timestamp
}

enum DependencyType {
  FINISH_TO_START = 'FS',        // A finishes → B starts
  // Future: SS, FF, SF
}
```

**Store Architecture:**

```
┌────────────────────────────────────────────────────────────┐
│                     Application State                       │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  taskSlice          dependencySlice       historySlice     │
│  ┌──────────────┐   ┌──────────────┐     ┌──────────────┐  │
│  │ tasks[]      │   │ dependencies[]│     │ undoStack[]  │  │
│  │ selection    │   │              │     │ redoStack[]  │  │
│  └──────────────┘   └──────────────┘     └──────────────┘  │
│         │                  │                    │          │
│         └──────────────────┼────────────────────┘          │
│                            │                               │
│                    ┌───────▼───────┐                       │
│                    │ Graph Utils   │                       │
│                    │ ─────────────  │                       │
│                    │ - topSort()   │                       │
│                    │ - detectCycle()│                       │
│                    │ - propagate() │                       │
│                    └───────────────┘                       │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Graph Algorithm Design:**

```typescript
// Cycle Detection using DFS
// Time Complexity: O(V + E) where V = tasks, E = dependencies
// Space Complexity: O(V) for recursion stack

interface CycleDetectionResult {
  hasCycle: boolean;
  cyclePath?: string[];  // Task IDs forming the cycle
}

function detectCycle(
  dependencies: Dependency[],
  newDependency?: Dependency
): CycleDetectionResult {
  // Build adjacency list
  const graph = new Map<string, string[]>();

  // Add existing dependencies
  for (const dep of dependencies) {
    if (!graph.has(dep.fromTaskId)) {
      graph.set(dep.fromTaskId, []);
    }
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
  }

  // Add proposed new dependency
  if (newDependency) {
    if (!graph.has(newDependency.fromTaskId)) {
      graph.set(newDependency.fromTaskId, []);
    }
    graph.get(newDependency.fromTaskId)!.push(newDependency.toTaskId);
  }

  // DFS with recursion stack tracking
  const visited = new Set<string>();
  const inStack = new Set<string>();
  const path: string[] = [];

  function dfs(node: string): string[] | null {
    visited.add(node);
    inStack.add(node);
    path.push(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const result = dfs(neighbor);
        if (result) return result;
      } else if (inStack.has(neighbor)) {
        // Cycle found - return cycle path
        const cycleStart = path.indexOf(neighbor);
        return [...path.slice(cycleStart), neighbor];
      }
    }

    inStack.delete(node);
    path.pop();
    return null;
  }

  // Check from all nodes (handles disconnected components)
  for (const node of graph.keys()) {
    if (!visited.has(node)) {
      const cycle = dfs(node);
      if (cycle) {
        return { hasCycle: true, cyclePath: cycle };
      }
    }
  }

  return { hasCycle: false };
}
```

**Topological Sort for Date Propagation:**

```typescript
// Kahn's Algorithm for topological sort
// Returns tasks in order where predecessors come before successors
// Time Complexity: O(V + E)

function topologicalSort(
  tasks: Task[],
  dependencies: Dependency[]
): Task[] {
  const taskMap = new Map(tasks.map(t => [t.id, t]));
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  // Initialize
  for (const task of tasks) {
    inDegree.set(task.id, 0);
    graph.set(task.id, []);
  }

  // Build graph and count in-degrees
  for (const dep of dependencies) {
    graph.get(dep.fromTaskId)!.push(dep.toTaskId);
    inDegree.set(dep.toTaskId, (inDegree.get(dep.toTaskId) || 0) + 1);
  }

  // Start with tasks that have no predecessors
  const queue: string[] = [];
  for (const [taskId, degree] of inDegree) {
    if (degree === 0) {
      queue.push(taskId);
    }
  }

  const result: Task[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(taskMap.get(current)!);

    for (const neighbor of graph.get(current) || []) {
      const newDegree = inDegree.get(neighbor)! - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return result;
}
```

**Date Propagation Algorithm:**

```typescript
// Propagate date changes through dependency chain
// Uses topological sort to ensure correct order

interface DateAdjustment {
  taskId: string;
  oldStartDate: string;
  oldEndDate: string;
  newStartDate: string;
  newEndDate: string;
}

function propagateDates(
  tasks: Task[],
  dependencies: Dependency[],
  changedTaskId: string
): DateAdjustment[] {
  const adjustments: DateAdjustment[] = [];
  const taskMap = new Map(tasks.map(t => [t.id, { ...t }])); // Clone for mutation

  // Get successors of changed task in topological order
  const sortedTasks = topologicalSort(tasks, dependencies);
  const changedIndex = sortedTasks.findIndex(t => t.id === changedTaskId);
  const tasksToProcess = sortedTasks.slice(changedIndex + 1);

  // Build predecessor map for quick lookup
  const predecessors = new Map<string, Dependency[]>();
  for (const dep of dependencies) {
    if (!predecessors.has(dep.toTaskId)) {
      predecessors.set(dep.toTaskId, []);
    }
    predecessors.get(dep.toTaskId)!.push(dep);
  }

  // Process each task in topological order
  for (const task of tasksToProcess) {
    const deps = predecessors.get(task.id) || [];
    if (deps.length === 0) continue;

    // Find latest predecessor end date (considering lag)
    let earliestStart = new Date(0);

    for (const dep of deps) {
      const predecessor = taskMap.get(dep.fromTaskId);
      if (!predecessor) continue;

      const predEnd = new Date(predecessor.endDate);
      const lag = dep.lag || 0;

      // For FS: successor starts after predecessor ends + lag
      const requiredStart = new Date(predEnd);
      requiredStart.setDate(requiredStart.getDate() + 1 + lag); // +1 for "after"

      if (requiredStart > earliestStart) {
        earliestStart = requiredStart;
      }
    }

    // Check if task needs to move
    const currentStart = new Date(task.startDate);
    if (earliestStart > currentStart) {
      const daysDiff = Math.ceil(
        (earliestStart.getTime() - currentStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      const newStart = new Date(task.startDate);
      newStart.setDate(newStart.getDate() + daysDiff);

      const newEnd = new Date(task.endDate);
      newEnd.setDate(newEnd.getDate() + daysDiff);

      adjustments.push({
        taskId: task.id,
        oldStartDate: task.startDate,
        oldEndDate: task.endDate,
        newStartDate: newStart.toISOString().split('T')[0],
        newEndDate: newEnd.toISOString().split('T')[0]
      });

      // Update task map for cascading propagation
      const updatedTask = taskMap.get(task.id)!;
      updatedTask.startDate = newStart.toISOString().split('T')[0];
      updatedTask.endDate = newEnd.toISOString().split('T')[0];
    }
  }

  return adjustments;
}
```

**Arrow Path Calculation (Bézier Curves):**

```typescript
// Generate SVG path for dependency arrow
// Uses quadratic Bézier curves for smooth routing

interface ArrowPath {
  path: string;           // SVG path d attribute
  arrowHead: {            // Arrowhead position and rotation
    x: number;
    y: number;
    angle: number;
  };
}

function calculateArrowPath(
  fromTask: { x: number; y: number; width: number; height: number },
  toTask: { x: number; y: number; width: number; height: number },
  rowHeight: number
): ArrowPath {
  // Start point: right edge of predecessor, vertically centered
  const startX = fromTask.x + fromTask.width;
  const startY = fromTask.y + fromTask.height / 2;

  // End point: left edge of successor, vertically centered
  const endX = toTask.x;
  const endY = toTask.y + toTask.height / 2;

  // Determine routing strategy based on relative positions
  const horizontalGap = endX - startX;
  const verticalGap = endY - startY;

  let path: string;
  let arrowAngle: number;

  if (horizontalGap > 30) {
    // Case 1: Simple curve (enough horizontal space)
    // Control point creates smooth curve
    const controlX = startX + horizontalGap / 2;

    path = `M ${startX} ${startY} ` +
           `Q ${controlX} ${startY}, ${controlX} ${(startY + endY) / 2} ` +
           `Q ${controlX} ${endY}, ${endX} ${endY}`;

    arrowAngle = Math.atan2(endY - (startY + endY) / 2, endX - controlX) * 180 / Math.PI;
  } else {
    // Case 2: Need to route around (tasks overlap or successor is before)
    const routeY = Math.max(fromTask.y + rowHeight, toTask.y + rowHeight) + 20;

    path = `M ${startX} ${startY} ` +
           `L ${startX + 15} ${startY} ` +
           `Q ${startX + 15} ${routeY}, ${startX + 30} ${routeY} ` +
           `L ${endX - 30} ${routeY} ` +
           `Q ${endX - 15} ${routeY}, ${endX - 15} ${endY} ` +
           `L ${endX} ${endY}`;

    arrowAngle = 0; // Pointing right
  }

  return {
    path,
    arrowHead: {
      x: endX,
      y: endY,
      angle: arrowAngle
    }
  };
}
```

**Performance Optimization Strategy:**

```
1. Memoization
   - Cache arrow paths (recalculate only on task position change)
   - Use React.memo for DependencyArrow components
   - Memoize cycle detection results

2. Batch Updates
   - Group multiple date adjustments into single state update
   - Use Immer for efficient immutable updates

3. Virtual Rendering
   - Only render arrows for visible tasks
   - Use IntersectionObserver for arrow visibility
   - Defer off-screen arrow calculation

4. SVG Optimization
   - Use path elements (more efficient than polyline)
   - Minimize DOM nodes
   - Consider Canvas fallback for >100 dependencies
```

---

### 5. Frontend Developer - Implementation Lead

**Name:** Frontend Engineer
**Role:** React implementation, state management, component development

#### Technical Implementation Plan

**File Structure:**

```
src/
├── store/
│   └── slices/
│       └── dependencySlice.ts     # Dependency state management
├── utils/
│   ├── graph/
│   │   ├── index.ts               # Public API
│   │   ├── cycleDetection.ts      # Cycle detection algorithm
│   │   ├── topologicalSort.ts     # Topological sort
│   │   └── datePropagation.ts     # Date adjustment logic
│   └── arrowPath/
│       ├── index.ts               # Public API
│       └── bezierPath.ts          # Bézier curve calculation
├── components/
│   ├── Timeline/
│   │   ├── DependencyArrows.tsx   # Container for all arrows
│   │   ├── DependencyArrow.tsx    # Single arrow component
│   │   └── ConnectionHandles.tsx  # Task bar connection handles
│   └── TaskBar/
│       └── TaskBar.tsx            # Enhanced with handles
├── hooks/
│   ├── useDependencyDrag.ts       # Drag interaction hook
│   └── useDependencyOperations.ts # CRUD operations hook
└── types/
    └── dependency.types.ts        # TypeScript interfaces
tests/
├── unit/
│   ├── graph/
│   │   ├── cycleDetection.test.ts
│   │   ├── topologicalSort.test.ts
│   │   └── datePropagation.test.ts
│   └── dependencySlice.test.ts
└── integration/
    └── dependencies.test.ts
```

**Dependency Store (dependencySlice.ts):**

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useHistoryStore } from './historySlice';
import { useTaskStore } from './taskSlice';
import { detectCycle, propagateDates } from '@/utils/graph';
import { CommandType } from '@/types/command.types';
import type { Dependency, DependencyType } from '@/types/dependency.types';

interface DependencyState {
  dependencies: Dependency[];
}

interface DependencyActions {
  // CRUD
  addDependency: (fromTaskId: string, toTaskId: string, type?: DependencyType, lag?: number) =>
    { success: boolean; error?: string; dependency?: Dependency };
  removeDependency: (id: string) => void;
  updateDependency: (id: string, updates: Partial<Dependency>) => void;

  // Bulk operations
  setDependencies: (dependencies: Dependency[]) => void;
  clearDependencies: () => void;

  // Queries
  getDependenciesForTask: (taskId: string) => {
    predecessors: Dependency[];
    successors: Dependency[];
  };
  hasDependency: (fromTaskId: string, toTaskId: string) => boolean;

  // Validation
  wouldCreateCycle: (fromTaskId: string, toTaskId: string) => {
    wouldCycle: boolean;
    cyclePath?: string[];
  };
}

type DependencyStore = DependencyState & DependencyActions;

export const useDependencyStore = create<DependencyStore>()(
  immer((set, get) => ({
    dependencies: [],

    addDependency: (fromTaskId, toTaskId, type = 'FS', lag = 0) => {
      const historyStore = useHistoryStore.getState();
      const taskStore = useTaskStore.getState();

      // Validation: Can't depend on self
      if (fromTaskId === toTaskId) {
        return { success: false, error: 'Task cannot depend on itself' };
      }

      // Validation: Check tasks exist
      const fromTask = taskStore.tasks.find(t => t.id === fromTaskId);
      const toTask = taskStore.tasks.find(t => t.id === toTaskId);
      if (!fromTask || !toTask) {
        return { success: false, error: 'One or both tasks not found' };
      }

      // Validation: Check for duplicate
      if (get().hasDependency(fromTaskId, toTaskId)) {
        return { success: false, error: 'Dependency already exists' };
      }

      // Validation: Check for cycle
      const cycleCheck = get().wouldCreateCycle(fromTaskId, toTaskId);
      if (cycleCheck.wouldCycle) {
        const taskNames = cycleCheck.cyclePath!.map(id => {
          const task = taskStore.tasks.find(t => t.id === id);
          return task?.name || id;
        });
        return {
          success: false,
          error: `Would create circular dependency: ${taskNames.join(' → ')}`
        };
      }

      // Create dependency
      const newDependency: Dependency = {
        id: crypto.randomUUID(),
        fromTaskId,
        toTaskId,
        type: type as DependencyType,
        lag,
        createdAt: new Date().toISOString()
      };

      set((state) => {
        state.dependencies.push(newDependency);
      });

      // Propagate date changes
      const adjustments = propagateDates(
        taskStore.tasks,
        [...get().dependencies],
        fromTaskId
      );

      // Apply date adjustments
      for (const adj of adjustments) {
        taskStore.updateTask(adj.taskId, {
          startDate: adj.newStartDate,
          endDate: adj.newEndDate
        });
      }

      // Record to history
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.ADD_DEPENDENCY,
          timestamp: Date.now(),
          description: `Created dependency: ${fromTask.name} → ${toTask.name}`,
          params: {
            dependency: newDependency,
            dateAdjustments: adjustments
          }
        });
      }

      return { success: true, dependency: newDependency };
    },

    removeDependency: (id) => {
      const historyStore = useHistoryStore.getState();
      const dependency = get().dependencies.find(d => d.id === id);

      if (!dependency) return;

      set((state) => {
        state.dependencies = state.dependencies.filter(d => d.id !== id);
      });

      // Record to history
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        const taskStore = useTaskStore.getState();
        const fromTask = taskStore.tasks.find(t => t.id === dependency.fromTaskId);
        const toTask = taskStore.tasks.find(t => t.id === dependency.toTaskId);

        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.DELETE_DEPENDENCY,
          timestamp: Date.now(),
          description: `Removed dependency: ${fromTask?.name} → ${toTask?.name}`,
          params: {
            dependency
          }
        });
      }
    },

    updateDependency: (id, updates) => {
      const historyStore = useHistoryStore.getState();
      const dependency = get().dependencies.find(d => d.id === id);

      if (!dependency) return;

      const previousValues = { ...dependency };

      set((state) => {
        const idx = state.dependencies.findIndex(d => d.id === id);
        if (idx !== -1) {
          state.dependencies[idx] = { ...state.dependencies[idx], ...updates };
        }
      });

      // Record to history
      if (!historyStore.isUndoing && !historyStore.isRedoing) {
        historyStore.recordCommand({
          id: crypto.randomUUID(),
          type: CommandType.UPDATE_DEPENDENCY,
          timestamp: Date.now(),
          description: `Updated dependency`,
          params: {
            id,
            updates,
            previousValues
          }
        });
      }
    },

    setDependencies: (dependencies) => {
      set((state) => {
        state.dependencies = dependencies;
      });
    },

    clearDependencies: () => {
      set((state) => {
        state.dependencies = [];
      });
    },

    getDependenciesForTask: (taskId) => {
      const deps = get().dependencies;
      return {
        predecessors: deps.filter(d => d.toTaskId === taskId),
        successors: deps.filter(d => d.fromTaskId === taskId)
      };
    },

    hasDependency: (fromTaskId, toTaskId) => {
      return get().dependencies.some(
        d => d.fromTaskId === fromTaskId && d.toTaskId === toTaskId
      );
    },

    wouldCreateCycle: (fromTaskId, toTaskId) => {
      const proposedDep: Dependency = {
        id: 'temp',
        fromTaskId,
        toTaskId,
        type: 'FS',
        createdAt: ''
      };

      const result = detectCycle(get().dependencies, proposedDep);
      return {
        wouldCycle: result.hasCycle,
        cyclePath: result.cyclePath
      };
    }
  }))
);
```

**Dependency Arrow Component:**

```typescript
// src/components/Timeline/DependencyArrow.tsx

import React, { memo, useMemo } from 'react';
import { calculateArrowPath } from '@/utils/arrowPath';
import type { Dependency } from '@/types/dependency.types';
import type { Task } from '@/types/task.types';

interface DependencyArrowProps {
  dependency: Dependency;
  fromTask: Task;
  toTask: Task;
  taskPositions: Map<string, { x: number; y: number; width: number; height: number }>;
  rowHeight: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const DependencyArrow = memo(function DependencyArrow({
  dependency,
  fromTask,
  toTask,
  taskPositions,
  rowHeight,
  isSelected,
  onSelect,
  onDelete
}: DependencyArrowProps) {
  const fromPos = taskPositions.get(dependency.fromTaskId);
  const toPos = taskPositions.get(dependency.toTaskId);

  // Calculate path
  const { path, arrowHead } = useMemo(() => {
    if (!fromPos || !toPos) {
      return { path: '', arrowHead: { x: 0, y: 0, angle: 0 } };
    }
    return calculateArrowPath(fromPos, toPos, rowHeight);
  }, [fromPos, toPos, rowHeight]);

  if (!fromPos || !toPos) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(dependency.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      onDelete(dependency.id);
    }
  };

  return (
    <g
      className="dependency-arrow"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="graphics-symbol"
      aria-label={`Dependency from ${fromTask.name} to ${toTask.name}`}
    >
      {/* Arrow path */}
      <path
        d={path}
        fill="none"
        stroke={isSelected ? '#3b82f6' : '#64748b'}
        strokeWidth={isSelected ? 3 : 2}
        className="transition-all duration-150 cursor-pointer hover:stroke-blue-500"
      />

      {/* Arrowhead */}
      <polygon
        points="-8,-4 0,0 -8,4"
        fill={isSelected ? '#3b82f6' : '#64748b'}
        transform={`translate(${arrowHead.x}, ${arrowHead.y}) rotate(${arrowHead.angle})`}
        className="transition-colors duration-150"
      />

      {/* Invisible wider hit area for easier clicking */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth={12}
        className="cursor-pointer"
      />

      {/* Selection indicator */}
      {isSelected && (
        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={6}
          strokeDasharray="4 2"
          opacity={0.3}
        />
      )}
    </g>
  );
});
```

**Connection Handles Component:**

```typescript
// src/components/Timeline/ConnectionHandles.tsx

import React, { useState, useCallback } from 'react';

interface ConnectionHandlesProps {
  taskId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  onDragStart: (taskId: string, side: 'start' | 'end') => void;
  onDragEnd: () => void;
  isValidDropTarget: boolean;
  isInvalidDropTarget: boolean;
}

export function ConnectionHandles({
  taskId,
  x,
  y,
  width,
  height,
  onDragStart,
  onDragEnd,
  isValidDropTarget,
  isInvalidDropTarget
}: ConnectionHandlesProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleRadius = isHovered || isDragging ? 5 : 4;
  const handleCenterY = y + height / 2;

  const handleMouseDown = useCallback((side: 'start' | 'end') => (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    onDragStart(taskId, side);
  }, [taskId, onDragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    onDragEnd();
  }, [onDragEnd]);

  // Determine handle colors
  let handleFill = '#94a3b8'; // slate-400
  let handleStroke = '#64748b'; // slate-500

  if (isValidDropTarget) {
    handleFill = '#3b82f6'; // blue-500
    handleStroke = '#2563eb'; // blue-600
  } else if (isInvalidDropTarget) {
    handleFill = '#ef4444'; // red-500
    handleStroke = '#dc2626'; // red-600
  }

  return (
    <g
      className="connection-handles"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ opacity: isHovered || isDragging || isValidDropTarget || isInvalidDropTarget ? 1 : 0 }}
    >
      {/* Start handle (left side) */}
      <circle
        cx={x}
        cy={handleCenterY}
        r={handleRadius}
        fill={handleFill}
        stroke={handleStroke}
        strokeWidth={1.5}
        className="cursor-crosshair transition-all duration-150"
        onMouseDown={handleMouseDown('start')}
        onMouseUp={handleMouseUp}
      />

      {/* End handle (right side) - primary for FS dependencies */}
      <circle
        cx={x + width}
        cy={handleCenterY}
        r={handleRadius}
        fill={handleFill}
        stroke={handleStroke}
        strokeWidth={1.5}
        className="cursor-crosshair transition-all duration-150"
        onMouseDown={handleMouseDown('end')}
        onMouseUp={handleMouseUp}
      />

      {/* Drop target indicator (larger ring) */}
      {(isValidDropTarget || isInvalidDropTarget) && (
        <>
          <circle
            cx={x}
            cy={handleCenterY}
            r={handleRadius + 4}
            fill="none"
            stroke={isValidDropTarget ? '#3b82f6' : '#ef4444'}
            strokeWidth={2}
            opacity={0.5}
          />
          <circle
            cx={x + width}
            cy={handleCenterY}
            r={handleRadius + 4}
            fill="none"
            stroke={isValidDropTarget ? '#3b82f6' : '#ef4444'}
            strokeWidth={2}
            opacity={0.5}
          />
        </>
      )}
    </g>
  );
}
```

**Drag Interaction Hook:**

```typescript
// src/hooks/useDependencyDrag.ts

import { useState, useCallback, useEffect } from 'react';
import { useDependencyStore } from '@/store/slices/dependencySlice';
import toast from 'react-hot-toast';

interface DragState {
  isDragging: boolean;
  fromTaskId: string | null;
  fromSide: 'start' | 'end' | null;
  currentPosition: { x: number; y: number };
  validTargets: Set<string>;
  invalidTargets: Set<string>;
}

export function useDependencyDrag() {
  const { addDependency, wouldCreateCycle } = useDependencyStore();
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    fromTaskId: null,
    fromSide: null,
    currentPosition: { x: 0, y: 0 },
    validTargets: new Set(),
    invalidTargets: new Set()
  });

  const startDrag = useCallback((taskId: string, side: 'start' | 'end', tasks: Task[]) => {
    // Determine valid/invalid targets
    const validTargets = new Set<string>();
    const invalidTargets = new Set<string>();

    for (const task of tasks) {
      if (task.id === taskId) continue;

      // For FS: dragging from END creates "taskId -> target"
      // Check if this would create a cycle
      const fromId = side === 'end' ? taskId : task.id;
      const toId = side === 'end' ? task.id : taskId;

      const cycleCheck = wouldCreateCycle(fromId, toId);
      if (cycleCheck.wouldCycle) {
        invalidTargets.add(task.id);
      } else {
        validTargets.add(task.id);
      }
    }

    setDragState({
      isDragging: true,
      fromTaskId: taskId,
      fromSide: side,
      currentPosition: { x: 0, y: 0 },
      validTargets,
      invalidTargets
    });
  }, [wouldCreateCycle]);

  const updateDragPosition = useCallback((x: number, y: number) => {
    setDragState(prev => ({
      ...prev,
      currentPosition: { x, y }
    }));
  }, []);

  const endDrag = useCallback((targetTaskId?: string) => {
    const { fromTaskId, fromSide, validTargets, invalidTargets } = dragState;

    if (targetTaskId && fromTaskId) {
      if (validTargets.has(targetTaskId)) {
        // Create dependency
        const fromId = fromSide === 'end' ? fromTaskId : targetTaskId;
        const toId = fromSide === 'end' ? targetTaskId : fromTaskId;

        const result = addDependency(fromId, toId);

        if (result.success) {
          toast.success(`Dependency created`);
        } else {
          toast.error(result.error || 'Failed to create dependency');
        }
      } else if (invalidTargets.has(targetTaskId)) {
        toast.error('Cannot create: Would create circular dependency');
      }
    }

    setDragState({
      isDragging: false,
      fromTaskId: null,
      fromSide: null,
      currentPosition: { x: 0, y: 0 },
      validTargets: new Set(),
      invalidTargets: new Set()
    });
  }, [dragState, addDependency]);

  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      fromTaskId: null,
      fromSide: null,
      currentPosition: { x: 0, y: 0 },
      validTargets: new Set(),
      invalidTargets: new Set()
    });
  }, []);

  // Handle Escape key to cancel drag
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dragState.isDragging) {
        cancelDrag();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dragState.isDragging, cancelDrag]);

  return {
    ...dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    isValidTarget: (taskId: string) => dragState.validTargets.has(taskId),
    isInvalidTarget: (taskId: string) => dragState.invalidTargets.has(taskId)
  };
}
```

---

### 6. QA Tester - Quality Assurance

**Name:** QA Engineer
**Role:** Test planning, test execution, bug reporting

#### Comprehensive Test Plan

**A. Dependency Creation Tests**
```
Test Case 1.1: Create FS Dependency via Handle Drag
[ ] Hover over task bar
[ ] Verify connection handles appear
[ ] Drag from end handle of Task A
[ ] Verify temporary arrow follows cursor
[ ] Drop on Task B
[ ] Verify dependency arrow renders
[ ] Verify toast notification appears
[ ] Verify dependency stored in state

Test Case 1.2: Create FS Dependency via Alt+Drag
[ ] Hold Alt key
[ ] Verify cursor changes to link cursor
[ ] Drag from Task A (anywhere on bar)
[ ] Drop on Task B
[ ] Verify dependency created
[ ] Release Alt key
[ ] Verify normal cursor restored

Test Case 1.3: Auto-Date Adjustment on Create
[ ] Create Task A: Jan 1-5
[ ] Create Task B: Jan 3-7 (overlapping)
[ ] Create dependency A → B
[ ] Verify Task B shifts to Jan 6-10
[ ] Verify notification shows date change
[ ] Verify undo restores original dates
```

**B. Circular Dependency Prevention**
```
Test Case 2.1: Direct Cycle (A → A)
[ ] Try to create dependency from Task A to Task A
[ ] Verify error shows immediately
[ ] Verify no dependency created

Test Case 2.2: Simple Cycle (A → B → A)
[ ] Create dependency A → B
[ ] Try to create dependency B → A
[ ] Verify error with cycle path shown
[ ] Verify B → A not created
[ ] Verify A → B still exists

Test Case 2.3: Complex Cycle (A → B → C → D → A)
[ ] Create chain A → B → C → D
[ ] Try to create D → A
[ ] Verify error shows full cycle path
[ ] Verify cycle prevention works
```

**C. Dependency Deletion**
```
Test Case 3.1: Delete via Click + Delete Key
[ ] Click on dependency arrow
[ ] Verify arrow is selected (highlight)
[ ] Press Delete key
[ ] Verify dependency removed
[ ] Verify toast notification

Test Case 3.2: Delete via Context Menu
[ ] Right-click on dependency arrow
[ ] Verify context menu appears
[ ] Click "Delete Dependency"
[ ] Verify dependency removed

Test Case 3.3: Undo Dependency Deletion
[ ] Delete a dependency
[ ] Press Ctrl+Z
[ ] Verify dependency restored
[ ] Press Ctrl+Shift+Z
[ ] Verify dependency deleted again
```

**D. Arrow Rendering**
```
Test Case 4.1: Simple Arrow (No Overlap)
[ ] Create two tasks with horizontal gap
[ ] Create dependency between them
[ ] Verify smooth curved arrow renders
[ ] Verify arrowhead points at successor

Test Case 4.2: Vertical Offset Arrow
[ ] Create Task A at row 1
[ ] Create Task B at row 5
[ ] Create dependency A → B
[ ] Verify arrow routes cleanly between rows
[ ] Verify arrow doesn't cross other tasks

Test Case 4.3: Overlapping Tasks Arrow
[ ] Create Task B starting before Task A ends
[ ] Create dependency A → B
[ ] Verify arrow routes around tasks
[ ] Verify no visual overlap
```

**E. Performance Tests**
```
Test Case 5.1: Many Dependencies (50+)
[ ] Create 100 tasks
[ ] Create 50 dependencies between them
[ ] Verify smooth scrolling (60fps)
[ ] Verify no visible lag when panning

Test Case 5.2: Rapid Dependency Creation
[ ] Create 10 dependencies in quick succession
[ ] Verify all arrows render correctly
[ ] Verify no duplicate dependencies
[ ] Verify no errors

Test Case 5.3: Large Date Propagation
[ ] Create chain of 20 linked tasks
[ ] Move first task forward 5 days
[ ] Verify all 19 successors adjust
[ ] Verify adjustment completes < 200ms
```

**F. File Operations**
```
Test Case 6.1: Save Dependencies
[ ] Create several dependencies
[ ] Save file
[ ] Inspect JSON for dependencies array
[ ] Verify all dependencies present

Test Case 6.2: Load Dependencies
[ ] Open file with dependencies
[ ] Verify all dependencies restored
[ ] Verify arrows render correctly
[ ] Verify date adjustments still valid

Test Case 6.3: Round-Trip Integrity
[ ] Create complex dependency graph
[ ] Save file
[ ] Close app
[ ] Open file
[ ] Verify identical dependency graph
```

**G. Undo/Redo Integration**
```
Test Case 7.1: Undo Create Dependency
[ ] Create dependency A → B
[ ] Press Ctrl+Z
[ ] Verify dependency removed
[ ] Verify arrow disappears

Test Case 7.2: Undo Date Adjustment
[ ] Create dependency that causes date shift
[ ] Press Ctrl+Z
[ ] Verify dependency removed
[ ] Verify dates restored to original

Test Case 7.3: Multiple Undo/Redo
[ ] Create 5 dependencies
[ ] Undo all 5 (Ctrl+Z × 5)
[ ] Verify all removed
[ ] Redo all 5 (Ctrl+Shift+Z × 5)
[ ] Verify all restored
```

**H. Edge Cases**
```
Test Case 8.1: Dependency to Summary Task
[ ] Create summary task with children
[ ] Create dependency to summary
[ ] Verify dependency works correctly
[ ] Verify date adjustment applies to summary

Test Case 8.2: Delete Task with Dependencies
[ ] Create Task A with predecessors and successors
[ ] Delete Task A
[ ] Verify all related dependencies removed
[ ] Verify no orphan arrows

Test Case 8.3: Move Task in Hierarchy
[ ] Create dependency between tasks
[ ] Indent successor under different parent
[ ] Verify dependency still valid
[ ] Verify arrow renders correctly
```

**Bug Severity Classification:**

| Severity | Description | Example |
|----------|-------------|---------|
| P0 - Critical | Data corruption/loss | Circular dep created, data loops |
| P1 - High | Feature broken | Can't create dependencies |
| P2 - Medium | Feature partially works | Arrow renders wrong |
| P3 - Low | Minor UX issue | Handle hard to click |
| P4 - Trivial | Cosmetic | Arrow slightly misaligned |

**Performance Benchmarks:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Arrow render time (single) | < 5ms | Chrome DevTools |
| 50 arrows render time | < 100ms | Chrome DevTools |
| Cycle detection (50 deps) | < 10ms | Console timing |
| Date propagation (20 tasks) | < 50ms | Console timing |
| Scroll FPS with 50 deps | 60fps | Chrome DevTools Performance |

---

### 7. DevOps Engineer - Build & Testing Infrastructure

**Name:** DevOps Lead
**Role:** CI/CD, testing automation, performance monitoring

#### CI/CD Pipeline

```yaml
# .github/workflows/test-dependencies.yml

name: Sprint 1.4 - Dependency Tests

on:
  pull_request:
    paths:
      - 'src/store/slices/dependencySlice.ts'
      - 'src/utils/graph/**'
      - 'src/utils/arrowPath/**'
      - 'src/components/Timeline/Dependency*.tsx'
      - 'tests/**/*dependency*.test.ts'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run graph algorithm tests
        run: npm run test:unit -- graph

      - name: Run dependency store tests
        run: npm run test:unit -- dependencySlice

      - name: Check coverage (85%+ required)
        run: npm run test:coverage -- --threshold 85

  algorithm-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Cycle detection correctness
        run: npm run test:unit -- cycleDetection

      - name: Topological sort correctness
        run: npm run test:unit -- topologicalSort

      - name: Date propagation correctness
        run: npm run test:unit -- datePropagation

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Dependency creation flow
        run: npm run test:integration -- dependencies

      - name: File save/load with dependencies
        run: npm run test:integration -- file-dependencies

      - name: Undo/redo with dependencies
        run: npm run test:integration -- undo-dependencies

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Performance with 100 tasks, 50 dependencies
        run: npm run test:performance -- dependencies

      - name: Arrow rendering performance
        run: npm run test:performance -- arrow-rendering

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Run dependency E2E tests
        run: npx playwright test tests/e2e/dependencies.spec.ts --project=${{ matrix.browser }}
```

**Algorithm Test Suite:**

```typescript
// tests/unit/graph/cycleDetection.test.ts

import { describe, it, expect } from 'vitest';
import { detectCycle } from '@/utils/graph/cycleDetection';

describe('Cycle Detection', () => {
  it('detects no cycle in empty graph', () => {
    const result = detectCycle([]);
    expect(result.hasCycle).toBe(false);
  });

  it('detects no cycle in valid chain', () => {
    const deps = [
      { id: '1', fromTaskId: 'A', toTaskId: 'B', type: 'FS' },
      { id: '2', fromTaskId: 'B', toTaskId: 'C', type: 'FS' },
      { id: '3', fromTaskId: 'C', toTaskId: 'D', type: 'FS' }
    ];
    const result = detectCycle(deps);
    expect(result.hasCycle).toBe(false);
  });

  it('detects direct cycle A → B → A', () => {
    const deps = [
      { id: '1', fromTaskId: 'A', toTaskId: 'B', type: 'FS' },
      { id: '2', fromTaskId: 'B', toTaskId: 'A', type: 'FS' }
    ];
    const result = detectCycle(deps);
    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toContain('A');
    expect(result.cyclePath).toContain('B');
  });

  it('detects complex cycle A → B → C → D → B', () => {
    const deps = [
      { id: '1', fromTaskId: 'A', toTaskId: 'B', type: 'FS' },
      { id: '2', fromTaskId: 'B', toTaskId: 'C', type: 'FS' },
      { id: '3', fromTaskId: 'C', toTaskId: 'D', type: 'FS' },
      { id: '4', fromTaskId: 'D', toTaskId: 'B', type: 'FS' }
    ];
    const result = detectCycle(deps);
    expect(result.hasCycle).toBe(true);
  });

  it('detects cycle when adding new dependency', () => {
    const existing = [
      { id: '1', fromTaskId: 'A', toTaskId: 'B', type: 'FS' },
      { id: '2', fromTaskId: 'B', toTaskId: 'C', type: 'FS' }
    ];
    const newDep = { id: '3', fromTaskId: 'C', toTaskId: 'A', type: 'FS' };

    const result = detectCycle(existing, newDep);
    expect(result.hasCycle).toBe(true);
    expect(result.cyclePath).toEqual(['A', 'B', 'C', 'A']);
  });

  it('handles disconnected components', () => {
    const deps = [
      { id: '1', fromTaskId: 'A', toTaskId: 'B', type: 'FS' },
      { id: '2', fromTaskId: 'C', toTaskId: 'D', type: 'FS' }
    ];
    const result = detectCycle(deps);
    expect(result.hasCycle).toBe(false);
  });

  it('handles self-loop', () => {
    const deps = [
      { id: '1', fromTaskId: 'A', toTaskId: 'A', type: 'FS' }
    ];
    const result = detectCycle(deps);
    expect(result.hasCycle).toBe(true);
  });
});
```

---

### 8. Data Analyst - Metrics & Success Tracking

**Name:** Analytics Specialist
**Role:** Define KPIs, track metrics, measure success

#### Success Metrics

**Key Performance Indicators:**

**1. Feature Adoption**
```
Metrics to Track:
- % of users who create at least one dependency (target: 60%)
- Average dependencies per chart (target: 5+)
- Dependency creation method (handle vs Alt+Drag)

Measurement:
- Event: 'dependency_created', 'dependency_deleted'
- Track via console.log initially
- Future: Analytics integration
```

**2. Error Prevention**
```
Circular Dependency Prevention Rate:
- Definition: Circular dependency attempts blocked / total dependency attempts
- Target: 100% blocked (no cycles ever created)

User Error Recovery:
- % of deleted dependencies that are immediately undone
- Target: <10% (low = users made intentional deletions)
```

**3. Performance Metrics**
```
Arrow Rendering:
- P50 (median): < 2ms per arrow
- P90: < 5ms per arrow
- P99: < 10ms per arrow

Cycle Detection:
- P50: < 1ms
- P90: < 5ms
- P99: < 15ms

Date Propagation:
- P50: < 10ms
- P90: < 30ms
- P99: < 100ms
```

**4. Quality Metrics**
```
Bug Density:
- Target: < 0.3 bugs per 100 LOC
- Critical bugs (P0/P1): 0

Test Coverage:
- Unit tests: > 90% on graph algorithms
- Integration tests: All critical paths
- E2E tests: Core user flows
```

---

## Implementation Timeline

### Day 1: Foundation (6 hours)
- [ ] Create dependency TypeScript types
- [ ] Implement dependencySlice store
- [ ] Write unit tests for store
- [ ] Code review

### Day 2: Graph Algorithms (6 hours)
- [ ] Implement cycle detection (DFS)
- [ ] Implement topological sort (Kahn's)
- [ ] Implement date propagation
- [ ] Comprehensive algorithm tests

### Day 3: UI - Connection Handles (6 hours)
- [ ] Create ConnectionHandles component
- [ ] Integrate with TaskBar
- [ ] Implement drag interaction hook
- [ ] Alt+Drag shortcut

### Day 4: UI - Dependency Arrows (6 hours)
- [ ] Implement arrow path calculation
- [ ] Create DependencyArrow component
- [ ] Create DependencyArrows container
- [ ] Arrow styling and optimization

### Day 5: Integration (6 hours)
- [ ] Auto-date adjustment integration
- [ ] Circular dependency error handling
- [ ] Toast notifications
- [ ] Undo/redo integration

### Day 6: Polish (5 hours)
- [ ] File format integration
- [ ] Cross-browser testing
- [ ] Performance testing
- [ ] Bug fixes

### Day 7: Completion (4 hours)
- [ ] Edge case testing
- [ ] Documentation
- [ ] Final review
- [ ] README & CHANGELOG

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Arrow path collisions** | Medium | Medium | Multiple routing strategies, test visually |
| **Cycle detection edge case** | Critical | Low | Comprehensive test suite, proven algorithm |
| **Performance with many arrows** | Medium | Medium | Memoization, virtual rendering |
| **Date propagation cascades** | High | Low | Topological sort ensures finite |
| **Drag interaction browser differences** | Medium | Medium | Cross-browser testing early |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Handles not discoverable** | High | Medium | Subtle animation, tooltip, tutorial |
| **Circular error confusing** | Medium | Medium | Clear error message with task names |
| **Unexpected date shifts** | Medium | Medium | Notification with undo option |
| **Arrow visual clutter** | Low | Medium | Styling, potential hide option |

---

## Success Criteria

### Sprint Complete When:

- [ ] **Functionality**
  - [ ] Can create FS dependency via handle drag
  - [ ] Can create FS dependency via Alt+Drag
  - [ ] Arrow renders between connected tasks
  - [ ] Circular dependencies blocked with error
  - [ ] Successor dates auto-adjust when needed
  - [ ] Can delete dependencies (click + Delete)
  - [ ] Dependencies persist in file format
  - [ ] Full undo/redo support

- [ ] **Performance**
  - [ ] 50 arrows render at 60fps
  - [ ] Cycle detection < 10ms
  - [ ] Date propagation < 50ms
  - [ ] No visible lag when scrolling

- [ ] **Quality**
  - [ ] 90%+ test coverage on algorithms
  - [ ] All unit tests pass
  - [ ] All integration tests pass
  - [ ] Cross-browser tested
  - [ ] Manual testing complete

- [ ] **User Experience**
  - [ ] Handles discoverable on hover
  - [ ] Clear visual feedback during drag
  - [ ] Error messages include task names
  - [ ] Date change notifications with undo

- [ ] **Documentation**
  - [ ] Code commented
  - [ ] README updated
  - [ ] CHANGELOG entry added

---

## Next Steps After Sprint 1.4

**Sprint 1.6: PNG Export & Polish**
- Export chart to PNG image
- Export options dialog
- Welcome tour for new users
- Final polish before MVP completion

**Future Enhancements (V1.1+):**
- Advanced dependency types (SS, FF, SF) - Premium feature
- Lag/lead time input in UI
- Dependency list panel
- Critical path highlighting
- Dependency conflict resolution

---

## Appendix

### Dependency Types Reference (V1.1+)

| Type | Name | Description | This Sprint |
|------|------|-------------|-------------|
| FS | Finish-to-Start | A finishes → B starts | Implemented |
| SS | Start-to-Start | A starts → B can start | V1.1 |
| FF | Finish-to-Finish | A finishes → B can finish | V1.1 |
| SF | Start-to-Finish | A starts → B can finish | V1.1 |

### Algorithm Complexity

| Algorithm | Time | Space | Notes |
|-----------|------|-------|-------|
| Cycle Detection (DFS) | O(V+E) | O(V) | V=tasks, E=dependencies |
| Topological Sort (Kahn) | O(V+E) | O(V) | Linear time |
| Date Propagation | O(V+E) | O(V) | Uses topo sort |
| Arrow Path Calculation | O(1) | O(1) | Per dependency |

### Glossary

- **Predecessor**: Task that must complete before another can start (source of dependency)
- **Successor**: Task that depends on another task (target of dependency)
- **FS (Finish-to-Start)**: Most common dependency type - successor starts after predecessor finishes
- **Cycle**: A chain of dependencies that forms a loop (A→B→C→A)
- **Topological Sort**: Ordering where predecessors come before successors
- **Lag**: Delay between predecessor end and successor start (can be negative for overlap)

### References

- [ROADMAP.md - Sprint 1.4](/docs/planning/ROADMAP.md#sprint-14-dependencies-finish-to-start-only)
- [DATA_MODEL.md - Dependency Interface](/docs/architecture/DATA_MODEL.md#22-dependency)
- [SVAR React Gantt - Links.jsx](https://github.com/svar-widgets/react-gantt/blob/master/src/components/chart/Links.jsx)
- [Topological Sort - Kahn's Algorithm](https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm)
- [Cycle Detection - DFS](https://en.wikipedia.org/wiki/Cycle_(graph_theory)#Cycle_detection)

---

**Document Version**: 1.0
**Created**: 2026-01-03
**Status**: PLANNED
**Sprint Priority:** Critical (Core MVP Feature)

---

## Team Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | Product Lead | Pending | |
| Project Manager | Project Coordinator | Pending | |
| UX/UI Designer | UX Designer | Pending | |
| Software Architect | System Architect | Pending | |
| Frontend Developer | Frontend Engineer | Pending | |
| QA Tester | QA Engineer | Pending | |
| DevOps Engineer | DevOps Lead | Pending | |
| Data Analyst | Analytics Specialist | Pending | |

**Awaiting team approval before implementation begins.**
