# Sprint 1.15: Task Hierarchies with Summary Tasks

**Status:** Planning (Revised after Competitive Analysis)
**Created:** 2025-12-19
**Revised:** 2025-12-23
**Position:** Between Sprint 1.1 and Sprint 1.2
**Duration:** 2-3 days
**Goal:** Add hierarchical task organization using task types (task, summary, milestone)

---

## Revision Summary (2025-12-23)

**Key Changes Based on Competitive Analysis:**

1. ✅ **Unified Data Model**: No separate `TaskGroup` interface - summary tasks ARE tasks
2. ✅ **Consistent Naming**: Use "summary" (not "groups") to align with SVAR React Gantt
3. ✅ **Simplified Store**: One `taskSlice` handles all types, no separate group slice
4. ✅ **Unified Component**: One `TaskRow` component renders all task types
5. ✅ **Leverages Existing Work**: Task type system already implemented in v0.0.1
6. ✅ **SVAR-Style UI**: Clean design without connector lines, chevrons only (see screenshot)
7. ✅ **Icon System**: Heroicons for consistent, professional icons (documented in ICON_SYSTEM.md)
8. ✅ **Decoupled Type from Hierarchy**: Tasks CAN have children (SVAR pattern - see analysis)

**CRITICAL UPDATE - Type vs Hierarchy (2025-12-23):**

After deep analysis of SVAR Gantt behavior (see `/tmp/type_hierarchy_analysis.md`), we discovered:

**Old Understanding (WRONG):**
- ❌ Only `summary` tasks can have children
- ❌ Regular `task` cannot have children
- ❌ Type determines hierarchy capability

**New Understanding (SVAR Pattern - CORRECT):**
- ✅ **Tasks CAN have children** - dates remain manual (independent of children)
- ✅ **Summary CAN have children** - dates auto-calculated from children
- ✅ **Type determines data behavior**, NOT hierarchy capability
- ✅ **Hierarchy is independent** of type (via `parent` field)

**Key Difference:**
- `type: 'task'` with children → Dates stay **manual** (fixed deadline containers)
- `type: 'summary'` with children → Dates are **auto-calculated** (aggregating phases)

**Use Case Example:**
```
Feature: User Auth (type='task', 14 days fixed deadline)
├─ Design mockups (3 days)
├─ Backend API (5 days)
└─ Frontend (4 days)
→ Parent deadline stays 14 days (NOT recalculated from children)
```

This would be IMPOSSIBLE with our old approach (would force `type='summary'` → auto-calculation).

**Why this approach is better:**

- ❌ **Old approach**: Separate `TaskGroup` entities treated completely differently from tasks
- ✅ **New approach**: Summary tasks are just tasks with `type: 'summary'` and children
- 🎯 **Benefit**: Less code duplication, more consistent behavior, easier to maintain

**UI Design Reference:**
- Screenshot: `/tmp/brave_ArGlaaayds.png` (SVAR React Gantt)
- Analysis: [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md)
- Key pattern: Simple indentation, chevrons (▼/▶), NO connector lines, bold for summaries

---

## Overview

This sprint implements hierarchical task organization using the **task type system**. Instead of creating a separate "group" concept, we use **summary tasks** - tasks that contain other tasks as children. This matches the proven pattern from SVAR React Gantt.

**Core Concept:**
```typescript
// Summary task (parent)
{
  id: "task-1",
  name: "Phase 1: Design",
  type: "summary",     // ← This makes it a parent
  parent: null,
  // Dates calculated from children, not editable
}

// Regular task (child)
{
  id: "task-2",
  name: "Design homepage",
  type: "task",        // ← Regular task
  parent: "task-1",    // ← Points to parent
  startDate: "2025-01-01",
  endDate: "2025-01-15",
}
```

**Key Insight from SVAR Analysis:**
Summary tasks don't need a separate data structure. They're just tasks with:
- `type: 'summary'`
- Children (via `parent` field on other tasks)
- Dates auto-calculated from children
- Different visual representation

---

## Why Now?

- ✅ Task type system already implemented (v0.0.1)
- ✅ Establishes hierarchy before timeline rendering (Sprint 1.2)
- ✅ Prevents major refactoring later
- ✅ Builds on Sprint 1.1's foundation

---

## Task Types Review

**Already implemented in `src/types/chart.types.ts`:**

```typescript
export type TaskType = 'task' | 'summary' | 'milestone';

export interface Task {
  // ... existing fields ...
  type?: TaskType;      // Already added in v0.0.1
  parent?: string;      // Already added in v0.0.1
  open?: boolean;       // Already added in v0.0.1 (for expand/collapse)
}
```

**Task Type Behaviors (SVAR Pattern - Type and Hierarchy are Independent):**

| Type | Description | Dates | Children | Date Calculation |
|------|-------------|-------|----------|------------------|
| `task` | Regular task | User-editable | **Yes** | Manual (independent of children) |
| `summary` | Auto-aggregating container | Locked (calculated) | Yes | Auto (from children) |
| `milestone` | Zero-duration marker | User-editable (duration=0) | **No** | Manual |

**Key Insight from SVAR Analysis:**
- `task` with children: Dates are **independent** of children (manually set)
- `summary` with children: Dates are **calculated** from children (auto-aggregated)
- Type determines **data behavior**, NOT whether hierarchy is allowed
- Hierarchy (parent field) is **independent** of type

---

## Data Model Changes

### What's Already Done (v0.0.1)

✅ `Task` interface has `type`, `parent`, `open` fields
✅ No changes needed to core data model

### What We Need to Add

#### 1. Task Validation Updates

**File:** `src/utils/validation.ts` (UPDATE)

```typescript
/**
 * Validate task based on type.
 */
export function validateTask(task: Task): ValidationResult {
  const errors: string[] = [];

  // Common validation
  if (!task.name || task.name.length < 1 || task.name.length > 200) {
    errors.push('Task name must be 1-200 characters');
  }

  // Type-specific validation
  switch (task.type) {
    case 'summary':
      // Summary tasks: dates are calculated, not editable
      // Validation happens on children
      // Can have children (same as regular tasks)
      break;

    case 'milestone':
      // Milestones: duration must be 0
      if (task.duration !== 0) {
        errors.push('Milestone tasks must have duration 0');
      }
      // Milestones CANNOT be parents (validated separately)
      break;

    case 'task':
    default:
      // Regular tasks: dates required and user-editable
      if (!task.startDate || !task.endDate) {
        errors.push('Task must have start and end dates');
      }
      if (task.duration < 0) {
        errors.push('Duration cannot be negative');
      }
      // Tasks CAN have children (dates independent of children)
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Check if a task type can have children.
 * Only milestones cannot be parents.
 */
export function canHaveChildren(task: Task): boolean {
  // Milestones cannot be parents
  if (task.type === 'milestone') return false;

  // Tasks and summaries can be parents
  return true;
}
```

#### 2. Hierarchy Utilities

**File:** `src/utils/hierarchy.ts` (NEW)

