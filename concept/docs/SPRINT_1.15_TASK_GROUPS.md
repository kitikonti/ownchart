# Sprint 1.15: Task Groups & Hierarchical Organization

**Status:** Planning
**Created:** 2025-12-19
**Position:** Between Sprint 1.1 and Sprint 1.2
**Duration:** 3-4 days
**Goal:** Add hierarchical task organization with collapsible groups

---

## Overview

This sprint implements the Task Groups feature, enabling users to organize tasks into collapsible groups/phases with visual hierarchy. This feature was originally planned for V1.1 but is being implemented early to establish the hierarchical data model before building the timeline visualization.

**Why now?**
- Establishes hierarchical data structure before timeline rendering (Sprint 1.2)
- Enables better task organization from the start
- Prevents major refactoring later
- Builds on Sprint 1.1's foundation (task CRUD, drag-drop, store)

---

## Key Concepts

### What are Task Groups?

Task Groups (also called "phases") provide hierarchical organization:
- **Container for tasks**: Group related tasks together
- **Collapsible sections**: Hide/show child tasks
- **Visual hierarchy**: Indentation shows parent-child relationships
- **Summary bars**: Show group timespan on timeline (Sprint 1.2)
- **Nested groups**: Groups can contain other groups (up to 3 levels deep in MVP)

### Design Principles

1. **Groups are organizational only**: Independent of dependencies
2. **Tasks belong to one group max**: No multi-group membership in MVP
3. **Groups don't affect scheduling**: Dependencies still control task timing
4. **Collapsed state is visual only**: Doesn't delete or hide data, just presentation
5. **Groups have no dates**: Timespan calculated from child tasks

---

## Data Model Changes

### 1. TaskGroup Interface

**File:** `src/types/chart.types.ts`

```typescript
/**
 * Represents a task group (phase) for hierarchical organization.
 * Groups contain tasks and can be nested up to 3 levels deep.
 */
export interface TaskGroup {
  id: string;                    // UUID v4
  name: string;                  // Group name (1-200 chars)
  description?: string;          // Optional description
  color: string;                 // Hex color for summary bar

  // Hierarchy
  parentGroupId?: string;        // Parent group ID (null = root level)
  order: number;                 // Display order among siblings

  // Display
  collapsed: boolean;            // Whether group is collapsed
  showSummaryBar: boolean;       // Show summary bar on timeline

  // Metadata
  createdAt: string;             // ISO 8601 timestamp
  updatedAt: string;             // ISO 8601 timestamp
}
```

### 2. Task Interface Updates

**Add to existing Task interface:**

```typescript
export interface Task {
  // ... existing fields ...

  // NEW: Grouping
  groupId?: string;              // Parent group ID (null = root level)
}
```

### 3. Chart Interface Updates

**Add to existing Chart interface:**

```typescript
export interface Chart {
  // ... existing fields ...

  // NEW: Groups
  groups: TaskGroup[];
}
```

### 4. Helper Types

```typescript
/**
 * Flattened view item for rendering (combines tasks and groups).
 */
export type TaskListItem =
  | { type: 'group'; data: TaskGroup; level: number }
  | { type: 'task'; data: Task; level: number };

/**
 * Hierarchy metadata for rendering.
 */
export interface HierarchyMetadata {
  level: number;                 // Nesting depth (0 = root)
  hasChildren: boolean;          // Whether item has children
  isLastChild: boolean;          // Whether item is last in parent's children
  path: string[];                // Array of parent IDs from root to this item
}
```

---

## Store Changes

### File: `src/store/slices/groupSlice.ts` (NEW)

Create new slice for group management:

```typescript
interface GroupState {
  groups: TaskGroup[];
  expandedGroupIds: Set<string>;  // Track collapsed/expanded state
}

interface GroupActions {
  // CRUD operations
  addGroup: (groupData: Omit<TaskGroup, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateGroup: (id: string, updates: Partial<TaskGroup>) => void;
  deleteGroup: (id: string) => void;

  // Hierarchy operations
  moveGroup: (groupId: string, newParentId: string | null) => void;
  reorderGroups: (fromIndex: number, toIndex: number, parentId?: string | null) => void;

  // Collapse/expand
  toggleGroupCollapsed: (id: string) => void;
  expandGroup: (id: string) => void;
  collapseGroup: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // Utility
  getGroupChildren: (groupId: string | null) => TaskGroup[];
  getGroupPath: (groupId: string) => TaskGroup[];
  getGroupLevel: (groupId: string) => number;
}
```

