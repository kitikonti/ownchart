# Gantt Chart Application

A browser-based, offline-first Gantt Chart application for project planning and visualization. Built with React, TypeScript, and modern web technologies.

## Features

- **Offline-First**: Works entirely in your browser, no backend required
- **Task Management**: Create, edit, and organize project tasks
- **Visual Timeline**: Interactive Gantt chart with drag-and-drop
- **Dependencies**: Link tasks with finish-to-start relationships
- **File Operations**: Save/load charts with robust validation and security
- **History**: Full undo/redo with time-travel capability
- **Export**: Save as PNG, PDF, or SVG
- **Accessible**: WCAG 2.1 AA compliant with keyboard navigation
- **Extensible**: Plugin system for custom functionality

## Technology Stack

- **React 18+** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Zustand** - Lightweight state management
- **TailwindCSS** - Utility-first styling
- **D3.js** - SVG rendering for timeline
- **Vitest** - Unit and integration testing
- **Playwright** - End-to-end testing

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 10.x or higher

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm run preview          # Preview production build

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format code with Prettier
npm run format:check     # Check code formatting
npm run type-check       # Run TypeScript type checking

# Testing
npm run test             # Run tests in watch mode
npm run test:unit        # Run unit tests with coverage
npm run test:integration # Run integration tests
npm run test:e2e         # Run end-to-end tests
npm run test:e2e:ui      # Run E2E tests with UI

# All Checks (run before committing)
npm run ci:local         # Run all quality checks
```

### Project Structure

```
app-gantt/
├── .github/
│   └── workflows/       # CI/CD pipelines
├── src/
│   ├── components/      # React components
│   ├── store/          # State management (Zustand)
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript definitions
│   ├── hooks/          # Custom React hooks
│   ├── plugins/        # Plugin system
│   ├── App.tsx         # Root component
│   └── main.tsx        # Entry point
├── tests/
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/            # End-to-end tests
├── concept/            # Design documentation
└── public/             # Static assets
```

## Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write code following the style guide
   - Add tests for new functionality
   - Update documentation if needed

3. **Run quality checks**
   ```bash
   npm run ci:local
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

### Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code formatting (not CSS)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Tooling, dependencies, config

## Testing

### Test Coverage Requirements

- Overall coverage: ≥80%
- Critical modules: 100%
- All new features must include tests

### Running Tests

```bash
# Unit tests (fast, run frequently)
npm run test:unit

# Integration tests (moderate speed)
npm run test:integration

# E2E tests (slow, run before commits)
npm run test:e2e
```

## CI/CD

### Continuous Integration

Every push and PR triggers automated checks:

1. Linting (ESLint)
2. Formatting (Prettier)
3. Type checking (TypeScript)
4. Unit tests with coverage
5. Integration tests
6. E2E tests (Chrome, Firefox, Safari)
7. Production build verification
8. Security audit

All checks must pass before merging.

### Deployment

- **Automatic**: Push to `main` branch
- **Target**: GitHub Pages
- **Duration**: ~5 minutes
- **URL**: Will be configured after first deployment

## Code Style

### TypeScript

- Use strict mode (no `any` types)
- Explicit return types for functions
- Prefer interfaces over types for objects
- Use descriptive variable names

### React

- Functional components with hooks
- Named exports (not default)
- Props interface for every component
- Keep components under 200 lines

### Styling

- Use TailwindCSS utility classes
- Mobile-first responsive design
- Follow design tokens for consistency
- No inline styles

## Documentation

Comprehensive documentation is available in the `/concept` folder:

**Planning:**
- [Product Requirements](./concept/planning/PRD.md)
- [Roadmap](./concept/planning/ROADMAP.md)
- [User Stories](./concept/planning/USER_STORIES.md)
- [Feature Specifications](./concept/planning/FEATURE_SPECIFICATIONS.md)

**Architecture:**
- [Technical Architecture](./concept/architecture/TECHNICAL_ARCHITECTURE.md)
- [Data Model](./concept/architecture/DATA_MODEL.md)
- [Extensibility Architecture](./concept/architecture/EXTENSIBILITY_ARCHITECTURE.md)

**Design:**
- [UI/UX Specifications](./concept/design/UI_UX_SPECIFICATIONS.md)
- [Icon System](./concept/design/ICON_SYSTEM.md)
- [Competitive Analysis](./concept/design/COMPETITIVE_ANALYSIS.md) - Analysis of SVAR React Gantt