```typescript
import type { Task } from '../types/chart.types';

/**
 * Get all children of a task (direct children only).
 */
export function getTaskChildren(tasks: Task[], parentId: string | null): Task[] {
  return tasks
    .filter(task => task.parent === parentId)
    .sort((a, b) => a.order - b.order);
}

/**
 * Get all descendants of a task (recursive).
 */
export function getTaskDescendants(tasks: Task[], parentId: string): Task[] {
  const children = getTaskChildren(tasks, parentId);
  const descendants = [...children];

  for (const child of children) {
    descendants.push(...getTaskDescendants(tasks, child.id));
  }

  return descendants;
}

/**
 * Get path from root to task (array of parent IDs).
 */
export function getTaskPath(tasks: Task[], taskId: string): string[] {
  const task = tasks.find(t => t.id === taskId);
  if (!task || !task.parent) return [];

  return [...getTaskPath(tasks, task.parent), task.parent];
}

/**
 * Get nesting level of a task (0 = root).
 */
export function getTaskLevel(tasks: Task[], taskId: string): number {
  return getTaskPath(tasks, taskId).length;
}

/**
 * Check if moving a task would create a circular hierarchy.
 */
export function wouldCreateCircularHierarchy(
  tasks: Task[],
  taskId: string,
  newParentId: string | null
): boolean {
  if (!newParentId) return false;
  if (taskId === newParentId) return true;

  // Check if newParent is a descendant of task
  const descendants = getTaskDescendants(tasks, taskId);
  return descendants.some(d => d.id === newParentId);
}

/**
 * Get max nesting depth in hierarchy.
 */
export function getMaxDepth(tasks: Task[]): number {
  let maxDepth = 0;

  for (const task of tasks) {
    const depth = getTaskLevel(tasks, task.id);
    if (depth > maxDepth) maxDepth = depth;
  }

  return maxDepth;
}

/**
 * Calculate summary task dates from children.
 *
 * IMPORTANT: Only applies to type='summary'!
 * Regular tasks (type='task') with children keep their manual dates.
 */
export function calculateSummaryDates(
  tasks: Task[],
  summaryTaskId: string
): { startDate: string; endDate: string; duration: number } | null {
  const summaryTask = tasks.find(t => t.id === summaryTaskId);

  // Only calculate for summary type!
  if (summaryTask?.type !== 'summary') {
    return null;
  }

  const children = getTaskChildren(tasks, summaryTaskId);

  if (children.length === 0) {
    return null; // No children, no dates
  }

  // Find earliest start date
  let minStart: Date | null = null;
  let maxEnd: Date | null = null;

  for (const child of children) {
    // For summary children, recursively calculate their dates
    let childStart: Date;
    let childEnd: Date;

    if (child.type === 'summary') {
      const summaryDates = calculateSummaryDates(tasks, child.id);
      if (!summaryDates) continue; // Skip empty summaries
      childStart = new Date(summaryDates.startDate);
      childEnd = new Date(summaryDates.endDate);
    } else {
      if (!child.startDate || !child.endDate) continue;
      childStart = new Date(child.startDate);
      childEnd = new Date(child.endDate);
    }

    if (!minStart || childStart < minStart) minStart = childStart;
    if (!maxEnd || childEnd > maxEnd) maxEnd = childEnd;
  }

  if (!minStart || !maxEnd) return null;

  // Calculate duration in days
  const duration = Math.ceil(
    (maxEnd.getTime() - minStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    startDate: minStart.toISOString().split('T')[0],
    endDate: maxEnd.toISOString().split('T')[0],
    duration,
  };
}

/**
 * Build flattened list for rendering (respects collapsed state).
 * Based on SVAR React Gantt pattern - simple and clean.
 */
export interface FlattenedTask {
  task: Task;
  level: number;
  hasChildren: boolean;
}

export function buildFlattenedTaskList(
  tasks: Task[],
  collapsedTaskIds: Set<string>
): FlattenedTask[] {
  const result: FlattenedTask[] = [];

  function addTaskAndChildren(
    parentId: string | null,
    level: number,
    parentCollapsed: boolean
  ) {
    const children = getTaskChildren(tasks, parentId);

    children.forEach((task) => {
      const hasChildren = getTaskChildren(tasks, task.id).length > 0;

      // Add task if parent is not collapsed
      if (!parentCollapsed) {
        result.push({ task, level, hasChildren });
      }

      // Recursively add children
      const isCollapsed = task.open === false || collapsedTaskIds.has(task.id);
      addTaskAndChildren(task.id, level + 1, parentCollapsed || isCollapsed);
    });
  }

  // Start from root level
  addTaskAndChildren(null, 0, false);

  return result;
}
```

---

## Store Changes

### Updates to `taskSlice.ts`

**File:** `src/store/slices/taskSlice.ts` (UPDATE)

Add hierarchy-specific actions:

```typescript
interface TaskActions {
  // ... existing actions ...

  // NEW: Hierarchy actions
  moveTaskToParent: (taskId: string, newParentId: string | null) => void;
  toggleTaskCollapsed: (taskId: string) => void;
  expandTask: (taskId: string) => void;
  collapseTask: (taskId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // NEW: Summary task creation
  createSummaryTask: (data: Omit<Task, 'id' | 'type' | 'parent'>) => string;
  convertToSummary: (taskId: string) => void;
  convertToTask: (taskId: string) => void;
}
```

**Implementation:**

```typescript
// Move task to new parent
moveTaskToParent: (taskId, newParentId) =>
  set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Validate: prevent circular hierarchy
    if (newParentId && wouldCreateCircularHierarchy(state.tasks, taskId, newParentId)) {
      console.error('Cannot move task: would create circular hierarchy');
      return;
    }

    // Validate: parent must be able to have children (milestones cannot be parents)
    if (newParentId) {
      const newParent = state.tasks.find(t => t.id === newParentId);
      if (newParent && !canHaveChildren(newParent)) {
        console.error('Cannot move task: milestones cannot be parents');
        return;
      }
    }

    // Validate: max depth 3 levels
    if (newParentId) {
      const newLevel = getTaskLevel(state.tasks, newParentId) + 1;
      if (newLevel > 3) {
        console.error('Cannot move task: maximum nesting depth is 3 levels');
        return;
      }
    }

    task.parent = newParentId;
  }),

// Toggle collapsed state
toggleTaskCollapsed: (taskId) =>
  set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Any task with children can be collapsed (task or summary)
    const hasChildren = state.tasks.some(t => t.parent === taskId);
    if (!hasChildren) return;

    task.open = !(task.open ?? true);
  }),

// Create summary task
createSummaryTask: (data) =>
  set((state) => {
    const newTask: Task = {
      ...data,
      id: crypto.randomUUID(),
      type: 'summary',
      open: true, // Expanded by default
      // Summary dates are calculated, but set initial values
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date().toISOString().split('T')[0],
      duration: 0,
    };
    state.tasks.push(newTask);
    return newTask.id;
  }),

// Convert regular task to summary
convertToSummary: (taskId) =>
  set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    task.type = 'summary';
    task.open = true;
    // Keep existing dates as fallback until children are added
  }),

// Convert summary to regular task
convertToTask: (taskId) =>
  set((state) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;

    // Tasks CAN have children - just switch the date calculation mode
    // Children's dates will no longer affect this task's dates
    task.type = 'task';

    // Keep 'open' state if has children (for expand/collapse)
    const hasChildren = state.tasks.some(t => t.parent === taskId);
    if (!hasChildren) {
      task.open = undefined; // Not needed if no children
    }

    // User notification: Dates are now manual
    console.info('Task dates are now manual. Children dates do not affect this task.');
  }),

// Expand all tasks with children
expandAll: () =>
  set((state) => {
    state.tasks.forEach(task => {
      const hasChildren = state.tasks.some(t => t.parent === task.id);
      if (hasChildren) {
        task.open = true;
      }
    });
  }),

// Collapse all tasks with children
collapseAll: () =>
  set((state) => {
    state.tasks.forEach(task => {
      const hasChildren = state.tasks.some(t => t.parent === task.id);
      if (hasChildren) {
        task.open = false;
      }
    });
  }),
```

**No separate group slice needed!** Everything is handled in the existing `taskSlice`.

---

## UI Components

### TaskRow Component Updates

**File:** `src/components/TaskList/TaskTableRow.tsx` (UPDATE)

The existing `TaskTableRow` component needs to handle all three task types. Key changes:

#### 1. Add Type-Specific Rendering

```typescript
interface TaskTableRowProps {
  task: Task;
  level: number;           // Nesting level (0 = root)
  hasChildren: boolean;    // Whether task has children
}

export function TaskTableRow({ task, level, hasChildren }: TaskTableRowProps) {
  const updateTask = useTaskStore(state => state.updateTask);
  const toggleTaskCollapsed = useTaskStore(state => state.toggleTaskCollapsed);
  const deleteTask = useTaskStore(state => state.deleteTask);

  // Calculate summary dates if needed
  const displayTask = useMemo(() => {
    if (task.type === 'summary') {
      const summaryDates = calculateSummaryDates(allTasks, task.id);
      if (summaryDates) {
        return { ...task, ...summaryDates };
      }
    }
    return task;
  }, [task, allTasks]);

  const isExpanded = task.open ?? true;

  return (
    <div
      className={cn(
        'task-table-row contents',
        task.type === 'summary' && 'font-semibold bg-gray-50'
      )}
      role="row"
    >
      {/* Checkbox column */}
      <Cell>
        <Checkbox checked={isSelected} onChange={handleToggle} />
      </Cell>

      {/* Name column with hierarchy - SVAR style (no connector lines) */}
      <Cell>
        <div
          className="flex items-center gap-1"
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {/* Expand/collapse button for any task with children */}
          {hasChildren ? (
            <button
              onClick={() => toggleTaskCollapsed(task.id)}
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600"
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          ) : (
            // Empty spacer for alignment
            <div className="w-4" />
          )}

          {/* Task type icon */}
          <TaskTypeIcon type={task.type} />

          {/* Task name */}
          <EditableText
            value={task.name}
            onChange={(name) => updateTask(task.id, { name })}
            className={cn(
              'flex-1',
              task.type === 'summary' && 'font-semibold'
            )}
          />
        </div>
      </Cell>

      {/* Date columns */}
      <Cell>
        {task.type === 'summary' ? (
          <span className="text-gray-500 italic">
            {displayTask.startDate}
          </span>
        ) : (
          <DatePicker
            value={task.startDate}
            onChange={(startDate) => updateTask(task.id, { startDate })}
          />
        )}
      </Cell>

      <Cell>
        {task.type === 'summary' ? (
          <span className="text-gray-500 italic">
            {displayTask.endDate}
          </span>
        ) : (
          <DatePicker
            value={task.endDate}
            onChange={(endDate) => updateTask(task.id, { endDate })}
          />
        )}
      </Cell>

      {/* Duration column */}
      <Cell>
        <span className={task.type === 'summary' ? 'text-gray-500 italic' : ''}>
          {displayTask.duration} days
        </span>
      </Cell>

      {/* Other columns... */}
    </div>
  );
}
```

