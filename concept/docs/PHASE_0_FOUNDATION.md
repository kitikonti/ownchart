# Phase 0: Foundation - Implementation Concept

## Overview

This document outlines the **first step** in building the Gantt Chart application: establishing the project foundation. Phase 0 creates the infrastructure, tooling, and basic structure without implementing any features.

**Goal:** Set up a production-ready development environment with CI/CD, testing infrastructure, and basic project scaffolding.

**Duration Estimate:** 1-2 weeks

**Success Criteria:**
- ✅ Project builds successfully
- ✅ All quality checks pass in CI/CD
- ✅ Empty state UI renders
- ✅ Can deploy to GitHub Pages
- ✅ Team can start feature development

---

## Phase 0 Deliverables

### 1. Project Initialization

**Tasks:**
- [x] Create project with Vite + React + TypeScript template
- [x] Initialize git repository
- [x] Set up semantic versioning (start at v0.1.0)
- [x] Create initial project structure

**File Structure:**
```
app-gantt/
├── .github/
│   └── workflows/          # CI/CD pipelines (to be created)
├── src/
│   ├── components/
│   ├── store/
│   ├── utils/
│   ├── types/
│   ├── hooks/
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── public/
├── concept/                # Existing documentation
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── tailwind.config.js
├── package.json
└── README.md
```

**Semantic Versioning Strategy:**
- `v0.x.x` - Pre-release / Development
- `v1.0.0` - First stable release (after Phase 1 MVP)
- `v1.x.x` - Feature additions (Phase 2+)
- `v2.0.0` - Breaking changes (if needed)

**Version Tags:**
- `v0.1.0` - Phase 0 complete (foundation)
- `v0.2.0` - Basic task management
- `v0.3.0` - Visual timeline
- `v0.4.0` - Dependencies
- `v0.5.0` - History/undo
- `v0.6.0` - File operations
- `v0.7.0` - Export functionality
- `v1.0.0` - MVP release

---

### 2. Code Quality Tools

**ESLint Configuration:**
```json
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off"
  }
}
```

**Prettier Configuration:**
```json
{
  "semi": true,
  "singleQuote": false,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 80,
  "arrowParens": "always"
}
```

**TypeScript Configuration:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

**Tasks:**
- [ ] Configure ESLint with React, TypeScript, and accessibility plugins
- [ ] Configure Prettier for consistent formatting
- [ ] Set up TypeScript in strict mode
- [ ] Add lint and format scripts to package.json
- [ ] Create `.eslintignore` and `.prettierignore`

---

### 3. Testing Infrastructure

**Vitest Setup (Unit + Integration):**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
  },
});
```

**Playwright Setup (E2E):**
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Tasks:**
- [ ] Install and configure Vitest
- [ ] Install and configure Playwright
- [ ] Create test setup files
- [ ] Add test scripts to package.json
- [ ] Create example tests (smoke tests for Phase 0)
- [ ] Set up coverage reporting

**Example Smoke Tests:**
```typescript
// tests/unit/App.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/App';

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(screen.getByText(/gantt chart/i)).toBeInTheDocument();
  });
});

// tests/e2e/smoke.spec.ts
import { test, expect } from '@playwright/test';

test('homepage loads', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/gantt/i);
});
```

---

### 4. CI/CD Pipeline

**GitHub Actions Workflows:**

**`.github/workflows/ci.yml`** - Continuous Integration
```yaml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run format:check
      - run: npm run type-check

  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:unit
      - uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/

  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: dist
          path: dist/

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm audit --production --audit-level=high
```

**`.github/workflows/deploy.yml`** - Deployment
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-pages-artifact@v2
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v2
```

**Tasks:**
- [ ] Create `.github/workflows/ci.yml`
- [ ] Create `.github/workflows/deploy.yml`
- [ ] Configure GitHub Pages in repository settings
- [ ] Add branch protection rules for `main`
- [ ] Set up Codecov integration (optional)
- [ ] Test CI pipeline with dummy commit

---

### 5. Dependencies Installation

**Core Dependencies:**
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.0",
    "d3": "^7.9.0",
    "@types/d3": "^7.4.3"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.1.0",
    "typescript": "^5.3.3",
    "@types/react": "^18.2.55",
    "@types/react-dom": "^18.2.19",

    "eslint": "^8.56.0",
    "@typescript-eslint/eslint-plugin": "^6.21.0",
    "@typescript-eslint/parser": "^6.21.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-jsx-a11y": "^6.8.0",
    "prettier": "^3.2.5",

    "vitest": "^1.2.2",
    "@vitest/ui": "^1.2.2",
    "@testing-library/react": "^14.2.1",
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/user-event": "^14.5.2",
    "jsdom": "^24.0.0",
    "@vitest/coverage-v8": "^1.2.2",

    "@playwright/test": "^1.41.2",

    "tailwindcss": "^3.4.1",
    "autoprefixer": "^10.4.17",
    "postcss": "^8.4.35"
  }
}
```

**Scripts to Add:**
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "format": "prettier --write \"src/**/*.{ts,tsx,css,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,css,md}\"",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:unit": "vitest run --coverage",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "ci:local": "npm run lint && npm run format:check && npm run type-check && npm run test:unit && npm run build"
  }
}
```

