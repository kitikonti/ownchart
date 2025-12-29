# Sprint 1.5: Undo/Redo System - Team Concept

**Project:** Gantt Chart Application - app-gantt
**Sprint:** Sprint 1.5 - Undo/Redo System
**Status:** Concept & Planning
**Date:** 2025-12-29
**Priority:** 🔴 Critical (Blocks Sprint 1.2 Package 2)
**Estimated Duration:** 3-4 days (15-20 hours)

---

## Executive Summary

### Sprint Goal
Implement a robust undo/redo system that allows users to safely reverse any action with Ctrl+Z (Cmd+Z on Mac), providing a critical safety net for all operations. This is a **prerequisite for Sprint 1.2 Package 2** (Interactive Editing), which requires undo capability for drag operations.

### Success Metrics
- ✅ All user actions can be undone (create, edit, delete, move, hierarchy changes)
- ✅ Ctrl+Z / Ctrl+Shift+Z keyboard shortcuts work reliably
- ✅ Undo/Redo toolbar buttons with proper disabled states
- ✅ Can undo/redo through 100+ actions without performance degradation
- ✅ Undo stack survives file save/load operations
- ✅ Visual feedback confirms undo/redo actions

### Sprint Completion Checkpoint
**Visual Test:** "I can undo my mistakes"
- User creates a task → presses Ctrl+Z → task disappears
- User updates task name → presses Ctrl+Z → name reverts
- User deletes task → presses Ctrl+Z → task reappears
- Toolbar buttons show enabled/disabled states correctly
- Can undo/redo multiple times in sequence

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

**Name:** Product Lead
**Role:** Define user value, prioritize features, acceptance criteria

#### Key Decisions & Requirements

**Critical Feature Rationale:**
> "After reviewing competitive analysis, undo/redo is **table stakes** for any productivity application. Users expect to be able to reverse mistakes instantly. Without this, our app feels fragile and anxiety-inducing. Every professional Gantt tool (MS Project, Smartsheet, Asana, Monday.com) has undo/redo. This is non-negotiable for MVP."

**User Value Proposition:**
1. **Safety**: Users can experiment without fear of breaking their chart
2. **Confidence**: Encourages exploration and trying new features
3. **Productivity**: Faster than manually reverting changes
4. **Professional**: Expected behavior in all modern applications
5. **Learning**: New users can safely explore without consequences

**Feature Priority Ranking:**
1. 🔴 **Critical:** Basic undo/redo for all operations (Ctrl+Z, Ctrl+Shift+Z)
2. 🔴 **Critical:** Toolbar buttons with visual feedback
3. 🟡 **High:** Undo stack persists across file save/load
4. 🟡 **High:** Toast notifications showing what was undone
5. 🟢 **Medium:** Undo history panel (list of actions)
6. 🔵 **Low:** History timeline slider (deferred to V1.1 per ROADMAP.md)

**Acceptance Criteria:**
- [ ] Every user action creates an undoable history entry
- [ ] Ctrl+Z undoes the last action
- [ ] Ctrl+Shift+Z (or Ctrl+Y) redoes an undone action
- [ ] Undo/redo buttons appear in toolbar
- [ ] Buttons are disabled when nothing to undo/redo
- [ ] After undo, performing a new action clears the redo stack (branching)
- [ ] Can undo/redo 100+ actions without lag
- [ ] Works for: create task, update task, delete task, move task, indent/outdent, convert type

**User Stories:**
- As a project manager, I want to undo accidental deletions so I don't lose work
- As a new user, I want to experiment with features knowing I can undo mistakes
- As a power user, I want to undo multiple actions quickly with repeated Ctrl+Z
- As a collaborator, I want to see what actions were undone for transparency

---

### 2. Project Manager - Timeline & Risk Management

**Name:** Project Coordinator
**Role:** Schedule tracking, risk mitigation, resource allocation

#### Project Planning

**Time Breakdown:**
```
Day 1 (6 hours):
  - 0.5h: Team alignment meeting
  - 2h: Design command pattern infrastructure (types, interfaces)
  - 2h: Implement historySlice with undo/redo stacks
  - 1h: Write unit tests for history stack logic
  - 0.5h: Code review & adjustments

Day 2 (6 hours):
  - 3h: Implement history middleware (command recording)
  - 2h: Integrate middleware with taskSlice actions
  - 1h: Test command recording for all action types

Day 3 (5 hours):
  - 2h: Implement global keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
  - 1.5h: Create undo/redo toolbar buttons component
  - 1h: Add toast notifications for visual feedback
  - 0.5h: Integration testing

Day 4 (3 hours):
  - 1h: Cross-browser testing (Windows/Mac, Chrome/Firefox/Safari)
  - 1h: Performance testing (100+ undo operations)
  - 0.5h: Bug fixes & edge cases
  - 0.5h: Documentation & code review

Total: 20 hours over 4 days
```

**Milestones:**
- **M1** (End of Day 1): History stack implemented, unit tests passing
- **M2** (End of Day 2): Middleware recording all actions
- **M3** (End of Day 3): UI integration complete (keyboard + buttons)
- **M4** (End of Day 4): Sprint complete, all tests passing

**Risk Register:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| Command serialization fails for complex objects | Medium | High | Use JSON.parse/stringify validation, test all action types |
| Undo breaks hierarchy validation | Medium | High | Replay commands through same validation logic |
| Memory usage grows with large undo stacks | Low | Medium | Limit stack to 100 entries, implement snapshots |
| Keyboard shortcuts conflict with browser | Low | Medium | Prevent default on Ctrl+Z, test across browsers |
| Middleware breaks existing functionality | Low | High | Comprehensive integration tests before release |

**Dependencies:**
- ✅ Zustand store with Immer middleware (exists)
- ✅ All CRUD actions implemented (exists)
- ✅ Toolbar component (exists in App.tsx)
- ✅ Phosphor icons library (exists)
- ❌ No blockers - ready to start immediately

**Quality Gates:**
- [ ] All unit tests pass (>80% coverage on new code)
- [ ] Integration tests verify undo/redo for all action types
- [ ] Manual testing checklist completed
- [ ] Performance verified (100+ undo operations < 100ms each)
- [ ] Cross-browser tested (Chrome, Firefox, Safari on Windows/Mac)
- [ ] Code reviewed and approved
- [ ] Documentation updated (README, CHANGELOG)

---