#### 2. TaskTypeIcon Component

**File:** `src/components/TaskList/TaskTypeIcon.tsx` (NEW)

```typescript
import { FolderIcon, DocumentIcon, FlagIcon } from '@heroicons/react/24/outline';
import type { TaskType } from '../../types/chart.types';

interface TaskTypeIconProps {
  type?: TaskType;
}

export function TaskTypeIcon({ type = 'task' }: TaskTypeIconProps) {
  switch (type) {
    case 'summary':
      return <FolderIcon className="w-4 h-4 text-blue-600 flex-shrink-0" />;

    case 'milestone':
      return <FlagIcon className="w-4 h-4 text-purple-600 flex-shrink-0" />;

    case 'task':
    default:
      return <DocumentIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />;
  }
}
```

#### 3. Visual Design Notes

**Inspired by SVAR React Gantt** (see screenshot in `/tmp/brave_ArGlaaayds.png`):

- ✅ **No connector lines** (├─, └─) - just indentation
- ✅ **Expand/collapse chevron** (▼/▶) for summaries
- ✅ **Task type icons** from Heroicons for clarity
- ✅ **Bold font** for summary tasks
- ✅ **Simple indentation** (20px per level)
- ✅ **Gray background** for summary rows

**Icon System: Heroicons**

Install: `npm install @heroicons/react`

**Why Heroicons?**
- From Tailwind Labs (perfect match for TailwindCSS)
- Lightweight, tree-shakeable (only imports used icons)
- Consistent design system
- MIT licensed
- Already used by many Tailwind projects

**Full Documentation:** See [ICON_SYSTEM.md](./ICON_SYSTEM.md) for complete icon system guidelines

### TaskTable Component Updates

**File:** `src/components/TaskList/TaskTable.tsx` (UPDATE)

Update to use flattened hierarchy:

```typescript
export function TaskTable() {
  const tasks = useTaskStore(state => state.tasks);
  const addTask = useTaskStore(state => state.addTask);
  const createSummaryTask = useTaskStore(state => state.createSummaryTask);

  // Build flattened list respecting collapsed state
  const flattenedTasks = useMemo(() => {
    const collapsedIds = new Set(
      tasks.filter(t => t.type === 'summary' && t.open === false).map(t => t.id)
    );
    return buildFlattenedTaskList(tasks, collapsedIds);
  }, [tasks]);

  const handleAddTask = () => {
    // Create regular task
    addTask({
      name: 'New Task',
      type: 'task',
      // ... other defaults
    });
  };

  const handleAddSummary = () => {
    // Create summary task
    createSummaryTask({
      name: 'New Phase',
      // ... other defaults
    });
  };

  return (
    <div className="task-table-container">
      {/* Toolbar */}
      <div className="task-table-toolbar">
        <h2>Tasks</h2>
        <div className="flex gap-2">
          <button onClick={handleAddTask}>+ Add Task</button>
          <button onClick={handleAddSummary}>+ Add Summary</button>
        </div>
      </div>

      {/* Table */}
      <div className="task-table-wrapper">
        {flattenedTasks.map(({ task, level, hasChildren }) => (
          <TaskTableRow
            key={task.id}
            task={task}
            level={level}
            hasChildren={hasChildren}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## Drag-and-Drop Updates

### UX Challenge: Hierarchical Drag & Drop

Hierarchical drag-and-drop presents unique UX challenges that flat reordering doesn't have:

**Problem 1: Ambiguous Drop Positions**
- When dropping after the last child of a parent, should it be:
  - The last child INSIDE the parent? OR
  - The first element AFTER the parent?

**Problem 2: Empty Parent Targets**
- When a task has no children yet, how does the user know they can drop INTO it?
- Visual feedback must indicate: BEFORE, AFTER, or INTO

**Problem 3: Multi-Level Hierarchy**
- User needs clear feedback about which level (0-3) they're dropping at
- Horizontal position (indentation) must be clearly communicated

**Solution: Hybrid Approach (SVAR + Notion Pattern)**

We combine two proven patterns:
1. **Horizontal position** determines nesting level (SVAR Gantt pattern)
2. **Vertical position** determines drop placement (Notion/Asana pattern)
3. **Visual zones** show clear drop feedback during drag

---

### Drop Zone System

Each task row is divided into **three vertical zones** during drag operations:

```
┌─────────────────────────────────────────┐
│ [BEFORE ZONE - top 40%]                 │ ← Drop BEFORE this task
│─────────────────────────────────────────│
│ [INTO ZONE - middle 20%]                │ ← Drop INTO as child (if allowed)
│─────────────────────────────────────────│
│ [AFTER ZONE - bottom 40%]               │ ← Drop AFTER this task
└─────────────────────────────────────────┘
```

**Zone Behavior:**

| Zone | Visual Indicator | Action | Condition |
|------|------------------|--------|-----------|
| **BEFORE** | Blue line above row | Insert before target | Always available |
| **INTO** | Blue background + ring | Make child of target | Only if `canHaveChildren(target)` |
| **AFTER** | Blue line below row | Insert after target | Always available |

**Horizontal Position (Indentation Level):**

The horizontal mouse position determines the **nesting level** of the drop:

```
Mouse position:
0-19px     → Level 0 (root)
20-39px    → Level 1 (child)
40-59px    → Level 2 (grandchild)
60-79px    → Level 3 (max depth)
```

---

### Visual Feedback During Drag

#### 1. Drop Indicator Types

```typescript
type DropIndicator =
  | { type: 'before'; targetId: string; level: number }
  | { type: 'after'; targetId: string; level: number }
  | { type: 'into'; parentId: string };
```

#### 2. Visual Examples

**Dropping BEFORE (top 40% of row):**
```
━━━━━━━━━━━━━━━━━━━━━━━━  ← Blue horizontal line (2px, solid)
  Task A
  Task B
```

**Dropping INTO (middle 20%, indented position):**
```
  ▼ Task A
  ┌─────────────────────────┐
  │ [Drop as child of A]    │  ← Blue background (bg-blue-50)
  └─────────────────────────┘  ← Blue ring (ring-2 ring-blue-300)
    Task B (existing child)
```

**Dropping AFTER (bottom 40% of row):**
```
  Task A
━━━━━━━━━━━━━━━━━━━━━━━━  ← Blue horizontal line
  Task B
```

**Ghost Element with Indentation:**

While dragging, show a semi-transparent preview at the drop position:

```
  ▼ Phase 1
    Task A
    [Task B] ← Ghost element (opacity: 0.4, correct indentation)
    Task C
```

---

### Special Cases

#### Case 1: Last Child Ambiguity

**Problem:** When hovering over the last child of a parent, should the drop be inside or outside the parent?

**Solution:** Use horizontal position to disambiguate:

```typescript
const resolveLastChildDrop = (
  overTask: Task,
  mouseX: number,
  rowRect: DOMRect
) => {
  const isLastChild = /* check if last child of parent */;

  if (!isLastChild) {
    return normalDropLogic();
  }

  // Calculate mouse indentation level
  const mouseLevel = Math.floor((mouseX - rowRect.left) / INDENT_SIZE);
  const taskLevel = getTaskLevel(tasks, overTask.id);

  if (mouseLevel >= taskLevel) {
    // Drop at same level as overTask (sibling - still inside parent)
    return { type: 'after', targetId: overTask.id, level: taskLevel };
  } else {
    // Drop at parent's level (outside parent, after parent)
    const parent = tasks.find(t => t.id === overTask.parent);
    return { type: 'after', targetId: parent!.id, level: taskLevel - 1 };
  }
};
```

**Visual Example:**

```
▼ Summary A (Level 0)
    Task 1 (Level 1)
    Task 2 (Level 1) ← Hovering here

CASE A - Mouse indented at Level 1 (20-39px):
    Task 2
    ━━━━━━━━━━━━━  ← Drop here = last child of Summary A

CASE B - Mouse at Level 0 (0-19px):
    Task 2
