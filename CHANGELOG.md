# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.0.18](https://github.com/kitikonti/ownchart/compare/v0.0.17...v0.0.18) (2026-01-08)


### Features

* add infinite scroll to timeline ([02e48a8](https://github.com/kitikonti/ownchart/commit/02e48a8b35f7cbaaae9ae57db67e81f79517cca2))
* implement infinite scroll for timeline ([39ce070](https://github.com/kitikonti/ownchart/commit/39ce070169f106664b1dc80be9fcf4c11dde5727))
* implement zoom anchoring for stable scroll position ([ac7a32f](https://github.com/kitikonti/ownchart/commit/ac7a32fdd27dbf8b0b36c408f42eff044babd29d))


### Bug Fixes

* disable false-positive a11y lint error for separator ([f46e9de](https://github.com/kitikonti/ownchart/commit/f46e9dee6122e51fd1bfb425f38e3b9156b0c8dd))
* prevent dependency arrows from animating during scroll ([065f2f6](https://github.com/kitikonti/ownchart/commit/065f2f6e1ec05dbb1d7be605f826b7afb33accb5))
* smooth left-scrolling for infinite timeline ([d3f1e35](https://github.com/kitikonti/ownchart/commit/d3f1e358cee1bf7064e58a927415a4586f258e3f))


### UI/UX

* remove TODAY label from today marker ([b4174cf](https://github.com/kitikonti/ownchart/commit/b4174cfb97fce405c0eb60b43bc2fa0a0dabee04))

### [0.0.17](https://github.com/kitikonti/ownchart/compare/v0.0.16...v0.0.17) (2026-01-06)


### UI/UX

* change default task color to teal and unify brand color ([12c25f0](https://github.com/kitikonti/ownchart/commit/12c25f082d933f4e583c928abdafaa1a4e062b98)), closes [#6366f1](https://github.com/kitikonti/ownchart/issues/6366f1) [#0d9488](https://github.com/kitikonti/ownchart/issues/0d9488) [#6366f1](https://github.com/kitikonti/ownchart/issues/6366f1) [#334155](https://github.com/kitikonti/ownchart/issues/334155)

### [0.0.16](https://github.com/kitikonti/ownchart/compare/v0.0.15...v0.0.16) (2026-01-06)

### [0.0.15](https://github.com/kitikonti/ownchart/compare/v0.0.14...v0.0.15) (2026-01-06)


### UI/UX

* increase checkbox and radio button size to 16px ([4ac2d8a](https://github.com/kitikonti/ownchart/commit/4ac2d8a80c781fe453ed432f6777290870cee405))
* refine design system with improved typography and form controls ([239a2c0](https://github.com/kitikonti/ownchart/commit/239a2c06ab9b22c7828015a8eee70eaaf53303b7))
* replace IBM Plex Sans with Inter font ([411a255](https://github.com/kitikonti/ownchart/commit/411a2554a444d0fcc4789b5d646d8e0f06414b45))

### [0.0.14](https://github.com/kitikonti/ownchart/compare/v0.0.13...v0.0.14) (2026-01-06)


### Features

* configure custom domain ownchart.app ([c742e7a](https://github.com/kitikonti/ownchart/commit/c742e7ad7c919a4a2ded00c63e371921265da8a7))

### [0.0.13](https://github.com/kitikonti/ownchart/compare/v0.0.12...v0.0.13) (2026-01-06)


### Features

* add holidays and task label position to export dialog ([3a85d1d](https://github.com/kitikonti/ownchart/commit/3a85d1d121301d98139c2058df6cf53b84f5a5db))
* auto-open chart settings dialog when creating new file ([73d270d](https://github.com/kitikonti/ownchart/commit/73d270d3ecfb1efebfa69fcab44a82d4ddcd0f7f))
* implement Sprint 1.5.9 User Preferences & Settings ([ab8a932](https://github.com/kitikonti/ownchart/commit/ab8a932da3dfb11509799f6c283ab304cdcbeeeb))
* move holiday region from user preferences to chart settings ([ff4fc03](https://github.com/kitikonti/ownchart/commit/ff4fc03d4ca68a016c41bdad36663b8ae290eb8a))


### Bug Fixes

* resolve Sprint 1.5.9 settings bugs and add week numbering ([e68f7be](https://github.com/kitikonti/ownchart/commit/e68f7bed27d64a0d608d0faa1d934f3470f5c77a))
* wrap default case in braces to fix lint error ([9fb5825](https://github.com/kitikonti/ownchart/commit/9fb5825086089b4ee94441483b39b46cc92d7351))


### UI/UX

* show calendar week in timeline header at lower zoom levels ([92c7296](https://github.com/kitikonti/ownchart/commit/92c7296066594d548fe3d8977b9309a47da58cc0))
* update toolbar and settings dialog icons ([f94c155](https://github.com/kitikonti/ownchart/commit/f94c155dc0eb8848599ddd8027ceab6d1799a12f))


### Code Refactoring

* rename concept/ folder to docs/ ([2a997ec](https://github.com/kitikonti/ownchart/commit/2a997ec04bf954a2d5c690f3a12d3de9a7d3058a))
* restructure AppToolbar with reusable primitives ([d42ce67](https://github.com/kitikonti/ownchart/commit/d42ce67bc838139e57dd98ab84dbfe3aa6fad427))

### [0.0.12](https://github.com/kitikonti/ownchart/compare/v0.0.11...v0.0.12) (2026-01-05)


### Features

* add density selection to export dialog ([6bf77b6](https://github.com/kitikonti/ownchart/commit/6bf77b6b6891e10cb57fd83c9884acb83154b52f))
* add density-aware color bar height ([cf1001d](https://github.com/kitikonti/ownchart/commit/cf1001d42a50ae34f5955fc6b8401f239965e64e))
* add density-aware column widths ([1962c60](https://github.com/kitikonti/ownchart/commit/1962c60ae84c07d069cbae967e911f8a56f5c50f))
* add UI density settings (compact/normal/comfortable) ([8ce1094](https://github.com/kitikonti/ownchart/commit/8ce1094448347691bb6e9709a55ebe41815733e4))


### Bug Fixes

* export now uses comfortable density regardless of user setting ([29a1d70](https://github.com/kitikonti/ownchart/commit/29a1d70207310f21d20154028aee9965e007fb58))
* increase bar font sizes by 1px (13→12→11) ([694ae35](https://github.com/kitikonti/ownchart/commit/694ae351cc2672a345ee7fccfb38091c74dd8143))
* restore original font sizes for comfortable density ([405e01f](https://github.com/kitikonti/ownchart/commit/405e01fcd699f24828cac3881a4712cfeda5d411))
* scale dependency arrow corners for different densities ([2c0e05d](https://github.com/kitikonti/ownchart/commit/2c0e05d1f34cf5ef8a38473a35dc8efd467c7c8c))
* use linear font size progression (16→15→14) ([efe900c](https://github.com/kitikonti/ownchart/commit/efe900ce2a4a84786cfe72ca75ec518398c4393d))

### [0.0.11](https://github.com/kitikonti/ownchart/compare/v0.0.10...v0.0.11) (2026-01-05)


### Features

* auto-fit name column when opening files ([2186809](https://github.com/kitikonti/ownchart/commit/21868093b0aba81e4f014244a1abe61374b3a78d))
* **export:** add grid lines/weekends options and persist settings in project file ([0395acb](https://github.com/kitikonti/ownchart/commit/0395acbae8d93bc16f3737d2e09ca1e46845a8f1))


### Bug Fixes

* persist column widths in multi-tab localStorage ([ec92e22](https://github.com/kitikonti/ownchart/commit/ec92e2218f046a76777ae703bf46c19fcbbcf486))
* persist dependencies in multi-tab localStorage ([94b4f54](https://github.com/kitikonti/ownchart/commit/94b4f546d220a330ea9fa932dadfa35aafd052b9))
* **welcome:** respect "Don't show again" checkbox ([c426186](https://github.com/kitikonti/ownchart/commit/c426186651d6bd7ddc2b7249a39ce845aa9c5bd6))


### Code Refactoring

* change file extension from .gantt to .ownchart ([4480d80](https://github.com/kitikonti/ownchart/commit/4480d80879293bd518e6dbff0482d8f46be5d22f))
* **export:** switch to html-to-image with offscreen rendering ([4a97843](https://github.com/kitikonti/ownchart/commit/4a978435626d7514fbad9e237ac1599c03e62375))
* restrict column resizing to name column only ([e7ff4cb](https://github.com/kitikonti/ownchart/commit/e7ff4cbaf257b25cc7227494200bc5e2874cca79))

### [0.0.10](https://github.com/kitikonti/ownchart/compare/v0.0.9...v0.0.10) (2026-01-05)


### Bug Fixes

* resolve accessibility lint error in Modal component ([d4e7949](https://github.com/kitikonti/ownchart/commit/d4e7949abadd34e0fab0541319d370c69c97b823))

### [0.0.9](https://github.com/kitikonti/ownchart/compare/v0.0.8...v0.0.9) (2026-01-05)


### Features

* add multi-task dragging in timeline view ([8cfea20](https://github.com/kitikonti/ownchart/commit/8cfea209514c548f7bc36c8bafe78ccf41f45e73))
* add PNG export, help panel, and welcome tour ([f5b2387](https://github.com/kitikonti/ownchart/commit/f5b2387736fcf709f2f17a8dba1b451d3b642f2e))

### [0.0.8](https://github.com/kitikonti/ownchart/compare/v0.0.7...v0.0.8) (2026-01-04)


### Features

* add cross-tab copy/paste via system clipboard ([d427d54](https://github.com/kitikonti/ownchart/commit/d427d5491f87be25f658073aed8c2bc09f9b3df6))
* add insert task above/below toolbar buttons ([47dfb7a](https://github.com/kitikonti/ownchart/commit/47dfb7a80b93f50235ab010e60f7be3efc3af23f))


### Bug Fixes

* auto-resize name column accounts for hierarchy indent ([fcc3180](https://github.com/kitikonti/ownchart/commit/fcc3180bde92dd5fc9e56e1554e0637bf2493bdc))
* restrict collapse/expand to summary tasks only ([4c6c2c7](https://github.com/kitikonti/ownchart/commit/4c6c2c727b8805071ad74c5dbd6d9bf74918fa87))
* update clipboard tests to use clipboardTaskIds ([debfffb](https://github.com/kitikonti/ownchart/commit/debfffb91f44128a002bf62a667ce863570db5ef))

### [0.0.7](https://github.com/kitikonti/ownchart/compare/v0.0.6...v0.0.7) (2026-01-04)

### [0.0.6](https://github.com/kitikonti/ownchart/compare/v0.0.5...v0.0.6) (2026-01-04)


### Features

* add DEL key and toolbar button to delete selected tasks ([8838294](https://github.com/kitikonti/ownchart/commit/88382945dfeeb2fae4a41e549888bcf2627e9622))


### UI/UX

* fix cell edit mode vertical centering and left padding ([41bbcd2](https://github.com/kitikonti/ownchart/commit/41bbcd2ddc691c1cfbab1f3af6bcc25183b65df0))
* improve clipboard visual feedback ([c531b18](https://github.com/kitikonti/ownchart/commit/c531b187cea4b7dcfaa1122276877afac98bcca4))
* match placeholder row edit styling with regular cells ([083ddde](https://github.com/kitikonti/ownchart/commit/083ddde3c9b0f42ed49ea20c3ae778be651d2d76))
* use consistent placeholder text for new task row ([e049146](https://github.com/kitikonti/ownchart/commit/e0491461636e04ffaa89d0118612d8746058493b))
* use dashed border overlay for clipboard selection ([b5c0edd](https://github.com/kitikonti/ownchart/commit/b5c0edd1d4027f30efd67bc35b26d7b709372068))
* use dotted border for clipboard selection ([abef7be](https://github.com/kitikonti/ownchart/commit/abef7be517cceca9f391832d375adc6632ab43ed))

### [0.0.5](https://github.com/kitikonti/ownchart/compare/v0.0.4...v0.0.5) (2026-01-04)


### Features

* add clipboard operations and placeholder row for task creation ([ba8b0b2](https://github.com/kitikonti/ownchart/commit/ba8b0b24c791f067c82d711397bfd354a52cd316))

### [0.0.4](https://github.com/kitikonti/ownchart/compare/v0.0.3...v0.0.4) (2026-01-04)


### Features

* add rectangular marquee selection in timeline view ([423036c](https://github.com/kitikonti/ownchart/commit/423036c6380b3dfbd5a41fbbbfb50675c1f47f25))


### Bug Fixes

* resolve lint errors for unused variables ([fedd225](https://github.com/kitikonti/ownchart/commit/fedd22534120f8cce0c5a521e2e5b51582fecc32))
* resolve marquee selection closure issue ([1e47a96](https://github.com/kitikonti/ownchart/commit/1e47a96f1f1af348b38955c2db150ef4ebe2569f))


### UI/UX

* clear row selection when clicking a cell (Excel behavior) ([d64accc](https://github.com/kitikonti/ownchart/commit/d64accc0cd6a2d684b1cb985cdd125c6070a171a))
* disable text selection in TaskTable except in edit mode ([6c6319e](https://github.com/kitikonti/ownchart/commit/6c6319e6836752c13fdb5fe7965731688e5b0f91))
* replace task bar selection outline with full row highlight ([5944990](https://github.com/kitikonti/ownchart/commit/594499083d1abbd077f5257726e3d2c592aa53a0))

### [0.0.3](https://github.com/kitikonti/ownchart/compare/v0.0.2...v0.0.3) (2026-01-04)


### Features

* add task dependencies with Finish-to-Start relationships ([3b2b739](https://github.com/kitikonti/ownchart/commit/3b2b7390f07e4bba8ee453141baecc6e4b7120d0))
* configure GitHub Pages deployment ([1b23694](https://github.com/kitikonti/ownchart/commit/1b236940049a317f7ff3b39b53637398b02d2a78))
* implement multi-tab support for parallel chart editing ([6d06397](https://github.com/kitikonti/ownchart/commit/6d063977aa0d4c119c647b3e81d130afa2044baa))
* rebrand to OwnChart throughout application ([9d99b1c](https://github.com/kitikonti/ownchart/commit/9d99b1c9ee4a90fd4f241cebb77201f5aa256971))


### Bug Fixes

* add automatic migration from v1 to v2 storage ([c12b87a](https://github.com/kitikonti/ownchart/commit/c12b87ab35d9c429c6859414b752709c942d4647))
* prevent data loss on page reload by removing beforeunload cleanup ([9e17c98](https://github.com/kitikonti/ownchart/commit/9e17c98b692aca3d64acb3b2b51a08eb996b51bf))

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