### 3. UX/UI Designer - Interaction Design

**Name:** UX Designer
**Role:** User experience, visual design, interaction patterns

#### Interaction Design Specifications

**Design Principles:**
1. **Immediate Feedback**: Visual confirmation within 100ms
2. **Predictable Behavior**: Match standard app conventions (Ctrl+Z = undo)
3. **Forgiving**: Easy to undo, easy to redo, impossible to lose work
4. **Transparent**: User understands what will be undone

**Visual Design - Toolbar Buttons**

```
Toolbar Layout (existing header):
┌─────────────────────────────────────────────────────────┐
│ 📊 Gantt Chart    [+ Add Task] [Indent] [Outdent]      │
│                   [↶ Undo] [↷ Redo]                     │ ← NEW
└─────────────────────────────────────────────────────────┘
```

**Button States:**

```
Enabled State:
┌─────┐
│ ↶   │  ← Undo button (blue on hover, cursor pointer)
└─────┘
Tooltip: "Undo: Created task 'Design mockups' (Ctrl+Z)"

Disabled State:
┌─────┐
│ ↶   │  ← Gray, cursor not-allowed, no hover effect
└─────┘
Tooltip: "Nothing to undo"

Active State (pressed):
┌─────┐
│ ↶   │  ← Slightly darker, scale 0.95
└─────┘
```

**Keyboard Shortcuts:**

| Platform | Undo | Redo |
|----------|------|------|
| Windows/Linux | Ctrl+Z | Ctrl+Shift+Z or Ctrl+Y |
| macOS | Cmd+Z | Cmd+Shift+Z or Cmd+Y |

**Visual Feedback - Toast Notifications:**

```
Undo Action:
┌────────────────────────────────────────┐
│ ↶  Undone: Created task "Design"       │  ← 3-second toast
│                              [Redo]     │  ← Click to redo
└────────────────────────────────────────┘

Redo Action:
┌────────────────────────────────────────┐
│ ↷  Redone: Created task "Design"       │
│                              [Undo]     │
└────────────────────────────────────────┘

Nothing to Undo:
┌────────────────────────────────────────┐
│ ⓘ  Nothing to undo                     │
└────────────────────────────────────────┘
```

**Icon Selection:**

Using **Phosphor Icons** (already installed):
- Undo: `ArrowCounterClockwise` (from `@phosphor-icons/react`)
- Redo: `ArrowClockwise`
- Weight: Regular (24px)
- Color: Text color when enabled, gray when disabled

**Accessibility Considerations:**

- **Screen Reader**: Announce "Undone: [action description]" after undo
- **Keyboard Navigation**: Buttons focusable with Tab
- **Focus Indicator**: Blue outline (2px) when focused
- **ARIA Labels**:
  - Undo button: `aria-label="Undo last action (Ctrl+Z)"`
  - Redo button: `aria-label="Redo last undone action (Ctrl+Shift+Z)"`
  - Disabled state: `aria-disabled="true"`
- **Tooltip**: Shows action description (e.g., "Undo: Created task 'Design'")

**User Flow Diagrams:**

```
Undo Flow:
1. User performs action (e.g., creates task) → Action recorded in undo stack
2. User presses Ctrl+Z → Undo command executed
3. Action reversed → State updated
4. Toast notification appears → "Undone: Created task 'Design'"
5. Redo button becomes enabled → User can redo if needed

Redo Flow:
1. User presses Ctrl+Z (undo) → Action moved to redo stack
2. User presses Ctrl+Shift+Z → Redo command executed
3. Action reapplied → State updated
4. Toast notification appears → "Redone: Created task 'Design'"
5. Action back in undo stack → Can undo again

Branching Flow (New Action After Undo):
1. User creates task A → Undo stack: [A]
2. User creates task B → Undo stack: [A, B]
3. User presses Ctrl+Z → Undo stack: [A], Redo stack: [B]
4. User creates task C → Undo stack: [A, C], Redo stack: [] (cleared!)
5. Redo button becomes disabled → Cannot redo B anymore
```

---

### 4. Frontend Developer - Implementation Lead

**Name:** Frontend Engineer
**Role:** React implementation, state management, code quality

#### Technical Implementation Plan

**Architecture Overview:**

```
Component/UI Layer
├── Toolbar (App.tsx)
│   └── UndoRedoButtons.tsx → useHistoryStore
├── Keyboard shortcuts
│   └── useKeyboardShortcuts.ts → useHistoryStore
└── Toast notifications
    └── useToast.ts

State Management Layer
├── historySlice.ts → Undo/Redo stacks
└── middleware/
    └── historyMiddleware.ts → Records commands

Data Layer
└── taskSlice.ts (existing)
    ├── addTask
    ├── updateTask
    ├── deleteTask
    ├── moveTaskToParent
    └── ... all actions
```

**Phase 1: Command Pattern & Types**

**File:** `src/types/command.types.ts` (NEW)

```typescript
/**
 * Command Pattern for Undo/Redo
 * Every user action becomes a serializable command that can be undone/redone
 */

export interface Command {
  id: string;                    // UUID for tracking
  type: CommandType;             // Action type
  timestamp: number;             // When executed
  description: string;           // Human-readable (e.g., "Created task 'Design'")

  // Serializable parameters
  params: CommandParams;

  // Optional: For complex commands that need context
  metadata?: Record<string, unknown>;
}

export enum CommandType {
  // Task operations
  ADD_TASK = 'addTask',
  UPDATE_TASK = 'updateTask',
  DELETE_TASK = 'deleteTask',
  REORDER_TASKS = 'reorderTasks',

  // Hierarchy operations
  MOVE_TASK_TO_PARENT = 'moveTaskToParent',
  INDENT_TASKS = 'indentSelectedTasks',
  OUTDENT_TASKS = 'outdentSelectedTasks',

  // Type conversions
  CONVERT_TO_SUMMARY = 'convertToSummary',
  CONVERT_TO_TASK = 'convertToTask',

  // Selection operations
  TOGGLE_TASK_SELECTION = 'toggleTaskSelection',
  SELECT_TASK_RANGE = 'selectTaskRange',
  CLEAR_SELECTION = 'clearSelection',

  // Collapse/expand
  TOGGLE_TASK_COLLAPSED = 'toggleTaskCollapsed',
  EXPAND_ALL = 'expandAll',
  COLLAPSE_ALL = 'collapseAll',
}

export type CommandParams =
  | AddTaskParams
  | UpdateTaskParams
  | DeleteTaskParams
  | MoveTaskParams
  | IndentOutdentParams
  | ConvertTypeParams
  | SelectionParams
  | CollapseParams;

// Specific parameter types for each command
export interface AddTaskParams {
  task: Omit<Task, 'id'>;
  generatedId?: string;          // Store the generated ID for undo
}

export interface UpdateTaskParams {
  id: string;
  updates: Partial<Task>;
  previousValues: Partial<Task>; // Store old values for undo
}

export interface DeleteTaskParams {
  id: string;
  cascade: boolean;
  deletedTasks: Task[];          // Store all deleted tasks for undo
}

export interface MoveTaskParams {
  taskId: string;
  newParentId: string | null;
  previousParentId: string | null; // For undo
}

export interface IndentOutdentParams {
  taskIds: string[];
  changes: Array<{
    taskId: string;
    oldParent: string | undefined;
    newParent: string | undefined;
  }>;
}

export interface ConvertTypeParams {
  taskId: string;
  newType: TaskType;
  previousType: TaskType;
}

export interface SelectionParams {
  taskIds: string[];
  previousSelection: string[];   // For undo
}

export interface CollapseParams {
  taskId?: string;               // undefined for expand/collapseAll
  previousState: boolean;        // For undo
}
```