━━━━━━━━━━━━━━━━  ← Drop here = after Summary A (sibling level)
Task B
```

#### Case 2: Empty Parent (No Children Yet)

**Problem:** A task with no children has no visual "slot" to drop into.

**Solution:** Combine vertical AND horizontal position:

```typescript
const shouldDropIntoEmptyParent = (
  overTask: Task,
  mouseX: number,
  mouseY: number,
  rowRect: DOMRect
) => {
  // Must be in middle zone (vertical)
  const relativeY = mouseY - rowRect.top;
  const isInMiddle = (
    relativeY > rowRect.height * 0.4 &&
    relativeY < rowRect.height * 0.6
  );

  // Must be indented (horizontal)
  const mouseLevel = Math.floor((mouseX - rowRect.left) / INDENT_SIZE);
  const taskLevel = getTaskLevel(tasks, overTask.id);
  const isIndented = mouseLevel > taskLevel;

  // Task must be able to have children
  const canBeParent = canHaveChildren(overTask);

  return isInMiddle && isIndented && canBeParent;
};
```

**Visual Feedback:**

When hovering over middle zone with indentation:
```
  Task A
  ┌─────────────────────────────┐
  │ Task B         ⬤ ← Mouse    │  ← bg-blue-50 (light blue)
  │   [Drop as first child]     │  ← ring-2 ring-blue-300
  └─────────────────────────────┘
  Task C
```

#### Case 3: Collapsed Parent

**Problem:** Dropping into a collapsed parent - user can't see where it will land.

**Solution:** Auto-expand on hover with delay:

```typescript
const [expandOnHoverTimeout, setExpandOnHoverTimeout] = useState<NodeJS.Timeout | null>(null);

const handleDragOverCollapsed = (taskId: string) => {
  // Clear existing timeout
  if (expandOnHoverTimeout) {
    clearTimeout(expandOnHoverTimeout);
  }

  // Set new timeout - expand after 800ms hover
  const timeout = setTimeout(() => {
    expandTask(taskId);
  }, 800);

  setExpandOnHoverTimeout(timeout);
};
```

**Visual Example:**

```
Time: 0ms - Start hovering
▶ Phase 1 (collapsed) ← Hovering...
  Task A

Time: 800ms - Auto-expand
▼ Phase 1 (expanded!) ← Shows children
    [DROP ZONE]       ← Now visible
  Task A
```

---

### Implementation

#### 1. Drop Position Detection

**File:** `src/components/TaskList/TaskTable.tsx` (UPDATE)

```typescript
const INDENT_SIZE = 20; // pixels per level

interface DropPosition {
  indicator: DropIndicator;
  isValid: boolean;
  errorMessage?: string;
}

const calculateDropPosition = (
  event: DragOverEvent,
  overTask: Task,
  allTasks: Task[]
): DropPosition => {
  const { clientX, clientY } = event;
  const rowRect = event.over?.rect;

  if (!rowRect) return { indicator: null, isValid: false };

  // Calculate vertical zone (BEFORE, INTO, AFTER)
  const relativeY = clientY - rowRect.top;
  const rowHeight = rowRect.height;
  const verticalZone =
    relativeY < rowHeight * 0.4 ? 'before' :
    relativeY > rowHeight * 0.6 ? 'after' :
    'middle';

  // Calculate horizontal level (indentation)
  const relativeX = clientX - rowRect.left;
  const mouseLevel = Math.max(0, Math.min(3, Math.floor(relativeX / INDENT_SIZE)));
  const taskLevel = getTaskLevel(allTasks, overTask.id);

  // Determine drop type based on zone
  if (verticalZone === 'before') {
    return {
      indicator: { type: 'before', targetId: overTask.id, level: mouseLevel },
      isValid: validateDrop(mouseLevel, overTask),
    };
  }

  if (verticalZone === 'after') {
    // Check for last child ambiguity
    const isLastChild = isLastChildOfParent(overTask, allTasks);

    if (isLastChild && mouseLevel < taskLevel) {
      // Drop AFTER parent, not after this child
      const parent = allTasks.find(t => t.id === overTask.parent);
      if (parent) {
        return {
          indicator: { type: 'after', targetId: parent.id, level: taskLevel - 1 },
          isValid: true,
        };
      }
    }

    return {
      indicator: { type: 'after', targetId: overTask.id, level: mouseLevel },
      isValid: validateDrop(mouseLevel, overTask),
    };
  }

  // Middle zone - check for INTO
  const isIndented = mouseLevel > taskLevel;
  const canBeParent = canHaveChildren(overTask);

  if (isIndented && canBeParent) {
    return {
      indicator: { type: 'into', parentId: overTask.id },
      isValid: validateDropInto(overTask, allTasks),
    };
  }

  // Fallback to AFTER
  return {
    indicator: { type: 'after', targetId: overTask.id, level: mouseLevel },
    isValid: validateDrop(mouseLevel, overTask),
  };
};
```

#### 2. Drop Validation

```typescript
const validateDropInto = (
  targetParent: Task,
  allTasks: Task[]
): boolean => {
  // Check if target can have children
  if (!canHaveChildren(targetParent)) {
    return false; // Milestones cannot be parents
  }

  // Check circular reference
  if (wouldCreateCircularHierarchy(allTasks, activeTask.id, targetParent.id)) {
    return false;
  }

  // Check max depth
  const newLevel = getTaskLevel(allTasks, targetParent.id) + 1;
  if (newLevel > 3) {
    return false; // Max 3 levels
  }

  return true;
};

const validateDrop = (
  targetLevel: number,
  nearTask: Task
): boolean => {
  // Cannot exceed max depth
  if (targetLevel > 3) return false;

  // Cannot drop at invalid level (e.g., level 2 when no level 1 parent exists)
  if (targetLevel > 0) {
    const hasValidParent = findParentAtLevel(nearTask, targetLevel - 1);
    if (!hasValidParent) return false;
  }

  return true;
};
```

#### 3. Visual Drop Indicators

**File:** `src/components/TaskList/TaskTableRow.tsx` (UPDATE)

```typescript
interface TaskTableRowProps {
  task: Task;
  level: number;
  hasChildren: boolean;
  dropIndicator?: DropIndicator | null; // NEW: Drop indicator state
  isDragging?: boolean; // NEW: Is this task being dragged
}

export function TaskTableRow({
  task,
  level,
  hasChildren,
  dropIndicator,
  isDragging
}: TaskTableRowProps) {
  const showBeforeIndicator =
    dropIndicator?.type === 'before' && dropIndicator.targetId === task.id;
  const showAfterIndicator =
    dropIndicator?.type === 'after' && dropIndicator.targetId === task.id;
  const showIntoIndicator =
    dropIndicator?.type === 'into' && dropIndicator.parentId === task.id;

  // Calculate indentation for drop indicators
  const indicatorIndent = dropIndicator?.type !== 'into'
    ? (dropIndicator?.level ?? 0) * INDENT_SIZE
    : (level + 1) * INDENT_SIZE;

  return (
    <>
      {/* BEFORE indicator */}
      {showBeforeIndicator && (
        <div
          className="drop-indicator drop-indicator-before"
          style={{ paddingLeft: `${indicatorIndent}px` }}
        >
          <div className="h-0.5 bg-blue-500 rounded-full" />
        </div>
      )}

      {/* Task row */}
      <div
        className={cn(
          'task-table-row contents',
          task.type === 'summary' && 'font-semibold bg-gray-50',
          isDragging && 'opacity-40', // Dim while dragging
          showIntoIndicator && 'bg-blue-50 ring-2 ring-blue-300' // INTO highlight
        )}
        role="row"
      >
        {/* Checkbox column */}
        <Cell>
          <Checkbox checked={isSelected} onChange={handleToggle} />
        </Cell>

        {/* Name column with hierarchy */}
        <Cell>
          <div
            className="flex items-center gap-1"
            style={{ paddingLeft: `${level * INDENT_SIZE}px` }}
          >
            {/* Expand/collapse button */}
            {hasChildren ? (
              <button
                onClick={() => toggleTaskCollapsed(task.id)}
                className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded text-gray-600"
              >
                {isExpanded ? '▼' : '▶'}
              </button>
            ) : (
              <div className="w-4" />
            )}

            {/* Task type icon */}
            <TaskTypeIcon type={task.type} />

            {/* Task name */}
            <EditableText
              value={task.name}
              onChange={(name) => updateTask(task.id, { name })}
              className={cn(
                'flex-1',
                task.type === 'summary' && 'font-semibold'
              )}
            />
          </div>

          {/* INTO zone hint */}
          {showIntoIndicator && (
            <div className="text-xs text-blue-600 italic mt-1">
              Drop as child
            </div>
          )}
        </Cell>

        {/* Other columns... */}
      </div>

      {/* AFTER indicator */}
      {showAfterIndicator && (
        <div
          className="drop-indicator drop-indicator-after"
          style={{ paddingLeft: `${indicatorIndent}px` }}
        >
          <div className="h-0.5 bg-blue-500 rounded-full" />
        </div>
      )}
    </>
  );
}
```

#### 4. Enhanced handleDragEnd

**File:** `src/components/TaskList/TaskTable.tsx` (UPDATE)

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;

  // Clear drop indicators
  setDropIndicator(null);

  if (!over || active.id === over.id) return;

  const activeTask = tasks.find(t => t.id === active.id);
  const overTask = tasks.find(t => t.id === over.id);

  if (!activeTask || !overTask) return;

  // Get final drop position
  const dropPosition = calculateDropPosition(event, overTask, tasks);

  if (!dropPosition.isValid) {
    // Show error message
    console.warn('Invalid drop:', dropPosition.errorMessage);
    return;
  }

  const { indicator } = dropPosition;

  switch (indicator.type) {
    case 'into':
      // Nest as child of target
      moveTaskToParent(activeTask.id, indicator.parentId);
      break;

    case 'before': {
      // Insert before target at specified level
      const newParent = findParentForLevel(indicator.targetId, indicator.level, tasks);
      moveTaskToParent(activeTask.id, newParent);

      // Reorder to be before target
      const targetOrder = overTask.order;
      reorderTask(activeTask.id, targetOrder - 0.5); // Insert between
      break;
    }

    case 'after': {
      // Insert after target at specified level
      const newParent = findParentForLevel(indicator.targetId, indicator.level, tasks);
      moveTaskToParent(activeTask.id, newParent);

      // Reorder to be after target
      const targetOrder = overTask.order;
      reorderTask(activeTask.id, targetOrder + 0.5); // Insert between
      break;
    }
  }
};

const handleDragOver = (event: DragOverEvent) => {
  if (!event.over) {
    setDropIndicator(null);
    return;
  }

  const overTask = tasks.find(t => t.id === event.over.id);
  if (!overTask) return;

  // Calculate and show drop position
  const dropPosition = calculateDropPosition(event, overTask, tasks);
  setDropIndicator(dropPosition.isValid ? dropPosition.indicator : null);

  // Handle collapsed parent auto-expand
  if (dropPosition.indicator?.type === 'into') {
    const parent = tasks.find(t => t.id === dropPosition.indicator.parentId);
    if (parent && parent.open === false) {
      handleDragOverCollapsed(parent.id);
    }
  }
};
```