**Tasks:**
- [ ] Install all dependencies
- [ ] Verify versions are latest stable
- [ ] Add all npm scripts
- [ ] Test each script locally

---

### 6. TailwindCSS Setup

**Configuration:**
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      spacing: {
        '18': '4.5rem',
        '72': '18rem',
        '84': '21rem',
        '96': '24rem',
      },
    },
  },
  plugins: [],
}
```

**Tasks:**
- [ ] Install TailwindCSS with PostCSS
- [ ] Configure `tailwind.config.js`
- [ ] Set up PostCSS config
- [ ] Add Tailwind directives to CSS
- [ ] Test with sample styled component

---

### 7. Empty State UI

**Purpose:** Provide a minimal, working UI that serves as the starting point for feature development.

**Components to Create:**

**`src/App.tsx`:**
```typescript
import React from 'react';

function App(): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Gantt Chart Application
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Phase 0: Foundation Complete
        </p>
        <div className="inline-block p-4 bg-blue-100 rounded-lg">
          <p className="text-sm text-blue-800">
            ✅ Project initialized<br />
            ✅ CI/CD configured<br />
            ✅ Testing infrastructure ready<br />
            ✅ Ready for feature development
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
```

**Tasks:**
- [ ] Create basic App component with empty state
- [ ] Add basic styling with TailwindCSS
- [ ] Create placeholder components (empty)
  - `src/components/Toolbar.tsx`
  - `src/components/TaskList.tsx`
  - `src/components/GanttCanvas.tsx`
  - `src/components/HistoryTimeline.tsx`
  - `src/components/SettingsPanel.tsx`
- [ ] Verify app renders in browser

---

### 8. Documentation

**README.md:**
Create a comprehensive README with:
- Project description
- Tech stack
- Getting started instructions
- Development workflow
- Testing commands
- Deployment process
- Links to concept documentation

**Tasks:**
- [ ] Create README.md
- [ ] Document development setup
- [ ] Add contributing guidelines
- [ ] Add license file (MIT recommended)

---

### 9. Git Configuration

**`.gitignore`:**
```
# Dependencies
node_modules/
.pnpm-debug.log*

# Build output
dist/
dist-ssr/
*.local

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/
playwright-report/
test-results/