**Phase 2: History Store**

**File:** `src/store/slices/historySlice.ts` (NEW)

```typescript
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Command } from '@/types/command.types';

interface HistoryState {
  undoStack: Command[];
  redoStack: Command[];
  maxStackSize: number;
  isUndoing: boolean;            // Flag to prevent recording during undo
  isRedoing: boolean;            // Flag to prevent recording during redo
}

interface HistoryActions {
  // Core undo/redo
  undo: () => void;
  redo: () => void;

  // Command management
  recordCommand: (command: Command) => void;
  clearHistory: () => void;

  // Query methods
  canUndo: () => boolean;
  canRedo: () => boolean;
  getUndoDescription: () => string | null;
  getRedoDescription: () => string | null;

  // Internal flags
  setUndoing: (value: boolean) => void;
  setRedoing: (value: boolean) => void;
}

type HistoryStore = HistoryState & HistoryActions;

const MAX_STACK_SIZE = 100; // Limit to prevent memory issues

export const useHistoryStore = create<HistoryStore>()(
  immer((set, get) => ({
    // State
    undoStack: [],
    redoStack: [],
    maxStackSize: MAX_STACK_SIZE,
    isUndoing: false,
    isRedoing: false,

    // Actions
    recordCommand: (command) => {
      set((state) => {
        // Don't record if we're currently undoing/redoing
        if (state.isUndoing || state.isRedoing) return;

        // Add to undo stack
        state.undoStack.push(command);

        // Clear redo stack (branching: new action after undo)
        state.redoStack = [];

        // Trim undo stack if too large
        if (state.undoStack.length > state.maxStackSize) {
          state.undoStack.shift(); // Remove oldest
        }
      });
    },

    undo: () => {
      const { undoStack, redoStack } = get();
      if (undoStack.length === 0) return;

      set((state) => {
        state.isUndoing = true;
      });

      // Pop command from undo stack
      const command = undoStack[undoStack.length - 1];

      // Execute reverse action
      executeUndoCommand(command);

      set((state) => {
        // Move to redo stack
        const cmd = state.undoStack.pop();
        if (cmd) {
          state.redoStack.push(cmd);
        }
        state.isUndoing = false;
      });

      // Show toast notification
      showToast(`Undone: ${command.description}`, 'undo');
    },

    redo: () => {
      const { redoStack } = get();
      if (redoStack.length === 0) return;

      set((state) => {
        state.isRedoing = true;
      });

      // Pop command from redo stack
      const command = redoStack[redoStack.length - 1];

      // Execute forward action
      executeRedoCommand(command);

      set((state) => {
        // Move back to undo stack
        const cmd = state.redoStack.pop();
        if (cmd) {
          state.undoStack.push(cmd);
        }
        state.isRedoing = false;
      });

      // Show toast notification
      showToast(`Redone: ${command.description}`, 'redo');
    },

    clearHistory: () => {
      set((state) => {
        state.undoStack = [];
        state.redoStack = [];
      });
    },

    canUndo: () => get().undoStack.length > 0,
    canRedo: () => get().redoStack.length > 0,

    getUndoDescription: () => {
      const { undoStack } = get();
      return undoStack.length > 0
        ? undoStack[undoStack.length - 1].description
        : null;
    },

    getRedoDescription: () => {
      const { redoStack } = get();
      return redoStack.length > 0
        ? redoStack[redoStack.length - 1].description
        : null;
    },

    setUndoing: (value) => set((state) => { state.isUndoing = value; }),
    setRedoing: (value) => set((state) => { state.isRedoing = value; }),
  }))
);

/**
 * Execute the reverse of a command (undo)
 */
function executeUndoCommand(command: Command): void {
  const taskStore = useTaskStore.getState();

  switch (command.type) {
    case CommandType.ADD_TASK: {
      const params = command.params as AddTaskParams;
      if (params.generatedId) {
        taskStore.deleteTask(params.generatedId);
      }
      break;
    }

    case CommandType.UPDATE_TASK: {
      const params = command.params as UpdateTaskParams;
      taskStore.updateTask(params.id, params.previousValues);
      break;
    }

    case CommandType.DELETE_TASK: {
      const params = command.params as DeleteTaskParams;
      // Re-add all deleted tasks
      params.deletedTasks.forEach((task) => {
        taskStore.addTask(task);
      });
      break;
    }

    case CommandType.MOVE_TASK_TO_PARENT: {
      const params = command.params as MoveTaskParams;
      taskStore.moveTaskToParent(params.taskId, params.previousParentId);
      break;
    }

    case CommandType.INDENT_TASKS: {
      const params = command.params as IndentOutdentParams;
      // Restore previous parent for each task
      params.changes.forEach(({ taskId, oldParent }) => {
        taskStore.moveTaskToParent(taskId, oldParent ?? null);
      });
      break;
    }

    // ... other command types
  }
}

/**
 * Execute a command forward (redo)
 */
function executeRedoCommand(command: Command): void {
  const taskStore = useTaskStore.getState();

  switch (command.type) {
    case CommandType.ADD_TASK: {
      const params = command.params as AddTaskParams;
      taskStore.addTask(params.task);
      break;
    }

    case CommandType.UPDATE_TASK: {
      const params = command.params as UpdateTaskParams;
      taskStore.updateTask(params.id, params.updates);
      break;
    }

    case CommandType.DELETE_TASK: {
      const params = command.params as DeleteTaskParams;
      taskStore.deleteTask(params.id, params.cascade);
      break;
    }

    // ... other command types
  }
}

/**
 * Show toast notification (placeholder - implement with toast library)
 */
function showToast(message: string, type: 'undo' | 'redo'): void {
  console.log(`[Toast] ${message}`);
  // TODO: Integrate with toast notification library
}
```

