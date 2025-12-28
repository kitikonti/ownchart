# Claude AI Assistant Guide - Gantt Chart Application

## Project Overview

This is a **browser-based, offline-first Gantt Chart application** for project planning and visualization. No backend required, all data stored locally.

**Key Characteristics:**
- Single-page application (SPA)
- Offline-first architecture
- Local file storage (JSON format)
- Zero installation beyond opening a web page
- Export to PNG, PDF, SVG
- Full undo/redo with time-travel
- Plugin system for extensibility

## Technology Stack

**Core Technologies:**
- **React 18+** - UI framework with hooks
- **TypeScript** - Strict mode, zero `any` types
- **Vite** - Build tool and dev server
- **Zustand** - State management (lightweight Redux alternative)
- **TailwindCSS** - Utility-first styling
- **D3.js** - SVG rendering for arrows and timeline

**Testing:**
- **Vitest** - Unit and integration tests
- **Playwright** - E2E tests across browsers
- **@axe-core/react** - Accessibility testing
- **Coverage**: 80%+ overall, 100% for critical modules

**CI/CD:**
- **GitHub Actions** - Automated testing and deployment
- **GitHub Pages** - Static site hosting
- **Codecov** - Coverage tracking
- **Snyk** - Security scanning
- **Lighthouse CI** - Performance monitoring

## Project Structure

```
app-gantt/
├── src/
│   ├── components/        # React components
│   │   ├── Toolbar.tsx
│   │   ├── TaskList/      # Task table components
│   │   │   ├── TaskTable.tsx
│   │   │   ├── TaskTableRow.tsx
│   │   │   └── Cell.tsx
│   │   ├── GanttCanvas.tsx
│   │   ├── HistoryTimeline.tsx
│   │   └── SettingsPanel.tsx
│   ├── store/            # Zustand state management
│   │   ├── taskStore.ts
│   │   ├── historyStore.ts
│   │   └── settingsStore.ts
│   ├── utils/            # Helper functions
│   │   ├── dateUtils.ts
│   │   ├── dependencyUtils.ts
│   │   ├── exportUtils.ts
│   │   └── validationUtils.ts
│   ├── types/            # TypeScript definitions
│   │   ├── task.ts
│   │   ├── dependency.ts
│   │   └── history.ts
│   ├── hooks/            # Custom React hooks
│   ├── plugins/          # Plugin system
│   └── App.tsx           # Root component
├── tests/
│   ├── unit/             # Unit tests (70%)
│   ├── integration/      # Integration tests (20%)
│   └── e2e/              # E2E tests (10%)
├── concept/              # All design documentation
└── public/               # Static assets
```

## Current Implementation Status (Sprint 1.2 Package 1)

### Timeline Visualization - ✅ Complete (2025-12-28)

**Architecture:**
- **Layout Pattern**: Vertical flex layout with sticky header row
  - Sticky headers (toolbar, table header, timeline header) at App level
  - Common vertical scroll container for synchronized scrolling
  - Separate horizontal scroll per panel (table and timeline)
  - `min-h-full` pattern for flexible content growth

**Components Implemented:**
- `ChartCanvas` - Main timeline container with ResizeObserver for auto-resize
- `TimelineHeader` - Multi-level date scales (Month + Day)
- `GridLines` - Background grid with weekend highlighting
- `TaskBar` - Task rendering with progress visualization
- `TodayMarker` - Current date indicator (red vertical line)
- `TaskTableHeader` - Extracted reusable table header component

**Utilities:**
- `dateUtils.ts` - Date calculations using date-fns
  - `getWeeksBetween`, `getDaysBetween`, `getMonthsBetween`
  - `addBusinessDays`, `isWeekend`
- `timelineUtils.ts` - Timeline scale system with zoom support
  - Multi-level scale generation (Month + Day, Day + Hour, etc.)
  - Scale calculation based on zoom level
  - Position calculations for date-to-pixel mapping

**State Management:**
- `chartSlice.ts` - Chart state with Zustand + Immer
  - Container width tracking with auto-recalculation
  - Zoom level management
  - Scale regeneration on resize/zoom changes

**Key Technical Patterns:**
1. **Sticky Positioning**: Headers are direct children of scroll container
2. **Synchronized Scrolling**: Single `overflow-y-auto` container with nested `overflow-y-hidden` children
3. **Responsive Timeline**: ResizeObserver with 100ms debounce triggers scale recalculation
4. **Grid Extension**: SVG height extends to full content height, not just last task
5. **Component Extraction**: Headers extracted to App level for sticky behavior

**Pending for Package 2:**
- Zoom controls (Ctrl+mousewheel or zoom slider)
- Interactive editing (drag task bars to change dates)
- Timeline scale transitions

