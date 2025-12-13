# CI/CD Pipeline Documentation

## 1. Overview

This document describes the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the Gantt Chart application.

**Philosophy**: Automate everything, fail fast, deploy confidently.

**Tools**: All free tier / open source
- **CI/CD Platform**: GitHub Actions (free for public repos)
- **Testing**: Vitest, Playwright
- **Performance**: Lighthouse CI (free)
- **Security**: npm audit (free), Snyk (free tier)
- **Coverage**: Codecov (free for open source)
- **Deployment**: GitHub Pages (free)

---

## 2. Pipeline Architecture

### 2.1 Workflow Triggers

**CI Pipeline** (`.github/workflows/ci.yml`):
- Triggers on: Push to `main`/`develop`, Pull Requests
- Runs: Lint, tests, build, security scans, performance checks
- Duration: ~8-10 minutes
- Blocks merge if any job fails

**Deploy Pipeline** (`.github/workflows/deploy.yml`):
- Triggers on: Push to `main` (after CI passes)
- Runs: Build + deploy to GitHub Pages
- Duration: ~3-5 minutes
- Only runs on successful CI

### 2.2 Pipeline Stages

```
┌─────────────────────────────────────────────────────────┐
│                     CI PIPELINE                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Stage 1: Lint & Type Check (5 min)                    │
│  ├─ ESLint (code quality)                              │
│  ├─ Prettier (formatting)                              │
│  └─ TypeScript (type safety)                           │
│                                                         │
│  Stage 2: Unit Tests (10 min)                          │
│  ├─ Run all unit tests                                 │
│  ├─ Generate coverage report                           │
│  ├─ Upload to Codecov                                  │
│  └─ Enforce 80%+ coverage                              │
│                                                         │
│  Stage 3: Integration Tests (10 min)                   │
│  └─ Test component interactions & state                │
│                                                         │
│  Stage 4: E2E Tests (15 min, parallel)                 │
│  ├─ Chromium (Linux)                                   │
│  ├─ Firefox (Linux)                                    │
│  └─ WebKit/Safari (Linux)                              │
│                                                         │
│  Stage 5: Build Verification (10 min)                  │
│  ├─ Production build                                   │
│  ├─ Check bundle size                                  │
│  └─ Upload artifacts                                   │
│                                                         │
│  Stage 6: Security Scan (5 min)                        │
│  ├─ npm audit (high/critical only)                     │
│  └─ Snyk vulnerability scan                            │
│                                                         │
│  Stage 7: Lighthouse CI (10 min)                       │
│  ├─ Performance (target: 90+)                          │
│  ├─ Accessibility (target: 95+)                        │
│  ├─ Best Practices (target: 90+)                       │
│  └─ SEO (target: 80+)                                  │
│                                                         │
│  Stage 8: Dependency Review (PRs only)                 │
│  └─ Check for vulnerable dependencies                  │
│                                                         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
              ✅ All checks pass
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  DEPLOY PIPELINE                        │
├─────────────────────────────────────────────────────────┤
│  Stage 1: Build (10 min)                                │
│  └─ npm run build (production)                         │
│                                                         │
│  Stage 2: Deploy (5 min)                                │
│  └─ Deploy to GitHub Pages                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Quality Gates

### 3.1 Required Checks (Block Merge)

Every PR must pass ALL of these:

1. ✅ **Lint & Type Check**
   - ESLint: Zero errors (warnings allowed)
   - Prettier: All files formatted
   - TypeScript: Strict mode, zero errors

2. ✅ **Unit Tests**
   - All tests passing
   - Coverage ≥ 80%
   - Critical modules coverage = 100%

3. ✅ **Integration Tests**
   - All integration tests passing

4. ✅ **E2E Tests**
   - All E2E tests passing on Chrome, Firefox, Safari

5. ✅ **Build**
   - Production build succeeds
   - No build errors or warnings

6. ✅ **Security**
   - npm audit: No high/critical vulnerabilities
   - Snyk: No high/critical vulnerabilities

7. ✅ **Performance (Lighthouse)**
   - Performance score ≥ 90
   - Accessibility score ≥ 95
   - Best Practices score ≥ 90

### 3.2 Warning Checks (Don't Block, Manual Review)

These checks warn but don't block merge:

- ⚠️ Bundle size increase > 10%
- ⚠️ Test coverage decrease
- ⚠️ Lighthouse SEO score < 80
- ⚠️ Visual regression differences (if enabled)

---

## 4. Setup Instructions

### 4.1 Repository Setup

1. **Enable GitHub Actions**:
   - Already enabled for this repository
   - Workflows run automatically on push/PR

2. **Configure Branch Protection** (Main branch):
   ```
   Settings → Branches → Branch protection rules → main

   ✅ Require a pull request before merging
   ✅ Require status checks to pass before merging
      - ci-success (from CI pipeline)
      - lint
      - unit-tests
      - integration-tests
      - e2e-tests (chromium)
      - e2e-tests (firefox)
      - e2e-tests (webkit)
      - build
      - security
   ✅ Require branches to be up to date before merging
   ✅ Require linear history
   ```

3. **Enable GitHub Pages**:
   ```
   Settings → Pages
   Source: GitHub Actions
   ```

### 4.2 Required Secrets

Add these secrets in `Settings → Secrets and variables → Actions`:

1. **CODECOV_TOKEN** (optional, but recommended):
   - Sign up at https://codecov.io (free for open source)
   - Link your GitHub repo
   - Copy token to GitHub secrets

2. **SNYK_TOKEN** (optional):
   - Sign up at https://snyk.io (free tier)
   - Generate API token
   - Add to GitHub secrets

3. **LHCI_GITHUB_APP_TOKEN** (optional):
   - For Lighthouse CI GitHub status checks
   - Install Lighthouse CI GitHub App
   - Token auto-generated

**Note**: All are optional. Pipeline works without them, but with reduced features.

### 4.3 Local Development Setup

Ensure your `package.json` has these scripts:

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
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## 5. Local Testing (Before Push)

### 5.1 Pre-Push Checklist

Before pushing code, run locally:

```bash
# 1. Lint and format
npm run lint
npm run format

