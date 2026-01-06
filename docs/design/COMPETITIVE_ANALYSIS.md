# Competitive Analysis: SVAR React Gantt

**Date**: 2025-12-23
**Version**: 1.0
**Status**: Completed
**Repository Analyzed**: https://github.com/svar-widgets/react-gantt

## Executive Summary

SVAR React Gantt is a mature, production-ready Gantt chart component that validates our architectural approach while providing valuable insights for feature implementation. Analysis confirms that our technology choices (Zustand, D3.js, minimal dependencies) are sound and potentially superior for maintainability.

**Key Recommendation**: Do NOT use as a dependency. Instead, learn from their patterns and implement features independently.

## Repository Overview

### Technical Details

| Aspect | Details |
|--------|---------|
| **License** | MIT (changed from GPL in v2.4.3) |
| **Version** | 2.4.3 (actively maintained) |
| **Code Size** | ~5,000 lines |
| **Architecture** | Proprietary state management with @svar-ui ecosystem |
| **Business Model** | Dual licensing: Community (MIT) + PRO (commercial) |
| **Repository** | https://github.com/svar-widgets/react-gantt |

### Technology Stack

```
Dependencies:
- React 18+ (peer dependency)
- @svar-ui/gantt-store: Proprietary state management
- @svar-ui/gantt-data-provider: Data handling
- @svar-ui/lib-state: State library
- @svar-ui/react-core: Core components
- @svar-ui/react-menu: Menu system
- @svar-ui/react-grid: Grid component
- @svar-ui/react-toolbar: Toolbar
- @svar-ui/react-editor: Editor component
```

## Feature Comparison

### Community Edition (MIT License)

| Feature | SVAR React Gantt | Our Project (Current) | Our Project (Planned) |
|---------|------------------|----------------------|----------------------|
| Interactive Drag & Drop | ✅ | ❌ | ✅ Phase 1 |
| Task Hierarchies | ✅ | ❌ | ✅ Phase 1 |
| Dependencies (FS) | ✅ | ❌ | ✅ Phase 1 |
| Progress Visualization | ✅ | ✅ | ✅ |
| Configurable Timeline | ✅ | ❌ | ✅ Phase 1 |
| Task Types | ✅ (task/summary/milestone) | ❌ | ✅ Now |
| Context Menu | ✅ | ❌ | ✅ Phase 1 |
| Toolbar | ✅ | ❌ | ✅ Phase 1 |
| Tooltips | ✅ | ❌ | ✅ Phase 1 |
| Grid Sorting | ✅ | ❌ | ✅ Phase 1 |
| Inline Editors | ✅ | ✅ | ✅ |
| Localization | ✅ | ❌ | ✅ Phase 2 |
| Themes | ✅ | ❌ | ✅ Phase 2 |
| Performance (large datasets) | ✅ | ❌ | ✅ Phase 1 |
| TypeScript | ✅ | ✅ | ✅ |

### PRO Edition (Commercial License)

**Note**: These features are behind a paywall, which conflicts with our open-source approach.

| Feature | Status |
|---------|--------|
| Auto-Scheduling | PRO only |
| Critical Path | PRO only |
| Work Calendar | PRO only |
| Baselines | PRO only |
| Split Tasks | PRO only |
| Vertical Markers | PRO only |
| Unscheduled Tasks | PRO only |
| Undo/Redo | PRO only |

**Impact on Our Project**: We will implement these features ourselves (especially Undo/Redo, which is critical and already planned for Phase 1).

## Architectural Insights

### 1. Component Structure

```
/src/components/
├── chart/              # Timeline rendering area
│   ├── Bars.jsx        # Task bars with drag & drop
│   ├── Links.jsx       # Dependency lines (SVG)
│   ├── CellGrid.jsx    # Grid overlay for timeline
│   └── TimeScale.jsx   # Timeline scale headers
├── grid/               # Spreadsheet table view
│   ├── Grid.jsx        # Main grid container
│   ├── TextCell.jsx    # Cell renderers
│   └── HeaderMenu.jsx  # Column configuration
├── editor/             # Task editor modal/sidebar
│   ├── DateTimePicker.jsx
│   └── Links.jsx       # Dependency editor
└── Layout.jsx          # Splits chart and grid
```