# Logs
logs/
*.log
npm-debug.log*
```

**Tasks:**
- [ ] Create comprehensive `.gitignore`
- [ ] Set up branch protection for `main`
- [ ] Configure git hooks (optional: husky)

---

## Implementation Checklist

### Phase 0.1: Project Setup (Day 1-2)
- [ ] Initialize Vite project with React + TypeScript
- [ ] Set up folder structure
- [ ] Initialize git repository
- [ ] Create initial README.md
- [ ] First commit: "chore: initialize project v0.0.1"

### Phase 0.2: Code Quality (Day 2-3)
- [ ] Configure ESLint
- [ ] Configure Prettier
- [ ] Configure TypeScript strict mode
- [ ] Add lint/format scripts
- [ ] Commit: "chore: configure linting and formatting v0.0.2"

### Phase 0.3: Testing Setup (Day 3-5)
- [ ] Install and configure Vitest
- [ ] Install and configure Playwright
- [ ] Create test setup files
- [ ] Write smoke tests
- [ ] Verify tests pass locally
- [ ] Commit: "chore: configure testing infrastructure v0.0.3"

### Phase 0.4: CI/CD Pipeline (Day 5-7)
- [ ] Create CI workflow file
- [ ] Create deploy workflow file
- [ ] Configure GitHub Pages
- [ ] Set up branch protection
- [ ] Test CI pipeline
- [ ] Commit: "ci: add GitHub Actions workflows v0.0.4"

### Phase 0.5: Styling & Dependencies (Day 7-8)
- [ ] Install all project dependencies
- [ ] Configure TailwindCSS
- [ ] Create empty state UI
- [ ] Test dev server
- [ ] Commit: "chore: add dependencies and styling v0.0.5"

### Phase 0.6: Documentation (Day 8-9)
- [ ] Complete README.md
- [ ] Add CONTRIBUTING.md
- [ ] Add LICENSE
- [ ] Update claude.md if needed
- [ ] Commit: "docs: add project documentation v0.0.6"

### Phase 0.7: Final Verification (Day 9-10)
- [ ] Run full CI locally: `npm run ci:local`
- [ ] Verify production build works
- [ ] Test deployment to GitHub Pages
- [ ] Create v0.1.0 tag
- [ ] Commit: "release: Phase 0 complete v0.1.0"

---

## Quality Gates (Must Pass Before Phase 0 Complete)

1. ✅ **All CI checks pass**
   - Lint: Zero errors
   - Format: All files formatted
   - Type check: Zero TypeScript errors
   - Tests: All smoke tests passing
   - Build: Production build succeeds
   - Security: No high/critical vulnerabilities

2. ✅ **Development environment works**
   - `npm run dev` starts dev server
   - Hot reload works
   - No console errors

3. ✅ **Testing infrastructure works**
   - Unit tests run and pass
   - E2E tests run and pass
   - Coverage reports generate

4. ✅ **CI/CD pipeline works**
   - All GitHub Actions pass
   - Deploys to GitHub Pages
   - Site is accessible

5. ✅ **Documentation complete**
   - README.md has setup instructions
   - All concept docs in place
   - claude.md created

---

## Risks and Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|-----------|------------|
| CI takes too long (>15 min) | Slow feedback loop | Medium | Optimize workflow caching, parallelize jobs |
| Playwright flaky tests | False failures | Medium | Add retries, use stable selectors |
| Dependency conflicts | Build failures | Low | Use exact versions, test locally first |
| GitHub Pages config issues | Deploy fails | Low | Test with manual workflow trigger first |

---

## Success Metrics

**Technical Metrics:**
- Build time: <30 seconds
- CI pipeline: <10 minutes
- Test coverage: N/A for Phase 0 (no features)
- Bundle size: <100KB (empty state)

**Process Metrics:**
- Zero manual deployment steps
- All team members can run project locally
- CI catches all quality issues before merge

---

## Post-Phase 0

**What happens after Phase 0 is complete:**

1. **Tag Release:** Create git tag `v0.1.0`
2. **Deploy:** Empty state UI live on GitHub Pages
3. **Review:** User reviews and approves foundation
4. **Next Phase:** Begin Phase 1 (MVP features)

**Phase 1 will add:**
- Task management (create, edit, delete)
- Visual Gantt timeline
- Basic state management with Zustand
- First real features and user value

---

## Commit Strategy for Phase 0

**Commit Message Format:**
```
<type>(<scope>): <description>

[optional body]
[optional footer]
```

**Types:**
- `chore` - Tooling, config, dependencies
- `ci` - CI/CD changes
- `docs` - Documentation
- `test` - Test setup
- `style` - Code formatting (not CSS)

**Example Commits:**
```
chore: initialize Vite project with React + TypeScript
chore(lint): configure ESLint and Prettier
chore(test): add Vitest configuration
ci: add GitHub Actions workflows
docs: create README and CONTRIBUTING guides
release: Phase 0 foundation complete v0.1.0
```

**Versioning:**
- Start at `v0.0.1` (first commit)
- Increment patch version for each checkpoint
- Tag `v0.1.0` when Phase 0 is complete
- All commits before v1.0.0 are considered pre-release

---

## Review Checklist (Before Moving to Phase 1)

**Code Quality:**
- [ ] All files follow ESLint rules
- [ ] All files formatted with Prettier
- [ ] TypeScript strict mode with no errors
- [ ] No console errors in browser

**Testing:**
- [ ] Vitest runs successfully
- [ ] Playwright runs successfully
- [ ] All smoke tests pass
- [ ] Coverage reporting works

**CI/CD:**
- [ ] All CI checks pass on main branch
- [ ] Deploy workflow succeeds
- [ ] Site accessible on GitHub Pages
- [ ] Branch protection rules active

**Documentation:**
- [ ] README.md complete and accurate
- [ ] All concept docs reviewed
- [ ] claude.md exists and helpful
- [ ] CONTRIBUTING.md exists

**Development Experience:**
- [ ] `npm install` works from scratch
- [ ] `npm run dev` starts immediately
- [ ] Hot reload works
- [ ] `npm run ci:local` passes all checks
- [ ] Production build succeeds

---

**This document serves as the blueprint for Phase 0. Once reviewed and approved, implementation can begin with confidence that all infrastructure decisions have been validated.**

**Status:** Ready for Review
**Version:** 1.0
**Created:** 2025-12-13
**Next Action:** User review and approval