---

### CSS Styles

**File:** `src/components/TaskList/TaskTable.css` (UPDATE)

```css
/* Drop indicators */
.drop-indicator {
  position: relative;
  height: 4px;
  pointer-events: none;
  z-index: 10;
}

.drop-indicator-before {
  margin-top: -2px;
}

.drop-indicator-after {
  margin-bottom: -2px;
}

/* INTO zone highlight */
.task-table-row.bg-blue-50 {
  background-color: rgba(59, 130, 246, 0.1);
  transition: background-color 150ms ease;
}

.task-table-row.ring-2 {
  box-shadow: inset 0 0 0 2px rgba(59, 130, 246, 0.3);
  transition: box-shadow 150ms ease;
}

/* Dragging state */
.task-table-row.opacity-40 {
  opacity: 0.4;
  transition: opacity 150ms ease;
}

/* Ghost element while dragging */
.dnd-ghost {
  opacity: 0.4;
  background-color: #f3f4f6;
  border: 2px dashed #9ca3af;
}
```

---

### Testing Strategy for Drag & Drop

#### Manual Testing Checklist

**Basic Drag Operations:**
- [ ] Drag task BEFORE another task (top 40% of row)
- [ ] Drag task AFTER another task (bottom 40% of row)
- [ ] Drag task INTO summary (middle 20%, indented)
- [ ] Drag task INTO regular task with children (middle 20%, indented)
- [ ] Drag task INTO empty task (middle 20%, indented)

**Indentation Level:**
- [ ] Drop at level 0 (mouse at 0-19px)
- [ ] Drop at level 1 (mouse at 20-39px)
- [ ] Drop at level 2 (mouse at 40-59px)
- [ ] Drop at level 3 (mouse at 60-79px)
- [ ] Try to drop at level 4 (should be prevented)

**Last Child Ambiguity:**
- [ ] Hover over last child with mouse at child level (should drop as sibling)
- [ ] Hover over last child with mouse at parent level (should drop after parent)

**Empty Parent:**
- [ ] Hover over empty task in middle zone, indented (should show INTO)
- [ ] Hover over empty task in middle zone, not indented (should show AFTER)

**Collapsed Parent:**
- [ ] Hover over collapsed parent for 800ms (should auto-expand)
- [ ] Move away before 800ms (should NOT expand)

**Validation:**
- [ ] Try to drag milestone onto another task as parent (should be rejected)
- [ ] Try to create circular hierarchy (should be rejected)
- [ ] Try to exceed max depth (should be rejected)

**Visual Feedback:**
- [ ] Blue line appears above row (BEFORE)
- [ ] Blue line appears below row (AFTER)
- [ ] Blue background + ring appears (INTO)
- [ ] Drop indicator shows correct indentation
- [ ] Dragged task dims (opacity 40%)

#### Integration Tests

**File:** `tests/integration/drag-drop-hierarchy.test.ts` (NEW)

```typescript
describe('Hierarchical Drag & Drop', () => {
  it('should drop BEFORE when hovering top 40% of row', () => {
    // Simulate drag to top of row
    // Verify task inserted before target
  });

  it('should drop INTO when hovering middle 20% with indentation', () => {
    // Simulate drag to middle of row with horizontal offset
    // Verify task becomes child of target
  });

  it('should drop AFTER when hovering bottom 40% of row', () => {
    // Simulate drag to bottom of row
    // Verify task inserted after target
  });

  it('should resolve last child ambiguity based on horizontal position', () => {
    // Setup: parent with children
    // Drag over last child with different horizontal positions
    // Verify correct parent assignment
  });

  it('should drop INTO empty parent when indented', () => {
    // Setup: task with no children
    // Drag to middle + indented
    // Verify becomes child
  });

  it('should auto-expand collapsed parent after hover delay', async () => {
    // Setup: collapsed parent
    // Hover for 800ms
    // Verify expands
  });

  it('should show correct drop indicator for each zone', () => {
    // Test visual feedback for all zones
  });

  it('should respect max depth validation', () => {
    // Try to drop at level 4
    // Verify rejection
  });
});
```

---

## Validation Rules

### Hierarchy Constraints

| Rule | Validation | Error Message |
|------|------------|---------------|
| Max nesting | 3 levels deep | "Maximum nesting depth is 3 levels" |
| Circular reference | Task cannot be parent of its ancestor | "Cannot move task: would create circular hierarchy" |
| Milestone parent | Milestones cannot be parents | "Milestones cannot be parents" |
| Task type | Must be 'task', 'summary', or 'milestone' | "Invalid task type" |

### Task Type Rules (SVAR Pattern)

**Regular Task (`type: 'task'`):**
- ✅ Dates are user-editable (manual)
- ✅ Can have children (via `parent` field)
- ✅ Children do NOT affect parent dates (independent)
- ✅ Can be collapsed/expanded if has children
- 📌 Use case: Fixed-deadline containers, manual organization

**Summary Task (`type: 'summary'`):**
- ✅ Dates are auto-calculated from children (locked in UI)
- ✅ Can have children (via `parent` field)
- ✅ Children dates auto-update parent dates
- ✅ Can be collapsed/expanded
- 📌 Use case: Auto-aggregating phases, dynamic containers

**Milestone (`type: 'milestone'`):**
- ✅ Dates are user-editable (duration always 0)
- ❌ Cannot have children (cannot be parent)
- ✅ Can be child of any task or summary
- 📌 Use case: Zero-duration markers, deadlines

---

## Delete Behavior

### Overview

When deleting tasks with children (both `type: 'task'` and `type: 'summary'` with children), the system must handle the hierarchy correctly to prevent orphaned tasks and data inconsistency.

**Key Principle:** Tasks can have children regardless of type (SVAR pattern), so delete behavior applies to ANY task with children, not just summary tasks.

### Delete Task Scenarios

#### 1. Regular Task Without Children
- **Behavior:** Simply delete, no special handling
- **Confirmation:** Basic confirmation dialog
- **Example:** `"Delete task 'Homepage design'?"`

#### 2. Task With Children (type: 'task' or 'summary')

Since both regular tasks AND summary tasks can have children (SVAR pattern), both need special delete handling.

**Confirmation Dialog Options:**

