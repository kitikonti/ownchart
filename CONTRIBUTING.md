# Contributing to OwnChart

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally
   ```bash
   git clone https://github.com/your-username/ownchart.git
   cd ownchart
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Create a branch** for your changes
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Before You Start

- Check existing issues and PRs to avoid duplicates
- For major changes, open an issue first to discuss
- Read the relevant documentation in `/concept`

### Making Changes

1. **Write code** following our style guide
2. **Add tests** for new functionality
3. **Update documentation** if needed
4. **Run quality checks**
   ```bash
   npm run ci:local
   ```

### Code Style

**TypeScript:**
- Use strict mode (no `any` types)
- Explicit return types for functions
- Descriptive variable names
- Follow existing patterns

**React:**
- Functional components with hooks
- Named exports (not default)
- Props interface for every component
- Keep components focused and under 200 lines

**Testing:**
- Write tests before implementation (TDD)
- Test coverage ≥80% overall
- 100% coverage for critical modules
- Include edge cases and error scenarios

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code change that neither fixes a bug nor adds a feature
- `test` - Adding or updating tests
- `chore` - Updating build tasks, package manager configs, etc.

**Examples:**
```
feat(tasks): add drag-and-drop for task reordering
fix(dependencies): prevent circular dependency creation
docs(readme): update installation instructions
test(utils): add edge cases for date calculations
```

## Pull Request Process

1. **Update documentation** for any changed functionality
2. **Ensure all tests pass** locally
   ```bash
   npm run ci:local
   ```
3. **Update version** in package.json if needed (maintainers will handle for releases)
4. **Create the PR** with a clear title and description
5. **Link related issues** using keywords (Fixes #123, Closes #456)
6. **Wait for review** - maintainers will review within 48 hours

### PR Title Format

Use the same format as commit messages:
```
feat: add task filtering by assignee
fix: resolve date calculation edge case
```

### PR Description Template

```markdown
## Description
Brief description of the changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Fixes #(issue number)

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests passing locally

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings generated
- [ ] Tests added that prove fix/feature works
```

## Testing Guidelines

### Test Coverage

Maintain these coverage levels:

- **Overall**: ≥80%
- **Critical modules**: 100%
  - `dependencyUtils.ts`
  - `validationUtils.ts`
  - `historyStore.ts`
  - `taskStore.ts`

### Writing Tests

**Unit Tests** (70% of tests):
```typescript
import { describe, it, expect } from 'vitest';
import { calculateDuration } from './dateUtils';

describe('calculateDuration', () => {
  it('calculates duration in days correctly', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-05');
    expect(calculateDuration(start, end)).toBe(4);
  });
});
```

**Integration Tests** (20% of tests):
```typescript
import { renderHook, act } from '@testing-library/react';
import { useTaskStore } from './taskStore';

describe('Task Store Integration', () => {
  it('creates task and updates dependencies', () => {
    // Test multi-component interactions
  });
});
```

**E2E Tests** (10% of tests):
```typescript
import { test, expect } from '@playwright/test';

test('user can create and edit task', async ({ page }) => {
  // Test complete user flows
});
```

## Code Review Process

### For Contributors

- Respond to review comments promptly
- Make requested changes in new commits (don't force push)
- Mark conversations as resolved when addressed
- Ask questions if feedback is unclear

### Review Checklist

Reviewers will check:

- [ ] Code quality and style
- [ ] Test coverage and quality
- [ ] Documentation updates
- [ ] No breaking changes (unless justified)
- [ ] Performance implications
- [ ] Security considerations
- [ ] Accessibility compliance

## Issue Guidelines

### Reporting Bugs

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- Version: [e.g., 1.0.0]

**Additional context**
Any other context about the problem.
```

### Requesting Features

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of the problem.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Other solutions you've thought about.

**Additional context**
Mockups, examples, or other context.
```

## Development Environment

### Required Tools

- Node.js 20.x or higher
- npm 10.x or higher
- Git
- Modern browser (Chrome, Firefox, or Safari)

### Recommended Tools

- VS Code with extensions:
  - ESLint
  - Prettier
  - TypeScript and JavaScript Language Features
  - Tailwind CSS IntelliSense
- Git GUI (GitKraken, SourceTree, or similar)

### IDE Setup

**VS Code Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

## Project Phases

Contributions should align with the current phase:

- **Phase 0** (v0.1.0): Foundation - Complete ✅
- **Phase 1** (v1.0.0): MVP - Current focus
- **Phase 2** (v1.x): Enhancements - Future
- **Phase 3** (v2.0): Advanced - Future

See [ROADMAP.md](./concept/docs/ROADMAP.md) for details.

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Provide constructive feedback
- Focus on what's best for the project
- Show empathy towards others

### Communication

- Use clear, concise language
- Provide context in discussions
- Link to relevant documentation
- Be patient with response times
- Assume good intentions

## Recognition

Contributors will be recognized in:

- Release notes
- Contributors section (coming soon)
- Git commit history

## Questions?

- Check existing documentation in `/concept`
- Search closed issues
- Ask in issue discussions
- Tag maintainers in PRs

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to the Gantt Chart Application!