**Process:**
- [Testing Strategy](./concept/process/TESTING_STRATEGY.md)
- [CI/CD Pipeline](./concept/process/CI_CD.md)

**Sprints:**
- [Sprint 1.2 - Timeline Visualization](./concept/sprints/SPRINT_1.2_TIMELINE_VISUALIZATION.md)

## Phase 0: Foundation

**Status**: ✅ Complete (v0.1.0)

Phase 0 establishes the project foundation:

- ✅ Project initialization
- ✅ Build tools configured
- ✅ Code quality tools set up
- ✅ Testing infrastructure ready
- ✅ CI/CD pipeline active
- ✅ Documentation complete

**Next**: Phase 1 - MVP Development

## Recent Updates (December 2025)

### Sprint 1.2 Package 1 - Core Foundation ✅ COMPLETE

**Implemented Features** (2025-12-28):
- ✅ **Interactive Timeline**: SVG-based Gantt chart visualization
- ✅ **Sticky Headers**: Toolbar, table header, and timeline header stay visible
- ✅ **Synchronized Scrolling**: Table and timeline scroll together
- ✅ **Auto-Resize**: Timeline adapts to window size changes
- ✅ **Multi-Level Timeline**: Month + Day scale system (SVAR-inspired)
- ✅ **Weekend Highlighting**: Visual distinction for Sat/Sun
- ✅ **Today Marker**: Red line indicating current date
- ✅ **Task Types**: Visual rendering for tasks, summaries, milestones
- ✅ **Progress Bars**: Visual progress indication on task bars
- ✅ **Grid System**: Adaptive grid with proper alignment

**New Components**:
- `ChartCanvas` - Main timeline container with ResizeObserver
- `TimelineHeader` - Multi-level date scales
- `GridLines` - Background grid with weekend highlighting
- `TaskBar` - Task rendering with progress visualization
- `TodayMarker` - Current date indicator
- `TaskTableHeader` - Extracted reusable table header

**New Utilities**:
- `dateUtils` - Date calculations using date-fns
- `timelineUtils` - Timeline scale system with zoom support

**State Management**:
- `chartSlice` - Chart state with automatic scale recalculation

**Architecture Highlights**:
- Vertical flex layout with sticky header row
- Common vertical scroll container
- Separate horizontal scroll per panel
- ResizeObserver for responsive timeline

**Next**: Sprint 1.2 Package 2 - Zoom & Interactive Editing

### Sprint 1.5 - Undo/Redo System ✅ COMPLETE

**Implemented Features** (2025-12-30):
- ✅ **Full Undo/Redo**: Complete command pattern implementation
- ✅ **Keyboard Shortcuts**: Ctrl+Z (undo), Ctrl+Shift+Z (redo), Ctrl+Y (redo)
- ✅ **Toolbar Buttons**: Visual undo/redo controls with disabled states
- ✅ **Toast Notifications**: Real-time feedback for all undo/redo operations
- ✅ **Smart Command Recording**: Tracks all task operations automatically
- ✅ **Branching Support**: New actions after undo clear the redo stack

**Supported Operations**:
- Task creation and deletion
- Task updates (name, dates, progress, color, type)
- Task reordering (drag-and-drop)
- Hierarchy changes (indent/outdent, parent changes)
- Type conversion (task ↔ summary ↔ milestone)
- Selection operations
- Collapse/expand states

**Keyboard Shortcuts**:
- **Windows/Linux**:
  - Ctrl+Z - Undo
  - Ctrl+Shift+Z - Redo
  - Ctrl+Y - Redo (alternative)
- **macOS**:
  - Cmd+Z - Undo
  - Cmd+Shift+Z - Redo
  - Cmd+Y - Redo (alternative)

**Technical Details**:
- Command stack limited to 100 operations
- History is not persisted across page refresh
- Operations execute in <10ms on typical datasets (100-500 tasks)
- Memory usage: ~8-10MB worst case for 100 commands with large projects

**Known Limitations**:
- Undo/redo history is cleared on page refresh
- Maximum 100 commands in history (oldest are dropped)
- Keyboard shortcuts disabled while typing in input fields
- No undo grouping (each operation is separate)