```
Delete "Phase 1"?

This task has 5 child tasks and 1 subtask with children.

○ Delete task only (move children to parent level)
● Delete task and all children (6 tasks total) - CASCADING DELETE

[Cancel] [Delete]
```

**Visual Feedback:**
- Show total count of affected tasks (including nested descendants)
- Distinguish between direct children and nested descendants
- Default to safer option (delete only, preserve children)

### Cascading Delete Implementation

#### Store Action: Enhanced deleteTask

**File:** `src/store/slices/taskSlice.ts` (UPDATE)

Add cascading delete logic to `deleteTask` action:

```typescript
interface TaskActions {
  // ... existing actions ...

  // Enhanced delete with cascading support
  deleteTask: (id: string, cascade?: boolean) => void;
}

// Implementation
deleteTask: (id, cascade = false) =>
  set((state) => {
    if (!cascade) {
      // Simple delete - just remove the task
      state.tasks = state.tasks.filter((task) => task.id !== id);
      return;
    }

    // Cascading delete - collect all descendants recursively
    const idsToDelete = new Set<string>([id]);

    // Recursively find all children of a given parent
    const findChildren = (parentId: string) => {
      state.tasks.forEach((task) => {
        if (task.parent === parentId && !idsToDelete.has(task.id)) {
          idsToDelete.add(task.id);
          findChildren(task.id); // Recursively find grandchildren
        }
      });
    };

    findChildren(id);

    // Remove all collected tasks
    state.tasks = state.tasks.filter((task) => !idsToDelete.has(task.id));

    // Clear selection for deleted tasks
    state.selectedTaskIds = state.selectedTaskIds.filter(
      (selectedId) => !idsToDelete.has(selectedId)
    );
  }),
```

**Alternative Implementation (Separate Action):**

```typescript
interface TaskActions {
  // ... existing actions ...

  deleteTask: (id: string) => void;
  deleteTaskCascading: (id: string) => void;  // NEW: Cascading delete
}

// Cascading delete action
deleteTaskCascading: (id) =>
  set((state) => {
    // Collect all task IDs to delete (parent + all children recursively)
    const idsToDelete = new Set<string>([id]);

    // Recursively find all children of a given parent
    const findChildren = (parentId: string) => {
      state.tasks.forEach((task) => {
        if (task.parent === parentId && !idsToDelete.has(task.id)) {
          idsToDelete.add(task.id);
          findChildren(task.id); // Recursively find grandchildren
        }
      });
    };

    findChildren(id);

    // Remove all collected tasks
    state.tasks = state.tasks.filter((task) => !idsToDelete.has(task.id));

    // Clear selection for deleted tasks
    state.selectedTaskIds = state.selectedTaskIds.filter(
      (selectedId) => !idsToDelete.has(selectedId)
    );
  }),
```

#### UI Component: Enhanced Delete Handler

**File:** `src/components/TaskList/TaskTableRow.tsx` (UPDATE)

Update delete handler to show child count and handle both delete modes:

```typescript
const handleDelete = () => {
  const allTasks = useTaskStore.getState().tasks;

  // Count all children recursively
  const countChildren = (parentId: string): number => {
    let count = 0;
    allTasks.forEach((t) => {
      if (t.parent === parentId) {
        count += 1 + countChildren(t.id); // Count this child + its children
      }
    });
    return count;
  };

  const childCount = countChildren(task.id);

  if (childCount > 0) {
    // Task has children - show enhanced dialog
    const deleteAll = window.confirm(
      `Delete task "${task.name}" and ${childCount} child task${childCount > 1 ? 's' : ''}?\n\n` +
      `Click OK to delete all (cascading delete).\n` +
      `Click Cancel to keep children and only delete "${task.name}".`
    );

    if (deleteAll) {
      // Cascading delete
      deleteTaskCascading(task.id);
    } else {
      // Move children to parent's level, then delete
      const children = allTasks.filter(t => t.parent === task.id);
      children.forEach(child =>
        moveTaskToParent(child.id, task.parent ?? null)
      );
      deleteTask(task.id);
    }
  } else {
    // No children - simple confirmation
    if (window.confirm(`Delete task "${task.name}"?`)) {
      deleteTask(task.id);
    }
  }
};
```

**Alternative: Modal Dialog Component (Better UX)**

For better user experience, create a dedicated delete confirmation modal:

**File:** `src/components/TaskList/DeleteConfirmDialog.tsx` (NEW)

```typescript
interface DeleteConfirmDialogProps {
  task: Task;
  childCount: number;
  onConfirm: (cascade: boolean) => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({
  task,
  childCount,
  onConfirm,
  onCancel
}: DeleteConfirmDialogProps) {
  const [deleteMode, setDeleteMode] = useState<'only' | 'cascade'>('only');

  return (
    <div className="delete-confirm-dialog">
      <h3>Delete Task "{task.name}"?</h3>

      {childCount > 0 ? (
        <>
          <p>This task has {childCount} child task{childCount > 1 ? 's' : ''}.</p>

          <div className="delete-options">
            <label>
              <input
                type="radio"
                value="only"
                checked={deleteMode === 'only'}
                onChange={() => setDeleteMode('only')}
              />
              Delete task only (move children to parent level)
            </label>

            <label>
              <input
                type="radio"
                value="cascade"
                checked={deleteMode === 'cascade'}
                onChange={() => setDeleteMode('cascade')}
              />
              Delete task and all {childCount} children (cascading delete)
            </label>
          </div>
        </>
      ) : (
        <p>This action cannot be undone.</p>
      )}

      <div className="dialog-actions">
        <button onClick={onCancel}>Cancel</button>
        <button
          onClick={() => onConfirm(deleteMode === 'cascade')}
          className="danger"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
```

### Testing Strategy for Delete Behavior

#### Unit Tests

**File:** `tests/unit/store/taskSlice.test.ts` (UPDATE)

Add comprehensive tests for cascading delete:

```typescript
describe('deleteTask - Cascading Delete', () => {
  it('should delete parent task with one child (cascading)', () => {
    // Setup: parent + 1 child
    const parentId = addTask({ name: 'Parent', type: 'summary', ... });
    addTask({ name: 'Child', parent: parentId, ... });

    expect(tasks).toHaveLength(2);

    // Delete with cascade
    deleteTaskCascading(parentId);

    expect(tasks).toHaveLength(0);
  });

  it('should delete parent task with multiple children (cascading)', () => {
    // Setup: parent + 3 children
    const parentId = addTask({ name: 'Parent', type: 'summary', ... });
    addTask({ name: 'Child 1', parent: parentId, ... });
    addTask({ name: 'Child 2', parent: parentId, ... });
    addTask({ name: 'Child 3', parent: parentId, ... });

    expect(tasks).toHaveLength(4);

    // Delete with cascade
    deleteTaskCascading(parentId);

    expect(tasks).toHaveLength(0);
  });

  it('should delete parent with nested hierarchy (grandchildren)', () => {
    // Setup: grandparent -> parent -> child (3 levels)
    const grandparentId = addTask({ name: 'Grandparent', type: 'summary', ... });
    const parentId = addTask({ name: 'Parent', parent: grandparentId, ... });
    addTask({ name: 'Child', parent: parentId, ... });

    expect(tasks).toHaveLength(3);

    // Delete grandparent with cascade
    deleteTaskCascading(grandparentId);

    expect(tasks).toHaveLength(0);
  });

  it('should only delete descendants when deleting from middle of hierarchy', () => {
    // Setup: grandparent -> parent -> child
    const grandparentId = addTask({ name: 'Grandparent', ... });
    const parentId = addTask({ name: 'Parent', parent: grandparentId, ... });
    addTask({ name: 'Child', parent: parentId, ... });

    expect(tasks).toHaveLength(3);

    // Delete middle parent with cascade
    deleteTaskCascading(parentId);

    // Only grandparent remains
    expect(tasks).toHaveLength(1);
    expect(tasks[0].name).toBe('Grandparent');
  });

  it('should not affect sibling tasks when cascading delete', () => {
    // Setup: Two separate parent hierarchies
    const parent1Id = addTask({ name: 'Parent 1', ... });
    addTask({ name: 'Child of Parent 1', parent: parent1Id, ... });

    const parent2Id = addTask({ name: 'Parent 2', ... });
    addTask({ name: 'Child of Parent 2', parent: parent2Id, ... });

    expect(tasks).toHaveLength(4);

    // Delete first parent with cascade
    deleteTaskCascading(parent1Id);

    // Only second parent hierarchy remains
    expect(tasks).toHaveLength(2);
    expect(tasks[0].name).toBe('Parent 2');
    expect(tasks[1].name).toBe('Child of Parent 2');
  });

  it('should clear selection for cascading deleted tasks', () => {
    // Setup: parent + children, all selected
    const parentId = addTask({ name: 'Parent', ... });
    const child1Id = addTask({ name: 'Child 1', parent: parentId, ... });
    const child2Id = addTask({ name: 'Child 2', parent: parentId, ... });

    toggleTaskSelection(parentId);
    toggleTaskSelection(child1Id);
    toggleTaskSelection(child2Id);

    expect(selectedTaskIds).toHaveLength(3);

    // Delete parent with cascade
    deleteTaskCascading(parentId);

    // Selection should be cleared
    expect(selectedTaskIds).toHaveLength(0);
  });

  it('should work with regular tasks that have children (SVAR pattern)', () => {
    // Setup: Regular task (type='task') with children
    const taskId = addTask({
      name: 'Task with fixed deadline',
      type: 'task',  // NOT summary!
      ...
    });
    addTask({ name: 'Subtask 1', parent: taskId, ... });
    addTask({ name: 'Subtask 2', parent: taskId, ... });

    expect(tasks).toHaveLength(3);

    // Should still cascade delete (type doesn't matter)
    deleteTaskCascading(taskId);

    expect(tasks).toHaveLength(0);
  });
});
```

