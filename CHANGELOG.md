# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/username/app-gantt/compare/v0.0.2...HEAD
[0.0.2]: https://github.com/username/app-gantt/compare/v0.0.1...v0.0.2
[0.0.1]: https://github.com/username/app-gantt/compare/v0.0.0...v0.0.1
[0.0.0]: https://github.com/username/app-gantt/releases/tag/v0.0.0
