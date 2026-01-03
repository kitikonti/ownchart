# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.2](https://github.com/kitikonti/ownchart/compare/v0.0.1...v0.0.2) (2026-01-03)


### Features

* add custom indent/outdent icons with horizontal lines 67622df
* add editable type column to task table 8561622
* add integration tests and toast notifications for undo/redo eb2230c
* add localStorage persistence to preserve data after browser refresh 3f3f724
* add validation to prevent multi-level jumps in hierarchy 662fd9b
* complete Sprint 1.2 Package 2 - Interactive Editing (drag-to-edit) 26de088
* complete Sprint 1.3 - File Operations with comprehensive security 0151b88
* enable type switching via clickable icon and remove type column 9a6d9f2
* implement automated versioning and release management 213828b
* implement hierarchical task organization (SVAR pattern) 15a0e21
* implement hierarchy indent/outdent functionality be04a92
* implement resizable split pane between TaskTable and Timeline bc4631b
* implement Sprint 1.2 Package 1 - Core Foundation c7a4eb2
* implement Sprint 1.5 - Undo/Redo system with keyboard shortcuts 49af349
* implement SVAR-style sticky scroll layout for timeline 4100c40
* improve milestone handling and unify task styling 46ff348
* integrate competitive analysis insights and enhance data model 9df604d
* migrate from Heroicons to Phosphor Icons 2180141
* redesign color column as compact vertical bar 195fba8
* remove 1:1 reset zoom button 9d95448
* **store:** add task CRUD operations 70b2e9a
* **store:** add task selection and reordering 8894d85
* **store:** initialize task store with Zustand 93a7bea
* switch indent/outdent shortcuts from Ctrl+[/] to Tab/Shift+Tab 4d22ffc
* **types:** add Chart and AppState interfaces dd230da
* **types:** add Dependency interface 87df387
* **types:** add Task interface definition 97c1a1c
* **ui:** add auto-fit column width on double-click cf8734a
* **ui:** add delete task functionality 77afa4b
* **ui:** add drag-and-drop reordering with [@dnd-kit](undefined/dnd-kit) 1493346
* **ui:** add inline editing to TaskRow 9edbd96
* **ui:** add live preview for column resizing 08b0ea0
* **ui:** add multi-selection with checkboxes 2fc945d
* **ui:** add TaskList container component 0d902d0
* **ui:** add TaskRow component with display mode 8ab38ce
* **ui:** integrate TaskList into App.tsx 7714549
* **ui:** transform TaskList into Excel-like spreadsheet table 3a90bad
* update icons to Phosphor icons ad22795
* **utils:** add basic validation functions b19d999
* **utils:** add validateTask function 265f09c


### Bug Fixes

* add undo/redo support for task reordering and color changes c500ff1, closes #3 #4
* correct duration calculation for tasks and summaries 06b4d15
* improve zoom indicator and adaptive grid lines 8bda22d
* prevent cascade effect when indenting multiple selected tasks 2ba6c60
* resolve delete task undo bug with deep clone and batch setState dae0e78
* resolve redo race condition by removing async imports ced6ff4
* resolve zoom functionality and fit-to-view double-padding bug 0ef8448
* skip milestone type when cycling types for tasks with children 8576c12
* **ui:** auto-open color picker on edit mode activation ca72ff9
* **ui:** ensure consistent color field appearance across all modes f6495ba
* **ui:** improve drag-and-drop visual feedback in TaskTable 7ca1410
* **ui:** prevent active cell border from being covered by hover f457db2
* **ui:** prevent color field vertical shift in edit mode 6969f64
* **ui:** remove text shift when entering edit mode eb2fe72
* **ui:** simplify color column display 01c09dc


### Code Refactoring

* redesign app header and simplify UI af5d0a6
* rename Sprint 1.15 → 1.1.1 and Sprint 1.16 → 1.1.2 a9ddd86
* rename usePanZoom to useZoom ee41c04
* reorganize toolbar following industry standard patterns 975f76e
* replace scaleLocked pattern with dateRange source of truth 511808a
* split App.tsx into sub-components e21e928


### UI/UX

* shorten progress column header to save space caba9db

## [0.0.3] - 2026-01-02

### Added - Sprint 1.2 Package 3: Navigation & Scale
- **Mouse Wheel Zoom**: Ctrl+Wheel zooms timeline centered on mouse cursor
- **Zoom Toolbar**: Zoom in/out buttons, percentage dropdown (10%-500%), Fit All button
- **Zoom Indicator**: Temporary overlay showing current zoom percentage (fixed center of viewport)
- **Fit-to-View**: Automatically calculates zoom level to show all tasks with 10% padding
- **Adaptive Grid Lines**: Grid density changes based on zoom level
  - Daily lines at ≥40% zoom
  - Weekly lines at 12-40% zoom (aligned to ISO 8601 Monday week start)
  - Monthly lines at <12% zoom (aligned to month boundaries)
- **Weekend Highlighting**: Visible at all zoom levels
- **SVAR-Style Sticky Scroll Layout**: Horizontal scrollbar always at viewport bottom
- **Keyboard Shortcuts**: Ctrl+0 (reset to 100%), Ctrl++ (zoom in), Ctrl+- (zoom out)

### Changed
- Implemented SVAR-inspired sticky scroll architecture for better UX
- Grid lines now use ISO 8601 week boundaries (Monday as week start)
- ZoomIndicator moved to root level with fixed positioning for stability
- Timeline header synchronized with chart zoom level

