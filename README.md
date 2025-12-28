# Gantt Chart Application

A browser-based, offline-first Gantt Chart application for project planning and visualization. Built with React, TypeScript, and modern web technologies.

## Features

- **Offline-First**: Works entirely in your browser, no backend required
- **Task Management**: Create, edit, and organize project tasks
- **Visual Timeline**: Interactive Gantt chart with drag-and-drop
- **Dependencies**: Link tasks with finish-to-start relationships
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

**Current Version**: 0.0.1 (Pre-release)
**Status**: Phase 0 - Foundation Complete, Enhanced with Competitive Analysis
**Last Updated**: 2025-12-23