### Updates to `taskSlice.ts`

**Add new actions:**

```typescript
interface TaskActions {
  // ... existing actions ...

  // NEW: Group assignment
  moveTaskToGroup: (taskId: string, groupId: string | null) => void;
  moveTasksToGroup: (taskIds: string[], groupId: string | null) => void;
}
```

### Combined Store Hook

**File:** `src/store/index.ts` (UPDATE)

```typescript
// Combine task and group slices
export const useAppStore = create<TaskStore & GroupStore>()(
  immer((set, get) => ({
    ...taskSlice(set, get),
    ...groupSlice(set, get),
  }))
);
```

---

## UI Components

### 1. TaskGroupRow Component (NEW)

**File:** `src/components/TaskList/TaskGroupRow.tsx`

```typescript
interface TaskGroupRowProps {
  group: TaskGroup;
  level: number;           // Nesting level for indentation
  hasChildren: boolean;    // Whether group has tasks/subgroups
  isCollapsed: boolean;    // Collapsed state
  onToggleCollapse: () => void;
}
```

**Features:**
- Expand/collapse button (chevron icon)
- Group name (inline editable on double-click)
- Drag handle for reordering
- Indentation based on nesting level
- Color indicator
- Delete button (with confirmation if has children)
- Child count badge (e.g., "5 tasks")

**Visual Design:**
```
[▼] 📁 Phase 1: Design     [5 tasks] [●] [×]
    ├─ Task A
    ├─ Task B
    └─ [▶] 📁 Subphase 1.1  [2 tasks] [●] [×]
```

### 2. TaskRow Updates

**File:** `src/components/TaskList/TaskRow.tsx` (UPDATE)

**Add:**
- `level` prop for indentation
- Hierarchy indicator (connecting lines)
- Visual indent based on `level`
- Drop target indicator for moving into groups

**Visual Design:**
```
[▼] 📁 Phase 1
    ├─ [≡] Task A          [dates] [color]
    ├─ [≡] Task B          [dates] [color]
    └─ [≡] Task C          [dates] [color]
```

### 3. TaskList Updates

**File:** `src/components/TaskList/TaskList.tsx` (UPDATE)

**New logic:**
- Build flattened hierarchy view from groups + tasks
- Respect collapsed state (filter out children of collapsed groups)
- Handle nested drag-drop (tasks into groups, groups into groups)
- Render TaskGroupRow for groups, TaskRow for tasks

**Flattening algorithm:**

```typescript
function buildFlattenedView(
  tasks: Task[],
  groups: TaskGroup[],
  collapsedGroupIds: Set<string>
): TaskListItem[] {
  const result: TaskListItem[] = [];

  function addGroupAndChildren(
    groupId: string | null,
    level: number,
    parentCollapsed: boolean
  ) {
    // Get groups at this level
    const childGroups = groups
      .filter(g => g.parentGroupId === groupId)
      .sort((a, b) => a.order - b.order);

    // Get tasks at this level
    const childTasks = tasks
      .filter(t => t.groupId === groupId)
      .sort((a, b) => a.order - b.order);

    // Add groups first
    for (const group of childGroups) {
      if (!parentCollapsed) {
        result.push({ type: 'group', data: group, level });
      }

      const isCollapsed = collapsedGroupIds.has(group.id);
      addGroupAndChildren(group.id, level + 1, parentCollapsed || isCollapsed);
    }

    // Then add tasks
    if (!parentCollapsed) {
      for (const task of childTasks) {
        result.push({ type: 'task', data: task, level });
      }
    }
  }

  // Start from root level
  addGroupAndChildren(null, 0, false);

  return result;
}
```

### 4. Add Group Button

**Location:** TaskList header, next to "Add Task"

```tsx
<button onClick={handleAddGroup}>
  + Add Group
</button>
```

**Behavior:**
- Creates new group at root level
- Auto-focuses name field for editing
- Default name: "New Group"
- Default color: Next in palette

---

## Drag-and-Drop Enhancements

### Current State (Sprint 1.1)
- Tasks can be reordered within flat list
- Uses @dnd-kit