**Architecture**:
- Command Pattern with Memento snapshots
- Zustand store for history management
- Immer middleware for immutable state updates
- Type-safe command definitions with TypeScript

**New Components**:
- `UndoRedoButtons` - Toolbar controls with tooltips
- `useKeyboardShortcuts` - Global keyboard event handler

**New State**:
- `historySlice` - Undo/redo stack management

**Files Modified**:
- All task actions now record commands automatically
- Toast notifications integrated via react-hot-toast

**Testing**:
- Comprehensive integration tests for all command types
- Edge case coverage (empty stacks, concurrent operations)
- Performance tests for 100+ sequential operations

**Next**: Sprint 1.4 - Dependencies (Finish-to-Start)

### Sprint 1.2 Package 2 - Interactive Editing ✅ COMPLETE

**Implemented Features** (2025-12-31):
- ✅ **Drag-to-Move**: Drag task bars horizontally to shift dates
- ✅ **Drag-to-Resize**: Resize tasks from left/right edges to change duration
- ✅ **Milestone Dragging**: Milestones can be dragged to change dates with visual preview
- ✅ **Visual Preview**: Solid blue outline shows target position during drag
- ✅ **Snap-to-Grid**: Dates automatically round to nearest day boundary
- ✅ **Cursor Changes**: Visual feedback (grab/grabbing/resize/not-allowed)
- ✅ **Summary Task Locking**: Summary tasks cannot be manually dragged (auto-calculated from children)
- ✅ **Summary Bracket Visualization**: Custom bracket/clamp SVG path for summary tasks
- ✅ **Recursive Cascade**: Parent summary dates update automatically through unlimited hierarchy levels
- ✅ **Undo Integration**: All drag operations can be undone with Ctrl+Z
- ✅ **Validation**: Minimum 1-day duration enforced, error toasts for invalid operations

**Interaction Modes**:
- **Drag-to-Move**: Hover over task bar center → cursor changes to grab → click and drag horizontally
- **Drag-to-Resize**: Hover near left or right edge (within 8px) → cursor changes to resize → drag to adjust duration
- **Milestone Drag**: Hover over milestone diamond → cursor changes to grab → drag to move (no resize)
- **Summary Tasks**: Display as bracket/clamp shape with not-allowed cursor → dates calculated from children

**Visual Design**:
- **Regular Tasks**: Rounded rectangles with progress bars
- **Milestones**: Diamond shapes centered on the day
- **Summary Tasks**: Bracket/clamp shape with:
  - Horizontal bar at 30% of row height
  - 60-degree triangular downward tips
  - Rounded top corners (10px radius)
  - Rounded inner corners (3px radius) where tips meet bar
  - Task name displayed to the right of the bracket

**Technical Details**:
- Unified `useTaskBarInteraction` hook handles both drag and resize
- Preview updates at 60fps using requestAnimationFrame
- Edge detection threshold: 8 pixels from left/right edges
- SVG coordinate conversion for accurate positioning
- Snap-to-grid using Math.round for intuitive day-level precision
- Recursive cascade algorithm walks up parent hierarchy to root

**Validation Rules**:
- Minimum task duration: 1 day (regular tasks only)
- Summary tasks cannot be manually dragged
- Milestones can be dragged (duration always 0)
- Invalid operations show error toasts with clear messages

**Undo/Redo Integration**:
- Each drag creates a single undo command
- Summary cascade updates included in same undo entry
- Both child and all ancestor parent updates reversed on undo
- Description indicates when parent was updated: "Updated task 'Design' (and parent)"

**New Components**:
- `useTaskBarInteraction` - Unified drag/resize hook with cursor management
- `dragValidation.ts` - Validation utilities for drag operations
- `MilestoneDiamond` - SVG milestone rendering component
- `SummaryBracket` - SVG summary bracket rendering component

**Files Modified**:
- `TaskBar.tsx` - Integrated hook, added preview rendering, milestone/summary components
- `taskSlice.ts` - Enhanced updateTask with recursive summary cascade logic
- `historySlice.ts` - Updated undo/redo handlers for cascade updates
- `command.types.ts` - Added cascadeUpdates field to UpdateTaskParams
- `timelineUtils.ts` - Added fallback for milestones without endDate
- `dragValidation.ts` - Milestone-specific validation logic
- `dateUtils.ts` - Added filtering for tasks with invalid dates
- `useKeyboardShortcuts.ts` - Fixed case sensitivity for Ctrl+Shift+Z