#### Integration Tests

**File:** `tests/integration/delete-behavior.test.ts` (NEW)

Test full delete flow with UI interaction:

```typescript
describe('Delete Behavior Integration', () => {
  it('should show child count in confirmation for tasks with children', () => {
    // Render task table with hierarchy
    // Click delete on parent task
    // Verify confirmation message includes child count
    // Verify both delete options are shown
  });

  it('should perform cascading delete when user confirms', () => {
    // Setup hierarchy
    // Click delete on parent
    // Select "Delete all" option
    // Confirm
    // Verify all tasks removed
  });

  it('should preserve children when user chooses delete-only', () => {
    // Setup hierarchy
    // Click delete on parent
    // Select "Delete only" option
    // Confirm
    // Verify children moved to parent level
    // Verify parent deleted
  });
});
```

### Edge Cases and Validation

#### Edge Cases to Handle

1. **Circular Reference Prevention:**
   - Should be impossible due to existing hierarchy validation
   - But add defensive check in cascading delete

2. **Empty Parent:**
   - Task with `parent` field but parent doesn't exist
   - Should already be handled by orphan cleanup
   - Cascading delete should skip non-existent references

3. **Concurrent Modifications:**
   - User deletes parent while child is being edited
   - Use optimistic updates with error recovery

4. **Performance:**
   - Large hierarchies (100+ descendants)
   - Test delete performance with deep nesting
   - Consider batch operations for very large deletes

#### Validation Rules

| Scenario | Validation | Expected Behavior |
|----------|------------|-------------------|
| Delete task without children | Basic confirmation | Simple delete |
| Delete task with children | Enhanced confirmation | Show child count, offer options |
| Delete with 100+ descendants | Performance warning | "This will delete 150 tasks. Continue?" |
| Delete while child is selected | Clear selection | Remove deleted IDs from selection |
| Delete during drag operation | Cancel drag | Abort drag, then delete |

### Performance Considerations

**Complexity Analysis:**
- `countChildren`: O(n) where n = total tasks
- `findChildren` (recursive): O(n × d) where d = max depth (3)
- Overall delete operation: O(n) for reasonable hierarchies

**Optimizations:**
- Cache child counts if hierarchy changes infrequently
- Use Set for O(1) lookup of IDs to delete
- Batch state updates to minimize re-renders

**Performance Targets:**
- < 10ms for deleting hierarchy with 10 tasks
- < 50ms for deleting hierarchy with 100 tasks
- < 200ms for deleting hierarchy with 500 tasks

---

## File Format

### JSON Structure

**No changes needed** - uses existing `Task` interface:

```json
{
  "tasks": [
    {
      "id": "task-1",
      "name": "Phase 1: Design",
      "type": "summary",
      "parent": null,
      "open": true,
      "startDate": "2025-01-01",
      "endDate": "2025-01-31",
      "duration": 30,
      "progress": 0,
      "color": "#3b82f6",
      "order": 0
    },
    {
      "id": "task-2",
      "name": "Design homepage",
      "type": "task",
      "parent": "task-1",
      "startDate": "2025-01-01",
      "endDate": "2025-01-15",
      "duration": 14,
      "progress": 50,
      "color": "#3b82f6",
      "order": 0
    }
  ]
}
```

### Backward Compatibility

- Tasks without `type`: Default to `'task'`
- Tasks without `parent`: Treated as root level
- Tasks without `open`: Default to `true` (expanded)

---

## Implementation Tasks

### Phase 1: Utilities & Validation (Day 1, Morning)

- [ ] **1.15.1a**: Create `src/utils/hierarchy.ts`
  - Implement all helper functions
  - **Test:** 30 unit tests
  - **Commit:** `feat(utils): add hierarchy utility functions`

- [ ] **1.15.1b**: Update `src/utils/validation.ts`
  - Add task type-specific validation
  - **Test:** 15 unit tests
  - **Commit:** `feat(validation): add task type validation`

### Phase 2: Store Updates (Day 1, Afternoon)

- [ ] **1.15.2a**: Update `taskSlice.ts` with hierarchy actions
  - `moveTaskToParent`, `toggleTaskCollapsed`, etc.
  - **Test:** 25 unit tests
  - **Commit:** `feat(store): add hierarchy actions to taskSlice`

- [ ] **1.15.2b**: Add summary task creation actions
  - `createSummaryTask`, `convertToSummary`, `convertToTask`
  - **Test:** 15 unit tests
  - **Commit:** `feat(store): add summary task creation actions`

### Phase 3: UI Components (Day 2)

- [ ] **1.15.3a**: Install Heroicons and create `TaskTypeIcon` component
  - Run `npm install @heroicons/react`
  - Create component with FolderIcon, DocumentIcon, FlagIcon
  - **Test:** Visual check
  - **Commit:** `feat(ui): add TaskTypeIcon component with Heroicons`

- [ ] **1.15.3b**: Update `TaskTableRow` with hierarchy rendering (SVAR style)
  - Indentation based on level (20px increments)
  - Expand/collapse chevron (▼/▶) for summaries
  - Task type icons for visual clarity
  - NO connector lines (clean like SVAR)
  - Bold font for summary tasks
  - Gray background for summary rows
  - **Test:** Visual check with various hierarchies
  - **Commit:** `feat(ui): add SVAR-style hierarchy to TaskTableRow`

- [ ] **1.15.3c**: Update `TaskTable` with flattened rendering
  - Use `buildFlattenedTaskList`
  - Respect collapsed state
  - Pass level/hierarchy props to rows
  - **Test:** Manual testing
  - **Commit:** `feat(ui): add hierarchy flattening to TaskTable`

- [ ] **1.15.3d**: Add "Add Summary" button
  - Next to "Add Task" button
  - Creates summary task at root level
  - **Test:** Manual testing
  - **Commit:** `feat(ui): add 'Add Summary' button`

### Phase 4: Drag-and-Drop (Day 3, Morning)

- [ ] **1.15.4a**: Implement drop zone detection system
  - Implement `calculateDropPosition` with vertical zones (BEFORE/INTO/AFTER)
  - Implement horizontal position detection for indentation levels
  - Add `DropIndicator` type and state management
  - **Test:** Manual testing with console logs for zone detection
  - **Commit:** `feat(dnd): implement drop zone detection system`

- [ ] **1.15.4b**: Implement special case handlers
  - Last child ambiguity resolver (horizontal position based)
  - Empty parent detection (middle zone + indentation)
  - Collapsed parent auto-expand (800ms hover timeout)
  - **Test:** Manual testing for each special case
  - **Commit:** `feat(dnd): handle special drop cases`

- [ ] **1.15.4c**: Add drop validation logic
  - Implement `validateDropInto` (circular hierarchy, max depth, canHaveChildren)
  - Implement `validateDrop` (level validation, parent existence)
  - Add error messages for invalid drops
  - **Test:** Try invalid moves (circular, milestone parent, max depth)
  - **Commit:** `feat(dnd): add comprehensive drop validation`

- [ ] **1.15.4d**: Implement visual drop indicators
  - BEFORE indicator (blue line above row, with indentation)
  - AFTER indicator (blue line below row, with indentation)
  - INTO indicator (blue background + ring)
  - Ghost element with correct indentation preview
  - Add CSS styles for all indicators
  - **Test:** Visual QA - all three indicator types
  - **Commit:** `feat(dnd): add visual drop indicators`

- [ ] **1.15.4e**: Implement handleDragEnd logic
  - Handle 'into' drop (moveTaskToParent)
  - Handle 'before' drop (moveTaskToParent + reorder)
  - Handle 'after' drop (moveTaskToParent + reorder)
  - Clear drop indicators on end
  - **Test:** Complete drop operations for all three types
  - **Commit:** `feat(dnd): implement drop execution logic`