# 2. Type check
npm run type-check

# 3. Run tests
npm run test:unit
npm run test:integration
npm run test:e2e  # Optional: slow

# 4. Build
npm run build

# 5. Security check
npm audit --audit-level=high
```

**OR** use the all-in-one command:

```bash
# Run everything (recommended before PR)
npm run ci:local
```

Add to `package.json`:
```json
{
  "scripts": {
    "ci:local": "npm run lint && npm run type-check && npm run test:unit && npm run build"
  }
}
```

### 5.2 Git Hooks (Optional but Recommended)

Install Husky for automated pre-commit/pre-push checks:

```bash
npm install -D husky lint-staged

# Setup husky
npx husky-init
```

**`.husky/pre-commit`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
```

**`.husky/pre-push`**:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
npm run test:unit
```

**`package.json`** (add lint-staged config):
```json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{css,md,json}": [
      "prettier --write"
    ]
  }
}
```

---

## 6. CI/CD Best Practices

### 6.1 Keep CI Fast

- **Target**: < 10 minutes total
- **Parallelize**: Run jobs concurrently where possible
- **Cache**: Use `cache: 'npm'` in `setup-node` action
- **Fail Fast**: Cancel old runs on new commits (`concurrency` setting)
- **Skip Unnecessary**: Use `[skip ci]` in commit message to skip CI (rare)

### 6.2 Flaky Test Management

If a test fails intermittently:

1. **Fix immediately** if possible
2. **Add retries** (Playwright: `retries: 2`)
3. **Mark as flaky** and file issue
4. **Remove** if can't be fixed (better no test than flaky test)

### 6.3 Security Best Practices

- **Dependency updates**: Weekly `npm audit` + `npm update`
- **Auto-merge**: Use Dependabot for security patches
- **Review changes**: Always review dependency changes before merging
- **Pin versions**: Use exact versions in `package.json` for critical deps

---

## 7. Monitoring & Notifications

### 7.1 GitHub Notifications

Configure notifications:
```
Settings → Notifications → Actions
✅ Send notifications for failed workflows
```

### 7.2 Slack Integration (Optional)

For team notifications, use GitHub Actions Slack integration:

```yaml
- name: Notify Slack on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### 7.3 Email Notifications

GitHub automatically emails on workflow failures (for repo owners).

---

## 8. Troubleshooting

### 8.1 Common Issues

**Issue**: Tests pass locally but fail in CI

**Solution**:
- Check Node version match (local vs CI)
- Check timezone differences (use UTC in tests)
- Check file path case sensitivity (CI uses Linux)

---

**Issue**: E2E tests timeout in CI

**Solution**:
- Increase timeout: `timeout-minutes: 20`
- Add explicit waits in tests: `await page.waitForLoadState('networkidle')`
- Check for race conditions

---

**Issue**: npm audit fails on dev dependencies

**Solution**:
```bash
# Only audit production dependencies
npm audit --production --audit-level=high
```

Update workflow:
```yaml
- run: npm audit --production --audit-level=high
```

---

**Issue**: Coverage drops below threshold

**Solution**:
- Write tests for new code
- Check for dead code (remove unused files)
- Adjust threshold if justified:
  ```json
  // package.json
  {
    "vitest": {
      "coverage": {
        "lines": 75,  // Lower threshold temporarily
        "functions": 75,
        "branches": 75,
        "statements": 75
      }
    }
  }
  ```

---