**Learning**: Clear separation of concerns. Our structure is similar and validated by this approach.

### 2. Scale System

**Key Pattern**: Flexible, configurable timeline scales

```javascript
const scales = [
  { unit: 'month', step: 1, format: '%F %Y' },
  { unit: 'day', step: 1, format: '%j' }
];
```

**Supported Units**: year, quarter, month, week, day, hour, minute
**Custom Scales**: Ability to define custom periods (sprints, stages)

**Recommendation**: Implement this flexible scale system early (Sprint 1.2).

### 3. Task Type System

```typescript
type TaskType = 'task' | 'summary' | 'milestone' | string;

interface Task {
  type: TaskType;
  // 'summary' tasks: dates computed from children
  // 'milestone' tasks: duration = 0, rendered as diamond
  // 'task': regular task bar
  // custom: user-defined rendering
}
```

**Recommendation**: ✅ Implement immediately (see Implementation section).

### 4. Virtual Scrolling

**Performance Pattern**: Only render visible rows

```javascript
const extraRows = 1 + scales.rows.length;
const visibleCount = Math.ceil(clientHeight / cellHeight) + 1;
const start = Math.max(0, scrollPosition - extraRows);
const end = scrollPosition + visibleCount + extraRows;
```

**Recommendation**: Implement in Phase 1 for performance with large datasets.

### 5. Event Bus System

**Pattern**: Decoupled action handling

```javascript
api.exec('add-task', taskData);
api.exec('update-task', { id, changes });
api.exec('delete-task', id);
api.on('task-updated', (task) => { /* handle */ });
```

**Recommendation**: Perfect for our plugin system! Implement in Sprint 1.3.

### 6. Dependency Rendering

**Key Insights**:
- Dependencies rendered as SVG paths
- Bézier curves for smooth connections
- Separate component (`Links.jsx`) for rendering
- Editor component for managing links

**File References**:
- Rendering: `/tmp/react-gantt/src/components/chart/Links.jsx`
- Editor: `/tmp/react-gantt/src/components/editor/Links.jsx`

**Recommendation**: Study their approach when implementing dependencies (Sprint 1.4).

## Why NOT to Use as Dependency

### ❌ Reasons Against Integration

1. **Vendor Lock-in**
   - Proprietary @svar-ui ecosystem
   - Complex internal dependencies
   - Limited control over architecture

2. **Business Model Conflict**
   - Critical features (Undo/Redo, Auto-Scheduling) are PRO-only
   - Conflicts with our open-source, offline-first approach
   - Uncertain future licensing changes

3. **Architectural Mismatch**
   - We use Zustand (simple, performant)
   - They use proprietary state system
   - Integration would be unnatural and complex

4. **Dependency Overhead**
   - 10+ @svar-ui packages
   - Adds significant bundle size
   - We don't need most of their ecosystem

5. **Loss of Control**
   - Black-box implementation
   - Hard to customize deeply
   - Debugging becomes difficult

### ✅ What We DO Instead

- Learn from their patterns
- Implement features independently
- Keep our flexible architecture
- Maintain full control

## Implementation Recommendations

### Immediate (This Sprint)

#### 1. Extended Task Data Model

```typescript
interface Task {
  // Existing fields
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  duration: number;
  progress: number;
  color: string;
  order: number;
  metadata: Record<string, unknown>;

  // NEW: Task type system
  type: 'task' | 'summary' | 'milestone';

  // NEW: Hierarchy support
  parent?: string;        // Parent task ID
  open?: boolean;         // Expanded/collapsed state for summaries

  // NEW: Performance optimization
  lazy?: boolean;         // Lazy-load children

  // NEW: Baseline support (for Phase 2)
  base_start?: string;    // Original planned start
  base_end?: string;      // Original planned end
}
```

**Action**: ✅ Update types and store (see below).

#### 2. Scale Configuration Structure

```typescript
interface ScaleConfig {
  unit: 'year' | 'quarter' | 'month' | 'week' | 'day' | 'hour' | 'minute';
  step: number;
  format: string | ((date: Date) => string);
  css?: (date: Date) => string; // For weekend/holiday highlighting
}
```