### New Requirements

**Task DnD:**
- ✅ Reorder tasks within same group
- ✅ Move task into group (drop on group row)
- ✅ Move task out of group (drop at root level)
- ✅ Move task between groups

**Group DnD:**
- ✅ Reorder groups within same parent
- ✅ Nest group inside another group (max 3 levels)
- ✅ Move group to root level
- ⚠️ Prevent circular nesting (group cannot be moved into its own descendants)

**Visual Feedback:**
- Drop indicator line (horizontal line showing drop position)
- Drop zone highlight (when hovering over group to nest inside)
- Indentation preview during drag

**Implementation approach:**
- Use @dnd-kit's `useSortable` for items
- Use `useSensor` with pointer and keyboard sensors
- Custom collision detection for nested drops
- Validation logic to prevent invalid moves

---

## Validation Rules

### Group Validation

| Rule | Validation | Error Message |
|------|------------|---------------|
| Name | 1-200 characters | "Group name must be 1-200 characters" |
| Max nesting | 3 levels deep | "Maximum nesting depth is 3 levels" |
| Circular nesting | Group cannot contain itself or ancestors | "Cannot move group into itself or descendants" |
| Color | Valid hex color | "Invalid color format" |

### Hierarchy Validation

- ✓ Task cannot reference non-existent group
- ✓ Group cannot reference non-existent parent
- ✓ No orphaned references on delete
- ✓ Order values are sequential (0, 1, 2, ...)

---

## Delete Behavior

### Delete Group

**Options:**

1. **Delete group only** (default):
   - Moves child tasks to parent level
   - Moves child groups to parent level
   - Preserves all data, just removes container

2. **Delete group and all children** (destructive):
   - Requires explicit confirmation
   - Deletes all child tasks
   - Deletes all child groups recursively
   - Shows count: "Delete 'Phase 1' and 12 tasks, 2 subgroups?"

**Confirmation dialog:**
```
Delete "Phase 1"?

○ Delete group only (move 5 tasks to root)
◉ Delete group and all contents (5 tasks, 1 subgroup)

[Cancel] [Delete]
```

### Delete Task in Group

- Simply removes task from group
- No special handling needed

---

## File Format Changes

### Chart JSON Structure

```json
{
  "id": "uuid",
  "name": "My Project",
  "version": "1.0.0",
  "tasks": [
    {
      "id": "task-1",
      "name": "Design homepage",
      "groupId": "group-1",
      ...
    }
  ],
  "groups": [
    {
      "id": "group-1",
      "name": "Phase 1: Design",
      "parentGroupId": null,
      "collapsed": false,
      "showSummaryBar": true,
      "color": "#3b82f6",
      "order": 0,
      "createdAt": "2025-12-19T10:00:00.000Z",
      "updatedAt": "2025-12-19T10:00:00.000Z"
    }
  ],
  "dependencies": [...],
  "viewSettings": {...},
  "metadata": {...}
}
```

### Backward Compatibility

- Files without `groups` field: Default to `[]`
- Tasks without `groupId`: Treated as root level
- Migration on load: Add `groups: []` if missing

---

## Implementation Tasks

### Phase 1: Data Layer (Day 1)

**Tasks:**

- [ ] **1.15.1a**: Add `TaskGroup` interface to `chart.types.ts`
  - Define all fields per spec above
  - Add JSDoc comments
  - Export type
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add TaskGroup interface`

- [ ] **1.15.1b**: Update `Task` interface with `groupId` field
  - Add optional `groupId?: string`
  - Update JSDoc
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add groupId to Task interface`

