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

### Enhanced Drop Logic

**File:** `src/components/TaskList/TaskTable.tsx` (UPDATE)

Update `handleDragEnd` to support hierarchy:

```typescript
const handleDragEnd = (event: DragEndEvent) => {
  const { active, over } = event;
  if (!over || active.id === over.id) return;

  const activeTask = tasks.find(t => t.id === active.id);
  const overTask = tasks.find(t => t.id === over.id);
  if (!activeTask || !overTask) return;

  // Check if dropping onto a summary task (to nest inside)
  const dropZone = event.delta.y; // Vertical offset
  const shouldNestInside =
    overTask.type === 'summary' &&
    Math.abs(dropZone) < 10; // Close to center of row

  if (shouldNestInside) {
    // Nest inside summary
    moveTaskToParent(activeTask.id, overTask.id);
  } else {
    // Reorder at same level
    const oldIndex = tasks.findIndex(t => t.id === activeTask.id);
    const newIndex = tasks.findIndex(t => t.id === overTask.id);
    reorderTasks(oldIndex, newIndex);
  }
};
```

### Visual Drop Indicators

Add visual feedback when dragging over summary tasks:

```typescript
const [dropTarget, setDropTarget] = useState<string | null>(null);

// In TaskTableRow
<div
  className={cn(
    'task-row',
    dropTarget === task.id && 'bg-blue-50 ring-2 ring-blue-300'
  )}
  onDragOver={(e) => {
    if (task.type === 'summary') {
      e.preventDefault();
      setDropTarget(task.id);
    }
  }}
  onDragLeave={() => setDropTarget(null)}
>
  {/* ... */}
</div>
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

### Delete Task

**Regular Task:**
- Simply delete, no special handling

**Summary Task:**

Show confirmation dialog with options:

```
Delete "Phase 1"?

This summary has 5 child tasks and 1 subsummary.

○ Delete summary only (move children to parent level)
● Delete summary and all children (5 tasks, 1 subsummary)

[Cancel] [Delete]
```

**Implementation:**

```typescript
const handleDeleteTask = (taskId: string) => {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  if (task.type === 'summary') {
    const children = getTaskChildren(tasks, taskId);

    if (children.length > 0) {
      // Show confirmation dialog
      const deleteAllChildren = confirm(
        `Delete "${task.name}" and ${children.length} children?`
      );

      if (deleteAllChildren) {
        // Delete recursively
        const descendants = getTaskDescendants(tasks, taskId);
        descendants.forEach(child => deleteTask(child.id));
      } else {
        // Move children to parent level
        children.forEach(child =>
          moveTaskToParent(child.id, task.parent ?? null)
        );
      }
    }
  }

  deleteTask(taskId);
};
```

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

- [ ] **1.15.4a**: Update DnD to support nesting
  - Detect drops on summary tasks
  - Call `moveTaskToParent` when nesting
  - **Test:** Manual drag testing
  - **Commit:** `feat(dnd): add support for nesting tasks`

- [ ] **1.15.4b**: Add validation to DnD
  - Prevent circular hierarchy
  - Prevent exceeding max depth
  - Show visual feedback for invalid drops
  - **Test:** Try invalid moves
  - **Commit:** `feat(dnd): add hierarchy validation`

- [ ] **1.15.4c**: Add visual drop indicators
  - Highlight summary when hovering to nest
  - Drop line between tasks for reordering
  - **Test:** Visual QA
  - **Commit:** `feat(dnd): add visual drop indicators`

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