**Issue**: Lighthouse CI fails with low performance score

**Solution**:
- Run locally: `npm run lighthouse:ci`
- Optimize bundle size (code splitting, tree shaking)
- Optimize images (use WebP, lazy loading)
- Remove unused dependencies

---

### 8.2 Debugging CI Failures

**View detailed logs**:
1. Go to Actions tab
2. Click on failed workflow
3. Click on failed job
4. Expand failed step
5. Read error messages

**Download artifacts**:
```
Actions → Failed workflow → Artifacts → Download
```

Artifacts include:
- Playwright test results (screenshots, videos)
- Playwright HTML report
- Lighthouse reports
- Coverage reports

**Re-run failed jobs**:
```
Actions → Failed workflow → Re-run failed jobs
```

---

## 9. Deployment Process

### 9.1 Automatic Deployment (Production)

**Trigger**: Push to `main` branch

**Process**:
1. Developer creates PR
2. CI runs all checks
3. PR approved and merged to `main`
4. CI re-runs on `main`
5. If CI passes, deploy workflow triggers
6. Build production bundle
7. Deploy to GitHub Pages
8. Site live at: `https://username.github.io/gantt-project-planing`

**Rollback**:
```bash
# If deployment breaks production
git revert <commit-hash>
git push origin main

# CI + deploy will re-run with previous version
```

### 9.2 Manual Deployment

**Trigger**: Via GitHub UI

**Process**:
1. Go to Actions tab
2. Select "Deploy to GitHub Pages" workflow
3. Click "Run workflow" button
4. Select branch (`main`)
5. Click "Run workflow"

**Use case**: Re-deploy without code changes (e.g., fix deployment config)

---

## 10. Performance Benchmarks

### 10.1 Target CI Times

| Stage | Target | Current |
|-------|--------|---------|
| Lint & Type Check | < 5 min | ~3 min |
| Unit Tests | < 10 min | ~5 min |
| Integration Tests | < 10 min | ~5 min |
| E2E Tests (per browser) | < 15 min | ~10 min |
| Build | < 10 min | ~5 min |
| Security | < 5 min | ~2 min |
| Lighthouse | < 10 min | ~8 min |
| **Total** | **< 10 min** | **~8 min** |

**Note**: E2E tests run in parallel (3 browsers), so total time ≈ slowest browser.

### 10.2 Optimization Opportunities

If CI gets too slow:

1. **Split E2E tests**: Critical paths only in CI, full suite nightly
2. **Selective testing**: Only run tests for changed files (advanced)
3. **Increase parallelism**: Split test suites across more workers
4. **Reduce Lighthouse runs**: Run only on `main`, not PRs

---

## 11. Cost Analysis

### 11.1 GitHub Actions Free Tier

**Limits** (per month):
- Public repos: **Unlimited** ⭐
- Private repos: 2,000 minutes

**This project (public repo)**:
- ✅ Unlimited CI/CD minutes
- ✅ No cost

### 11.2 Third-Party Services (Free Tiers)

| Service | Free Tier | Usage | Cost |
|---------|-----------|-------|------|
| GitHub Actions | Unlimited (public) | CI/CD | $0 |
| GitHub Pages | Unlimited (public) | Hosting | $0 |
| Codecov | Unlimited (open source) | Coverage | $0 |
| Snyk | Limited scans | Security | $0 |
| Lighthouse CI | Unlimited | Performance | $0 |
| **Total** | | | **$0/month** |

---

## 12. Future Enhancements

### Phase 2 (V1.1):

1. **Automated releases**: Create GitHub releases on tag push
2. **Changelog generation**: Auto-generate from commit messages
3. **Nightly builds**: Run full test suite + performance benchmarks
4. **Visual regression**: Add Percy.io or Playwright screenshots
5. **Storybook**: Deploy Storybook for component documentation

### Phase 3 (V1.0):

1. **Canary deployments**: Deploy to staging before production
2. **Smoke tests**: Run subset of E2E tests post-deployment
3. **Monitoring**: Add error tracking (Sentry free tier)
4. **Analytics**: Add privacy-friendly analytics (Plausible)

---

## 13. Summary

**Benefits of this CI/CD pipeline**:

✅ **Fast feedback**: Developers know within 10 minutes if code is broken
✅ **High confidence**: 7 layers of quality checks before merge
✅ **Automated**: Zero manual steps from code to production
✅ **Free**: $0/month cost for unlimited builds
✅ **Scalable**: Handles growing codebase and team size

**Developer experience**:

1. Write code
2. Run `npm run ci:local` (optional but recommended)
3. Push to GitHub
4. Create PR
5. Wait ~10 minutes for CI
6. Address any failures
7. Merge PR
8. Automatic deployment to production
9. ✨ Done!

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: Active
**Next Review**: After Phase 0 completion