## Core Data Model

### Task Object
```typescript
interface Task {
  id: string;                    // UUID v4
  name: string;                  // Max 200 chars
  startDate: Date;               // ISO 8601
  endDate: Date;                 // ISO 8601
  duration: number;              // Calculated in days
  progress: number;              // 0-100
  color: string;                 // Hex code
  assignee?: string;
  dependencies: Dependency[];
  metadata: Record<string, unknown>;  // Plugin data
}
```

### Dependency Object
```typescript
interface Dependency {
  id: string;
  fromTaskId: string;
  toTaskId: string;
  type: "FS" | "SS" | "FF" | "SF";  // MVP: FS only
  lag: number;                       // Days (MVP: 0)
}
```

### History Entry
```typescript
interface HistoryEntry {
  id: string;
  timestamp: Date;
  action: Action;
  previousState: Task[];
  currentState: Task[];
}
```

## Key Features by Phase

### Phase 0: Foundation (Week 1-2)
- Project setup with Vite + React + TypeScript
- Basic folder structure
- ESLint + Prettier configuration
- CI/CD pipeline setup
- Empty state placeholder UI

### Phase 1: MVP (Week 3-6)
- **Core Task Management**: Create, edit, delete tasks
- **Visual Timeline**: SVG-based Gantt chart with D3.js
- **Dependencies**: FS (Finish-to-Start) type only
- **Drag & Drop**: Move and resize task bars
- **History**: Undo/redo with time-travel slider
- **File Operations**: Save/load JSON files
- **Export**: PNG, PDF, SVG
- **Accessibility**: WCAG 2.1 AA compliance

### Phase 2+: Enhanced Features
- Additional dependency types (SS, FF, SF)
- Dependency lag times
- Baselines and variance tracking
- Collaboration features
- Plugin marketplace

## State Management Architecture

**Zustand Stores:**

1. **taskStore** - Primary application state
   - Tasks array
   - Dependencies array
   - CRUD operations
   - Dependency validation

2. **historyStore** - Undo/redo functionality
   - Command pattern implementation
   - Time-travel to any point
   - Auto-save checkpoints

3. **settingsStore** - User preferences
   - Theme (light/dark)
   - Language
   - Keyboard shortcuts
   - Plugin settings

**Why Zustand?**
- Minimal boilerplate vs Redux
- No context provider needed
- TypeScript-first
- Dev tools support
- Perfect for 1-3 stores

## Critical Dependencies

**Dependency Validation Logic:**
- No circular dependencies (A→B→C→A)
- No self-dependencies (A→A)
- Date auto-adjustment when dependencies change
- Cascade updates through dependency chain
- Test coverage: 100% (50-100 test cases)

**Auto-Date Adjustment Rules:**
1. If Task A depends on Task B (FS):
   - Task A start date = Task B end date + 1 day
2. When Task B dates change:
   - Recalculate all dependent tasks
   - Cascade through entire chain
3. When circular dependency detected:
   - Prevent creation
   - Show error message
   - Do not save state

## Testing Strategy

**Test Pyramid:**
- 70% Unit Tests (utils, hooks, components)
- 20% Integration Tests (store interactions, multi-component)
- 10% E2E Tests (critical user flows)

**Critical Test Areas:**
1. Dependency logic (50-100 cases for circular detection)
2. Date calculations (edge cases, timezones)
3. Undo/redo system (state snapshots)
4. File save/load (corruption handling)
5. Export functions (all formats)
6. Accessibility (keyboard nav, screen readers)

**Coverage Requirements:**
- Overall: ≥80%
- Critical modules: 100%
  - `dependencyUtils.ts`
  - `validationUtils.ts`
  - `historyStore.ts`
  - `taskStore.ts`

**Running Tests:**
```bash
npm run test:unit           # Unit tests with coverage
npm run test:integration    # Integration tests
npm run test:e2e            # E2E tests (Playwright)
npm run ci:local            # Run all checks locally
```

## CI/CD Pipeline

**Automatic Quality Gates (Must Pass):**
1. ESLint (zero errors)
2. Prettier (all files formatted)
3. TypeScript (strict mode, no errors)
4. Unit tests (80%+ coverage)
5. Integration tests (all passing)
6. E2E tests (Chrome, Firefox, Safari)
7. Build (production, no errors)
8. Security (npm audit, Snyk)
9. Lighthouse (Performance ≥90, A11y ≥95)

**Deployment Flow:**
```
Push to main → CI checks → All pass → Deploy to GitHub Pages
```

**Pipeline Duration:** ~8-10 minutes total

## Development Workflow