**Phase 3: History Middleware**

**File:** `src/store/middleware/historyMiddleware.ts` (NEW)

```typescript
import type { StateCreator } from 'zustand';
import { useHistoryStore } from '../slices/historySlice';
import { CommandType } from '@/types/command.types';

/**
 * Middleware that intercepts actions and records them as commands
 *
 * This middleware wraps store actions to automatically create undo/redo entries
 * whenever a state mutation occurs.
 */
export const historyMiddleware = <T extends object>(
  config: StateCreator<T>
): StateCreator<T> => {
  return (set, get, api) => {
    // Wrap the setState function
    const wrappedSet: typeof set = (fn) => {
      // Get history state
      const historyStore = useHistoryStore.getState();

      // Don't record if we're undoing/redoing
      if (historyStore.isUndoing || historyStore.isRedoing) {
        set(fn);
        return;
      }

      // TODO: Capture command metadata before state change
      // This is complex - need to inspect which action is being called

      // Apply state change
      set(fn);

      // TODO: Record command to history
    };

    return config(wrappedSet, get, api);
  };
};

/**
 * Alternative approach: Decorator pattern
 * Wrap each action individually to capture parameters
 */
export function recordableAction<P extends unknown[], R>(
  actionName: string,
  action: (...params: P) => R,
  createCommand: (...params: P) => Command
) {
  return (...params: P): R => {
    const historyStore = useHistoryStore.getState();

    // Skip recording during undo/redo
    if (!historyStore.isUndoing && !historyStore.isRedoing) {
      const command = createCommand(...params);
      historyStore.recordCommand(command);
    }

    return action(...params);
  };
}
```

**Note:** Middleware approach is complex. **Recommended approach** is to modify each action in `taskSlice.ts` to manually call `recordCommand` after execution.

**Phase 4: Modified Task Slice (Example)**

**File:** `src/store/slices/taskSlice.ts` (MODIFIED)

```typescript
// Add import
import { useHistoryStore } from './historySlice';
import { CommandType } from '@/types/command.types';

// Modify addTask action to record command
addTask: (taskData) => {
  const historyStore = useHistoryStore.getState();
  let generatedId = '';

  set((state) => {
    const newTask: Task = {
      ...taskData,
      id: crypto.randomUUID(),
    };
    generatedId = newTask.id;
    state.tasks.push(newTask);
  });

  // Record command for undo/redo
  if (!historyStore.isUndoing && !historyStore.isRedoing) {
    historyStore.recordCommand({
      id: crypto.randomUUID(),
      type: CommandType.ADD_TASK,
      timestamp: Date.now(),
      description: `Created task "${taskData.name}"`,
      params: {
        task: taskData,
        generatedId,
      },
    });
  }
},

// Modify updateTask action
updateTask: (id, updates) => {
  const historyStore = useHistoryStore.getState();
  let previousValues: Partial<Task> = {};

  set((state) => {
    const taskIndex = state.tasks.findIndex((task) => task.id === id);
    if (taskIndex !== -1) {
      const currentTask = state.tasks[taskIndex];

      // Capture previous values for undo
      Object.keys(updates).forEach((key) => {
        previousValues[key as keyof Task] = currentTask[key as keyof Task];
      });

      // Apply updates
      state.tasks[taskIndex] = {
        ...currentTask,
        ...updates,
      };
    }
  });

  // Record command
  if (!historyStore.isUndoing && !historyStore.isRedoing && Object.keys(previousValues).length > 0) {
    const task = get().tasks.find((t) => t.id === id);
    historyStore.recordCommand({
      id: crypto.randomUUID(),
      type: CommandType.UPDATE_TASK,
      timestamp: Date.now(),
      description: `Updated task "${task?.name}"`,
      params: {
        id,
        updates,
        previousValues,
      },
    });
  }
},

// Similar modifications for deleteTask, moveTaskToParent, etc.
```

**Phase 5: Keyboard Shortcuts**

**File:** `src/hooks/useKeyboardShortcuts.ts` (NEW)

```typescript
import { useEffect } from 'react';
import { useHistoryStore } from '@/store/slices/historySlice';

/**
 * Global keyboard shortcuts for undo/redo
 *
 * Handles:
 * - Ctrl+Z / Cmd+Z: Undo
 * - Ctrl+Shift+Z / Cmd+Shift+Z: Redo
 * - Ctrl+Y / Cmd+Y: Redo (alternative)
 */
export function useKeyboardShortcuts() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modKey = isMac ? e.metaKey : e.ctrlKey;

      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if (modKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Redo: Ctrl+Shift+Z or Cmd+Shift+Z
      if (modKey && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
        return;
      }

      // Redo: Ctrl+Y or Cmd+Y (alternative)
      if (modKey && e.key === 'y') {
        e.preventDefault();
        redo();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo]);
}
```

**Usage in App.tsx:**
```typescript
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

function App() {
  useKeyboardShortcuts(); // Enable global shortcuts

  return (
    // ... rest of app
  );
}
```

**Phase 6: Undo/Redo Buttons Component**

**File:** `src/components/Toolbar/UndoRedoButtons.tsx` (NEW)

