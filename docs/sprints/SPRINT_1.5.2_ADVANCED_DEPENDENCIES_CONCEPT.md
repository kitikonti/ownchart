# Sprint 1.5.2: Advanced Dependencies (SS/FF/SF + Auto-Scheduling) - Team Concept

**Project:** Gantt Chart Application - app-gantt
**Sprint:** Sprint 1.5.2 - Advanced Dependencies
**Status:** IN PROGRESS (Packages 1-2 complete)
**Date:** 2026-03-23 (Concept Created)
**Priority:** High (V1.1 Feature)
**Estimated Duration:** 1.5-2 weeks (split into 4 testable packages)
**Prerequisite:** Sprint 1.4 (FS Dependencies) - COMPLETE
**Issue:** [#22 - Dependencies: research behavior and plan improvements](https://github.com/user/app-gantt/issues/22)

---

## Executive Summary

### Sprint Goal
Extend OwnChart's dependency system from FS-only to **all 4 standard types** (FS, SS, FF, SF) with **visual differentiation**, a **Dependency Properties Panel** for post-creation editing, **handle-based type inference** for intuitive creation, and **opt-in auto-scheduling** that cascades date changes through the dependency graph.

### Success Metrics
- [ ] Users can create all 4 dependency types via handle-based drag (type inferred from handle combination)
- [ ] Users can change dependency type and lag via Properties Panel after creation
- [ ] Each dependency type renders with distinct visual style (dash pattern)
- [ ] Arrow paths route correctly for all 4 types (different anchor points per type)
- [ ] Auto-scheduling toggle in Settings (default: OFF)
- [ ] When ON: predecessor changes cascade dates through dependency chain
- [ ] Performance: 100 tasks with 50 mixed-type dependencies at 60fps
- [ ] Dependencies persist correctly in .ownchart file format (backward compatible)
- [ ] Full undo/redo support for type changes, lag edits, and auto-scheduling cascades
- [ ] Export (PNG/PDF/SVG) renders correct arrow styles per dependency type

### Sprint Completion Checkpoint
**Visual Test:** "I can create and manage all dependency types"
1. User hovers task bar → both start and end handles appear
2. User drags from end handle of Task A to start handle of Task B → FS dependency created (arrow: solid)
3. User drags from start handle of Task A to start handle of Task B → SS dependency created (arrow: dashed)
4. User clicks SS arrow → Properties Panel appears with type=SS, lag=0
5. User changes type to FF in panel → arrow re-routes to end→end anchors, dash pattern changes to dotted
6. User sets lag=2 → arrow label shows "+2d" (if applicable)
7. User enables auto-scheduling in Settings → moves Task A forward 3 days → Task B's dates shift accordingly
8. User presses Ctrl+Z → all date changes undo correctly
9. User saves file → reloads → all dependency types and lag values preserved

---

## Competitive Analysis Summary

Research conducted across 7 Gantt chart tools (MS Project, GanttPRO, TeamGantt, Instagantt, SVAR Gantt, GanttProject, OwnChart):

| Feature | MS Project | GanttPRO | TeamGantt | Instagantt | SVAR Gantt | GanttProject | **OwnChart Current** |
|---------|-----------|----------|-----------|------------|------------|-------------|---------------------|
| FS | Yes | Yes | Yes | Yes | Yes | Yes | **Yes** |
| SS | Yes | Yes | No | No | Yes | Yes | Data model only |
| FF | Yes | Yes | No | No | Yes | Yes | Data model only |
| SF | Yes | Yes | No | No | Yes | Yes | Data model only |
| Lag/Lead | Yes | Yes | Limited | No | PRO | Yes | Data model only |
| Auto-scheduling | Default ON | Toggle | Partial | Yes | PRO | Yes | No |
| Hard vs Soft deps | Hard | Hard | Hard | Hard | Hard (PRO) | Strong+Rubber | Visual-only |
| Critical path | Yes | Yes | No | No | PRO | Yes | No |

**Key findings:**
1. **FS dominates** (~90% of real-world dependencies) — FS must remain the frictionless default
2. **SS/FF are useful** (~8% of project plans) — standard in professional tools
3. **SF is rare** (<2%) — include for completeness, not prominence
4. **Auto-scheduling is industry standard** — but must be opt-in to respect OwnChart's "own your workflow" philosophy
5. **Lag/lead is expected** in professional tools
6. **GanttProject's "rubber" (soft) dependencies** are interesting but out of scope for this sprint

Sources:
- [MS Project: Link tasks](https://support.microsoft.com/en-us/office/link-tasks-in-a-project-31b918ce-4b71-475c-9d6b-0ee501b4be57)
- [ProjectManager: Gantt Chart Dependencies](https://www.projectmanager.com/blog/gantt-chart-dependencies)
- [SVAR Gantt PRO](https://svar.dev/blog/react-gantt-pro-2-4-released/)
- [GanttPRO: Creating Dependencies](https://help.ganttpro.com/hc/en-us/articles/5486660021905-Creating-dependencies)

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

#### Recommendation: "Opt-In Auto-Scheduling with Full Type Support"

1. **Support all 4 types** (FS, SS, FF, SF) with FS as the default
2. **Auto-scheduling is opt-in** (OFF by default) — toggle in Project Settings
3. **When OFF:** Dependencies are visual-only (arrows shown, no date adjustment)
4. **When ON:** Predecessor changes cascade through topological sort, respecting type-specific constraints and lag
5. **Lag/lead supported** for all types (positive = gap, negative = overlap)
6. **Two creation methods:** Handle-based type inference (primary) + Properties Panel editing (secondary)
7. **Backward compatible** — existing files work unchanged, type defaults to "FS"

#### Feature Priority Ranking

1. **Critical:** Arrow path routing for all 4 types (SS, FF, SF anchors)
2. **Critical:** Visual differentiation per type (dash patterns)
3. **Critical:** Handle-based type inference during drag creation
4. **Critical:** Dependency Properties Panel (type selector + lag input)
5. **High:** Auto-scheduling toggle (OFF by default)
6. **High:** Date cascade algorithms for SS/FF/SF
7. **High:** Undo/redo for type changes and cascaded date adjustments
8. **Medium:** Export pipeline update for per-type arrow styles
9. **Medium:** Help content with visual examples of each type
10. **Low:** Drag preview showing correct anchor per inferred type

#### User Stories

- As a project manager, I want to create SS dependencies so I can express "these tasks start together"
- As a planner, I want to edit dependency type after creation so I can fix mistakes without deleting and recreating
- As a power user, I want handle-based creation so the dependency type is inferred naturally from my drag gesture
- As a careful user, I want auto-scheduling OFF by default so my dates don't change unexpectedly
- As an experienced PM, I want to enable auto-scheduling so the timeline stays accurate when I adjust task dates

---

### 2. Project Manager - Timeline & Risk Management

#### Package-Based Timeline

The sprint is split into **4 testable packages**. Each package must pass all tests (unit + manual) before proceeding to the next.

```
Package 1: Arrow Paths & Visual Differentiation      (2-3 days)
Package 2: Dependency Properties Panel                (1-2 days)
Package 3: Handle-Based Type Inference                (1-2 days)
Package 4: Auto-Scheduling (opt-in)                   (2-3 days)
                                                      ─────────
Total:                                                 6-10 days
```

#### Risk Register

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| SS/FF/SF arrow paths look cluttered with many deps | Medium | Medium | Test with real project data, density-aware spacing already exists |
| Auto-scheduling surprises users with unexpected date changes | High | High | Default OFF, clear toggle, undo always works, toast notification |
| Cascade propagation with mixed types produces wrong dates | Medium | High | Extensive unit tests for each type, topological sort already handles ordering |
| Properties Panel positioning conflicts with other UI | Low | Medium | Use existing `useDropdown` pattern, portal-based rendering |
| Handle-based drag type inference confuses users | Medium | Medium | Tooltip during drag showing inferred type, consistent visual feedback |
| File format backward compatibility breaks | Low | Critical | Type field already exists in file format, defaults to "FS" |
| Performance degrades with mixed-type path calculations | Low | Low | Same O(V+E) algorithms, connection point functions are O(1) |

#### Quality Gates (per package)

Each package must pass before proceeding:
- [ ] All unit tests pass (`npm run test:unit`)
- [ ] No lint/type errors (`npm run lint && npm run type-check`)
- [ ] Manual testing checklist completed
- [ ] Code reviewed

Final gate (after Package 4):
- [ ] Full CI passes (`npm run ci:local`)
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Performance verified (60fps with 50 mixed dependencies)
- [ ] Help documentation updated

---

### 3. UX/UI Designer - Interaction Design

#### Design Principles

1. **Zero-friction default**: FS creation works exactly as today (end→start drag)
2. **Natural inference**: Handle combination determines type intuitively
3. **Edit after creation**: Properties Panel for corrections without delete/recreate
4. **Visual clarity**: Each type has distinct arrow style
5. **Opt-in complexity**: Auto-scheduling is a conscious choice

#### Handle-Based Type Inference (Option B)

```
Drag Source Handle → Drop Target Handle = Dependency Type

  End handle  →  Start handle  =  FS (Finish-to-Start)  ← default, most common
  Start handle →  Start handle  =  SS (Start-to-Start)
  End handle  →  End handle    =  FF (Finish-to-Finish)
  Start handle →  End handle    =  SF (Start-to-Finish)
```

**Connection Handle Design (enhanced):**

```
Task Bar (hover state - both handles are drag sources):
  ○────────────────────────────────────────○
┌─┼─────────────────────────────────────┼─┐
│  Design mockups                         │
└─────────────────────────────────────────┘
  ↑                                       ↑
  Start handle                     End handle
  (can be drag SOURCE              (can be drag SOURCE
   or drop TARGET)                  or drop TARGET)
```

**Handle States (same as Sprint 1.4, both handles):**
```
Normal:          ○   (gray, 8px, 50% opacity)
Hover:           ●   (blue, 10px, 100% opacity)
Dragging:        ●   (blue with pulse animation)
Drop Target:     ◉   (blue ring, 12px)
Invalid Target:  ◉   (red ring - would create cycle)
```

**Drop Target Enhancement:**
When dragging, BOTH handles on the target task become valid drop zones. The handle the user drops on determines the "target side":
- Drop on **start handle** → target side = "start"
- Drop on **end handle** → target side = "end"
- Drop on **task body** (not on a handle) → default to "start" (preserves FS-like behavior)

**Drag Preview:**
During drag, a tooltip near the cursor shows the inferred type:
```
┌──────────────────┐
│ Creating: SS     │   (updates live as cursor moves between handles)
└──────────────────┘
```

#### Dependency Properties Panel (Option A)

Appears when a dependency arrow is selected (clicked):

```
┌───────────────────────────────────────┐
│  Dependency: Task A → Task B          │
│                                       │
│  Type:  [FS] [SS] [FF] [SF]          │
│          ^^^ selected (highlighted)   │
│                                       │
│  Lag:   [ 0 ] days                    │
│         (negative = overlap)          │
│                                       │
│  [Delete Dependency]                  │
└───────────────────────────────────────┘
```

**Panel Behavior:**
- Appears near the selected arrow (floating, portal-based)
- Positioned to avoid overlapping tasks
- Closes on: click outside, Escape key, or delete
- Type change applies immediately (with undo support)
- Lag change applies on Enter or blur

**Type Selector:** Segmented control (4 buttons in a row)
- Active type: filled brand color
- Inactive types: outlined/ghost style
- Each button shows the two-letter code: FS, SS, FF, SF
- Hover tooltip shows full name: "Finish-to-Start", "Start-to-Start", etc.

#### Visual Differentiation Per Type

```
FS (Finish-to-Start):  ────────────────→  (solid line)
SS (Start-to-Start):   ── ── ── ── ──→  (dashed, 6px dash, 4px gap)
FF (Finish-to-Finish): ·· ·· ·· ·· ··→  (dotted, 2px dash, 4px gap)
SF (Start-to-Finish):  ─ · ─ · ─ · ─→  (dash-dot, 8px dash, 4px gap, 2px dot, 4px gap)
```

**Color:** Same color system as current (slate scale, selected=blue). Type is distinguished by **dash pattern only**, not color, to keep the design clean and accessible.

#### Arrow Anchor Points Per Type

```
FS (Finish-to-Start):
  ┌─── Task A ───┐          ┌─── Task B ───┐
  │              ●──────────→●              │
  └──────────────┘          └──────────────┘
                 ^end        ^start

SS (Start-to-Start):
  ┌─── Task A ───┐
  ●──────────────────┐
  └──────────────┘   │
                     └──→●┌─── Task B ───┐
                          └──────────────┘
  ^start                   ^start

FF (Finish-to-Finish):
  ┌─── Task A ───┐
  │              ●──────────┐
  └──────────────┘          │
                     ┌──────┘
  ┌─── Task B ───┐  │
  │              ●←─┘
  └──────────────┘
                 ^end        ^end

SF (Start-to-Finish):
  ┌─── Task A ───┐
  ●──────────────────────┐
  └──────────────┘       │
                   ┌─────┘
  ┌─── Task B ───┐│
  │              ●┘
  └──────────────┘
  ^start                  ^end
```

#### Auto-Scheduling Toggle

Located in **Project Settings** (existing settings panel):

```
Project Settings
├── Display
│   ├── Show Weekends          [ON]
│   ├── Show Today Marker      [ON]
│   ├── Show Holidays          [ON]
│   ├── Show Dependencies      [ON]
│   ├── Show Progress          [ON]
│   └── Task Labels            [Inside ▾]
├── Scheduling                          ← NEW SECTION
│   └── Auto-scheduling        [OFF]
│       "Automatically adjust dates
│        when predecessor tasks change"
└── Working Days
    └── ...
```

**When auto-scheduling is toggled ON:**
- Toast: "Auto-scheduling enabled. Dependent task dates will adjust automatically."
- Immediate recalculation of all dependencies (may shift dates)

**When auto-scheduling is toggled OFF:**
- Toast: "Auto-scheduling disabled. Dependencies are now visual-only."
- No date changes (existing positions preserved)

---

### 4. Software Architect - System Design

#### Architecture Overview

```
┌────────────────────────────────────────────────────────────────┐
│                     Application State                           │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  taskSlice          dependencySlice       chartSlice           │
│  ┌──────────────┐   ┌──────────────┐     ┌──────────────────┐  │
│  │ tasks[]      │   │ dependencies[]│     │ autoScheduling   │  │
│  │ selection    │   │ selectedId   │     │ showDependencies │  │
│  └──────────────┘   └──────────────┘     └──────────────────┘  │
│         │                  │                    │              │
│         └──────────────────┼────────────────────┘              │
│                            │                                   │
│              ┌─────────────▼──────────────┐                    │
│              │ Graph Utils                │                    │
│              │ ──────────────────          │                    │
│              │ cycleDetection.ts  (exists) │                    │
│              │ topologicalSort.ts (exists) │                    │
│              │ graphHelpers.ts    (exists) │                    │
│              │ dateAdjustment.ts  (NEW)    │                    │
│              └────────────────────────────┘                    │
│                                                                │
│              ┌─────────────────────────────┐                   │
│              │ Arrow Path                  │                   │
│              │ ────────────                 │                   │
│              │ elbowPath.ts                │                   │
│              │   getFSConnectionPoints()   │                   │
│              │   getSSConnectionPoints()   │ NEW               │
│              │   getFFConnectionPoints()   │ NEW               │
│              │   getSFConnectionPoints()   │ NEW               │
│              │   calculateArrowPath()      │ MODIFIED          │
│              └─────────────────────────────┘                   │
│                                                                │
│              ┌─────────────────────────────┐                   │
│              │ UI Components               │                   │
│              │ ──────────────               │                   │
│              │ DependencyArrow.tsx  (mod)   │                   │
│              │ DependencyArrows.tsx (mod)   │                   │
│              │ DependencyDragPreview (mod)  │                   │
│              │ DependencyPropertiesPanel    │ NEW               │
│              └─────────────────────────────┘                   │
└────────────────────────────────────────────────────────────────┘
```

#### Connection Point Functions

The existing `getFSConnectionPoints` function (elbowPath.ts:258) computes anchor points for FS: **from right edge → to left edge**. Each type needs its own anchor function:

```typescript
// EXISTING (elbowPath.ts:258)
function getFSConnectionPoints(fromPos, toPos): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x + fromPos.width, y: fromPos.y + fromPos.height / 2 },  // right edge
    to:   { x: toPos.x,                   y: toPos.y + toPos.height / 2 },       // left edge
  };
}

// NEW: Start-to-Start
function getSSConnectionPoints(fromPos, toPos): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x, y: fromPos.y + fromPos.height / 2 },  // left edge
    to:   { x: toPos.x,   y: toPos.y + toPos.height / 2 },      // left edge
  };
}

// NEW: Finish-to-Finish
function getFFConnectionPoints(fromPos, toPos): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x + fromPos.width, y: fromPos.y + fromPos.height / 2 },  // right edge
    to:   { x: toPos.x + toPos.width,     y: toPos.y + toPos.height / 2 },      // right edge
  };
}

// NEW: Start-to-Finish
function getSFConnectionPoints(fromPos, toPos): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x,             y: fromPos.y + fromPos.height / 2 },  // left edge
    to:   { x: toPos.x + toPos.width, y: toPos.y + toPos.height / 2 },     // right edge
  };
}
```

#### Arrowhead Angle Per Type

The arrowhead must point in the correct direction based on the **target anchor**:

| Type | Target Anchor | Arrow enters from | Arrowhead angle |
|------|--------------|-------------------|----------------|
| FS | Left edge (start) | Left side | 0° (pointing right) |
| SS | Left edge (start) | Left side | 0° (pointing right) |
| FF | Right edge (end) | Right side | 180° (pointing left) |
| SF | Right edge (end) | Right side | 180° (pointing left) |

#### Path Routing Considerations

- **FS** (end→start): Existing routing works as-is. Arrow goes left-to-right naturally.
- **SS** (start→start): Both anchors on the left. Path exits left from source, routes around, enters target from left. Needs a "left-exit" variant that mirrors the horizontal segment direction.
- **FF** (end→end): Both anchors on the right. Path exits right from source, routes around, enters target from right. Similar to SS but mirrored.
- **SF** (start→end): Source exits left, target enters from right. Can produce crossing paths — use same elbow/S-curve routing with adjusted segments.

**Key insight:** The existing `buildTwoCornerPath` and `buildSCurvePath` functions work with arbitrary `from`/`to` points. The main change is:
1. Compute the correct `from` and `to` anchors per type
2. Adjust `HORIZONTAL_SEGMENT` direction (left exit vs right exit)
3. Adjust arrowhead angle for right-edge targets

#### Date Adjustment Algorithms

```typescript
// NEW: src/utils/graph/dateAdjustment.ts

/**
 * Calculate the earliest allowed date for the successor based on dependency type.
 * Returns the date constraint that the predecessor imposes on the successor.
 */
function calculateConstraint(
  predecessorStart: Date,
  predecessorEnd: Date,
  successorStart: Date,
  successorEnd: Date,
  successorDuration: number,  // days
  type: DependencyType,
  lag: number
): { newStart: Date; newEnd: Date } | null {

  switch (type) {
    case "FS":
      // successor.start >= predecessor.end + lag
      const fsMinStart = addDays(predecessorEnd, lag);
      if (successorStart < fsMinStart) {
        return { newStart: fsMinStart, newEnd: addDays(fsMinStart, successorDuration) };
      }
      return null;

    case "SS":
      // successor.start >= predecessor.start + lag
      const ssMinStart = addDays(predecessorStart, lag);
      if (successorStart < ssMinStart) {
        return { newStart: ssMinStart, newEnd: addDays(ssMinStart, successorDuration) };
      }
      return null;

    case "FF":
      // successor.end >= predecessor.end + lag
      const ffMinEnd = addDays(predecessorEnd, lag);
      if (successorEnd < ffMinEnd) {
        const newEnd = ffMinEnd;
        const newStart = addDays(newEnd, -successorDuration);
        return { newStart, newEnd };
      }
      return null;

    case "SF":
      // successor.end >= predecessor.start + lag
      const sfMinEnd = addDays(predecessorStart, lag);
      if (successorEnd < sfMinEnd) {
        const newEnd = sfMinEnd;
        const newStart = addDays(newEnd, -successorDuration);
        return { newStart, newEnd };
      }
      return null;
  }
}

/**
 * Propagate date changes through the dependency graph.
 * Uses topological sort to process tasks in correct order.
 * Returns list of date adjustments for undo/redo support.
 */
function propagateDateChanges(
  tasks: Task[],
  dependencies: Dependency[],
  changedTaskId: TaskId
): DateAdjustment[] {
  // 1. Topological sort all tasks (existing utility)
  // 2. Process each task after changedTaskId in topo order
  // 3. For each task, check ALL predecessor constraints
  // 4. Use the LATEST required date (most restrictive constraint wins)
  // 5. If task needs to move, record adjustment and update working copy
  // 6. Return all adjustments for history recording
}
```

#### Auto-Scheduling State

```typescript
// chartSlice.ts — new state field
autoScheduling: boolean;  // default: false

// New setter
setAutoScheduling: (enabled: boolean) => void;

// ViewSettings addition (fileOperations/types.ts)
autoScheduling?: boolean;  // persisted in .ownchart file
```

---

### 5. Frontend Developer - Implementation Plan

#### Existing Code to Reuse

| What | File | How to reuse |
|------|------|-------------|
| Dependency types | `src/types/dependency.types.ts` | `DependencyType`, `DEPENDENCY_TYPES`, `DependencyUpdatableFields` already exist |
| Store CRUD | `src/store/slices/dependencySlice.ts` | `addDependency(from, to, type, lag)` already accepts type param |
| Update action | `dependencySlice.ts:220` | `updateDependency(id, { type, lag })` already wired with undo/redo |
| Cycle detection | `src/utils/graph/cycleDetection.ts` | Type-agnostic — works for all types unchanged |
| Topological sort | `src/utils/graph/topologicalSort.ts` | Kahn's algorithm — type-agnostic, reuse directly |
| Graph helpers | `src/utils/graph/graphHelpers.ts` | `buildAdjacencyList`, `bfsReachable` — type-agnostic |
| Elbow path core | `src/utils/arrowPath/elbowPath.ts` | `buildTwoCornerPath`, `buildSCurvePath`, `computeElbowParams` — reuse for all types |
| Arrow rendering | `src/components/GanttChart/DependencyArrow.tsx` | Extend with type-aware dash pattern |
| Drag hook | `src/hooks/useDependencyDrag.ts` | `resolveDependencyDirection` → extend to resolve type |
| File serialization | `src/utils/fileOperations/serialize.ts` | Already serializes `type` field |
| Clipboard | `src/utils/clipboard/` | Already preserves dependency type on copy/paste |
| Dropdown pattern | `src/hooks/useDropdown.ts` | Reuse for Properties Panel positioning |
| Export constants | `src/utils/export/renderConstants.ts` | Extend with per-type dash patterns |

#### File Changes Summary

**Package 1 files:**
- MODIFY: `src/utils/arrowPath/elbowPath.ts` — add `getSSConnectionPoints`, `getFFConnectionPoints`, `getSFConnectionPoints`, refactor `calculateArrowPath` to accept `DependencyType`
- MODIFY: `src/components/GanttChart/DependencyArrow.tsx` — accept type, apply dash pattern
- MODIFY: `src/components/GanttChart/DependencyArrows.tsx` — pass type through to arrow components, fix drag preview anchor
- MODIFY: `src/components/GanttChart/DependencyDragPreview.tsx` — no changes needed (drag preview stays dashed regardless)
- MODIFY: `src/utils/export/renderConstants.ts` — add `DEPENDENCY_DASH_PATTERNS` per type
- CREATE: `tests/unit/utils/arrowPath.elbowPath.test.ts` — test all 4 connection point functions + path routing

**Package 2 files:**
- CREATE: `src/components/GanttChart/DependencyPropertiesPanel.tsx` — floating panel with type selector + lag input
- MODIFY: `src/components/GanttChart/DependencyArrows.tsx` — render Properties Panel when dependency is selected

**Package 3 files:**
- MODIFY: `src/hooks/useDependencyDrag.ts` — `resolveDependencyDirection` → `resolveDependencyTypeAndDirection`, both handles as drag sources
- MODIFY: `src/components/GanttChart/DependencyArrows.tsx` — compute drag start position based on drag side (start vs end handle)

**Package 4 files:**
- CREATE: `src/utils/graph/dateAdjustment.ts` — `calculateConstraint`, `propagateDateChanges`
- MODIFY: `src/store/slices/chartSlice.ts` — `autoScheduling` state + setter + toggle
- MODIFY: `src/store/slices/dependencySlice.ts` — call `propagateDateChanges` in `addDependency` when auto-scheduling is ON
- MODIFY: `src/utils/fileOperations/types.ts` — `autoScheduling` in `ViewSettings`
- MODIFY: `src/config/helpContent.ts` — update dependency help topics
- CREATE: `tests/unit/utils/dateAdjustment.test.ts` — test all 4 type constraints + cascade propagation

---

### 6. QA Tester - Testing Strategy

#### Unit Tests — Package 1 (~20 cases)

```
Arrow Path Tests (tests/unit/utils/arrowPath.elbowPath.test.ts):
- [ ] getSSConnectionPoints: returns left-edge anchors for both tasks
- [ ] getFFConnectionPoints: returns right-edge anchors for both tasks
- [ ] getSFConnectionPoints: returns left-edge source, right-edge target
- [ ] getFSConnectionPoints: unchanged behavior (regression)
- [ ] calculateArrowPath with type="SS": correct path routing
- [ ] calculateArrowPath with type="FF": correct path routing + arrowhead angle=180
- [ ] calculateArrowPath with type="SF": correct path routing + arrowhead angle=180
- [ ] calculateArrowPath with type="FS": unchanged behavior (regression)
- [ ] SS path with same-row tasks: degenerates correctly
- [ ] FF path with overlapping tasks: S-curve routing works
- [ ] SF path with tasks far apart: standard elbow routing
- [ ] All types: arrowhead angle correct (0° for FS/SS, 180° for FF/SF)
```

#### Unit Tests — Package 2 (~10 cases)

```
Properties Panel Tests:
- [ ] Renders type selector with current type selected
- [ ] Renders lag input with current lag value
- [ ] Type change calls updateDependency with new type
- [ ] Lag change calls updateDependency with new lag
- [ ] Negative lag accepted (lead time)
- [ ] Delete button calls removeDependency
- [ ] Panel closes on Escape key
- [ ] Panel closes on click outside
```

#### Unit Tests — Package 3 (~15 cases)

```
Handle-Based Type Inference Tests (useDependencyDrag):
- [ ] End→Start drag: infers FS
- [ ] Start→Start drag: infers SS
- [ ] End→End drag: infers FF
- [ ] Start→End drag: infers SF
- [ ] Drop on task body (no specific handle): defaults to FS-like (end→start)
- [ ] Drag from start handle: sets fromSide="start"
- [ ] Drag from end handle: sets fromSide="end"
- [ ] Valid/invalid targets computed correctly for all drag sides
- [ ] Cancel drag resets state for all types
- [ ] Created dependency has correct type in store
```

#### Unit Tests — Package 4 (~30 cases)

```
Date Adjustment Tests (tests/unit/utils/dateAdjustment.test.ts):
- [ ] FS constraint: successor.start >= predecessor.end + lag
- [ ] FS constraint with positive lag (gap)
- [ ] FS constraint with negative lag (overlap allowed)
- [ ] FS constraint: no adjustment needed when already satisfied
- [ ] SS constraint: successor.start >= predecessor.start + lag
- [ ] SS constraint with lag
- [ ] FF constraint: successor.end >= predecessor.end + lag (derives start from duration)
- [ ] FF constraint with lag
- [ ] SF constraint: successor.end >= predecessor.start + lag (derives start from duration)
- [ ] SF constraint with lag
- [ ] Mixed-type cascade: A→[FS]→B→[SS]→C
- [ ] Mixed-type cascade: A→[FF]→B→[FS]→C
- [ ] Multiple predecessors: most restrictive constraint wins
- [ ] Long chain: A→B→C→D→E all shift correctly
- [ ] No adjustment when auto-scheduling is OFF
- [ ] Cascade produces correct DateAdjustment[] for undo/redo
- [ ] Zero-duration task (milestone) handled correctly
- [ ] Summary task skipped (dates computed from children)
- [ ] Tasks with no dependencies: not affected
- [ ] Negative lag: overlap allowed, dates computed correctly
```

#### Integration & E2E Tests

```
- [ ] Create FS dependency via end→start drag, verify arrow renders solid
- [ ] Create SS dependency via start→start drag, verify arrow renders dashed
- [ ] Create FF dependency via end→end drag, verify arrow renders dotted
- [ ] Change type in Properties Panel, verify arrow re-renders
- [ ] Set lag in Properties Panel, verify value persisted
- [ ] Enable auto-scheduling, move predecessor, verify cascade
- [ ] Undo/redo type change: arrow reverts
- [ ] Undo/redo cascaded dates: all tasks revert
- [ ] Save file with mixed types, reload, verify all types preserved
- [ ] Export PNG with mixed types: correct dash patterns in output
- [ ] Performance: 100 tasks, 50 mixed deps, verify 60fps scroll
```

---

## Package Implementation Details

### Package 1: Arrow Paths & Visual Differentiation

**Goal:** All 4 dependency types render with correct routing and visual style.

**Gate:** `npm run test:unit` passes + manual verification of arrow rendering for each type.

#### Step 1.1: Connection Point Functions

**File:** `src/utils/arrowPath/elbowPath.ts`

Add three new functions next to the existing `getFSConnectionPoints` (line 258):

```typescript
/** SS: Start-to-Start — both anchors on the left edge. */
function getSSConnectionPoints(fromPos: TaskPosition, toPos: TaskPosition): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x, y: fromPos.y + fromPos.height / 2 },
    to:   { x: toPos.x,   y: toPos.y + toPos.height / 2 },
  };
}

/** FF: Finish-to-Finish — both anchors on the right edge. */
function getFFConnectionPoints(fromPos: TaskPosition, toPos: TaskPosition): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x + fromPos.width, y: fromPos.y + fromPos.height / 2 },
    to:   { x: toPos.x + toPos.width,     y: toPos.y + toPos.height / 2 },
  };
}

/** SF: Start-to-Finish — source left edge, target right edge. */
function getSFConnectionPoints(fromPos: TaskPosition, toPos: TaskPosition): { from: Point; to: Point } {
  return {
    from: { x: fromPos.x,             y: fromPos.y + fromPos.height / 2 },
    to:   { x: toPos.x + toPos.width, y: toPos.y + toPos.height / 2 },
  };
}
```

Add a dispatcher function:

```typescript
/** Get connection points for a dependency based on its type. */
function getConnectionPoints(
  type: DependencyType,
  fromPos: TaskPosition,
  toPos: TaskPosition
): { from: Point; to: Point } {
  switch (type) {
    case "SS": return getSSConnectionPoints(fromPos, toPos);
    case "FF": return getFFConnectionPoints(fromPos, toPos);
    case "SF": return getSFConnectionPoints(fromPos, toPos);
    case "FS":
    default:   return getFSConnectionPoints(fromPos, toPos);
  }
}
```

#### Step 1.2: Modify `calculateArrowPath` Signature

**File:** `src/utils/arrowPath/elbowPath.ts` — `calculateArrowPath` (line 292)

Add `type` parameter:

```typescript
export function calculateArrowPath(
  fromPos: TaskPosition,
  toPos: TaskPosition,
  rowHeight: number = BASE_ROW_HEIGHT,
  type: DependencyType = "FS"   // NEW parameter, defaults to FS for backward compat
): ArrowPath {
  const { from, to } = getConnectionPoints(type, fromPos, toPos);
  // ... existing routing logic ...

  // Arrowhead angle: 0° for left-edge targets (FS, SS), 180° for right-edge targets (FF, SF)
  const arrowAngle = (type === "FF" || type === "SF") ? 180 : 0;

  return {
    path,
    arrowHead: { x: to.x, y: to.y, angle: arrowAngle },
  };
}
```

**Important:** The existing routing functions (`buildTwoCornerPath`, `calculateRoutedPath`, `buildSCurvePath`) work with arbitrary `from`/`to` points. For SS/FF where both anchors are on the same side, the `horizontalGap` will be negative or very small, which will trigger the S-curve routing path — **this is correct behavior**.

For **left-exit** paths (SS, SF where source is on the left), the `HORIZONTAL_SEGMENT` direction needs to be negated. Add a helper:

```typescript
/** Get the horizontal exit direction for the source anchor. */
function getExitDirection(type: DependencyType): 1 | -1 {
  // FS/FF exit right (from right edge), SS/SF exit left (from left edge)
  return (type === "SS" || type === "SF") ? -1 : 1;
}

/** Get the horizontal entry direction for the target anchor. */
function getEntryDirection(type: DependencyType): 1 | -1 {
  // FS/SS enter from left (into left edge), FF/SF enter from right (into right edge)
  return (type === "FF" || type === "SF") ? -1 : 1;
}
```

These affect the `buildSCurvePath` function's `firstX` and `secondX` calculations:
```typescript
const firstX = from.x + exitDir * HORIZONTAL_SEGMENT;
const secondX = to.x + entryDir * HORIZONTAL_SEGMENT;  // note: was "- HORIZONTAL_SEGMENT"
```

#### Step 1.3: Visual Differentiation (Dash Patterns)

**File:** `src/utils/export/renderConstants.ts`

Add a new constant:

```typescript
/** Dash patterns per dependency type. undefined = solid line. */
export const DEPENDENCY_DASH_PATTERNS: Record<DependencyType, string | undefined> = {
  FS: undefined,           // solid
  SS: "6 4",               // dashed
  FF: "2 4",               // dotted
  SF: "8 4 2 4",           // dash-dot
};
```

**File:** `src/components/GanttChart/DependencyArrow.tsx`

Pass `dependency.type` and apply `strokeDasharray`:

```typescript
// In the arrow <path> element:
<path
  d={path}
  fill="none"
  stroke={strokeColor}
  strokeWidth={strokeWidth}
  strokeDasharray={DEPENDENCY_DASH_PATTERNS[dependency.type]}
  className="transition-colors duration-150 cursor-pointer"
/>
```

#### Step 1.4: Pass Type Through Component Chain

**File:** `src/components/GanttChart/DependencyArrow.tsx`

Modify `arrowData` useMemo to include type:

```typescript
const arrowData = useMemo(() => {
  if (!fromPos || !toPos) return null;
  return calculateArrowPath(fromPos, toPos, rowHeight, dependency.type);
}, [fromPos, toPos, rowHeight, dependency.type]);
```

**File:** `src/components/GanttChart/DependencyArrows.tsx`

No changes needed for Package 1 — `DependencyArrow` already receives the full `dependency` object.

#### Step 1.5: Unit Tests

**File:** `tests/unit/utils/arrowPath.elbowPath.test.ts` (NEW)

Test all connection point functions and path routing for each type. See QA Tester section for test cases.

---

### Package 2: Dependency Properties Panel

**Goal:** Users can select a dependency arrow and change its type/lag in a floating panel.

**Gate:** `npm run test:unit` passes + manual: select arrow, change type/lag, verify updates.

#### Step 2.1: Create Properties Panel Component

**File:** `src/components/GanttChart/DependencyPropertiesPanel.tsx` (NEW)

```typescript
interface DependencyPropertiesPanelProps {
  dependency: Dependency;
  fromTaskName: string;
  toTaskName: string;
  position: { x: number; y: number };  // screen coordinates near the selected arrow
  onUpdateType: (type: DependencyType) => void;
  onUpdateLag: (lag: number) => void;
  onDelete: () => void;
  onClose: () => void;
}
```

**Implementation notes:**
- Use a portal (`createPortal`) to render above the SVG layer
- Position near the arrow midpoint (compute from task positions)
- Use `DEPENDENCY_TYPES` from `dependency.types.ts` for the type selector
- Segmented control for type selection (4 buttons: FS, SS, FF, SF)
- Number input for lag with +/- stepper
- Delete button at bottom
- Close on Escape key or click outside (use existing `useDropdown` pattern)
- Tailwind classes for styling (match existing UI patterns)

#### Step 2.2: Wire Panel Into DependencyArrows

**File:** `src/components/GanttChart/DependencyArrows.tsx`

When `selectedDependencyId` is set:
1. Find the selected dependency
2. Compute panel position from task positions (midpoint of the arrow)
3. Render `DependencyPropertiesPanel` as an overlay

```typescript
// After the dependency arrows map:
{selectedDep && selectedFromTask && selectedToTask && (
  <DependencyPropertiesPanel
    dependency={selectedDep}
    fromTaskName={selectedFromTask.name}
    toTaskName={selectedToTask.name}
    position={computePanelPosition(selectedDep, taskPositions)}
    onUpdateType={(type) => updateDependency(selectedDep.id, { type })}
    onUpdateLag={(lag) => updateDependency(selectedDep.id, { lag })}
    onDelete={() => removeDependency(selectedDep.id)}
    onClose={() => selectDependency(null)}
  />
)}
```

**Note:** The panel is rendered outside the SVG (via portal) since it contains HTML form elements. It needs screen-space coordinates, not SVG coordinates. Use the SVG element's `getBoundingClientRect` + task positions to compute screen-space placement.

---

### Package 3: Handle-Based Type Inference

**Goal:** Dragging between different handle combinations creates the correct dependency type.

**Gate:** `npm run test:unit` passes + manual: each handle combination creates expected type.

#### Step 3.1: Extend resolveDependencyDirection

**File:** `src/hooks/useDependencyDrag.ts`

Replace `resolveDependencyDirection` (line 71) with `resolveDependencyTypeAndDirection`:

```typescript
/**
 * Determine dependency direction AND type based on source and target handle sides.
 *
 * Handle combinations:
 *   source=end,   target=start → FS (Finish-to-Start)
 *   source=start, target=start → SS (Start-to-Start)
 *   source=end,   target=end   → FF (Finish-to-Finish)
 *   source=start, target=end   → SF (Start-to-Finish)
 *
 * For FS and SF, the dependency direction is source→target.
 * For SS and FF, the dependency direction is also source→target
 * (the "from" is always the task the user dragged FROM).
 */
function resolveDependencyTypeAndDirection(
  sourceTaskId: TaskId,
  targetTaskId: TaskId,
  sourceSide: "start" | "end",
  targetSide: "start" | "end"
): { fromId: TaskId; toId: TaskId; type: DependencyType } {
  // Determine type from handle combination
  let type: DependencyType;
  if (sourceSide === "end" && targetSide === "start") {
    type = "FS";
  } else if (sourceSide === "start" && targetSide === "start") {
    type = "SS";
  } else if (sourceSide === "end" && targetSide === "end") {
    type = "FF";
  } else {
    type = "SF";
  }

  return { fromId: sourceTaskId, toId: targetTaskId, type };
}
```

**Current behavior to preserve:** When the user drags from a **start handle** in FS-only mode, the direction is reversed (target→source). In the new system, start handle drag no longer reverses — it creates SS or SF depending on the target handle. The old `resolveDependencyDirection` (line 71-79) reversal logic is no longer needed.

#### Step 3.2: Track Target Handle Side

The current `endDrag(targetTaskId)` only receives the target task ID, not which handle was dropped on. Two approaches:

**Approach A (Recommended):** Detect target handle from drop position.
- In `findHoveredTaskId` (line 188), also return which side of the task the cursor is on
- Compare cursor X to task midpoint: left half = "start", right half = "end"
- Return `{ taskId, side }` instead of just `taskId`

**Approach B:** Make both handles separate drop zones.
- Each handle is a separate SVG element with its own mouseUp handler
- More precise but requires deeper component changes

**Recommendation:** Approach A — simpler, and the left/right heuristic maps naturally to start/end.

#### Step 3.3: Update Drag Preview Anchor

**File:** `src/components/GanttChart/DependencyArrows.tsx` — `dragStartPosition` memo (line 119)

Currently hardcoded to right edge (`pos.x + pos.width`). Change to respect drag side:

```typescript
const dragStartPosition = useMemo(() => {
  if (!dragState?.isDragging || !dragState.fromTaskId) return null;
  const pos = taskPositions.get(dragState.fromTaskId);
  if (!pos) return null;

  // Start from the handle the user dragged from
  const x = dragState.fromSide === "start" ? pos.x : pos.x + pos.width;
  return { x, y: pos.y + pos.height / 2 };
}, [dragState, taskPositions]);
```

**Note:** This requires `DependencyArrowsProps.dragState` to include `fromSide`. Update the interface to pass it through.

#### Step 3.4: Update attemptCreateDependency

**File:** `src/hooks/useDependencyDrag.ts`

Modify `attemptCreateDependency` to pass the inferred type:

```typescript
// In attemptCreateDependency:
const { fromId, toId, type } = resolveDependencyTypeAndDirection(
  fromTaskId, targetTaskId, fromSide, targetSide
);
const result = addDependency(fromId, toId, type);
```

The `AddDependencyFn` type (line 16) needs to accept a `type` parameter:
```typescript
type AddDependencyFn = (
  fromId: TaskId,
  toId: TaskId,
  type?: DependencyType
) => { success: boolean; error?: string };
```

---

### Package 4: Auto-Scheduling (Opt-In)

**Goal:** When enabled, predecessor changes cascade date adjustments through the dependency graph.

**Gate:** `npm run ci:local` passes + E2E test for cascade workflow.

#### Step 4.1: Date Adjustment Utility

**File:** `src/utils/graph/dateAdjustment.ts` (NEW)

See Software Architect section for algorithm pseudocode. Key implementation details:

- Use `topologicalSort` from existing `topologicalSort.ts`
- Work with cloned task data (don't mutate store directly)
- Return `DateAdjustment[]` array for undo/redo recording
- Handle edge cases: zero-duration milestones, summary tasks (skip — dates computed from children)
- All date math uses ISO date strings (`YYYY-MM-DD`) consistent with the existing codebase

#### Step 4.2: Auto-Scheduling State

**File:** `src/store/slices/chartSlice.ts`

Add to state interface and initial state:
```typescript
// State
autoScheduling: boolean;  // line ~93, after showProgress

// Initial state
autoScheduling: false,    // line ~298, after showProgress

// ViewSettingsKeys (line ~145)
| "autoScheduling"

// Actions
setAutoScheduling: (enabled: boolean) => void;
toggleAutoScheduling: () => void;

// applyViewSettings (line ~953)
if (settings.autoScheduling !== undefined)
  state.autoScheduling = settings.autoScheduling;
```

**File:** `src/utils/fileOperations/types.ts` — `ViewSettings` interface

Add:
```typescript
autoScheduling?: boolean;  // after workingDaysConfig
```

#### Step 4.3: Wire Auto-Scheduling Into Dependency Creation

**File:** `src/store/slices/dependencySlice.ts` — `addDependency` (line 130)

After creating the dependency, check if auto-scheduling is enabled and propagate:

```typescript
// After: set((state) => { state.dependencies.push(newDependency); });
const chartStore = useChartStore.getState();
let dateAdjustments: DateAdjustment[] = [];

if (chartStore.autoScheduling) {
  dateAdjustments = propagateDateChanges(
    taskStore.tasks,
    [...get().dependencies],  // includes the new dependency
    fromTaskId
  );

  // Apply date adjustments to tasks
  for (const adj of dateAdjustments) {
    taskStore.updateTaskDates(adj.taskId, adj.newStartDate, adj.newEndDate);
  }
}

// Record history with date adjustments
historyStore.recordCommand({
  ...
  params: {
    dependency: newDependency,
    dateAdjustments,  // populated when auto-scheduling is ON
  },
});
```

#### Step 4.4: Wire Auto-Scheduling Into Task Date Changes

When a predecessor task's dates change (drag, edit), propagate to successors. This should be triggered from the task date update path. The specific integration point depends on how task date editing currently works — investigate `taskSlice.ts` update actions.

#### Step 4.5: Help Content Updates

**File:** `src/config/helpContent.ts`

Update existing dependency help topics:
- "Dependency Types" — explain FS, SS, FF, SF with plain-language descriptions
- "Create Dependency" — update to mention handle-based type inference
- "Edit Dependency" — new topic for Properties Panel
- "Auto-Scheduling" — new topic explaining the toggle and cascade behavior

#### Step 4.6: Settings UI

Add "Scheduling" section to the Project Settings panel with the auto-scheduling toggle. Follow the pattern of existing toggles (`showWeekends`, `showHolidays`, etc.).

---

## Working Checklist

> This checklist serves as a working document. Update checkboxes as tasks are completed during implementation.

### Package 1: Arrow Paths & Visual Differentiation
- [x] Add `getSSConnectionPoints` function in `elbowPath.ts`
- [x] Add `getFFConnectionPoints` function in `elbowPath.ts`
- [x] Add `getSFConnectionPoints` function in `elbowPath.ts`
- [x] Add `getConnectionPoints` dispatcher function in `elbowPath.ts`
- [x] Add `getExitDirection` and `getEntryDirection` helpers
- [x] Modify `calculateArrowPath` to accept `DependencyType` parameter
- [x] Handle arrowhead angle (0° for FS/SS, 180° for FF/SF)
- [x] Handle left-exit paths for SS/SF (direction-aware S-curve with parameterized `exitDir`/`entryDir`)
- [x] Add `DEPENDENCY_DASH_PATTERNS` to `renderConstants.ts`
- [x] Modify `DependencyArrow.tsx` to apply dash pattern from `dependency.type`
- [x] Pass `dependency.type` to `calculateArrowPath` in `DependencyArrow.tsx`
- [x] Update export pipeline to use per-type dash patterns (automatic — export reuses `DependencyArrow`)
- [x] Write unit tests for all 4 connection point functions
- [x] Write unit tests for path routing per type
- [x] Write unit tests for arrowhead angle per type
- [x] **GATE: `npm run test:unit` passes** (56/56 tests pass)
- [x] **GATE: `npm run ci:local` passes** (lint, type-check, tests, build all green)
- [x] **GATE: Manual verification — create deps in code/test, verify all 4 arrow styles render**

**Implementation note:** Senior review identified that `buildTwoCornerPath` assumes left-to-right flow, which breaks SS/FF/SF routing. Solution: non-FS types always use a fully direction-aware S-curve (`buildSCurvePath` with `exitDir`/`entryDir` params). FS routing is unchanged (zero regression).

### Package 2: Dependency Properties Panel
- [x] Create `DependencyPropertiesPanel.tsx` component
- [x] Implement type selector (segmented control: FS/SS/FF/SF)
- [x] Implement lag input (number, supports negative)
- [x] Implement delete button
- [x] Wire `onUpdateType` → `updateDependency(id, { type })`
- [x] Wire `onUpdateLag` → `updateDependency(id, { lag })`
- [x] Wire `onDelete` → `removeDependency(id)`
- [x] Close on Escape / click outside
- [x] Portal-based rendering (above SVG layer)
- [x] Compute panel position from task positions
- [x] Render panel in `DependencyArrows.tsx` when dependency is selected
- [x] Write unit tests for panel rendering and interactions
- [x] Update `helpContent.ts` with dependency type descriptions (FS/SS/FF/SF)
- [x] **GATE: `npm run test:unit` passes**
- [x] **GATE: `npm run ci:local` passes** (lint, type-check, tests, build all green)
- [ ] **GATE: Manual — select arrow, change type, verify arrow re-renders; change lag, verify persisted**

**Implementation notes:** Panel uses HTML overlay (div with absolute positioning, not SVG foreignObject) rendered within the chart container. Position is computed from arrow midpoint coordinates converted to container-relative pixels. Type selector uses segmented button group with active state highlighting. Lag input uses native number input with blur/Enter to apply. Arrow click selection triggers panel display; click-outside and Escape close it. Help content updated with dependency type descriptions.

### Package 3: Handle-Based Type Inference
- [x] Replace `resolveDependencyDirection` with `resolveDependencyTypeAndDirection`
- [x] Detect target handle side from drop position (per-handle mouseUp instead of midpoint heuristic)
- [x] Update `ConnectionHandles.onDrop` to pass handle side
- [x] Update `endDrag` to pass target side
- [x] Update `attemptCreateDependency` to use inferred type
- [x] Update `AddDependencyFn` type to accept `type` parameter
- [x] Update drag preview start position based on `fromSide`
- [x] Use `DependencyDragState` type directly in `DependencyArrowsProps` (replaces inline subset)
- [x] Write unit tests for type inference from all handle combinations (FS/SS/FF/SF)
- [x] Write unit tests for body drop default (defaults to "start" → FS for end-handle drags)
- [x] Write unit test for start-handle cycle detection with new direction semantics
- [x] Update `ConnectionHandles.test.tsx` for per-handle onDrop with side parameter
- [x] Update `DependencyArrows.test.tsx` dragState to use full `DependencyDragState` type
- [x] Remove unused mock dragState from `ExportRenderer.tsx` (prop is optional)
- [x] **GATE: `npm run test:unit` passes** (5000/5000 tests pass)
- [x] **GATE: `npm run ci:local` passes** (lint, type-check, format, tests, build all green)
- [ ] **GATE: Manual — drag end→start=FS, start→start=SS, end→end=FF, start→end=SF**

**Implementation notes:** Used per-handle mouseUp (Approach B from concept doc) instead of midpoint heuristic (Approach A). Each handle's inner `<g>` has its own `onMouseUp` that passes the handle side. Body drops (task bar `<g>` mouseUp, not on a handle) default to `targetSide="start"`, preserving FS behavior for end-handle drags. Direction is always source→target (no more reversal for start-handle drags). Cycle detection now always checks `(source, target)` — this is correct and improves UX by showing invalid targets before drop instead of post-drop error toasts.

### Package 4: Auto-Scheduling (Opt-In)
- [x] Create `src/utils/graph/dateAdjustment.ts`
- [x] Implement `calculateConstrainedDates` for all 4 types
- [x] Implement `propagateDateChanges` using topological sort with reachability filter
- [x] Implement `applyDateAdjustments` and `reverseeDateAdjustments` batch helpers
- [x] Handle edge cases: milestones, summary tasks, no-dep tasks
- [x] Add `autoScheduling` state to `chartSlice.ts`
- [x] Add `setAutoScheduling` and `toggleAutoScheduling` actions (with cascade + undo)
- [x] Add `autoScheduling` to `ViewSettings` in `fileOperations/types.ts`
- [x] Add `autoScheduling` to `applyViewSettings` in `chartSlice.ts`
- [x] Add `autoScheduling` to `viewSettingsDefaults.ts` (backward compat: defaults to false)
- [x] Add `autoScheduling` to `useFileOperations.ts` (ChartSliceNeeded, useFeatureViewSettings)
- [x] Add `autoScheduling` to multi-tab persistence (multiTabStorage + useMultiTabPersistence)
- [x] Wire auto-scheduling into `dependencySlice.addDependency`
- [x] Wire auto-scheduling into `dependencySlice.updateDependency`
- [x] Wire auto-scheduling into `taskSlice.updateTask` (cell edits, resize)
- [x] Wire auto-scheduling into `taskSlice.updateMultipleTasks` (drag move)
- [x] Add toast notifications for date adjustments
- [x] Add `TOGGLE_AUTO_SCHEDULING` command type with full undo/redo
- [x] Extend `UpdateDependencyParams`, `UpdateTaskParams`, `MultiDragTasksParams` with dateAdjustments
- [x] Update all 6 undo/redo handlers for dateAdjustments
- [x] Add "Scheduling" section to View tab ribbon (Lightning icon toggle)
- [x] Update `helpContent.ts` with auto-scheduling help topic
- [x] Update `helpContent.ts` dependency creation topic with type inference info
- [x] Write unit tests for all 4 type constraints (35 tests)
- [x] Write unit tests for cascade propagation with mixed types
- [x] Write unit tests for multiple predecessors (most restrictive wins)
- [x] **GATE: `npm run ci:local` passes** (lint, type-check, format, 5035 tests, build all green)
- [ ] **GATE: Manual — enable auto-scheduling, move predecessor, verify cascade**
- [ ] **GATE: Manual — save/load file with mixed types, verify preservation**
- [ ] **GATE: Manual — export PNG/PDF with mixed arrow styles**

**Implementation notes:** Core algorithm uses topological sort + reachability filtering via `getSuccessors()` for efficient scoped propagation. Toggle-ON runs full recalculation (no changedTaskIds). All cascade operations are fully undoable — toggle, dependency creation/update, task drag/resize/edit all record dateAdjustments in their command params. Uses `useTaskStore.setState()` for batch date application to avoid N separate history entries. Lag field is optional (defaults to 0). FS constraint uses `+1` offset because dates are inclusive.

### Final
- [ ] All packages complete and gates passed
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Performance verified (60fps with 50 mixed dependencies)
- [ ] CHANGELOG updated
- [ ] Sprint marked as COMPLETE

---

## End-User Feedback (from Team Survey)

5 personas surveyed: Power User, Average User, Freelancer, Executive, Tech Skeptic.

**Consensus:**
- Auto-scheduling should be opt-in (OFF by default)
- FS must remain the simple, frictionless default
- Help docs need clear visual examples of each type

**Key concerns addressed:**
- Average User worried about accidental auto-scheduling → **Default OFF**
- Tech Skeptic worried about backward compatibility → **Type field already in file format, defaults to FS**
- Freelancer worried about overcomplication → **Type selector only appears when arrow is clicked**
- Power User wanted keyboard shortcuts → **Future enhancement, not in this sprint**

---

## Appendix: Dependency Type Quick Reference

| Type | Code | Meaning | Constraint | Arrow Style | Anchor |
|------|------|---------|-----------|-------------|--------|
| Finish-to-Start | FS | B cannot start until A finishes | B.start >= A.end + lag | Solid | end→start |
| Start-to-Start | SS | B cannot start until A starts | B.start >= A.start + lag | Dashed | start→start |
| Finish-to-Finish | FF | B cannot finish until A finishes | B.end >= A.end + lag | Dotted | end→end |
| Start-to-Finish | SF | B cannot finish until A starts | B.end >= A.start + lag | Dash-dot | start→end |

**Lag:** Positive = gap (days between), Negative = overlap (lead time), Zero = immediate.
