# OwnChart

> **Privacy-first, offline Gantt chart for project planning. Own your data.**

[![Version](https://img.shields.io/badge/version-0.0.2-blue.svg)](https://github.com/kitikonti/ownchart/releases)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://react.dev)

**OwnChart** is a browser-based Gantt chart application that respects your privacy. No cloud, no tracking, no accounts. Your data stays on your device.

## 🌐 Try It Now

**Live Demo**: [https://kitikonti.github.io/ownchart/](https://kitikonti.github.io/ownchart/)

No installation needed - just open and start planning. Your data stays in your browser's local storage.

## ✨ Features

- 🔒 **Privacy-First** - All data stays local, zero tracking
- 📴 **Offline-Ready** - Works completely offline in your browser
- 🎯 **No Setup** - Zero installation, no backend required
- 💾 **Own Your Data** - Save/load `.gantt` files on your device
- ⚡ **Fast & Lightweight** - Built with modern web technologies
- 🎨 **Interactive Timeline** - Drag-to-move, drag-to-resize task bars
- 🔄 **Full Undo/Redo** - Time-travel through your changes
- 📊 **Task Hierarchy** - Organize with summaries and milestones
- ⌨️ **Keyboard Shortcuts** - Efficient navigation and editing
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

**Or use the live demo**: [https://kitikonti.github.io/ownchart/](https://kitikonti.github.io/ownchart/)

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
├── concept/            # Comprehensive documentation
└── CLAUDE.md           # AI assistant guide
```

## 📖 Documentation

Comprehensive documentation is available in the [`/concept`](./concept) folder:

- **[Product Requirements](./concept/planning/PRD.md)** - Vision and requirements
- **[Roadmap](./concept/planning/ROADMAP.md)** - Development phases
- **[Technical Architecture](./concept/architecture/TECHNICAL_ARCHITECTURE.md)** - System design
- **[Data Model](./concept/architecture/DATA_MODEL.md)** - Data structures
- **[Testing Strategy](./concept/process/TESTING_STRATEGY.md)** - QA approach
- **[CI/CD Pipeline](./concept/process/CI_CD.md)** - Deployment process

## 🔐 Security & Privacy

**OwnChart** is designed with privacy as the foundation:

- ✅ **Zero Telemetry** - No analytics, no tracking
- ✅ **Local-Only** - No data ever leaves your device
- ✅ **No Accounts** - No sign-up, no login required
- ✅ **File Validation** - 6-layer security pipeline (XSS, prototype pollution prevention)
- ✅ **Open Source** - Fully auditable code

## 🎯 Current Status

**Version**: 0.0.2 (Early Development)

**Completed Features**:
- ✅ Task management with hierarchy (summaries, milestones)
- ✅ Interactive timeline (drag-to-move, drag-to-resize)
- ✅ Zoom & navigation (10%-500%)
- ✅ File operations (save/load .gantt format)
- ✅ Undo/redo system (100 command stack)
- ✅ Keyboard shortcuts

**Next Up**:
- 🚧 Task dependencies (Finish-to-Start)
- 🚧 PNG/PDF export
- 🚧 Critical path visualization

See the [Roadmap](./concept/planning/ROADMAP.md) for the full development plan.

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

- **Live Demo**: [kitikonti.github.io/ownchart](https://kitikonti.github.io/ownchart/)
- **Repository**: [github.com/kitikonti/ownchart](https://github.com/kitikonti/ownchart)
- **Issues**: [Report a bug or request a feature](https://github.com/kitikonti/ownchart/issues)
- **Changelog**: [See what's new](./CHANGELOG.md)
- **AI Guide**: [For AI assistants working on this project](./CLAUDE.md)

---

**Built with ❤️ for privacy-conscious developers and power users.**

**OwnChart** - Because your project data belongs to you, not in someone else's cloud.