- [ ] **1.15.1c**: Update `Chart` interface with `groups` array
  - Add `groups: TaskGroup[]`
  - Update JSDoc
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add groups to Chart interface`

- [ ] **1.15.1d**: Add helper types (`TaskListItem`, `HierarchyMetadata`)
  - Define types per spec above
  - **Test:** TypeScript compiles
  - **Commit:** `feat(types): add hierarchy helper types`

### Phase 2: Store Layer (Day 1-2)

**Tasks:**

- [ ] **1.15.2a**: Create `groupSlice.ts` with state structure
  - Define `GroupState` and `GroupActions` interfaces
  - Initialize empty slice
  - **Test:** Compiles and integrates with store
  - **Commit:** `feat(store): create group slice structure`

- [ ] **1.15.2b**: Implement group CRUD actions
  - `addGroup`, `updateGroup`, `deleteGroup`
  - Generate UUIDs, timestamps
  - **Test:** Unit tests for CRUD operations (15 tests)
  - **Commit:** `feat(store): implement group CRUD operations`

- [ ] **1.15.2c**: Implement hierarchy operations
  - `moveGroup`, `reorderGroups`
  - Validation for max nesting depth (3 levels)
  - Circular nesting prevention
  - **Test:** Unit tests for hierarchy (20 tests)
  - **Commit:** `feat(store): implement group hierarchy operations`

- [ ] **1.15.2d**: Implement collapse/expand actions
  - `toggleGroupCollapsed`, `expandGroup`, `collapseGroup`
  - `expandAll`, `collapseAll`
  - Track state in `expandedGroupIds` Set
  - **Test:** Unit tests (10 tests)
  - **Commit:** `feat(store): implement collapse/expand actions`

- [ ] **1.15.2e**: Implement utility getters
  - `getGroupChildren`, `getGroupPath`, `getGroupLevel`
  - **Test:** Unit tests (15 tests)
  - **Commit:** `feat(store): implement group utility getters`

- [ ] **1.15.2f**: Update `taskSlice.ts` with group assignment
  - `moveTaskToGroup`, `moveTasksToGroup`
  - **Test:** Unit tests (10 tests)
  - **Commit:** `feat(store): add task group assignment actions`

- [ ] **1.15.2g**: Integrate slices in `store/index.ts`
  - Combine task and group slices
  - Export unified store hook
  - **Test:** Store hook works in components
  - **Commit:** `feat(store): integrate group and task slices`

### Phase 3: UI Components (Day 2-3)

**Tasks:**

- [ ] **1.15.3a**: Create `TaskGroupRow.tsx` component
  - Basic rendering (name, expand/collapse button)
  - Indentation based on level
  - **Test:** Visual check, renders correctly
  - **Commit:** `feat(ui): create TaskGroupRow component`

- [ ] **1.15.3b**: Add inline editing to TaskGroupRow
  - Double-click to edit name
  - Save on Enter/blur, cancel on Escape
  - Validation
  - **Test:** Manual testing
  - **Commit:** `feat(ui): add inline editing to TaskGroupRow`

- [ ] **1.15.3c**: Add delete functionality to TaskGroupRow
  - Delete button (trash icon)
  - Confirmation dialog with options
  - Handle child migration or deletion
  - **Test:** Manual testing with nested groups
  - **Commit:** `feat(ui): add delete to TaskGroupRow`

- [ ] **1.15.3d**: Update `TaskRow.tsx` with hierarchy support
  - Add `level` prop
  - Add indentation
  - Add hierarchy connector lines (├─, └─)
  - **Test:** Visual check
  - **Commit:** `feat(ui): add hierarchy support to TaskRow`

- [ ] **1.15.3e**: Update `TaskList.tsx` with flattening logic
  - Implement `buildFlattenedView` function
  - Respect collapsed state
  - Render TaskGroupRow for groups, TaskRow for tasks
  - **Test:** Manual testing with various hierarchies
  - **Commit:** `feat(ui): add hierarchy flattening to TaskList`

- [ ] **1.15.3f**: Add "Add Group" button to TaskList header
  - Button next to "Add Task"
  - Creates new group at root level
  - Auto-focus name field
  - **Test:** Manual testing
  - **Commit:** `feat(ui): add 'Add Group' button`

### Phase 4: Drag-and-Drop (Day 3-4)

**Tasks:**

- [ ] **1.15.4a**: Enable group row dragging
  - Add drag handle to TaskGroupRow
  - Integrate with @dnd-kit
  - Basic reordering within same level
  - **Test:** Manual drag testing
  - **Commit:** `feat(dnd): enable group row dragging`

- [ ] **1.15.4b**: Implement nested group drops
  - Allow dropping group into another group
  - Show drop zone indicator
  - **Test:** Manual testing
  - **Commit:** `feat(dnd): implement nested group drops`

- [ ] **1.15.4c**: Add circular nesting prevention
  - Validate before drop
  - Show error message if invalid
  - **Test:** Try to move group into its own child
  - **Commit:** `feat(dnd): prevent circular group nesting`

- [ ] **1.15.4d**: Enable task drop into groups
  - Allow dropping task on group row (nests inside)
  - Visual feedback (highlight group row)
  - **Test:** Manual testing
  - **Commit:** `feat(dnd): enable task drop into groups`

- [ ] **1.15.4e**: Add max depth validation for drag-drop
  - Prevent drops that would exceed 3 levels
  - Show visual feedback (invalid drop cursor)
  - **Test:** Try to nest beyond 3 levels
  - **Commit:** `feat(dnd): add max depth validation to DnD`

- [ ] **1.15.4f**: Polish DnD visual feedback
  - Drop indicator line (blue horizontal line)
  - Drop zone highlight (light blue background)
  - Indentation preview during drag
  - **Test:** Visual QA
  - **Commit:** `feat(dnd): polish drag-drop visual feedback`

### Phase 5: Validation & Edge Cases (Day 4)

**Tasks:**

- [ ] **1.15.5a**: Create `groupValidation.ts` utility
  - Validation functions for group name, color, nesting depth
  - Clear error messages
  - **Test:** Unit tests (20 tests)
  - **Commit:** `feat(validation): add group validation utilities`

- [ ] **1.15.5b**: Handle delete edge cases
  - Delete group with children: Show confirmation
  - Delete last child: Auto-collapse parent
  - Delete group referenced by tasks: Migrate tasks
  - **Test:** Manual testing of edge cases
  - **Commit:** `fix(groups): handle delete edge cases`

- [ ] **1.15.5c**: Handle orphaned references
  - On load: Remove groupId if group doesn't exist
  - On delete: Clear parentGroupId in child groups
  - **Test:** Load file with orphaned refs
  - **Commit:** `fix(groups): handle orphaned group references`

- [ ] **1.15.5d**: File format migration
  - Add `groups: []` if missing on load
  - Ensure backward compatibility
  - **Test:** Load old format files
  - **Commit:** `feat(file): add groups array migration`

---

## Testing Strategy

### Unit Tests

**Files to test:**
- `groupSlice.ts` - All actions (70 tests)
- `groupValidation.ts` - All validation rules (20 tests)
- `buildFlattenedView` helper - Various hierarchies (15 tests)

**Coverage target:** 80%+

### Integration Tests

**Scenarios:**
- Create group, add tasks, collapse, expand
- Nest groups 3 levels deep
- Move task between groups
- Delete group with children
- Drag-drop task into group

**Coverage target:** 60%+

### Manual Testing Checklist

- [ ] Create root-level group
- [ ] Create nested group (2 levels)
- [ ] Create nested group (3 levels) ✓
- [ ] Try to create nested group (4 levels) ✗ (should fail)
- [ ] Add task to group
- [ ] Move task between groups (drag-drop)
- [ ] Move task to root level (drag-drop)
- [ ] Collapse group (tasks hidden)
- [ ] Expand group (tasks shown)
- [ ] Rename group (inline edit)
- [ ] Delete group (keep children)
- [ ] Delete group (delete children)
- [ ] Reorder groups (drag-drop)
- [ ] Move group into another group (drag-drop)
- [ ] Try to move group into its own child ✗ (should fail)
- [ ] Save file with groups
- [ ] Load file with groups
- [ ] Load old format file (no groups) ✓ (should migrate)

---

## Acceptance Criteria

**Before moving to Sprint 1.2:**

- [ ] All 25 implementation tasks complete and committed
- [ ] 80%+ test coverage for group-related code
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Manual testing checklist complete
- [ ] TypeScript strict mode, zero errors
- [ ] ESLint clean, zero warnings
- [ ] Can create 3-level nested hierarchy
- [ ] Can drag-drop tasks into groups
- [ ] Can collapse/expand groups smoothly
- [ ] File save/load works with groups
- [ ] No performance degradation (still 60fps with 100 tasks)

---

## Performance Considerations

### Flattening Algorithm Complexity

- **buildFlattenedView**: O(n) where n = tasks + groups
- **getGroupPath**: O(d) where d = depth (max 3)
- **Max items**: 100 tasks + 20 groups = 120 items
- **Expected performance**: < 1ms for flattening

### Re-render Optimization

- Use React.memo for TaskGroupRow and TaskRow
- Only re-render visible items (collapsed children skip render)
- Use Set for expandedGroupIds (O(1) lookup)

### Drag-Drop Performance

- No change from Sprint 1.1 (same @dnd-kit)
- Validation runs only on drop (not during drag)

---

## UI/UX Details

### Visual Hierarchy

**Indentation:**
- Level 0: 0px
- Level 1: 24px
- Level 2: 48px
- Level 3: 72px

**Connector Lines:**
```
└─ Last child
├─ Middle child
```

**Icons:**
- Collapsed group: ▶ (right chevron)
- Expanded group: ▼ (down chevron)
- Group icon: 📁 (folder emoji or SVG)

### Colors

**Group Row:**
- Background: `bg-gray-50` (light gray)
- Hover: `bg-gray-100`
- Text: `text-gray-900` (dark)
- Color indicator: Task color or auto-assigned

**Task Row (in group):**
- Background: `bg-white`
- Hover: `bg-gray-50`
- Indented connector: `text-gray-300`

### Animations

- Collapse/expand: 150ms ease-out
- Drag-drop: Default @dnd-kit animations
- Drop indicator: Fade in 100ms

---

## File Structure

```
src/
├── types/
│   └── chart.types.ts           # TaskGroup interface (UPDATE)
├── store/
│   ├── slices/
│   │   ├── taskSlice.ts         # Add group assignment (UPDATE)
│   │   └── groupSlice.ts        # Group management (NEW)
│   └── index.ts                 # Combine slices (UPDATE)
├── utils/
│   └── groupValidation.ts       # Group validation (NEW)
├── components/
│   └── TaskList/
│       ├── TaskList.tsx         # Add flattening logic (UPDATE)
│       ├── TaskRow.tsx          # Add hierarchy (UPDATE)
│       └── TaskGroupRow.tsx     # Group row component (NEW)
└── hooks/
    └── useHierarchy.ts          # Helper hooks (NEW, OPTIONAL)