**Before Every Commit:**
```bash
npm run lint              # Check code quality
npm run format            # Format all files
npm run type-check        # TypeScript validation
npm run test:unit         # Run unit tests
npm run build             # Verify production build
```

**Or use the all-in-one command:**
```bash
npm run ci:local          # Runs all checks
```

**Git Commit Standards:**
- Use semantic versioning
- Clear, descriptive commit messages
- One logical change per commit
- Run tests before committing

## Accessibility Requirements

**WCAG 2.1 AA Compliance:**
- Keyboard navigation for all features
- Screen reader support with ARIA labels
- Focus indicators (4px blue outline)
- Color contrast ratios ≥4.5:1 (text), ≥3:1 (UI)
- No keyboard traps
- Skip links for main content

**Critical Keyboard Shortcuts:**
- `Tab` / `Shift+Tab` - Navigate between elements
- `Enter` / `Space` - Activate buttons
- `Escape` - Close dialogs
- `Ctrl+Z` / `Cmd+Z` - Undo
- `Ctrl+Shift+Z` / `Cmd+Shift+Z` - Redo
- `Ctrl+S` / `Cmd+S` - Save file

**Testing Accessibility:**
```bash
npm run test:a11y         # axe-core automated tests
```

## Performance Requirements

**Target Metrics:**
- **Lighthouse Performance**: ≥90
- **Time to Interactive**: <3s
- **First Contentful Paint**: <1.5s
- **Bundle Size**: <500KB (main bundle)

**Optimization Strategies:**
- Code splitting by route
- Lazy load heavy components
- Virtual scrolling for 1000+ tasks
- Debounce drag operations (16ms)
- Memoize expensive calculations
- Use React.memo for pure components

## Plugin System Architecture

**Hook-based Extensibility:**
```typescript
interface Plugin {
  id: string;
  name: string;
  version: string;
  hooks: {
    onTaskCreate?: (task: Task) => Task;
    onTaskUpdate?: (task: Task) => Task;
    onExport?: (data: ExportData) => void;
    // ... more hooks
  };
}
```

**Custom Fields:**
Plugins can add custom fields to tasks via `metadata` object.

**Plugin Lifecycle:**
1. Register plugin
2. Initialize
3. Hook into events
4. Cleanup on unregister

## File Format

**JSON Structure:**
```json
{
  "version": "1.0",
  "metadata": {
    "createdAt": "2025-01-15T10:00:00Z",
    "modifiedAt": "2025-01-15T15:30:00Z",
    "appVersion": "1.0.0"
  },
  "tasks": [ /* Task[] */ ],
  "dependencies": [ /* Dependency[] */ ],
  "settings": { /* user preferences */ }
}
```

**File Extension:** `.gantt.json`

**Versioning:** Semantic versioning for schema changes

## Common Development Tasks

### Adding a New Feature
1. **Check Phase**: Verify feature is in current phase roadmap
2. **Write Tests First**: TDD approach
3. **Implement Feature**: Follow existing patterns
4. **Update Documentation**: If architecture changes
5. **Run CI Locally**: `npm run ci:local`
6. **Create PR**: Wait for CI to pass

### Fixing a Bug
1. **Write Failing Test**: Reproduce the bug
2. **Fix the Bug**: Minimal change
3. **Verify Test Passes**: Green test
4. **Check for Side Effects**: Run full test suite
5. **Commit**: Clear message describing fix

### Refactoring
1. **Ensure Tests Pass**: Green baseline
2. **Make Changes**: No feature additions
3. **Verify Tests Still Pass**: No behavior change
4. **Check Performance**: No degradation
5. **Commit**: Describe refactoring goal

## Code Style Guidelines

**TypeScript:**
- Strict mode enabled
- No `any` types (use `unknown` and type guards)
- Explicit return types for functions
- Interface over type for objects
- Descriptive variable names

**React:**
- Functional components with hooks
- Named exports (not default)
- Props interface for every component
- Extract complex logic to custom hooks
- Keep components under 200 lines

**State Management:**
- Use Zustand stores for global state
- Use React state for local component state
- Avoid prop drilling (use Zustand instead)
- Immutable state updates

**Styling:**
- TailwindCSS utility classes
- Responsive design (mobile-first)
- Design tokens for colors/spacing
- No inline styles (use Tailwind)

## Security Considerations

**Client-Side Security:**
- Input validation for all user data
- XSS prevention (React auto-escapes)
- No `eval()` or `new Function()`
- Content Security Policy headers
- Regular dependency updates

**File Operations:**
- Validate JSON structure on load
- Handle corrupted files gracefully
- Size limits for file uploads
- Sanitize file names

## Deployment

**Production Build:**
```bash
npm run build             # Creates dist/ folder
```