**Performance**:
- Drag start to first preview: <20ms
- Frame time during drag: <16ms (60fps maintained)
- Tested with 100+ tasks: No jank, smooth interaction
- Recursive cascade handles unlimited nesting levels efficiently

**Testing**:
- Comprehensive manual testing completed (sections A-J)
- Edge cases verified (nested summaries, type conversions, undo/redo)
- Cross-browser tested (Chrome, Firefox)
- Performance verified with 100+ tasks

**Known Limitations**:
- Multi-select drag not yet implemented (planned for future)
- No keyboard alternative for drag (arrow keys planned for Sprint 1.x)
- No visual feedback for dependency constraints (planned for Sprint 1.2 Package 4)
- No formal unit/integration/E2E tests (manual testing only)

### Sprint 1.2 Package 3 - Navigation & Scale ✅ COMPLETE

**Implemented Features** (2026-01-02):
- ✅ **Mouse Wheel Zoom**: Ctrl+Wheel zooms centered on mouse cursor position
- ✅ **Zoom Toolbar**: Zoom in/out buttons, percentage dropdown, Fit All button
- ✅ **Zoom Indicator**: Temporary overlay showing current zoom level (centered in viewport)
- ✅ **Zoom Range**: 10% - 500% with 5% increment steps
- ✅ **Fit-to-View**: Automatically calculates zoom to fit all tasks with 10% padding
- ✅ **Adaptive Grid Lines**: Grid density adapts to zoom level
  - Daily lines at ≥40% zoom
  - Weekly lines at 12-40% zoom (ISO 8601 week boundaries, Monday start)
  - Monthly lines at <12% zoom (month boundaries)
- ✅ **Weekend Highlighting**: Always visible at all zoom levels
- ✅ **SVAR-Style Sticky Scroll Layout**: Horizontal scrollbar always at viewport bottom
- ✅ **Keyboard Shortcuts**: Ctrl+0 (reset), Ctrl++ (zoom in), Ctrl+- (zoom out)

**Technical Architecture**:
- SVAR-inspired sticky scroll layout with pseudo-rows for scroll height
- Virtual scrolling via `translateY` transforms
- Zoom state in Zustand chartSlice (single source of truth)
- CSS transforms for GPU-accelerated zoom rendering
- Adaptive grid line calculation based on effective pixels per day

**New Components**:
- `ZoomToolbar` - Toolbar with zoom controls
- `ZoomIndicator` - Temporary zoom percentage display
- `ZoomControls` - Integrated toolbar component
- `usePanZoom` - Hook for zoom event handling

**Files Modified**:
- `App.tsx` - SVAR-style sticky scroll layout implementation
- `chartSlice.ts` - Zoom state management and fit-to-view calculation
- `ChartCanvas.tsx` - Zoom integration with scale system
- `GridLines.tsx` - Adaptive grid density with ISO 8601 week alignment
- `TimelineHeader.tsx` - Zoom-aware timeline rendering
- `timelineUtils.ts` - Zoom-aware scale calculations

**Performance**:
- Zoom maintains 60fps with 100+ tasks
- Grid line calculation optimized with useMemo
- CSS transforms for hardware-accelerated rendering

**Next**: Sprint 1.4 - Dependencies (Finish-to-Start)

### Sprint 1.3 - File Operations ✅ COMPLETE

**Implemented Features** (2026-01-03):
- ✅ **Save to .gantt Format**: Browser-based file save with File System Access API
- ✅ **Open .gantt Files**: Load charts with comprehensive validation
- ✅ **New Chart**: Create new project with unsaved changes warning
- ✅ **Keyboard Shortcuts**: Ctrl+S (save), Ctrl+Shift+S (save as), Ctrl+O (open), Ctrl+Alt+N (new)
- ✅ **Dirty State Tracking**: Visual indicator when changes are unsaved
- ✅ **Unsaved Changes Warning**: Browser beforeunload prevention
- ✅ **6-Layer Validation Pipeline**: Complete security and data integrity validation
- ✅ **XSS Prevention**: DOMPurify integration for HTML sanitization
- ✅ **Prototype Pollution Protection**: Dangerous keys filtered
- ✅ **Round-Trip Integrity**: All data preserved (tasks, hierarchy, view settings, unknown fields)
- ✅ **Browser Compatibility**: File System Access API (Chrome/Edge) + fallback (Firefox/Safari)