- [ ] **1.15.4f**: Implement handleDragOver with real-time feedback
  - Call `calculateDropPosition` on every drag move
  - Update drop indicator state in real-time
  - Trigger auto-expand for collapsed parents
  - **Test:** Smooth visual feedback during drag
  - **Commit:** `feat(dnd): add real-time drag feedback`

### Phase 5: Polish & Edge Cases (Day 3, Afternoon)

- [ ] **1.15.5a**: Implement delete confirmation dialog
  - Show child count
  - Options: delete only or delete all
  - **Test:** Manual testing
  - **Commit:** `feat(ui): add summary delete confirmation`

- [ ] **1.15.5b**: Handle orphaned tasks on load
  - If parent doesn't exist, move to root
  - Log warning
  - **Test:** Load file with orphaned refs
  - **Commit:** `fix(load): handle orphaned parent references`

- [ ] **1.15.5c**: Add keyboard shortcuts
  - Tab: Indent task (make child of previous)
  - Shift+Tab: Outdent task (move to parent's level)
  - **Test:** Keyboard navigation
  - **Commit:** `feat(keyboard): add indent/outdent shortcuts`

- [ ] **1.15.5d**: Summary date calculation edge cases
  - Empty summary: Show placeholder dates
  - Nested summaries: Recursive calculation
  - Mixed task types: Handle milestones correctly
  - **Test:** Unit tests (10 tests)
  - **Commit:** `fix(summary): handle date calculation edge cases`

---

## Testing Strategy

### Unit Tests (80 total)

**Files:**
- `hierarchy.ts` - 30 tests (getChildren, getPath, circular detection, etc.)
- `validation.ts` - 15 tests (type-specific validation)
- `taskSlice.ts` hierarchy actions - 25 tests
- Summary date calculation - 10 tests

**Coverage target:** 85%+

### Integration Tests

**Scenarios:**
- Create summary, add child tasks, dates calculate correctly
- Nest task into summary via drag-drop
- Collapse summary, children hidden in list
- Delete summary with children (both options)
- Convert task to summary and back
- Indent/outdent with keyboard

### Manual Testing Checklist

- [ ] Create summary task at root level
- [ ] Create regular task
- [ ] Drag task onto summary (becomes child)
- [ ] Drag task onto task (becomes child) ✓ (SVAR pattern)
- [ ] Drag task between summaries
- [ ] Nest 3 levels deep ✓
- [ ] Try to nest 4 levels deep ✗ (should fail with message)
- [ ] Try to drag task onto milestone ✗ (should fail - milestones can't be parents)
- [ ] Collapse summary (children hidden)
- [ ] Expand summary (children shown)
- [ ] Collapse task with children (children hidden)
- [ ] Expand task with children (children shown)
- [ ] Edit summary name
- [ ] Edit regular task name
- [ ] Edit task-with-children dates ✓ (should be editable, NOT auto-calculated)
- [ ] Summary dates update when child dates change ✓ (auto-calculated)
- [ ] Task-with-children dates DO NOT update when child dates change ✓ (manual)
- [ ] Delete summary (keep children)
- [ ] Delete summary (delete children)
- [ ] Delete task with children (keep children)
- [ ] Delete task with children (delete children)
- [ ] Convert task to summary (dates switch from manual to auto)
- [ ] Convert summary to task (dates switch from auto to manual) ✓ (now allowed!)
- [ ] Tab to indent task
- [ ] Shift+Tab to outdent task
- [ ] Save file with hierarchy
- [ ] Load file with hierarchy
- [ ] Load old format file (no type/parent) ✓ (should work)

---

## Acceptance Criteria

- [ ] All 18 implementation tasks complete
- [ ] 85%+ test coverage for hierarchy code
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing checklist complete
- [ ] TypeScript strict mode, zero errors
- [ ] ESLint clean
- [ ] Can nest tasks 3 levels deep
- [ ] Cannot nest 4 levels (validation works)
- [ ] Summary dates calculate correctly from children
- [ ] Collapse/expand works smoothly
- [ ] Drag-drop nesting works intuitively
- [ ] Delete with confirmation works
- [ ] File save/load preserves hierarchy
- [ ] No performance regression (60fps with 100 tasks)

---

## Performance Considerations

### Complexity

- `buildFlattenedTaskList`: O(n) where n = number of tasks
- `calculateSummaryDates`: O(n × d) where d = depth (max 3)
- Expected: < 1ms for 100 tasks

### Optimizations

- Use `React.memo` for `TaskTableRow`
- Only re-calculate summary dates when children change
- Use Set for collapsed IDs (O(1) lookup)
- Lazy rendering: collapsed children don't render

---

## UI/UX Details

### Visual Hierarchy (SVAR Style)

**Reference**: See `/tmp/brave_ArGlaaayds.png` for SVAR React Gantt design

**Indentation:**
- Level 0: 0px
- Level 1: 20px
- Level 2: 40px
- Level 3: 60px

**Visual Elements:**
```
▼ 📁 Project planning          <- Summary (chevron + folder icon, bold, gray bg)
  📄 Marketing analysis        <- Child task (doc icon, indented)
  ▼ 📁 Discussions            <- Summary child (chevron + folder, bold, gray bg)
    📄 Initial design          <- Nested child (double indented)
    🚩 Presentation           <- Milestone (flag icon)
```

**No Connector Lines!** - Clean indentation without tree lines (├─, └─)

**Task Type Styling:**

| Type | Chevron | Icon | Font | Background | Notes |
|------|---------|------|------|------------|-------|
| `task` | ▼/▶ (if has children)<br>None (if no children) | 📄 DocumentIcon | Regular | White | Gray icon |
| `summary` | ▼ (expanded)<br>▶ (collapsed) | 📁 FolderIcon | **Bold** | `bg-gray-50` | Blue icon |
| `milestone` | None | 🚩 FlagIcon | Regular | White | Purple icon |

**Icon Colors:**
- Summary (FolderIcon): `text-blue-600`
- Task (DocumentIcon): `text-gray-500`
- Milestone (FlagIcon): `text-purple-600`

### Colors

- Summary row background: `bg-gray-50`
- Summary row hover: `bg-gray-100`
- Calculated dates (summary): `text-gray-500 italic`
- Chevron color: `text-gray-600`
- Chevron hover: `hover:bg-gray-200`
- Drop target highlight: `bg-blue-50 ring-2 ring-blue-300`

### Animations

- Collapse/expand: 150ms ease-out (height transition)
- Drag-drop: Default @dnd-kit animations
- Drop indicator: Fade in 100ms

---

## Comparison: Old vs New Approach

### Old Approach (Discarded)

❌ Separate `TaskGroup` interface
❌ Separate `groupSlice` in store
❌ Separate `TaskGroupRow` component
❌ Groups and tasks treated completely differently
❌ More code duplication
❌ Inconsistent behavior between groups and tasks

### New Approach (Current)

✅ Unified `Task` interface with `type` field
✅ Single `taskSlice` handles everything
✅ Single `TaskTableRow` handles all types
✅ Consistent treatment of all tasks
✅ Less code, simpler mental model
✅ Matches proven pattern from SVAR React Gantt

**Why this is better:**
- Developer experience: One mental model for all tasks
- Maintenance: Less code to maintain
- Consistency: Same operations work on all types
- Performance: No duplication, simpler queries
- Proven: SVAR uses this exact approach successfully

---

## Future Enhancements (Out of Scope)

- ✨ Auto-calculate summary progress from children
- ✨ Summary-level dependencies
- ✨ Task templates
- ✨ Bulk indent/outdent operations
- ✨ Tree view toggle (compact hierarchy view)
- ✨ Summary statistics (total duration, task count, etc.)

---

## Related Documents

- [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md) - SVAR React Gantt analysis
- [Type vs Hierarchy Analysis](/tmp/type_hierarchy_analysis.md) - Deep dive: Why tasks can have children
- [ICON_SYSTEM.md](./ICON_SYSTEM.md) - Heroicons icon system documentation
- [DATA_MODEL.md](./DATA_MODEL.md) - Task interface documentation
- [PHASE_1_MVP.md](./PHASE_1_MVP.md) - Sprint 1.1 foundation

---

**Status:** Ready for implementation (Updated with SVAR type/hierarchy pattern)
**Key Insights:**
- Summary tasks are just tasks with `type: 'summary'` - keep it simple!
- **Tasks CAN have children** - type determines data behavior, NOT hierarchy capability
- Use `type: 'task'` for fixed-deadline containers, `type: 'summary'` for auto-aggregation
**Next Steps:** Begin Phase 1 (Utilities & Validation)