**Preview Production Build:**
```bash
npm run preview           # Test production build locally
```

**Automatic Deployment:**
- Push to `main` branch
- CI/CD pipeline runs
- Deploys to GitHub Pages
- URL: `https://username.github.io/gantt-project-planing`

**Manual Deployment:**
- Go to GitHub Actions
- Run "Deploy to GitHub Pages" workflow
- Select `main` branch

## Troubleshooting

### Tests Failing Locally
- Check Node version matches CI (20.x)
- Clear node_modules: `rm -rf node_modules && npm install`
- Clear test cache: `npm run test:unit -- --clearCache`

### Build Errors
- Run `npm run type-check` for TypeScript errors
- Check for circular imports
- Verify all dependencies are installed

### Performance Issues
- Use React DevTools Profiler
- Check bundle size: `npm run build -- --analyze`
- Look for unnecessary re-renders
- Profile with Chrome DevTools

## Key Decision Records

### Why React over Vue/Svelte?
- Larger ecosystem and community
- Better TypeScript support
- More mature tooling
- Team familiarity

### Why Zustand over Redux?
- Simpler API (less boilerplate)
- Better TypeScript inference
- No provider wrapper needed
- Sufficient for app complexity

### Why SVG over Canvas?
- Better accessibility (DOM elements)
- Easier hit detection
- Simpler event handling
- Good performance for <1000 tasks

### Why GitHub Pages?
- Free hosting
- Automatic HTTPS
- Simple deployment
- Perfect for static SPAs

## Important Files to Know

### Configuration Files
- `vite.config.ts` - Build configuration
- `tsconfig.json` - TypeScript settings
- `tailwind.config.js` - Styling configuration
- `.eslintrc.json` - Linting rules
- `.prettierrc` - Formatting rules
- `playwright.config.ts` - E2E test configuration
- `vitest.config.ts` - Unit test configuration

### Documentation
- `concept/README.md` - Documentation hub
- `concept/planning/PRD.md` - Product requirements
- `concept/planning/ROADMAP.md` - Development phases
- `concept/architecture/TECHNICAL_ARCHITECTURE.md` - System design
- `concept/architecture/DATA_MODEL.md` - Data structures
- `concept/process/TESTING_STRATEGY.md` - Test approach
- `concept/process/CI_CD.md` - Pipeline details
- `concept/sprints/SPRINT_1.2_TIMELINE_VISUALIZATION.md` - Current sprint details

### Source Code (to be created)
- `src/store/taskStore.ts` - Core state management
- `src/utils/dependencyUtils.ts` - Dependency validation
- `src/utils/dateUtils.ts` - Date calculations
- `src/components/GanttCanvas.tsx` - Main chart component

## Development Phases Summary

**Phase 0: Foundation** ✅ Complete
- Setup project structure
- Configure tooling
- CI/CD pipeline
- No features, just infrastructure

**Phase 1: MVP** (In Progress - Sprint 1.2)
- **Sprint 1.2 Package 1** ✅ Complete (2025-12-28)
  - Interactive SVG-based timeline with multi-level scale
  - Sticky headers (toolbar, table header, timeline header)
  - Synchronized scrolling between table and timeline
  - Auto-resizing timeline on window resize
  - Weekend highlighting and today marker
  - Task types rendering (tasks, summaries, milestones)
  - Progress bars on task bars
  - Grid system with proper alignment
- All core features functional
- Production-ready
- Deploy to GitHub Pages

**Phase 2: Enhancement**
- Additional features
- Plugin marketplace
- Performance optimization

**Phase 3: Advanced**
- Collaboration
- Real-time sync
- Mobile app

## Getting Help

**Documentation:**
- Start with `concept/README.md`
- Check specific docs in organized subdirectories:
  - `concept/planning/` - Product planning
  - `concept/architecture/` - Technical architecture
  - `concept/design/` - UI/UX design
  - `concept/process/` - Development process
  - `concept/sprints/` - Sprint details
- Review code comments

**Debugging:**
- Use browser DevTools
- Check console for errors
- Use React DevTools
- Check Playwright trace viewer for E2E failures

**External Resources:**
- React docs: https://react.dev
- TypeScript docs: https://www.typescriptlang.org/docs
- Zustand docs: https://github.com/pmndrs/zustand
- Vite docs: https://vitejs.dev
- TailwindCSS docs: https://tailwindcss.com

---

**This file serves as a quick reference for AI assistance throughout development. It should be updated as the project evolves and architectural decisions are made.**

**Last Updated:** 2025-12-28
**Status:** Phase 1 - MVP (Sprint 1.2 Package 1 Complete)
**Next Review:** After Sprint 1.2 Package 2 completion
