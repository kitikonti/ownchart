# OwnChart

> **Privacy-first, offline Gantt chart for project planning. Own your data.**

[![CI](https://github.com/kitikonti/ownchart/actions/workflows/ci.yml/badge.svg)](https://github.com/kitikonti/ownchart/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.0.33-blue.svg)](https://github.com/kitikonti/ownchart/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)

**OwnChart** is a browser-based Gantt chart application that respects your privacy. No cloud, no tracking, no accounts. Your data stays on your device.

## 🌐 Try It Now

**Live**: [https://ownchart.app](https://ownchart.app)

No installation needed - just open and start planning. Your data stays in your browser's local storage.

## ✨ Features

- 🔒 **Privacy-First** - All data stays local, zero tracking
- 📴 **Offline-Ready** - Works completely offline in your browser
- 🎯 **No Setup** - Zero installation, no backend required
- 💾 **Own Your Data** - Save/load `.ownchart` files on your device
- ⚡ **Fast & Lightweight** - Built with modern web technologies
- 🎨 **Interactive Timeline** - Drag-to-move, drag-to-resize task bars
- 🔗 **Task Dependencies** - Finish-to-Start with automatic date propagation
- 🔄 **Full Undo/Redo** - Time-travel through your changes (100 steps)
- 📊 **Task Hierarchy** - Organize with summaries and milestones (3 levels)
- 📋 **Multi-Select** - Select multiple tasks with Ctrl/Shift+Click or marquee
- ✂️ **Copy/Paste** - Cross-tab clipboard support with dependencies preserved
- 📄 **PDF/SVG/PNG Export** - Vector and raster export with live preview
- 🎨 **Smart Color Management** - 5 color modes (Manual, By Type, Progress, Duration, Random)
- 📐 **UI Density Modes** - Compact, Normal, Comfortable row heights
- 📅 **Holiday Support** - 199 countries with timeline highlighting
- ⚙️ **Working Days Mode** - Business day calculations for scheduling
- 🎀 **MS Office UI** - Familiar ribbon interface with tabbed workflow
- ⌨️ **Keyboard Shortcuts** - Efficient navigation and editing
- ❓ **Help Panel** - Built-in keyboard shortcut reference
- 🎓 **Welcome Tour** - Guided introduction for first-time users
- 🔐 **Security-Focused** - 6-layer file validation against XSS/injection

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/kitikonti/ownchart.git
cd ownchart

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser to start developing!

**Or try it online**: [https://ownchart.app](https://ownchart.app)

## 🏗️ Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe development
- **Zustand** - Lightweight state management
- **TailwindCSS** - Utility-first styling
- **Vite** - Lightning-fast build tool
- **D3.js** - Timeline rendering
- **Vitest + Playwright** - Comprehensive testing

## 📦 Scripts

```bash
npm run dev              # Start dev server
npm run build            # Production build
npm run preview          # Preview production build

npm run lint             # Lint code
npm run format           # Format with Prettier
npm run type-check       # TypeScript validation

npm run test:unit        # Unit tests with coverage
npm run test:e2e         # E2E tests with Playwright

npm run ci:local         # Run all checks (pre-commit)

npm run release          # Create new release with changelog
```

## 🗂️ Project Structure

```
ownchart/
├── src/
│   ├── components/      # React components
│   ├── store/          # Zustand state slices
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript definitions
│   └── hooks/          # Custom React hooks
├── tests/              # Unit, integration, E2E tests
├── docs/            # Comprehensive documentation
└── CLAUDE.md           # AI assistant guide
```

## 📖 Documentation

Comprehensive documentation is available in the [`/docs`](./docs) folder:

- **[Product Requirements](./docs/planning/PRD.md)** - Vision and requirements
- **[Roadmap](./docs/planning/ROADMAP.md)** - Development phases
- **[Technical Architecture](./docs/architecture/TECHNICAL_ARCHITECTURE.md)** - System design
- **[Data Model](./docs/architecture/DATA_MODEL.md)** - Data structures
- **[Testing Strategy](./docs/process/TESTING_STRATEGY.md)** - QA approach
- **[CI/CD Pipeline](./docs/process/CI_CD.md)** - Deployment process

## 🔐 Security & Privacy

**OwnChart** is designed with privacy as the foundation:

- ✅ **Zero Telemetry** - No analytics, no tracking
- ✅ **Local-Only** - No data ever leaves your device
- ✅ **No Accounts** - No sign-up, no login required
- ✅ **File Validation** - 6-layer security pipeline (XSS, prototype pollution prevention)
- ✅ **Open Source** - Fully auditable code

## 🎯 Current Status

**Version**: 0.0.33

**Core Features**:
- ✅ Task management with hierarchy (summaries, milestones, 3 levels)
- ✅ Interactive timeline (drag-to-move, drag-to-resize, multi-task drag)
- ✅ Zoom & navigation (5%-300%) with cursor-centered anchoring
- ✅ File operations (save/load `.ownchart` format with 6-layer validation)
- ✅ Task dependencies (Finish-to-Start with automatic date propagation)
- ✅ Undo/redo system (100 command stack with indent/outdent support)
- ✅ Multi-select with rectangular marquee selection
- ✅ Copy/paste/cut with cross-tab clipboard support
- ✅ PDF/SVG/PNG export with Figma-style live preview
- ✅ Smart Color Management (5 modes: Manual, By Type, Progress, Duration, Random)
- ✅ UI Density settings (Compact/Normal/Comfortable)
- ✅ User preferences (date format, first day of week, week numbering)
- ✅ Holiday support (199 countries) with timeline highlighting
- ✅ Working Days Mode for business day calculations
- ✅ MS Office-style ribbon UI (File, Task, View, Help tabs)
- ✅ Help panel with keyboard shortcuts reference
- ✅ Welcome tour for first-time users
- ✅ Infinite scroll timeline with smooth navigation

**Next Up (V1.1)**:
- 🔜 Advanced dependencies (Start-to-Start, Finish-to-Finish, Start-to-Finish)
- 🔜 Custom fields UI
- 🔜 Multi-project management
- 🔜 History timeline slider with real-time scrubbing
- 🔜 Named snapshots

See the [Roadmap](./docs/planning/ROADMAP.md) for the full development plan.

## 🤝 Contributing

Contributions are welcome! Please read our [contributing guidelines](./CONTRIBUTING.md) before submitting PRs.

**Development Workflow**:
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

**Commit Convention**: We use [Conventional Commits](https://www.conventionalcommits.org/) for automated changelog generation.

## 📝 License

[MIT License](LICENSE) - Feel free to use OwnChart for any purpose.

## 🔗 Links

- **Live**: [ownchart.app](https://ownchart.app)
- **Repository**: [github.com/kitikonti/ownchart](https://github.com/kitikonti/ownchart)
- **Issues**: [Report a bug or request a feature](https://github.com/kitikonti/ownchart/issues)
- **Changelog**: [See what's new](./CHANGELOG.md)
- **AI Guide**: [For AI assistants working on this project](./CLAUDE.md)

---

**Built with ❤️ for privacy-conscious developers and power users.**

**OwnChart** - Because your project data belongs to you, not in someone else's cloud.