**Security Features**:
- **Layer 1**: Pre-parse validation (file size 50MB limit, extension check)
- **Layer 2**: Safe JSON parsing with prototype pollution prevention
- **Layer 3**: Structure validation (required fields, type checking)
- **Layer 4**: Semantic validation (UUID format, date validation, circular dependency detection)
- **Layer 5**: String sanitization via DOMPurify (XSS prevention)
- **Layer 6**: Version compatibility and migration system

**File Format** (.gantt):
```json
{
  "fileVersion": "1.0.0",
  "appVersion": "0.1.0",
  "chart": {
    "id": "uuid-v4",
    "name": "Chart Name",
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601",
    "tasks": [/* Task objects */],
    "viewSettings": {
      "zoom": 1.0,
      "panOffset": { "x": 0, "y": 0 },
      "showWeekends": true,
      "showTodayMarker": true,
      "taskTableWidth": 400,
      "columnWidths": { /* Column widths */ }
    }
  }
}
```

**New Components**:
- `FileButtons` - New/Open/Save toolbar buttons with dirty state indicator
- `useFileOperations` - React hook for file I/O operations
- `useUnsavedChanges` - Hook for beforeunload warning

**New Utilities** (8 files):
- `fileOperations/validate.ts` - 6-layer validation pipeline (31 tests)
- `fileOperations/sanitize.ts` - XSS/HTML sanitization (23 tests)
- `fileOperations/serialize.ts` - Chart → JSON conversion (25 tests)
- `fileOperations/deserialize.ts` - JSON → Chart conversion (33 tests)
- `fileOperations/fileDialog.ts` - Browser file I/O (File System Access API + fallback)
- `fileOperations/migrate.ts` - Future schema migrations
- `fileOperations/types.ts` - TypeScript interfaces
- `fileOperations/index.ts` - Public API exports

**State Management**:
- `fileSlice` - File state (fileName, isDirty, lastSaved, chartId)

**Modified Files**:
- `taskSlice.ts` - Integrated dirty state tracking, added `setTasks()` action
- `App.tsx` - Added `useUnsavedChanges()` hook
- `AppToolbar.tsx` - Integrated FileButtons component
- `useKeyboardShortcuts.ts` - Added file operation shortcuts (Ctrl+S/O/N)

**Testing**:
- Comprehensive unit tests (112 tests total for file operations)
- Validation: 31 tests (all 6 layers)
- Serialization: 25 tests (round-trip integrity)
- Sanitization: 23 tests (XSS prevention)
- Deserialization: 33 tests (full pipeline)
- Integration: Undo/redo tests updated

**Browser Support**:
| Browser | Save Behavior | Open Behavior |
|---------|---------------|---------------|
| Chrome/Edge | File System Access API (re-save to same file) | Native file picker |
| Firefox/Safari | Download (always new file) | File input dialog |

**Known Limitations**:
- Re-save only works in Chrome/Edge (File System Access API)
- Firefox/Safari trigger download on every save
- History not persisted across sessions
- Maximum file size: 50MB

**Example File**: `examples/website-relaunch.gantt` (27 tasks, 3-level hierarchy, 17 KB)

**Next**: Sprint 1.4 - Dependencies (Finish-to-Start)

## Contributing

1. Fork the repository
2. Create your feature branch
3. Make your changes
4. Ensure all tests pass
5. Submit a pull request

Please read our [contributing guidelines](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Support

- **Issues**: [GitHub Issues](https://github.com/username/gantt-chart-app/issues)
- **Documentation**: See `/concept` folder
- **AI Assistant**: See [claude.md](./claude.md) for AI-specific guidance

## Roadmap

- **Phase 0** (v0.1.0): Foundation ✅
- **Phase 1** (v1.0.0): MVP - Core features
- **Phase 2** (v1.x): Enhanced features
- **Phase 3** (v2.0): Advanced capabilities

See [ROADMAP.md](./concept/docs/ROADMAP.md) for detailed timeline.

---

**Current Version**: 0.0.4 (Pre-release)
**Status**: Phase 1 - MVP (Sprint 1.3 File Operations Complete)
**Last Updated**: 2026-01-03