```

---

## Migration Notes

### From Current State (Post-Sprint 1.1)

**Current:**
- Flat list of tasks
- Simple reordering

**After Sprint 1.15:**
- Hierarchical list of tasks and groups
- Nested reordering
- Collapsed/expanded state

**No breaking changes:**
- Existing task data structure unchanged (only added `groupId`)
- Existing components enhanced, not replaced
- Existing drag-drop logic extended, not replaced

### File Format Compatibility

**Old format (pre-1.15):**
```json
{
  "tasks": [...],
  "dependencies": [...]
}
```

**New format (post-1.15):**
```json
{
  "tasks": [...],
  "groups": [],
  "dependencies": [...]
}
```

**Migration:** Automatic on load (add `groups: []` if missing)

---

## Future Enhancements (Out of Scope for MVP)

- ✨ Group templates (save/load group structures)
- ✨ Group-level progress calculation (rollup from children)
- ✨ Group-level dependencies (all tasks depend on another group)
- ✨ Bulk operations (move all tasks in group)
- ✨ Group filters (show only specific groups)
- ✨ Group search (find tasks in groups)
- ✨ Group export (export just one group as separate file)

---

## Success Metrics

**Goal:** Seamless integration of hierarchy without breaking existing features

**Metrics:**
- ✅ No regression in Sprint 1.1 features
- ✅ 3-level hierarchy works smoothly
- ✅ Drag-drop feels natural and responsive
- ✅ Collapse/expand is instant (< 16ms)
- ✅ File save/load preserves hierarchy
- ✅ Zero critical bugs

---

## Related Documents

- [DATA_MODEL.md](./DATA_MODEL.md) - Section 2.5 (TaskGroup)
- [FEATURE_SPECIFICATIONS.md](./FEATURE_SPECIFICATIONS.md) - Section 2.7 (Task Groups)
- [USER_STORIES.md](./USER_STORIES.md) - Story 1.10 (Task Groups and Phases)
- [PHASE_1_MVP.md](./PHASE_1_MVP.md) - Sprint 1.1 (Foundation)

---

**Status:** Ready for review and refinement
**Next Steps:**
1. Review and discuss this concept
2. Refine based on feedback
3. Update PHASE_1_MVP.md to include Sprint 1.15
4. Begin implementation with Phase 1 (Data Layer)