**Action**: Document in technical architecture for Sprint 1.2 implementation.

### Short-term (Phase 1)

1. **Virtual Scrolling** (Sprint 1.1)
   - Implement lazy rendering for task list
   - Only render visible rows
   - Ref: `/tmp/react-gantt/src/components/chart/Chart.jsx:80-93`

2. **Scale System** (Sprint 1.2)
   - Implement flexible scale configuration
   - Support multiple time units
   - Custom formatters

3. **Event Bus** (Sprint 1.3)
   - Create plugin-friendly event system
   - Support `exec`, `on`, `intercept` pattern
   - Ref: `/tmp/react-gantt/src/components/Gantt.jsx:150-157`

4. **Dependencies** (Sprint 1.4)
   - SVG path rendering for links
   - Bézier curves for connections
   - Ref: `/tmp/react-gantt/src/components/chart/Links.jsx`

5. **Context Menu & Toolbar** (Sprint 1.5)
   - Standard actions (add, delete, indent, outdent)
   - Keyboard shortcuts
   - Ref: `/tmp/react-gantt/demos/cases/GanttToolbar.jsx`

### Mid-term (Phase 2)

1. **Localization**
   - Multi-language support
   - Date format localization
   - Ref: `/tmp/react-gantt/src/` locale handling

2. **Themes**
   - Light/dark mode
   - Custom color schemes
   - Ref: `/tmp/react-gantt/src/themes/`

3. **Baselines**
   - Visual comparison planned vs actual
   - Use `base_start` and `base_end` fields

4. **Advanced Grid Features**
   - Column sorting
   - Column hide/show
   - Custom cell renderers

### Long-term (Phase 3+)

1. **Auto-Scheduling**
   - Forward/backward scheduling
   - Respect dependencies
   - Work calendar integration
   - **Note**: Very complex! Study SVAR PRO approach but implement independently

2. **Critical Path**
   - Calculate longest path
   - Highlight critical tasks
   - Performance optimization needed

3. **Split Tasks**
   - Tasks with breaks
   - Multiple date ranges per task

4. **Advanced Dependencies**
   - Multiple dependency types (SS, SF, FF)
   - Lag/lead time
   - Dependency validation

## Technical Learnings

### Performance Optimizations

1. **Virtual Scrolling**: Only render visible items
2. **Memoization**: Heavy use of `useMemo` for computed values
3. **Event Throttling**: Debounce scroll/resize events
4. **Lazy Loading**: Load child tasks on demand

### Code Quality Patterns

1. **Separation of Concerns**: Chart vs Grid vs Editor
2. **Component Composition**: Small, focused components
3. **Custom Hooks**: Reusable logic extraction
4. **TypeScript**: Full type safety

### UI/UX Patterns

1. **Sticky Headers**: Keep timeline visible while scrolling
2. **Hover States**: Clear visual feedback
3. **Drag Handles**: Intuitive resize/move interactions
4. **Tooltips**: Contextual information on hover

## Repository References

For future reference when implementing features:

| Feature | File Path in svar-widgets/react-gantt |
|---------|---------------------------------------|
| Main Component | `/src/components/Gantt.jsx` |
| Chart Rendering | `/src/components/chart/Chart.jsx` |
| Task Bars | `/src/components/chart/Bars.jsx` |
| Dependencies | `/src/components/chart/Links.jsx` |
| Grid Table | `/src/components/grid/Grid.jsx` |
| Time Scales | `/src/components/TimeScale.jsx` |
| Event System | `/src/components/Gantt.jsx:146-157` |
| Virtual Scrolling | `/src/components/chart/Chart.jsx:80-93` |
| Task Editor | `/src/components/Editor.jsx` |
| Demos | `/demos/cases/` (many examples) |

**Clone Command**:
```bash
git clone https://github.com/svar-widgets/react-gantt.git /tmp/react-gantt
```

## Validation of Our Approach

### ✅ Confirmed Good Decisions

1. **Zustand for State**: Simpler than their proprietary system
2. **D3.js for Rendering**: Proven, flexible, performant
3. **Minimal Dependencies**: Less complexity, faster builds
4. **TypeScript**: Industry standard
5. **Test Coverage**: Critical for maintainability
6. **Plugin System**: More flexible than their approach