```typescript
import { ArrowCounterClockwise, ArrowClockwise } from '@phosphor-icons/react';
import { useHistoryStore } from '@/store/slices/historySlice';

export function UndoRedoButtons() {
  const undo = useHistoryStore((state) => state.undo);
  const redo = useHistoryStore((state) => state.redo);
  const canUndo = useHistoryStore((state) => state.canUndo());
  const canRedo = useHistoryStore((state) => state.canRedo());
  const undoDescription = useHistoryStore((state) => state.getUndoDescription());
  const redoDescription = useHistoryStore((state) => state.getRedoDescription());

  return (
    <div className="flex gap-1">
      {/* Undo Button */}
      <button
        onClick={undo}
        disabled={!canUndo}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={canUndo ? `Undo: ${undoDescription} (Ctrl+Z)` : 'Nothing to undo'}
        title={canUndo ? `Undo: ${undoDescription}` : 'Nothing to undo'}
      >
        <ArrowCounterClockwise size={20} weight="regular" />
      </button>

      {/* Redo Button */}
      <button
        onClick={redo}
        disabled={!canRedo}
        className="p-2 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label={canRedo ? `Redo: ${redoDescription} (Ctrl+Shift+Z)` : 'Nothing to redo'}
        title={canRedo ? `Redo: ${redoDescription}` : 'Nothing to redo'}
      >
        <ArrowClockwise size={20} weight="regular" />
      </button>
    </div>
  );
}
```

**Integration in App.tsx:**
```typescript
import { UndoRedoButtons } from '@/components/Toolbar/UndoRedoButtons';

// In the header toolbar (line 44-55):
<header className="flex items-center justify-between p-4 border-b">
  <div className="flex items-center gap-4">
    <ChartBarHorizontal size={24} />
    <h1 className="text-xl font-bold">Gantt Chart</h1>
  </div>

  <div className="flex items-center gap-2">
    <button onClick={handleAddTask}>+ Add Task</button>
    <HierarchyButtons />
    <UndoRedoButtons /> {/* NEW */}
  </div>
</header>
```

---

### 5. Software Architect - System Design & Patterns

**Name:** System Architect
**Role:** Technical architecture, design patterns, scalability

#### Architectural Decisions

**1. Command Pattern Selection**

**Why Command Pattern?**
- Encapsulates each action as an object
- Easy to serialize/deserialize for persistence
- Supports undo/redo naturally
- Can be extended to support macros, scripting, etc.

**Alternative Considered: State Snapshots**
```
❌ Rejected: Memory-intensive, doesn't scale beyond 10-20 snapshots
✅ Chosen: Command pattern with periodic snapshots (every 50 commands)
```

**2. History Stack Architecture**

```
Memory Structure:
┌──────────────────────────────────────┐
│ Undo Stack (Array)                   │
│ ┌─────────────────────────────────┐  │
│ │ [0] Add Task "Research"         │  │
│ │ [1] Update Task "Research"      │  │
│ │ [2] Add Task "Design"           │  │
│ │ [3] Delete Task "Research"      │  │ ← Most recent
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘

After Undo (Ctrl+Z):
┌──────────────────────────────────────┐
│ Undo Stack                           │
│ ┌─────────────────────────────────┐  │
│ │ [0] Add Task "Research"         │  │
│ │ [1] Update Task "Research"      │  │
│ │ [2] Add Task "Design"           │  │
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Redo Stack                           │
│ ┌─────────────────────────────────┐  │
│ │ [0] Delete Task "Research"      │  │ ← Moved here
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘

After New Action (branching):
┌──────────────────────────────────────┐
│ Undo Stack                           │
│ ┌─────────────────────────────────┐  │
│ │ [0] Add Task "Research"         │  │
│ │ [1] Update Task "Research"      │  │
│ │ [2] Add Task "Design"           │  │
│ │ [3] Add Task "Development"      │  │ ← New action
│ └─────────────────────────────────┘  │
└──────────────────────────────────────┘
┌──────────────────────────────────────┐
│ Redo Stack: []                       │ ← CLEARED (no longer valid)
└──────────────────────────────────────┘
```

**3. Data Flow Architecture**

```
User Action (e.g., "Create Task")
         ↓
   Component Event Handler
         ↓
   Store Action (addTask)
         ↓
   ┌─────────────────────────────┐
   │ 1. Execute state mutation   │
   │ 2. Capture command params   │
   │ 3. Record to history stack  │
   └─────────────────────────────┘
         ↓
   React Re-render
         ↓
   UI Updates
```

**Undo Flow:**
```
User presses Ctrl+Z
         ↓
   historyStore.undo()
         ↓
   Pop command from undo stack
         ↓
   Execute reverse operation
   (e.g., deleteTask instead of addTask)
         ↓
   Move command to redo stack
         ↓
   React Re-render
```

**4. Serialization Strategy**

All commands must be JSON-serializable for:
- Persistence in `.gantt` file format
- LocalStorage caching
- Future: Network transmission (collaboration)

**Serialization Rules:**
```typescript
// ✅ Good: Primitive values
{ id: "task-123", name: "Design" }

// ✅ Good: Date as ISO string
{ timestamp: "2025-12-29T10:30:00.000Z" }

// ❌ Bad: Function references
{ callback: () => console.log("Hello") }

// ❌ Bad: Circular references
{ task: task, parent: task.parent.task }

// ✅ Good: Use IDs instead
{ taskId: "task-123", parentId: "task-456" }
```

**5. Performance Optimization**

**Stack Size Limit:**
- Max 100 commands in memory
- When limit reached, remove oldest (FIFO)
- Prevents unbounded memory growth

**Snapshot Strategy (Phase 2 - V1.1):**
```typescript
// Every 50 commands, create a full state snapshot
if (undoStack.length % 50 === 0) {
  createSnapshot(getCurrentState());
}

// On deep undo (50+ steps back), restore from nearest snapshot
// then replay commands forward
```

**6. Edge Case Handling**

| Edge Case | Solution |
|-----------|----------|
| Undo delete with children | Store entire subtree in command params |
| Undo breaks validation | Replay through same validation logic, show error if invalid |
| Rapid undo/redo (spam Ctrl+Z) | Debounce or queue commands |
| Browser refresh loses history | Persist to LocalStorage (future enhancement) |
| File load clears history | Option to preserve or clear on load |

**7. Extensibility Points**

**Future Enhancements:**
```typescript
interface Command {
  // ... existing fields

  // Future: Grouping (e.g., "Indent 5 tasks" = 1 history entry)
  groupId?: string;

  // Future: User who performed action (collaboration)
  userId?: string;

  // Future: Conflict resolution (collaborative editing)
  version?: number;
}
```

---

### 6. QA Tester - Quality Assurance

**Name:** QA Engineer
**Role:** Test planning, manual testing, bug reporting

#### Comprehensive Test Plan

**Manual Testing Checklist:**

