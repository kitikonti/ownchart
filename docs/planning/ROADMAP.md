# Development Roadmap

## 1. Overview

This roadmap outlines the phased development approach for the Gantt Chart application, from initial setup through V1.0 release and beyond.

**Philosophy**: Ship early, iterate based on feedback, maintain quality.

---

## 📋 Roadmap Updates (v2.5 - April 2026)

**Current state**: The application is at **v1.6.0** and production-live at [ownchart.app](https://ownchart.app). MVP, all Phase 1.5 sprints through 1.5.9.2, a comprehensive code review, and Sprint 1.5.2 (Advanced Dependencies) are complete. The focus is now shifting to remaining V1.1 deferred features.

**What's been achieved since initial roadmap**:
1. ✅ **MVP complete** — all core features shipped (task management, timeline, dependencies, undo/redo, export)
2. ✅ **Deferred features delivered early** — task groups, copy/paste, PDF/SVG export all completed ahead of schedule
3. ✅ **User preferences & settings** — date formats, density, holidays, working days, chart settings
4. ✅ **Full code review** — systematic review of all components, hooks, utils, and export code (~587 commits)
5. ✅ **Quality infrastructure** — VRT, E2E testing (Playwright), CI hardening, unified design system
6. ✅ **Export pipeline polished** — PDF default, logo support, warnings, better defaults
7. ✅ **Advanced dependencies** — all 4 types (FS/SS/FF/SF), properties panel, handle-based type inference, opt-in auto-scheduling with cascade propagation, 43 E2E tests

**Remaining for V1.1**:
- Named snapshots
- Custom fields UI
- Multi-project management

---

## 1.5 Competitive Analysis Integration (December 2025)

**Analysis Date**: 2025-12-23
**Reference**: [COMPETITIVE_ANALYSIS.md](./COMPETITIVE_ANALYSIS.md)

### Key Insights from SVAR React Gantt Analysis

Based on comprehensive analysis of SVAR React Gantt (https://github.com/svar-widgets/react-gantt), we have validated our approach and identified critical features to prioritize:

**✅ Architectural Validation**:
- Zustand + D3.js + minimal dependencies: CONFIRMED as sound approach
- SVAR uses complex proprietary state management - our approach is simpler and better
- Client-side-only architecture is production-ready

**🎯 Enhanced Data Model** (Implemented in v0.0.1):
- Task type system: `task`, `summary`, `milestone`
- Hierarchy support: `parent`, `open` for expandable groups
- Baseline tracking: `baseStart`, `baseEnd` for planned vs actual
- Performance optimization: `lazy` flag for lazy-loading

**📊 Feature Prioritization Updates**:

| Priority | Feature | Sprint | Rationale from Analysis |
|----------|---------|--------|------------------------|
| **Critical** | Virtual Scrolling | 1.1 | Performance with 500+ tasks |
| **Critical** | Scale System | 1.2 | Essential for hour/day/week/month views |
| **Critical** | Event Bus | 1.3 | Foundation for plugin system |
| **High** | SVG Dependencies | 1.4 | Proven approach with Bézier curves |
| **High** | Context Menu | 1.5 | Standard UX expectation |
| **Medium** | Toolbar | 1.5 | Standard UX expectation |
| **Medium** | Tooltips | 1.5 | Enhanced UX |
| **Low** | Localization | 2.x | Nice-to-have |

**🚫 Strategic Decision: Independent Implementation**

After analysis, we've confirmed the decision to build independently rather than using SVAR as dependency:

**Reasons**:
1. ❌ SVAR has vendor lock-in to @svar-ui ecosystem (10+ packages)
2. ❌ Their complex state management would require major integration effort
3. ✅ Our architecture is simpler, more maintainable, and more flexible
4. ✅ We maintain full control

**Approach**: Study their patterns, learn from their demos, implement independently.

### Implementation Patterns to Adopt

**From SVAR Analysis** (see docs/docs/COMPETITIVE_ANALYSIS.md for details):

1. **Component Structure**: Separate Chart, Grid, Editor components (we already do this ✅)
2. **Virtual Scrolling**: Render only visible rows + buffer
   - Reference: `/tmp/react-gantt/src/components/chart/Chart.jsx:80-93`
3. **Scale Configuration**: Flexible timeline units (year/quarter/month/week/day/hour)
   - Reference: `/tmp/react-gantt/src/helpers/prepareConfig.js`
4. **Event Bus Pattern**: For plugin system
   - Reference: `/tmp/react-gantt/src/components/Gantt.jsx:146-157`
5. **Dependency Rendering**: SVG paths with Bézier curves
   - Reference: `/tmp/react-gantt/src/components/chart/Links.jsx`

### Updated Performance Targets

Based on SVAR's capabilities:

- ✅ Support 1000+ tasks (with virtual scrolling)
- ✅ 60fps scrolling and interactions
- ✅ Smooth zoom operations
- ✅ Responsive to user input < 100ms

### Reference Repository

For future implementation reference:
```bash
# Clone SVAR React Gantt for pattern reference
git clone https://github.com/svar-widgets/react-gantt.git /tmp/react-gantt
```

Key files to reference:
- Main component: `/src/components/Gantt.jsx`
- Chart rendering: `/src/components/chart/Chart.jsx`
- Dependencies: `/src/components/chart/Links.jsx`
- Demos: `/demos/cases/` (30+ examples)

---

## 2. Development Phases

### Phase 0: Foundation & Risk Validation (2-3 weeks)

**Goal**: Establish development environment, validate high-risk assumptions, set up quality infrastructure.

**Philosophy**: Don't commit to 12+ weeks of development until we've proven the risky parts work.

**Key Activities**:

**1. Project Setup** (Week 1):
- Project repository structure
- Build pipeline (Vite + TypeScript)
- Component library foundation (Radix + Tailwind)
- State management setup (Zustand)
- Testing framework (Vitest + Playwright)
- Basic design system components
- **Extensibility foundations** (event bus, plugin registration API)

**2. CI/CD Infrastructure** (Week 1):
- GitHub Actions workflow (free tier):
  - Lint + TypeScript check on every commit
  - Run tests on PR
  - Build verification
- Lighthouse CI for performance budgets (free)
- npm audit for dependency security (free)
- Branch protection rules (require CI pass)

**3. Risk Validation Prototypes** (Week 2-3):
- **Dependency Arrow Routing POC**:
  - Implement basic arrow path calculation
  - Test with complex scenarios (overlapping tasks, long arrows)
  - Validate SVG vs Canvas performance
  - Goal: Prove we can render arrows efficiently
- **Performance Validation**:
  - Render 1000 tasks on timeline
  - Measure frame rate during pan/zoom
  - Identify if virtualization is needed
  - Goal: Confirm performance targets are achievable
- **Date Calculation Logic**:
  - Prototype auto-adjustment algorithm
  - Test circular dependency detection
  - Validate topological sort approach
  - Goal: Ensure dependency logic is sound

**Deliverables**:
1. ✓ Complete concept documentation (this repository)
2. ✓ Extensibility architecture documented (EXTENSIBILITY_ARCHITECTURE.md)
3. Working development environment
4. CI/CD pipeline running on GitHub Actions
5. Dependency arrow POC (working demo)
6. Performance benchmark results (1000 tasks)
7. Testing infrastructure ready
8. Event bus and plugin API foundation
9. Go/no-go decision on technical feasibility

**Success Criteria**:
- Development server runs with hot reload
- TypeScript strict mode enabled and passing
- First component renders with tests
- CI pipeline runs on every PR
- Dependency arrow POC renders correctly
- 1000 task benchmark meets 30fps minimum (60fps target)
- Team confident in technical approach

**Go/No-Go Decision**:
If dependency arrows or performance validation fails, reassess approach before committing to full MVP development.

---

### Phase 1: MVP (Minimum Viable Product) - 6-8 weeks

**Goal**: Build core functionality for creating, editing, and saving basic Gantt charts.

**Target**: MVP demonstrates value and core workflows with minimal complexity.

**Simplified Scope** (based on team review):
- Basic task management (create, edit, delete, reorder)
- Timeline visualization with pan/zoom
- **Finish-to-Start dependencies only** (not SS/FF/SF)
- File save/load (.ownchart format)
- **Basic undo/redo**
- **PNG export only** (not PDF/SVG)
- Keyboard shortcuts and help

**Deferred to V1.1** (Phase 1.5):
- Advanced dependency types (SS, FF, SF)
- ~~PDF/SVG export~~ → ✅ COMPLETE (v0.0.22)
- ~~Task groups/phases~~ → ✅ COMPLETE (Sprint 1.1.1)
- ~~Copy/paste with multi-select~~ → ✅ COMPLETE (Sprint 1.5.4)
- Named snapshots

#### Sprint 1.1: Basic Task Management ✅ COMPLETE

**Features**:
- Create/edit/delete tasks
- Task list panel UI
- Inline task editing
- Task ordering

**Technical Work**:
- Task data model (with extensibility fields - see DATA_MODEL.md)
- Task state management
- Task list components
- Validation logic
- Event bus integration (emit task.created, task.updated events)

**Acceptance Criteria**:
- Can add 10 tasks quickly
- Inline editing works smoothly
- Reordering via drag-and-drop
- Data persists in state

**Status**: ✅ COMPLETE (2025-12-19)

---

#### Sprint 1.1.1: Task Groups & Hierarchical Organization ✅ COMPLETE

**Duration:** 2 days
**Goal:** Add hierarchical task organization using SVAR pattern (type decoupled from hierarchy)

**Features**:
- Task groups/phases for organization
- Collapsible sections (3 levels deep)
- Nested drag-and-drop
- Visual hierarchy with indentation
- SVAR pattern adoption (tasks CAN have children regardless of type)

**Technical Work**:
- Task type system: `task`, `summary`, `milestone`
- Hierarchy utilities (`getChildren`, `calculateSummaryDates`, `buildFlattenedTaskList`)
- Enhanced drag-and-drop with drop zones (BEFORE/INTO/AFTER)
- Summary date auto-calculation
- Circular hierarchy prevention

**Acceptance Criteria**:
- Can nest tasks 3 levels deep
- Summary dates auto-calculate from children
- Regular tasks with children keep manual dates (SVAR pattern)
- Collapse/expand works smoothly
- Drag-drop nesting works intuitively

**Status**: ✅ COMPLETE (2025-12-24)

**Key Innovation**: Adopted SVAR pattern - type and hierarchy are independent. Regular tasks CAN have children (manual dates), summaries auto-calculate dates from children.

---

#### Sprint 1.1.2: Hierarchy Indent/Outdent ✅ COMPLETE

**Duration:** 2 days
**Goal:** Add UI controls and keyboard shortcuts for hierarchy navigation

**Features**:
- Indent button (→) - make task child of previous sibling
- Outdent button (←) - make task sibling of parent
- Keyboard shortcuts (Tab/Shift+Tab)
- Multi-selection support for bulk operations
- Smart validation (buttons disabled when invalid)

**Technical Work**:
- `indentSelectedTasks()` store action
- `outdentSelectedTasks()` store action
- `canIndentSelection()` validator
- `canOutdentSelection()` validator
- HierarchyButtons component
- Snapshot-based hierarchy operations to prevent cascading bugs

**Acceptance Criteria**:
- Indent/outdent buttons work correctly
- Keyboard shortcuts functional (Tab/Shift+Tab)
- Multi-selection processed sequentially
- Invalid operations prevented with clear feedback
- Parent auto-expands when child is indented

**Status**: ✅ COMPLETE (2025-12-27)

---

#### Sprint 1.2: Timeline & Visualization

**Features**:
- Gantt chart canvas
- Timeline header (date axis)
- Task bar rendering
- Basic timeline scaling

**Technical Work**:
- SVG rendering pipeline
- Date calculation utilities
- Coordinate mapping
- Pan/zoom foundation

**Acceptance Criteria**:
- Tasks render as bars on timeline
- Timeline shows appropriate date range
- Visual quality matches designs
- Performance: 100 tasks at 60fps

---

#### Sprint 1.3: File Operations ✅ COMPLETE

**Duration:** 1 week
**Status:** ✅ COMPLETE (2026-01-03)

**Features**:
- ✅ Save to .ownchart file
- ✅ Open .ownchart file
- ✅ New chart
- ✅ File validation
- ✅ 6-layer validation pipeline:
  1. Pre-parse (size, extension)
  2. Safe JSON parse (prevent prototype pollution)
  3. Structure validation
  4. Semantic validation (circular deps, valid refs)
  5. String sanitization (DOMPurify)
  6. Version compatibility
- ✅ Unsaved changes dialog

**Technical Work**:
- ✅ JSON serialization (with version fields and unknown field preservation)
- ✅ File I/O handlers (File System Access API + fallback)
- ✅ Validation schema (112 automated tests)
- ✅ Error handling (toast notifications)
- ✅ Migration system foundation
- ✅ Security layer (XSS and prototype pollution prevention)

**Acceptance Criteria**:
- ✅ Files save and load correctly
- ✅ Invalid files rejected gracefully
- ✅ Unsaved changes prompts work
- ✅ File format documented
- ✅ 6-layer validation prevents malicious files

**Implementation Summary**:
- 8 utility files created in `src/utils/fileOperations/`
- 112 automated tests (90%+ coverage)
- Browser compatibility: Chrome/Edge (File System Access API) + Firefox/Safari (fallback)
- Example file: `examples/mars-colony.ownchart` (29 tasks, 18 KB)

**Rationale for Priority**: File operations moved ahead of dependencies because:
- Critical for usability - users need to save their work
- Enables user testing before adding complex dependency features
- Simpler implementation allows for quicker release
- Logical flow: Timeline → Save/Load → Dependencies → Undo → Export

---

#### Sprint 1.4: Dependencies (Finish-to-Start Only) ✅ COMPLETE

**Duration:** 1.5 weeks
**Status:** ✅ COMPLETE (2026-01-04)

**Features**:
- ✅ Create Finish-to-Start (FS) dependencies
- Two interaction methods:
  - Alt+Drag between tasks (keyboard users)
  - Connection handles on task bars (mouse users)
- Dependency arrows on chart
- Circular dependency prevention
- Auto-adjust dependent task dates (FS logic only)

**Technical Work**:
- Dependency data model (support FS type only for now)
- Graph traversal (topological sort)
- Arrow path calculation algorithm (using Phase 0 POC)
- Date adjustment logic (dependent starts after predecessor ends)
- Connection handle UI components

**Acceptance Criteria**:
- Can create FS dependencies via Alt+Drag
- Can create FS dependencies via connection handles (discoverable)
- Arrows render without overlapping tasks
- Circular deps blocked with clear error message
- Auto-adjustment moves dependent tasks correctly
- Performance: 100 tasks with 50 dependencies at 60fps

**Testing Focus**:
- 50-100 automated test cases for dependency logic
- Complex dependency chains (A→B→C→D)
- Circular detection (A→B→C→A)
- Edge cases (tasks on same day, weekend handling)

---

#### Sprint 1.5: Basic Undo/Redo ✅ COMPLETE

**Status**: ✅ COMPLETE (2025-12-30)

**Features**:
- ✅ Auto-record all changes
- ✅ Undo/Redo (Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y)
- ✅ Undo/Redo buttons in toolbar with disabled states
- ✅ Visual feedback via toast notifications (react-hot-toast)

**Technical Work**:
- ✅ History data structure (Command Pattern with undo/redo stacks)
- ✅ Command pattern for all mutations (15 command types)
- ✅ Undo/redo state management (historySlice with Zustand + Immer)
- ✅ Global keyboard shortcuts (useKeyboardShortcuts hook)
- ✅ UndoRedoButtons component with tooltips

**Acceptance Criteria**:
- ✅ All user actions recorded automatically
- ✅ Undo/redo works for all operations (create, edit, delete, move, dependencies, hierarchy)
- ✅ Keyboard shortcuts work (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y on Windows/Mac)
- ✅ Can undo/redo through 100+ changes without performance issues (<10ms per operation)
- ✅ Memory efficient (100-command stack limit, oldest dropped)
- ✅ Comprehensive integration tests (18 test cases)

**Implementation Details**:
- Command stack limited to 100 operations
- History not persisted across page refresh
- Branching support (new action clears redo stack)
- Toast notifications for all undo/redo actions
- Support for concurrent operations with isUndoing/isRedoing flags

**Deferred to V1.1**:
- Named snapshots
- Timeline visualization of changes
- History persistence to localStorage

---

#### Sprint 1.5.4: Copy/Paste & Multi-Select ✅ COMPLETE (Ahead of Schedule)

**Status**: ✅ COMPLETE (2026-01-05) - Originally planned for Phase 1.5 (V1.1)

**Note**: This sprint was completed ahead of schedule during MVP development instead of being deferred to V1.1.

**Features Implemented**:
- ✅ Multi-select tasks (Ctrl+Click, Shift+Click, Ctrl+A)
- ✅ Rectangular marquee selection in timeline (drag to select multiple tasks)
- ✅ Copy/paste tasks (Ctrl+C, Ctrl+V) with dependencies preserved
- ✅ Cut/paste tasks (Ctrl+X, Ctrl+V) with source deletion
- ✅ Cross-tab copy/paste via system clipboard
- ✅ Paste with ID remapping (new UUIDs generated)
- ✅ Placeholder row for quick task creation
- ✅ Delete selected tasks (DEL key, toolbar button)
- ✅ Insert task above/below (toolbar buttons)
- ✅ Multi-task dragging in timeline (drag moves all selected)
- ✅ Summary task dragging (moves all children automatically)
- ✅ Bulk operations with single undo/redo

**Technical Work**:
- ✅ clipboardSlice with Zustand + Immer
- ✅ Selection state management (selectedTaskIds)
- ✅ Clipboard operations with dependency remapping
- ✅ Cross-tab persistence via localStorage
- ✅ MULTI_DRAG_TASKS command type for undo/redo
- ✅ getEffectiveTasksToMove hierarchy utility

**Acceptance Criteria**:
- ✅ Can select multiple tasks with keyboard/mouse
- ✅ Copy/paste works with dependencies preserved
- ✅ Bulk delete/move works correctly
- ✅ Keyboard shortcuts work (Ctrl+C/V/X, DEL, Ctrl+A)
- ✅ Cross-tab clipboard works between browser tabs

---

#### Sprint 1.6: PNG Export & Polish ✅ COMPLETE

**Status**: ✅ COMPLETE (2026-01-05)

**Features Implemented**:
- ✅ Export chart to PNG (high resolution with html-to-image)
- ✅ Export options dialog: zoom, columns, grid lines, weekends, background
- ✅ Export settings persisted in project file
- ✅ Help panel with keyboard shortcuts (? key)
- ✅ Welcome tour for first-time users
- ✅ File extension changed to `.ownchart`
- ✅ Auto-fit name column on file open
- ✅ Multi-tab persistence for dependencies and column widths

**Technical Implementation**:
- html-to-image for PNG export (offscreen rendering)
- Export settings stored in `.ownchart` file
- Settings architecture documented for V1.1 user preferences
- Comprehensive bug fixes for localStorage persistence

**Deferred to V1.1**:
- Export customization (colors, fonts, branding)

---

**MVP Milestone**: ✅ COMPLETE (v0.0.11 - 2026-01-05)

Feature-complete for basic Gantt chart creation and editing.

**Success Metrics** (all achieved):
- ✅ User can create a 20-task chart with dependencies in < 5 minutes
- ✅ Charts look professional with zero configuration
- ✅ Save/load works 100% reliably (no data loss)
- ✅ Undo/redo provides safety net for mistakes
- ✅ Dependency creation is discoverable (connection handles)
- ✅ PNG export produces presentation-quality output
- ✅ Performance: 100 tasks at 60fps, 500 tasks at 30fps minimum

**Known Limitations** (intentional for MVP):
- No named snapshots (V1.1)

**Originally Planned for V1.1 but Completed in MVP**:
- ✅ Copy/paste with multi-select (Sprint 1.5.4)
- ✅ Multi-task dragging in timeline
- ✅ Task groups/phases (Sprint 1.1.1)
- ✅ Export options with grid lines/weekends
- ✅ Export settings persistence

---

### Phase 1.5: V1.1 - Deferred Features & Extensibility (4-6 weeks)

**Goal**: Add features deferred from MVP to create a more complete V1.1 release, enable extensibility features.

**Target**: Address "known limitations" from MVP, unlock extensibility system.

**Key Architecture Documents**:
- [SETTINGS_ARCHITECTURE.md](../architecture/SETTINGS_ARCHITECTURE.md) - User Preferences vs Project Settings separation

**Why These Were Deferred**:
These features add significant complexity relative to their value for proving the core concept. By shipping MVP first, we can validate the product before investing in these enhancements.

#### Sprint 1.5.2: Advanced Dependencies (SS/FF/SF) ✅ COMPLETE

**Status**: ✅ Completed (2026-04-07) — Released as v1.6.0

**Delivered** (4 packages):
1. Arrow path routing & visual differentiation for all 4 types
2. Dependency Properties Panel (type selector + lag input)
3. Handle-based type inference (drag from start/end handles)
4. Opt-in auto-scheduling with topological cascade propagation

**Also delivered** (beyond original scope):
- Always-enforce dependency constraints with Alt+drag modifier
- Auto-calculated lag on dependency creation
- Bidirectional cascade (snap-back for successor drags)
- Working-days-aware constraint enforcement
- Bug fix: calendar duration preservation during drag snap-back
- 43 E2E tests (dependency scheduling, persistence round-trip, SVG export)
- Shared test helper extraction (fixtures/dependency-helpers.ts)

**Concept doc**: [SPRINT_1.5.2_ADVANCED_DEPENDENCIES_CONCEPT.md](../sprints/SPRINT_1.5.2_ADVANCED_DEPENDENCIES_CONCEPT.md)

---

#### Sprint 1.5.3: Task Groups & Phases ✅ MOVED TO MVP

**Status**: ✅ Completed in MVP Phase (Sprint 1.1.1)

This sprint was completed ahead of schedule during MVP development. See Sprint 1.1.1 for implementation details.

**Features Completed**:
- ✅ Create task groups/phases with `type: 'summary'`
- ✅ Nest tasks within groups (3 levels deep)
- ✅ Collapse/expand groups
- ✅ Summary bars with auto-calculated dates
- ✅ Drag-drop with INTO/BEFORE/AFTER zones

---

#### Sprint 1.5.4: Copy/Paste & Multi-Select ✅ MOVED TO MVP

**Status**: ✅ Completed in MVP Phase (Sprint 1.5.4 above)

This sprint was completed ahead of schedule during MVP development. See Sprint 1.5.4 in Phase 1 for implementation details.

**Features Completed**:
- ✅ Multi-select tasks (Ctrl+Click, Shift+Click)
- ✅ Rectangular marquee selection in timeline
- ✅ Copy/paste/cut with dependencies preserved
- ✅ Cross-tab clipboard support
- ✅ Bulk operations (delete, move, drag)
- ✅ Insert task above/below

---

#### Sprint 1.5.5: PDF/SVG Export ✅ COMPLETE

**Status**: ✅ COMPLETE (2026-01-10)

**Features Implemented**:
- ✅ PDF Export with vector graphics (single page, scales for large prints)
- ✅ SVG Export for editable vector output
- ✅ Page size selection (A4, A3, Letter, Legal, Tabloid)
- ✅ Orientation (Landscape/Portrait) and margin presets (Normal/Narrow/Wide/None)
- ✅ Scale modes (Fit to page, Custom zoom %)
- ✅ Unified export dialog with teal accent color
- ✅ Chart settings persistence in localStorage
- ✅ Inter and Inter-Italic fonts embedded for proper PDF rendering
- ✅ Shared export utilities for PNG/PDF/SVG consistency

**Technical Implementation**:
- svg2pdf.js + jsPDF for PDF export (vector rendering)
- Native SVG elements for SVG export
- Shared layout calculations across all export formats
- Font embedding with Base64 font data
- 834 unit tests passing (80%+ coverage)

**Acceptance Criteria** (all met):
- ✅ PDF export works with vector graphics (no rasterization)
- ✅ SVG export produces clean, editable vectors
- ✅ Export settings work (A4/A3/Letter, portrait/landscape)
- ✅ All text is searchable/selectable in PDF
- ✅ Export completes in < 5 seconds for 100 tasks

**Note**: Multi-page PDF not implemented - single page vector PDF scales perfectly for large format printing (A4 → A0)

---

#### Sprint 1.5.6: Named Snapshots

**Features**:
- Create named snapshots
- Snapshot list panel
- Restore from snapshot
- Delete snapshots
- Compare snapshots (diff view)

**Technical Work**:
- Snapshot storage (separate from undo history)
- Snapshot list UI component
- State restoration logic
- Diff algorithm for comparison

**Acceptance Criteria**:
- Can create snapshots with custom names
- Snapshot list shows all saved snapshots
- Restore works without losing current state
- Comparison shows differences clearly

---

#### Sprint 1.5.7: Custom Fields UI

**Features**:
- Custom field definition manager
- Create/edit/delete custom field definitions
- Display custom fields in task editor
- Filter and group by custom fields

**Technical Work**:
- Custom field manager UI
- Field type renderers (text, number, dropdown, etc.)
- Validation for custom field values
- Persistence in file format

**Acceptance Criteria**:
- Can create custom fields of all supported types
- Custom fields appear in task editor
- Values validate correctly
- Custom fields save/load with files

**Note**: Data model already supports this (MVP Phase 1), just adding UI

---

#### Sprint 1.5.8: Multi-Project Management

**Features**:
- Project list view
- Project switcher in toolbar
- Recent projects menu
- Project metadata editing

**Technical Work**:
- Multi-project storage in IndexedDB
- Project switcher component
- Project metadata management
- Auto-save per project

**Acceptance Criteria**:
- Can switch between multiple projects
- Recent projects accessible
- Each project auto-saves independently
- Project list shows thumbnails and metadata

**Note**: Data model already supports this (MVP Phase 1), just adding UI

---

#### Sprint 1.5.9: User Preferences & Settings Dialog ✅ COMPLETE

**Status**: ✅ COMPLETE (2026-01-06) - All features implemented

**Features Implemented**:
- ✅ Preferences dialog (Menu → Preferences...)
- ✅ Date format selection (DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD)
- ✅ First day of week (Sunday/Monday)
- ✅ Week numbering system (ISO/US)
- ✅ UI density (Compact/Normal/Comfortable) - completed in Sprint 1.5.9.1
- ✅ Chart Settings Dialog (gear icon in toolbar)
- ✅ Holiday Service with date-holidays library (199 countries)
- ✅ Holiday region selection (project-specific)
- ✅ Holiday highlighting in timeline with tooltips
- ✅ Task Label Position (before/inside/after/none)
- ✅ Show/Hide toggles: Today Marker, Weekends, Holidays, Dependencies, Progress
- ✅ Keyboard shortcuts for view toggles (T, D, P, H)
- ✅ Dependencies toggle button in toolbar (FlowArrow icon)
- ✅ Timeline header improvements: Calendar week visible at all zoom levels
- ✅ Working Days Mode (workingDaysCalculator, duration editing, task drag)
- 🔜 Theme selection (Light/Dark/System) - V2.0

**Technical Work Completed**:
- ✅ `userPreferencesSlice.ts` with Zustand persist middleware
- ✅ `holidayService.ts` singleton with caching
- ✅ `ChartSettingsDialog.tsx` component
- ✅ `PreferencesDialog.tsx` extended with regional settings
- ✅ View settings in chartSlice (showHolidays, showDependencies, etc.)
- ✅ Timeline header scale improvements for week display
- ✅ `workingDaysCalculator.ts` utility (208 lines)
- ✅ Working Days Mode in Cell.tsx (duration editing)
- ✅ Working Days Mode in useTaskBarInteraction.ts (task drag)
- ✅ Comprehensive test coverage (120+ new tests)

**Acceptance Criteria** (all met):
- ✅ Preferences persist across browser sessions (localStorage)
- ✅ Date format applies to all date displays
- ✅ UI density affects row heights, font sizes, spacing
- ✅ Holiday highlighting works with regional selection
- ✅ View toggles work via toolbar and keyboard shortcuts
- ✅ Working Days Mode functional (duration editing, task drag)
- 🔜 Theme applies immediately without reload (V2.0)

**Architecture Reference**: See [SETTINGS_ARCHITECTURE.md](../architecture/SETTINGS_ARCHITECTURE.md) for:
- Two-tier storage model (User Prefs vs Project Settings)
- No override logic needed - clear separation
- Implementation guide with code examples
- User persona validation

**Test Coverage**: 786 unit tests total (Sprint 1.5.9 + 1.5.9.1 + 1.5.9.2)

---

#### Sprint 1.5.9.1: UI Density (Compact/Normal/Comfortable) ✅ COMPLETE

**Status**: ✅ COMPLETE (2026-01-06) - Implemented ahead of schedule

**Features Implemented**:
- ✅ Three UI density modes: Compact (28px), Normal (36px), Comfortable (44px)
- ✅ Preferences dialog with density selection (gear icon in toolbar)
- ✅ All density-related values in `DENSITY_CONFIG` object
- ✅ CSS custom properties for density values
- ✅ Density affects: row heights, task bar heights, font sizes, padding, spacing
- ✅ Export density selection independent from app preference
- ✅ Density-aware dependency arrows (scaled corner radius)

**Technical Implementation**:
- `userPreferencesSlice.ts` with Zustand persist middleware
- `DENSITY_CONFIG` in `preferences.types.ts` with all values per mode
- `useDensityConfig()` hook for components
- `densityOverride` prop pattern for export
- CSS classes: `.density-compact`, `.density-comfortable` (normal is default)

**Acceptance Criteria** (all met):
- ✅ Three density modes working correctly
- ✅ Preferences persist across browser sessions
- ✅ UI updates immediately without reload
- ✅ Export can use different density than app preference
- ✅ Dependency arrows scale correctly with density

---

#### Sprint 1.5.9.2: Infinite Scroll & Zoom Anchoring ✅ COMPLETE

**Status**: ✅ COMPLETE (2026-01-08)

**Features Implemented**:
- ✅ Infinite Scroll for timeline (auto-extends 30 days when near edge)
- ✅ Smooth left-scrolling (scroll position maintained during date range extension)
- ✅ Zoom Anchoring - cursor-centered zoom for Ctrl+Wheel
- ✅ Zoom Anchoring - viewport-centered zoom for keyboard (Ctrl++/-) and toolbar
- ✅ Dependency arrows no longer animate during scroll
- ✅ ZoomAnchor interface with anchorDate and anchorPixelOffset
- ✅ Exported getViewportCenterAnchor and applyScrollLeft helpers

**Technical Implementation**:
- `chartSlice.ts`: `setZoom`, `zoomIn`, `zoomOut`, `resetZoom` now accept `ZoomAnchor` parameter and return `ZoomResult` with `newScrollLeft`
- `useZoom.ts`: Cursor-centered wheel zoom, viewport-centered keyboard zoom
- `GanttLayout.tsx`: Infinite scroll with 500px threshold, scroll position correction
- All zoom UI components updated (AppToolbar, ZoomToolbar, ZoomControls)

**Acceptance Criteria** (all met):
- ✅ Timeline extends automatically when scrolling near edges
- ✅ Scroll position stays stable during zoom (date under cursor/center stays fixed)
- ✅ Dependency arrows don't flash/animate during scroll
- ✅ All zoom methods (wheel, keyboard, toolbar) maintain stable anchor point
- ✅ 786 unit tests passing

---

**V1.1 Milestone**: Complete feature set for professional project planning, extensibility unlocked.

**Success Metrics**:
- All deferred features working reliably
- Performance maintained with added features
- Custom fields system functional
- Multi-project management working
- User satisfaction > 85%
- At least one community plugin created (validates plugin API)

---

### Phase 2: Beta (Polish & Enhancement)

**Goal**: Refine UX, add important features, prepare for public beta release.

**Target**: Production-ready quality

#### Sprint 2.1: Additional Export Formats ✅ COMPLETE

**Status**: ✅ COMPLETE — Delivered in Sprint 1.5.5 (v0.0.22) and polished through v1.4.0.

PDF/SVG export, export settings dialog with live preview, page size/orientation/margin presets, logo support, and warnings all shipped.

---

#### Sprint 2.2: Named Snapshots

**Features**:
- Create named snapshots
- Snapshot markers on timeline
- Restore from snapshots
- Snapshot management

**Technical Work**:
- Snapshot data model
- Snapshot UI components
- State restoration logic

---

#### Sprint 2.3: Advanced Customization ✅ MOSTLY COMPLETE

**Status**: Most features delivered in Sprints 1.5.9–1.5.9.2 and v0.0.31.

- ✅ Individual task colors (v0.0.31 — 5 color modes: Manual, By Type, By Progress, By Duration, Random)
- ✅ View mode switching (Day/Week/Month zoom levels)
- ✅ Show/hide weekends, holidays, dependencies, progress, today marker
- ✅ Settings panel (Preferences dialog + Chart Settings dialog)
- ✅ Color picker integration
- 🔜 Color themes (Light/Dark/System) — deferred to V2.0

---

#### Sprint 2.4: Milestones ✅ COMPLETE

**Status**: ✅ COMPLETE — Delivered in Sprint 1.1.1 (v0.0.3). Milestone type with diamond rendering, date editing (v1.2.5 fixed sync), and label display all working.

---

#### Sprint 2.5: Auto-Save & Recovery

**Features**:
- Auto-save to browser storage
- Recovery prompt on reload
- Storage quota management

**Technical Work**:
- IndexedDB setup
- Auto-save service
- Recovery UI
- Quota monitoring

---

#### Sprint 2.6: Quality & Testing ✅ SUBSTANTIALLY COMPLETE

**Status**: ✅ Substantially complete through v1.2.0–v1.4.0 code review campaign.

- ✅ Unit test coverage > 80%
- ✅ E2E tests for critical paths (Playwright — task CRUD, export, scroll, keyboard shortcuts)
- ✅ Visual regression testing (Docker-based VRT infrastructure)
- ✅ Accessibility improvements (roving-tabindex, ARIA semantics, keyboard navigation)
- ✅ CI hardening (test isolation, warning elimination, audit fixes)
- 🔜 Performance profiling (no major issues reported)
- 🔜 User documentation (help panel exists, external docs TBD)

---

**Beta Milestone**: Most planned features are already implemented, tested, and polished. Remaining items: named snapshots, auto-save/recovery, and external documentation.

**Success Metrics**:
- ✅ Zero critical bugs
- ✅ Performance targets met
- ✅ Accessibility improvements applied
- 🔜 Positive beta user feedback (pending broader testing)

---

### Phase 3: V1.0 (Public Release) ✅ COMPLETE

**Status**: ✅ COMPLETE — Application is live at [ownchart.app](https://ownchart.app) since early 2026.

**Completed**:
- ✅ Production deployment (GitHub Pages)
- ✅ Custom domain (ownchart.app)
- ✅ CI/CD pipeline (GitHub Actions — auto-deploy on push)
- ✅ User onboarding (welcome tour for first-time users)
- ✅ Help system (? key, searchable help panel)

**Still TBD**:
- 🔜 Landing page improvements
- 🔜 Analytics setup (privacy-respecting)
- 🔜 Feedback collection mechanism

---

### Phase 4: V1.x (Iterative Improvements)

**Goal**: Enhance based on real user feedback, leverage extensibility system.

**Potential Features**:
- Templates (pre-built chart styles)
- ~~Bulk operations (multi-select actions)~~ → ✅ COMPLETE (Sprint 1.5.4)
- Search/filter tasks
- ~~Task groups/phases~~ → ✅ COMPLETE (Sprint 1.1.1)
- Critical path highlighting
- Advanced dependency types (SS, FF, SF)
- ~~Progress tracking enhancements~~ → ✅ COMPLETE (color mode by progress, progress drag)
- Print optimization
- ~~More export customization~~ → ✅ COMPLETE (v1.4.0 — logo, columns, warnings)
- Internationalization (i18n)
- **CSV Import/Export Adapter**
- **MS Project XML Import Adapter**
- **Alternative Views** (List view, Calendar view)
- **Plugin Marketplace** (community plugins)
- **Synced Copies** (tasks and task groups)
  - Create linked copies where changes to one affect all
  - Bidirectional sync (no "original" concept)
  - Inheritance: synced groups automatically sync children
  - Decouple options: single, recursive, or dissolve group
- **Vacation/Absence Management** (V1.2+) ⭐ NEW
  - Team vacations and absences in project file
  - Vacations treated like holidays for Working Days calculation
  - Timeline highlighting for vacation periods
  - Vacation management panel (add/edit/delete)
  - Integration with Working Days Mode
  - Reference: Data model prepared in Sprint 1.5.9
  - See: `docs/sprints/SPRINT_1.5.9_USER_PREFERENCES_SETTINGS_CONCEPT.md` Section 2.7
- Mobile viewing mode (read-only)
  - Responsive layout for tablets (768px+) and phones (375px+)
  - View-only mode (no editing on mobile)
  - Touch-optimized navigation (pinch-to-zoom, swipe to pan)
  - Simplified UI for small screens
  - Export to PDF/PNG from mobile
  - Share chart links for mobile viewing

**Prioritization**: Based on user demand and feedback

**Mobile Viewing Notes**:
While editing is desktop-focused, a view-only mobile mode could be added if there is user demand for stakeholders and clients to view charts on mobile devices.

**Mobile Viewing Scope** (V1.x):
- **Target devices**: Tablets (iPad, Android tablets), large phones (iPhone, Android)
- **Minimum width**: 375px (iPhone SE)
- **Features**:
  - Pinch-to-zoom timeline
  - Swipe to pan horizontally/vertically
  - Tap tasks to view details (modal)
  - Simplified toolbar (export, zoom controls only)
  - Collapsible task list for more chart space
  - Optimized touch targets (44×44px minimum)
- **Not included**: Task editing, dependency creation, file management (desktop only)

**Implementation Notes**:
- Use CSS media queries: `@media (max-width: 1280px)`
- Detect touch: `'ontouchstart' in window`
- Prevent accidental edits: Disable drag-and-drop on touch devices
- Alternative: Show "Open on desktop to edit" message

---

### Phase 5: V2.0 (Major Enhancements)

**Goal**: Add significant new capabilities, full platform features.

**Potential Features**:
- **Real-time collaboration** (with optional cloud backend)
- **Resource management** (workload, leveling, utilization)
- Read-only sharing links
- Chart templates marketplace
- **Advanced charting** (Resource view, Kanban board, Calendar view)
- Mobile editing (full responsiveness with touch-based task editing)
  - Note: Mobile viewing (read-only) is in V1.x; V2.0 adds full editing capability
- Offline PWA
- **Full format adapter suite** (MS Project MPP, Primavera P6, Excel)
- **Integration APIs & Webhooks**
- **Advanced plugin system** (UI extensions, custom renderers)

**Note**: V2.0 scope TBD based on V1.0 learnings

---

## 3. Development Principles

### 3.1 Quality Standards

1. **Code Quality**:
   - TypeScript strict mode
   - ESLint + Prettier
   - Code reviews required
   - Test coverage > 80%

2. **Performance**:
   - Initial load < 2s
   - Interactions at 60fps
   - Memory leaks prevented
   - Bundle size optimized

3. **Accessibility**:
   - WCAG 2.1 AA compliance
   - Keyboard navigation complete
   - Screen reader tested
   - Color contrast verified

4. **Browser Support**:
   - Chrome/Edge 90+
   - Firefox 88+
   - Safari 14+
   - Test on Windows, Mac, Linux

### 3.2 Development Workflow

```
Feature Branch → Development → Code Review → Testing → Main → Staging → Production
```

1. **Feature Development**:
   - Branch from main
   - Implement feature
   - Write tests
   - Self-test thoroughly

2. **Code Review**:
   - Create pull request
   - Peer review
   - Address feedback
   - Pass CI checks

3. **Testing**:
   - Unit tests pass
   - Integration tests pass
   - E2E tests pass
   - Manual QA

4. **Deployment**:
   - Merge to main
   - Auto-deploy to staging
   - Smoke tests
   - Deploy to production

### 3.3 Release Strategy

**MVP (Phase 1)**:
- Internal testing only
- Friends and family
- Gather initial feedback

**Beta (Phase 2)**:
- Limited public beta
- Invite-only or sign-up list
- Active feedback collection
- Iterate quickly

**V1.0 (Phase 3)**:
- Public launch
- Marketing push
- Support channels open
- Stable release cadence

**Post-Launch**:
- Regular updates (every 2-4 weeks)
- Bug fix releases as needed
- Feature releases quarterly
- Major versions annually

---

## 4. Risk Management

### 4.1 Technical Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Browser performance limits | High | Optimize early, use Canvas fallback |
| File format compatibility issues | Medium | Versioning system, migrations |
| Third-party library issues | Medium | Minimize dependencies, have alternatives |
| Browser API changes | Low | Use stable APIs, monitor changes |

### 4.2 Scope Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Feature creep | High | Strict MVP definition, defer to v2 |
| Underestimated complexity | Medium | Buffer time, iterative approach |
| Changing requirements | Medium | Regular stakeholder communication |

### 4.3 Mitigation Strategies

1. **Regular Reviews**: Check progress against roadmap weekly
2. **Feedback Loops**: Test with real users early and often
3. **Flexibility**: Ready to adjust scope based on learnings
4. **Documentation**: Keep decisions documented
5. **Rollback Plan**: Can revert to previous version if issues

---

## 5. Dependencies & Prerequisites

### 5.1 Before Starting Development

- ✓ Concept documentation complete
- ✓ Technical decisions finalized
- Development environment set up
- Design mockups/wireframes ready
- Team/developer assigned

### 5.2 External Dependencies

| Dependency | Purpose | Alternative |
|------------|---------|-------------|
| React | UI framework | Vue, Svelte |
| D3.js | Date/scale utilities | date-fns only |
| html2canvas | PNG export | Manual canvas |
| jsPDF | PDF export | PDFKit |
| Radix UI | Component primitives | Headless UI |
| Tailwind CSS | Styling | CSS-in-JS |

### 5.3 Critical Path

Must complete in order:
1. Foundation → MVP Sprint 1.1
2. Sprint 1.1 → Sprint 1.2
3. Sprint 1.4 (File Ops) → Beta
4. Beta Sprints → V1.0

Can parallelize:
- UI polish and features (different components)
- Testing and bug fixes
- Documentation

---

## 6. Success Metrics

### 6.1 MVP Success

- ✓ Core features work reliably
- ✓ 5 users can create charts successfully
- ✓ No data loss scenarios
- ✓ Positive feedback on concept

### 6.2 Beta Success

- ✓ 50+ beta testers
- ✓ < 5 critical bugs per week
- ✓ 80%+ user satisfaction
- ✓ Performance targets met

### 6.3 V1.0 Success

- ✓ Public launch completed
- ✓ 1000+ charts created in first month
- ✓ 90%+ user satisfaction
- ✓ < 1% critical bug rate

### 6.4 Ongoing Success

- Active user growth
- Low bug report rate
- Positive reviews/feedback
- Feature requests aligned with vision

---

## 7. Timeline Estimate (v1.4 - Realistic)

**Note**: These are realistic estimates based on professional review. Includes buffer for integration, testing, and unexpected issues.

**Key Changes from v1.3**:
- Added Phase 0 risk validation (2-3 weeks)
- Reduced MVP from 12-14 weeks to 6-8 weeks (simplified scope)
- Added Phase 1.5 (V1.1) for deferred features (4-6 weeks)
- Increased buffer times for integration and testing
- More realistic Beta phase duration

### Single Developer (Part-time, 20 hrs/week)

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Foundation & Risk Validation | 2-3 weeks | 3 weeks |
| Phase 1: MVP (Simplified) | 6-8 weeks | 11 weeks |
| Integration & Testing Buffer | 1-2 weeks | 13 weeks |
| Phase 1.5: V1.1 Deferred Features | 4-6 weeks | 19 weeks |
| Phase 2: Beta (Polish) | 3-4 weeks | 23 weeks |
| Phase 3: V1.0 Launch Prep | 1-2 weeks | 25 weeks |
| **Total to V1.0** | **~6 months** | |

### Small Team (2-3 developers, full-time)

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Phase 0: Foundation & Risk Validation | 1-2 weeks | 2 weeks |
| Phase 1: MVP (Simplified) | 3-4 weeks | 6 weeks |
| Integration & Testing Buffer | 1 week | 7 weeks |
| Phase 1.5: V1.1 Deferred Features | 2-3 weeks | 10 weeks |
| Phase 2: Beta (Polish) | 2 weeks | 12 weeks |
| Phase 3: V1.0 Launch Prep | 1 week | 13 weeks |
| **Total to V1.0** | **~3 months** | |

### Early Launch Option (MVP Only)

For faster validation, launch Phase 1 (MVP) as V0.9 beta:

**Single Developer**: 13 weeks (~3 months)
**Small Team**: 7 weeks (~1.5 months)

Then gather feedback before committing to V1.1 features.

### Assumptions

- Experienced with React/TypeScript
- Part-time: 20 hours/week (evenings/weekends)
- Full-time: 40 hours/week
- Includes testing and bug fixes (not separate QA phase)
- Includes integration buffer time
- Does not include design time (wireframes/mockups)
- Does not include marketing/content creation
- Phase 0 validation successful (no major pivots needed)

---

## 8. Post-Launch Roadmap

### V1.1 (Bug Fixes & Quick Wins)

- Address launch issues
- Quick UX improvements
- Performance optimizations
- Most-requested small features

### V1.2-1.5 (Feature Additions)

- Templates
- Enhanced customization
- Search/filter
- Additional export options
- Accessibility improvements

### V2.0 (Major Release)

- Collaboration features
- Mobile support
- Advanced views
- API/integrations

---

## 9. Go/No-Go Checklist

### MVP Go-Live Criteria ✅ ALL MET

- [x] All MVP features implemented
- [x] Core workflows tested
- [x] No critical bugs
- [x] Performance acceptable
- [x] File save/load works reliably
- [x] Documentation complete

### Beta Go-Live Criteria ✅ SUBSTANTIALLY MET

- [x] All Beta features implemented (most — snapshots & auto-save remaining)
- [x] Comprehensive testing complete (unit 80%+, E2E, VRT)
- [x] Bug count < threshold
- [x] Performance targets met
- [x] Accessibility tested (improved in v1.2.0 review campaign)
- [ ] Beta signup/feedback system ready

### V1.0 Launch Criteria ✅ LAUNCHED

- [x] Zero critical bugs
- [x] All planned features working
- [x] Performance excellent
- [x] Accessibility compliance verified (partial — improved in v1.2.0)
- [x] Documentation complete (in-app help panel)
- [ ] Support system ready
- [ ] Analytics/monitoring in place
- [ ] Positive beta feedback

---

## 10. Next Steps

### Immediate Actions

1. **Review & Approve**: Stakeholders review all concept docs
2. **Finalize Decisions**: Resolve any open questions
3. **Set Up Project**: Initialize repository, configure tools
4. **Design Mockups**: Create detailed UI mockups (if not done)
5. **Start Phase 0**: Begin foundation work

### Questions to Resolve

From PRD Section 10 (Open Questions):
1. File format: Support import from other formats?
2. Export settings: What customization options?
3. Collaboration: Read-only sharing in MVP or later?
4. Templates: Include sample templates?
5. Localization: Multi-language support priority?
6. Auto-backup: Frequency and management?

### Communication Plan

- Weekly progress updates
- Demo after each sprint
- Monthly stakeholder review
- Beta user feedback sessions
- Public launch communications

---

## 11. Appendix: Sprint Details Template

**Sprint Planning Template**:

```markdown
## Sprint X.Y: [Sprint Name]

**Goal**: [What we're trying to achieve]

**Duration**: [Estimated time]

### Features
- Feature 1
- Feature 2

### Technical Tasks
- Task 1
- Task 2

### Testing
- Test scenario 1
- Test scenario 2

### Success Criteria
- [ ] Criterion 1
- [ ] Criterion 2

### Demo
- What to demonstrate
- Key interactions to show

### Known Risks
- Risk 1: [Mitigation]
- Risk 2: [Mitigation]
```

---

## 12. Summary

This roadmap provides a clear path from concept to launch:

1. **Phase 0**: Set up infrastructure ✅
2. **Phase 1**: Build MVP (core functionality) ✅
3. **Phase 1.5**: V1.1 deferred features ✅ (mostly complete — snapshots, custom fields, multi-project remain)
4. **Phase 2**: Polish for beta (enhanced features) ✅ (mostly complete)
5. **Phase 3**: Launch V1.0 (production release) ✅ Live at ownchart.app
6. **Phase 4+**: Iterate based on feedback — current phase

**Key Principles**:
- Start simple, add complexity gradually
- Ship early, get feedback
- Maintain high quality
- Stay focused on user value

**Success depends on**:
- Clear scope
- Regular testing
- User feedback
- Quality focus
- Realistic timeline

---

**Document Version**: 2.4
**Last Updated**: 2026-03-22
**Status**: ✅ v1.4.0 — Code Review Complete, Export Polish, E2E Testing Expanded
**Next Phase**: V1.1 - Remaining Deferred Features (Named Snapshots, Custom Fields, Multi-Project)

**Recent Updates (v2.4)** - v1.0.2 to v1.4.0 (2026-02-27 → 2026-03-22, 784 commits):

- **v1.4.0** (2026-03-22) - Export Polish & Logo Support:
  - Project logo support for PDF export
  - PDF is now the default export format
  - Export dialog shows warnings for missing title or logo
  - Improved export default settings for better out-of-the-box results
  - Consolidated default export columns to single source of truth
  - Reduced excessive whitespace in PDF export header/footer
  - Comprehensive E2E tests for PNG, PDF, and SVG export
- **v1.3.0** (2026-03-18) - Task Type UX & Bug Fixes:
  - Alternative ways to change task type (#74) — context menu, keyboard shortcuts
  - New task placement uses latest endDate, not last array position (#77)
  - Scroll position restored on file open and browser reload (#76)
  - HiDPI/4K grid line sharpening (#64)
  - Milestone date editing fixed — syncs both dates (#68)
  - Hidden rows excluded from PNG/PDF/SVG exports
  - Prevented task insertion from reordering siblings
- **v1.2.0** (2026-03-08) - Code Quality & Infrastructure Milestone:
  - **Systematic code review** of entire codebase (~587 review commits):
    - All components, hooks, utils, export code reviewed
    - Accessibility improvements (roving-tabindex, ARIA, semantic HTML)
    - Type safety hardening (branded types, stricter generics)
    - Error handling improvements (forwarding original errors as `cause`)
    - JSDoc documentation added across codebase
  - **Unified color system** — Tailwind Slate scale (#56) with `colors.js` as single source of truth
  - **Design system consolidation** (#66) with visual regression tests
  - **`@/` path alias** adopted project-wide (#63) — all imports use `@/` instead of relative `../`
  - **VRT infrastructure** — Docker-based visual regression testing for CI
  - **E2E test expansion** — Playwright tests for critical user flows (#55), insert/scroll (#78), keyboard shortcuts
  - **CI hardening** — test isolation, eliminated all ci:local warnings (#70), npm audit fixes
  - **ES2022 target** — upgraded from ES2020 in tsconfig and Vite
  - Performance: memo-wrapped InsertRowButton and HelpTabContent

**Previous Updates (v2.3)** - v0.0.23 to v0.0.33:
- **v0.0.33** (2026-01-30) - UI Polish & Bug Fixes
- **v0.0.31** (2026-01-15) - Smart Color Management (5 color modes)
- **v0.0.28** (2026-01-15) - Export Dialog Redesign (Figma-style with live preview)
- **v0.0.24** (2026-01-12) - MS Office-style Ribbon UI

**Previous Updates (v2.2)** - v0.0.22:
- **v0.0.22** (2026-01-10) - Sprint 1.5.5 Complete (PDF/SVG export)

(See git history for full changelog of earlier versions)