### Technical Details
- New `ZoomToolbar`, `ZoomIndicator`, `ZoomControls` components
- New `usePanZoom` hook for zoom event handling
- Enhanced `chartSlice.ts` with zoom state (single source of truth)
- Enhanced `GridLines.tsx` with adaptive density using `startOfWeek`/`startOfMonth`
- SVAR-style layout in `App.tsx` with pseudo-rows and sticky container
- Virtual scrolling via `translateY` transforms

### Performance
- Zoom maintains 60fps with 100+ tasks
- CSS transforms for GPU-accelerated rendering
- Grid calculation optimized with useMemo

## [0.0.2] - 2025-12-31

### Added - Sprint 1.2 Package 2: Interactive Editing
- **Drag-to-Move**: Drag task bars horizontally to shift dates
- **Drag-to-Resize**: Resize tasks from left/right edges to change duration
- **Milestone Dragging**: Milestones can be dragged with visual preview
- **Visual Preview**: Solid blue outline shows target position during drag
- **Snap-to-Grid**: Dates automatically round to nearest day boundary
- **Cursor Feedback**: Visual feedback (grab/grabbing/resize/not-allowed)
- **Summary Bracket Visualization**: Custom bracket/clamp SVG path for summary tasks
  - Horizontal bar at 30% of row height
  - 60-degree triangular downward tips
  - Rounded top corners (10px radius)
  - Rounded inner corners (3px radius)
  - Task name displayed to right of bracket
- **Recursive Cascade**: Parent summary dates update automatically through unlimited hierarchy levels
- **Validation**: Minimum 1-day duration enforced for regular tasks
- **Error Toasts**: Clear error messages for invalid operations

### Changed
- Summary tasks now render as bracket/clamp shapes instead of regular bars
- Summary tasks display task name to the right of the bracket
- Milestones now properly handle missing endDate field
- Keyboard shortcuts now use case-insensitive key comparison (fixes Ctrl+Shift+Z)
- Summary cascade now recursively updates all ancestor summaries

### Fixed
- Milestone rendering when only startDate is set (no endDate required)
- Redo functionality with frozen objects (mutable copy created)
- Summary type conversion now recalculates dates from children
- Nested summary cascade now updates top-level summaries correctly
- Date range calculation now filters out invalid/empty dates

### Technical Details
- Added `useTaskBarInteraction` hook for unified drag/resize handling
- Added `dragValidation.ts` for validation utilities
- Added `MilestoneDiamond` component for milestone rendering
- Added `SummaryBracket` component for summary bracket rendering
- Enhanced `taskSlice.ts` with recursive cascade algorithm
- Updated `historySlice.ts` to handle cascade updates in undo/redo
- Modified `TaskBar.tsx` to integrate interaction hook and preview rendering
- Updated `timelineUtils.ts` with milestone date fallback
- Modified `dateUtils.ts` to filter invalid dates

### Performance
- Drag start to first preview: <20ms
- Frame time during drag: <16ms (60fps maintained)
- Tested with 100+ tasks: No jank, smooth interaction
- Recursive cascade handles unlimited nesting levels efficiently

## [0.0.1] - 2025-12-30

### Added - Sprint 1.5: Undo/Redo System
- **Full Undo/Redo**: Complete command pattern implementation
- **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo)
- **Toolbar Buttons**: Visual undo/redo controls with disabled states
- **Toast Notifications**: Real-time feedback for all undo/redo operations
- **Smart Command Recording**: Tracks all task operations automatically
- **Branching Support**: New actions after undo clear the redo stack

### Added - Sprint 1.2 Package 1: Timeline Visualization
- **Interactive Timeline**: SVG-based Gantt chart visualization
- **Sticky Headers**: Toolbar, table header, and timeline header stay visible
- **Synchronized Scrolling**: Table and timeline scroll together
- **Auto-Resize**: Timeline adapts to window size changes
- **Multi-Level Timeline**: Month + Day scale system (SVAR-inspired)
- **Weekend Highlighting**: Visual distinction for Sat/Sun
- **Today Marker**: Red line indicating current date
- **Task Types**: Visual rendering for tasks, summaries, milestones
- **Progress Bars**: Visual progress indication on task bars
- **Grid System**: Adaptive grid with proper alignment

### Technical Details
- Vertical flex layout with sticky header row
- Common vertical scroll container for synchronized scrolling
- Separate horizontal scroll per panel (table and timeline)
- ResizeObserver for responsive timeline
- Command pattern with Memento snapshots for undo/redo
- Zustand store with Immer middleware for state management

## [0.0.0] - 2025-12-23

### Added - Phase 0: Foundation
- Project initialization with Vite + React + TypeScript
- Build tools configured (Vite, TypeScript, ESLint, Prettier)
- Code quality tools set up (ESLint, Prettier, TypeScript strict mode)
- Testing infrastructure ready (Vitest, Playwright)
- CI/CD pipeline active (GitHub Actions)
- Documentation complete (concept folder structure)
- Basic project structure and folder organization
- README with development workflow
- Contributing guidelines

[Unreleased]: https://github.com/username/app-gantt/compare/v0.0.3...HEAD
[0.0.3]: https://github.com/username/app-gantt/compare/v0.0.2...v0.0.3
[0.0.2]: https://github.com/username/app-gantt/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/username/app-gantt/compare/v0.0.0...v0.0.1
[0.0.0]: https://github.com/username/app-gantt/releases/tag/v0.0.0