**A. Basic Undo/Redo Functionality**
```
Test Case 1.1: Undo Create Task
[ ] Create a new task "Design mockups"
[ ] Verify task appears in list
[ ] Press Ctrl+Z
[ ] Verify task disappears
[ ] Verify toast shows "Undone: Created task 'Design mockups'"
[ ] Verify redo button becomes enabled

Test Case 1.2: Redo Create Task
[ ] (Continuing from 1.1)
[ ] Press Ctrl+Shift+Z
[ ] Verify task reappears
[ ] Verify toast shows "Redone: Created task 'Design mockups'"
[ ] Verify undo button becomes enabled

Test Case 1.3: Undo Update Task
[ ] Update task name from "Design" to "Design mockups"
[ ] Press Ctrl+Z
[ ] Verify name reverts to "Design"
[ ] Press Ctrl+Shift+Z
[ ] Verify name changes back to "Design mockups"

Test Case 1.4: Undo Delete Task
[ ] Delete a task
[ ] Verify task disappears
[ ] Press Ctrl+Z
[ ] Verify task reappears in same position
[ ] Verify all properties restored (name, dates, progress, etc.)
```

**B. Hierarchy Operations**
```
Test Case 2.1: Undo Indent
[ ] Create tasks A, B (no hierarchy)
[ ] Select task B, indent (becomes child of A)
[ ] Verify B is indented under A
[ ] Press Ctrl+Z
[ ] Verify B returns to root level
[ ] Verify hierarchy restored

Test Case 2.2: Undo Outdent
[ ] Create parent task A with child B
[ ] Outdent B (move to root)
[ ] Press Ctrl+Z
[ ] Verify B becomes child of A again

Test Case 2.3: Undo Convert to Summary
[ ] Convert task to summary type
[ ] Press Ctrl+Z
[ ] Verify task type reverts to regular task
```

**C. Branching & Redo Stack**
```
Test Case 3.1: New Action Clears Redo Stack
[ ] Create task A
[ ] Create task B
[ ] Press Ctrl+Z (undo task B)
[ ] Verify redo button enabled
[ ] Create task C (new action after undo)
[ ] Verify redo button becomes DISABLED
[ ] Press Ctrl+Shift+Z
[ ] Verify nothing happens (redo stack cleared)

Test Case 3.2: Multiple Undo/Redo
[ ] Perform 5 actions (create 5 tasks)
[ ] Press Ctrl+Z 5 times
[ ] Verify all 5 tasks disappear in reverse order
[ ] Press Ctrl+Shift+Z 5 times
[ ] Verify all 5 tasks reappear in original order
```

**D. Toolbar Buttons**
```
Test Case 4.1: Button Disabled States
[ ] Open fresh app (no actions)
[ ] Verify undo button is disabled (gray, not clickable)
[ ] Verify redo button is disabled
[ ] Create a task
[ ] Verify undo button becomes enabled
[ ] Verify redo button still disabled

Test Case 4.2: Button Click Actions
[ ] Create a task
[ ] Click undo button (not keyboard)
[ ] Verify task undone
[ ] Click redo button
[ ] Verify task redone

Test Case 4.3: Tooltip Shows Action Description
[ ] Create task "Design mockups"
[ ] Hover over undo button
[ ] Verify tooltip shows "Undo: Created task 'Design mockups' (Ctrl+Z)"
[ ] Press Ctrl+Z
[ ] Hover over redo button
[ ] Verify tooltip shows "Redo: Created task 'Design mockups' (Ctrl+Shift+Z)"
```

**E. Keyboard Shortcuts**
```
Test Case 5.1: Windows/Linux Shortcuts
[ ] Test on Windows or Linux
[ ] Verify Ctrl+Z undoes
[ ] Verify Ctrl+Shift+Z redoes
[ ] Verify Ctrl+Y redoes (alternative)

Test Case 5.2: macOS Shortcuts
[ ] Test on Mac
[ ] Verify Cmd+Z undoes
[ ] Verify Cmd+Shift+Z redoes
[ ] Verify Cmd+Y redoes (alternative)

Test Case 5.3: Shortcuts Don't Fire in Inputs
[ ] Focus a task name input field
[ ] Type text, then press Ctrl+Z
[ ] Verify text input undo works (native behavior)
[ ] Verify global undo DOES NOT fire
```

**F. Performance & Limits**
```
Test Case 6.1: 100+ Actions
[ ] Create 150 tasks programmatically
[ ] Press Ctrl+Z 50 times
[ ] Measure time: Should complete in < 5 seconds
[ ] Verify memory usage stable (no leaks)

Test Case 6.2: Stack Limit (100 commands)
[ ] Perform 120 actions
[ ] Press Ctrl+Z 100 times
[ ] Verify only undoes last 100 (oldest 20 trimmed)
[ ] Verify no errors or crashes
```

**G. Edge Cases**
```
Test Case 7.1: Undo Cascade Delete
[ ] Create parent task with 3 children
[ ] Delete parent with cascade=true
[ ] Verify all 4 tasks deleted
[ ] Press Ctrl+Z
[ ] Verify all 4 tasks restored
[ ] Verify hierarchy intact

Test Case 7.2: Undo Breaks Validation
[ ] Create task A
[ ] Create task B as child of A
[ ] Delete task A (breaks B's parent reference)
[ ] Press Ctrl+Z to restore A
[ ] Verify A and B relationship restored

Test Case 7.3: Rapid Undo/Redo Spam
[ ] Create a task
[ ] Rapidly press Ctrl+Z and Ctrl+Shift+Z 20 times
[ ] Verify app doesn't crash
[ ] Verify final state is consistent
```

**H. Toast Notifications**
```
Test Case 8.1: Undo Toast Appears
[ ] Create task
[ ] Press Ctrl+Z
[ ] Verify toast appears: "Undone: Created task '[name]'"
[ ] Verify toast disappears after 3 seconds

Test Case 8.2: Nothing to Undo Toast
[ ] Open fresh app
[ ] Press Ctrl+Z
[ ] Verify toast shows "Nothing to undo"
```

**Bug Severity Classification:**

| Severity | Description | Example |
|----------|-------------|---------|
| P0 - Critical | Undo/redo completely broken | Ctrl+Z does nothing |
| P1 - High | Major data loss risk | Undo deletes wrong task |
| P2 - Medium | Feature partially works | Redo button doesn't disable |
| P3 - Low | Minor UX issue | Toast message unclear |
| P4 - Trivial | Cosmetic issue | Tooltip typo |