### ⚠️ Areas to Improve

1. **Performance**: Implement virtual scrolling early
2. **Scale System**: Need flexible timeline configuration
3. **Event System**: Plugin architecture needs event bus
4. **Task Types**: Implement type system immediately

---

## Adopted Insights from Implementation

**Updated**: December 27, 2025

After completing Sprint 1.1.1 and 1.1.2 (December 23-27, 2025), we successfully adopted several key insights from SVAR React Gantt competitive analysis:

### ✅ SVAR Pattern (Type-Hierarchy Decoupling)

**Insight Adopted**: Task type and hierarchy capability are independent concerns.

**Implementation**:
- Sprint 1.1.1: Implemented SVAR pattern where `type` determines data behavior, not hierarchy capability
- Regular tasks CAN have children (manual dates as deadline containers)
- Summary tasks auto-calculate dates from children
- Milestones cannot have children (zero-duration markers)

**Result**:
- Simpler mental model than separate TaskGroup interface
- Single `taskSlice.ts` handles all task types (580 lines, unified)
- Flexible architecture matching professional Gantt tools

**Files**:
- `/src/types/chart.types.ts` - Task interface with `type` + `parent`
- `/src/store/slices/taskSlice.ts` - Unified task management
- `/src/utils/hierarchy.ts` - Hierarchy utilities (186 lines)

### ✅ Snapshot-Based Operations

**Insight Adopted**: Pre-calculate hierarchy snapshots to prevent cascading bugs.

**Implementation**:
- Sprint 1.1.2: Indent/outdent operations use `buildFlattenedTaskList()` snapshot
- All changes calculated against consistent snapshot before applying
- Enables safe bulk operations on multiple selected tasks

**Result**:
- Zero hierarchy corruption bugs during multi-select operations
- Clean separation: snapshot → calculate → validate → apply
- Robust bulk hierarchy changes

**Files**:
- `/src/store/slices/taskSlice.ts` - `indentSelectedTasks()`, `outdentSelectedTasks()`

### ✅ Computed Properties

**Insight Adopted**: Don't store derived data - calculate on-the-fly.

**Implementation**:
- Summary task dates computed during render, not stored
- `calculateSummaryDates()` utility provides single source of truth
- No sync issues between summary and children dates

**Result**:
- Simpler state management (no dual date tracking)
- Automatic updates when children change
- Zero staleness bugs

**Files**:
- `/src/components/TaskList/TaskTableRow.tsx` - Uses computed dates on render
- `/src/utils/hierarchy.ts` - `calculateSummaryDates()` utility

### 🎯 Validation of Independent Implementation

**Decision Validated**: Building independently (not using SVAR as dependency) was correct.

**Evidence**:
- Our architecture is simpler (single task slice vs complex SVAR state management)
- No vendor lock-in to @svar-ui ecosystem
- Full control over implementation patterns
- All core features (undo/redo, auto-scheduling) remain free/open-source

**Impact**:
- Development velocity: 3-4x faster than estimated (aided by excellent planning docs)
- Sprints 1.15 + 1.16 completed in 4 days (estimated 3-4 weeks combined)
- Zero technical debt from dependencies

### 📊 Metrics

**Sprints Completed**: Sprint 1.1, 1.15, 1.16 ✅
**Lines of Code**: ~2,800 lines across 16 TypeScript files
**Key Insight Adoption**: 3/3 major patterns successfully implemented
**Time Saved**: Avoided weeks of dependency integration and lock-in management

---

## Conclusion

SVAR React Gantt validates that our architectural approach is sound and provides a valuable reference for feature implementation. However, direct integration is not recommended due to vendor lock-in, licensing conflicts, and architectural mismatches.

**Strategy**: Learn from their patterns, implement features independently, maintain our superior architecture.

**Next Steps**: See updated ROADMAP.md for feature prioritization based on this analysis.

---

**Analysis Conducted**: 2025-12-23
**Analyzed By**: Development Team
**Repository Version**: v2.4.3
**Status**: Complete ✅