**Performance Benchmarks:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Undo execution time | < 100ms | Chrome DevTools Performance tab |
| Redo execution time | < 100ms | Same |
| 100 sequential undos | < 5 seconds | Stopwatch + automation script |
| Memory growth (100 commands) | < 5MB | Chrome Task Manager |
| Toast notification delay | < 200ms | Visual inspection |

---

### 7. DevOps Engineer - Build & Testing Infrastructure

**Name:** DevOps Lead
**Role:** CI/CD, testing automation, deployment pipeline

#### Testing Strategy

**Unit Tests (Vitest):**

**File:** `tests/unit/historySlice.test.ts` (NEW)

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoryStore } from '@/store/slices/historySlice';
import { CommandType } from '@/types/command.types';

describe('History Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useHistoryStore.getState().clearHistory();
  });

  it('should record command to undo stack', () => {
    const { recordCommand, canUndo } = useHistoryStore.getState();

    const command = {
      id: 'cmd-1',
      type: CommandType.ADD_TASK,
      timestamp: Date.now(),
      description: 'Created task',
      params: { task: { name: 'Test' } },
    };

    recordCommand(command);
    expect(canUndo()).toBe(true);
  });

  it('should move command to redo stack on undo', () => {
    const { recordCommand, undo, canRedo } = useHistoryStore.getState();

    recordCommand(mockCommand);
    undo();

    expect(canRedo()).toBe(true);
  });

  it('should clear redo stack on new action after undo', () => {
    const { recordCommand, undo, canRedo } = useHistoryStore.getState();

    recordCommand(mockCommand);
    recordCommand(mockCommand2);
    undo();
    expect(canRedo()).toBe(true);

    recordCommand(mockCommand3); // New action
    expect(canRedo()).toBe(false);
  });

  it('should limit stack to maxStackSize', () => {
    const { recordCommand, undoStack } = useHistoryStore.getState();

    // Record 150 commands
    for (let i = 0; i < 150; i++) {
      recordCommand({ ...mockCommand, id: `cmd-${i}` });
    }

    // Stack should be trimmed to 100
    expect(useHistoryStore.getState().undoStack.length).toBe(100);
  });

  it('should return correct undo description', () => {
    const { recordCommand, getUndoDescription } = useHistoryStore.getState();

    recordCommand({
      ...mockCommand,
      description: 'Created task "Design mockups"',
    });

    expect(getUndoDescription()).toBe('Created task "Design mockups"');
  });
});
```

**Integration Tests:**

**File:** `tests/integration/undo-redo-integration.test.ts` (NEW)

```typescript
import { describe, it, expect } from 'vitest';
import { useTaskStore } from '@/store/slices/taskSlice';
import { useHistoryStore } from '@/store/slices/historySlice';

describe('Undo/Redo Integration', () => {
  it('should undo task creation', () => {
    const { addTask, tasks } = useTaskStore.getState();
    const { undo } = useHistoryStore.getState();

    const initialCount = tasks.length;

    addTask({
      name: 'Test Task',
      startDate: '2025-01-01',
      endDate: '2025-01-05',
      // ... other required fields
    });

    expect(useTaskStore.getState().tasks.length).toBe(initialCount + 1);

    undo();

    expect(useTaskStore.getState().tasks.length).toBe(initialCount);
  });

  it('should undo task update', () => {
    const { addTask, updateTask } = useTaskStore.getState();
    const { undo } = useHistoryStore.getState();

    const taskId = addTask({ name: 'Original', /* ... */ });
    updateTask(taskId, { name: 'Updated' });

    expect(useTaskStore.getState().tasks.find(t => t.id === taskId)?.name).toBe('Updated');

    undo();

    expect(useTaskStore.getState().tasks.find(t => t.id === taskId)?.name).toBe('Original');
  });
});
```

**CI/CD Pipeline Enhancement:**

**File:** `.github/workflows/test-undo-redo.yml` (NEW)

```yaml
name: Sprint 1.5 - Undo/Redo Tests

on:
  pull_request:
    paths:
      - 'src/store/slices/historySlice.ts'
      - 'src/types/command.types.ts'
      - 'src/hooks/useKeyboardShortcuts.ts'
      - 'tests/**/*undo*.test.ts'

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

      - name: Run undo/redo unit tests
        run: npm run test:unit -- historySlice

      - name: Run integration tests
        run: npm run test:integration -- undo-redo

      - name: Check coverage (80%+ required)
        run: npm run test:coverage

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Test 100 undo operations
        run: npm run test:performance -- undo-stress

      - name: Assert < 5 second execution
        run: |
          # Custom script to verify performance
```

---

### 8. Data Analyst - Metrics & Success Tracking

**Name:** Analytics Specialist
**Role:** Define KPIs, track metrics, measure success

#### Success Metrics

**Key Performance Indicators:**

**1. Adoption Metrics**
```
Metrics to Track:
- % of users who use undo at least once (target: 70%)
- Average undo operations per session (target: 3+)
- Undo-to-action ratio (target: 5-10%)

Measurement:
- Event: 'undo_executed', 'redo_executed'
- Track via console.log in historyStore (Phase 1)
- Future: Analytics integration
```

**2. Error Prevention**
```
User Confidence Score:
- Definition: % of users who perform >10 actions without saving
- Hypothesis: Undo increases confidence → more actions before save
- Target: 40% of users (vs. 20% without undo)

Mistake Recovery Rate:
- Definition: % of deletes followed by immediate undo
- Indicates accidental deletions being caught
- Target: 15-20% (healthy range)
```

**3. Performance Metrics**
```
Undo Latency:
- P50 (median): < 50ms
- P90: < 100ms
- P99: < 200ms

Memory Usage:
- 100 commands in stack: < 5MB
- Monitor for memory leaks (should be flat over time)
```

**4. Quality Metrics**
```
Bug Density:
- Target: < 0.3 bugs per 100 LOC
- Critical bugs (P0/P1): 0

Test Coverage:
- Unit tests: > 85%
- Integration tests: All critical paths
- E2E tests: Core user flows
```

---

## Implementation Timeline

### Day 1: Foundation (6 hours)
- ✅ Create command types (`command.types.ts`)
- ✅ Implement `historySlice.ts` with undo/redo stacks
- ✅ Write unit tests for history logic
- ✅ Code review

### Day 2: Integration (6 hours)
- ✅ Modify `taskSlice.ts` actions to record commands
- ✅ Implement `executeUndoCommand` and `executeRedoCommand`
- ✅ Test integration with all action types
- ✅ Handle edge cases (cascade delete, hierarchy validation)

### Day 3: UI Integration (5 hours)
- ✅ Create `useKeyboardShortcuts.ts` hook
- ✅ Create `UndoRedoButtons.tsx` component
- ✅ Integrate keyboard shortcuts in App
- ✅ Integrate buttons in toolbar
- ✅ Add toast notifications (simple console.log or alert for now)

### Day 4: Testing & Polish (3 hours)
- ✅ Manual testing checklist (all test cases)
- ✅ Cross-browser testing
- ✅ Performance testing (100+ undos)
- ✅ Bug fixes
- ✅ Documentation (README, CHANGELOG)

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Command serialization breaks** | High | Medium | Test all action types, validate JSON compatibility |
| **Undo breaks validation logic** | High | Low | Replay through same validators, comprehensive tests |
| **Memory leak from unbounded stack** | Medium | Low | Hard limit at 100 commands, monitor memory |
| **Race condition: undo during action** | Medium | Low | Use isUndoing/isRedoing flags |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Confusing undo behavior** | Medium | Low | Clear toast messages, descriptive tooltips |
| **Loss of redo stack frustrates users** | Low | Medium | Educate via toast: "New action cleared redo history" |
| **Performance lag with many undos** | Low | Low | Optimize executeUndoCommand, test with 100+ |

---

## Success Criteria

### Sprint Complete When:

- [ ] **Functionality**
  - [ ] Ctrl+Z undoes last action
  - [ ] Ctrl+Shift+Z (and Ctrl+Y) redoes last undone action
  - [ ] Toolbar buttons trigger undo/redo
  - [ ] All action types support undo (create, update, delete, move, hierarchy)
  - [ ] New action after undo clears redo stack

- [ ] **Performance**
  - [ ] Single undo executes in < 100ms
  - [ ] 100 sequential undos complete in < 5 seconds
  - [ ] No memory leaks (tested with 200+ actions)

- [ ] **Quality**
  - [ ] 85%+ test coverage on new code
  - [ ] All unit/integration tests pass
  - [ ] Manual testing checklist complete (50+ test cases)
  - [ ] Cross-browser tested (Chrome, Firefox, Safari on Windows/Mac)

- [ ] **User Experience**
  - [ ] Buttons show correct enabled/disabled states
  - [ ] Tooltips show action descriptions
  - [ ] Toast notifications appear on undo/redo
  - [ ] Works with keyboard and mouse
  - [ ] Accessible (screen reader support, keyboard navigation)

- [ ] **Documentation**
  - [ ] Code commented
  - [ ] README updated with undo/redo feature
  - [ ] CHANGELOG entry added
  - [ ] User guide includes undo/redo instructions

---

## Next Steps After Sprint 1.5

**Immediate:**
- **Sprint 1.2 Package 2**: Interactive Editing (drag-to-edit task bars)
  - Now unblocked since history/undo system exists
  - Users can drag task bars and undo mistakes with Ctrl+Z

**Future Enhancements (V1.1):**
- History timeline slider with real-time scrubbing
- Named snapshots ("Save this version")
- History panel showing list of all actions
- Undo grouping (e.g., "Indent 5 tasks" = 1 undo)
- Persist history in `.gantt` file format
- Collaborative undo (track who performed action)

---

## Appendix

### Command Type Reference

All supported command types:
1. `ADD_TASK` - Create new task
2. `UPDATE_TASK` - Modify task properties
3. `DELETE_TASK` - Remove task (with or without cascade)
4. `REORDER_TASKS` - Change task order
5. `MOVE_TASK_TO_PARENT` - Change hierarchy
6. `INDENT_TASKS` - Indent selected tasks
7. `OUTDENT_TASKS` - Outdent selected tasks
8. `CONVERT_TO_SUMMARY` - Change type to summary
9. `CONVERT_TO_TASK` - Change type to task
10. `TOGGLE_TASK_SELECTION` - Select/deselect task
11. `SELECT_TASK_RANGE` - Select range
12. `CLEAR_SELECTION` - Clear all selections
13. `TOGGLE_TASK_COLLAPSED` - Expand/collapse
14. `EXPAND_ALL` - Expand all tasks
15. `COLLAPSE_ALL` - Collapse all tasks

### Glossary

- **Command**: Serializable object representing a user action
- **Undo Stack**: Array of commands that can be undone (LIFO)
- **Redo Stack**: Array of undone commands that can be redone (LIFO)
- **Branching**: When redo stack is cleared after new action following undo
- **Snapshot**: Full state capture for performance optimization (V1.1)
- **Command Pattern**: Design pattern encapsulating actions as objects

### References

- [Concept: ROADMAP.md Sprint 1.5](/concept/planning/ROADMAP.md#sprint-15-basic-undoredo)
- [Concept: DATA_MODEL.md History System](/concept/architecture/DATA_MODEL.md#3-history-system)
- [Concept: TECHNICAL_ARCHITECTURE.md Command Pattern](/concept/architecture/TECHNICAL_ARCHITECTURE.md#41-command-pattern-for-actions)
- [Concept: USER_STORIES.md Epic 3](/concept/planning/USER_STORIES.md#epic-3-version-history)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [Command Pattern (Refactoring Guru)](https://refactoring.guru/design-patterns/command)

---

**Document Version**: 1.0
**Created**: 2025-12-29
**Status**: Ready for Implementation
**Estimated Completion**: 2026-01-03 (4 working days)
**Priority**: 🔴 Critical (Blocks Sprint 1.2 Package 2)

---

## Team Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | Product Lead | ✅ Approved | 2025-12-29 |
| Project Manager | Project Coordinator | ✅ Approved | 2025-12-29 |
| UX/UI Designer | UX Designer | ✅ Approved | 2025-12-29 |
| Frontend Developer | Frontend Engineer | ✅ Approved | 2025-12-29 |
| Software Architect | System Architect | ✅ Approved | 2025-12-29 |
| QA Tester | QA Engineer | ✅ Approved | 2025-12-29 |
| DevOps Engineer | DevOps Lead | ✅ Approved | 2025-12-29 |
| Data Analyst | Analytics Specialist | ✅ Approved | 2025-12-29 |

**All team members have reviewed and approved this concept document. Proceed with implementation.** 🚀
