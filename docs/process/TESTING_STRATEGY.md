# Testing Strategy

## 1. Overview

This document defines the comprehensive testing strategy for the Gantt Chart application, including test types, coverage requirements, automation approach, and quality gates.

**Philosophy**: Testing is not a separate phase—it's integrated into every sprint. Every feature ships with tests.

**Target Metrics**:
- Unit test coverage: 80%+ (critical paths 100%)
- Integration test coverage: 60%+ (API boundaries, state management)
- E2E test coverage: All critical user workflows
- Zero critical bugs at release
- All accessibility criteria verified

---

## 2. Test Pyramid Strategy

**Distribution** (based on QA Tester recommendations):
- **70% Unit Tests**: Fast, isolated, component-level
- **20% Integration Tests**: State management, data flow, component interactions
- **10% E2E Tests**: Critical user workflows, cross-browser

**Rationale**:
- Unit tests provide fast feedback during development
- Integration tests catch state management issues
- E2E tests validate complete user journeys
- Pyramid structure ensures fast CI/CD pipeline (< 5 minutes)

```
         /\
        /  \       E2E Tests (10%)
       /____\      ~20 tests, ~2 min
      /      \
     /        \    Integration Tests (20%)
    /__________\   ~100 tests, ~1 min
   /            \
  /              \ Unit Tests (70%)
 /________________\ ~350 tests, ~30 sec
```

---

## 3. Unit Testing

### 3.1 Tools & Framework

- **Framework**: Vitest (fast, Vite-native)
- **Component Testing**: React Testing Library
- **Mocking**: Vitest mocks for external dependencies
- **Coverage**: c8 (Vitest built-in)

### 3.2 Coverage Requirements

**Overall**: 80%+ coverage of:
- Lines
- Branches
- Functions
- Statements

**Critical Modules** (100% coverage required):
- Dependency graph algorithms (topological sort, circular detection)
- Date calculation logic (auto-adjustment, constraints)
- File validation (JSON Schema, security checks)
- Arrow path calculation (routing, collision detection)
- History/undo system (state snapshots, command pattern)

### 3.3 Unit Test Categories

#### 3.3.1 Pure Functions

Test all pure utility functions with:
- Valid inputs (happy path)
- Edge cases (empty, null, undefined, extreme values)
- Invalid inputs (wrong types, out of range)

**Example**:
```typescript
describe('calculateTaskDuration', () => {
  it('calculates duration in days correctly', () => {
    expect(calculateTaskDuration('2025-01-01', '2025-01-08')).toBe(7);
  });

  it('handles same-day tasks', () => {
    expect(calculateTaskDuration('2025-01-01', '2025-01-01')).toBe(0);
  });

  it('throws error when end before start', () => {
    expect(() => calculateTaskDuration('2025-01-08', '2025-01-01'))
      .toThrow('End date must be after start date');
  });

  it('handles leap years correctly', () => {
    expect(calculateTaskDuration('2024-02-28', '2024-03-01')).toBe(2);
  });
});
```

#### 3.3.2 React Components

Test components in isolation with:
- Rendering with props
- User interactions (click, type, drag)
- State changes
- Conditional rendering
- Accessibility

**Example**:
```typescript
describe('TaskListItem', () => {
  it('renders task name and dates', () => {
    render(<TaskListItem task={mockTask} />);
    expect(screen.getByText('Design mockups')).toBeInTheDocument();
    expect(screen.getByText('Jan 1 - Jan 8')).toBeInTheDocument();
  });

  it('handles inline edit on double-click', async () => {
    const onEdit = vi.fn();
    render(<TaskListItem task={mockTask} onEdit={onEdit} />);

    const taskName = screen.getByText('Design mockups');
    await userEvent.dblClick(taskName);

    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', async () => {
    const onDelete = vi.fn();
    render(<TaskListItem task={mockTask} onDelete={onDelete} />);

    await userEvent.hover(screen.getByTestId('task-item'));
    await userEvent.click(screen.getByLabelText('Delete task'));

    expect(onDelete).toHaveBeenCalledWith(mockTask.id);
  });

  it('is keyboard accessible', async () => {
    render(<TaskListItem task={mockTask} />);

    const taskItem = screen.getByTestId('task-item');
    taskItem.focus();

    expect(taskItem).toHaveFocus();
    expect(taskItem).toHaveAttribute('tabindex', '0');
  });
});
```

#### 3.3.3 State Management (Zustand)

Test stores with:
- Initial state
- Actions and mutations
- Computed values
- Persistence

**Example**:
```typescript
describe('taskStore', () => {
  beforeEach(() => {
    useTaskStore.setState(initialState, true); // Reset store
  });

  it('initializes with empty tasks', () => {
    const { tasks } = useTaskStore.getState();
    expect(tasks).toEqual([]);
  });

  it('adds task with correct properties', () => {
    const { addTask } = useTaskStore.getState();
    addTask({ name: 'New Task' });

    const { tasks } = useTaskStore.getState();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      name: 'New Task',
      duration: 7,
      progress: 0
    });
    expect(tasks[0].id).toBeDefined();
  });

  it('updates task correctly', () => {
    const { addTask, updateTask } = useTaskStore.getState();
    const taskId = addTask({ name: 'Task 1' });

    updateTask(taskId, { name: 'Updated Task' });

    const { tasks } = useTaskStore.getState();
    expect(tasks[0].name).toBe('Updated Task');
  });

  it('deletes task and associated dependencies', () => {
    const { addTask, addDependency, deleteTask } = useTaskStore.getState();

    const task1 = addTask({ name: 'Task 1' });
    const task2 = addTask({ name: 'Task 2' });
    addDependency(task1, task2, 'FS');

    deleteTask(task1);

    const { tasks, dependencies } = useTaskStore.getState();
    expect(tasks).toHaveLength(1);
    expect(dependencies).toHaveLength(0);
  });
});
```

#### 3.3.4 Dependency Logic (Critical - 50-100 Test Cases)

**Topological Sort**:
- Empty graph
- Single task
- Linear chain (A→B→C)
- Complex DAG (multiple paths)
- Disconnected components

**Circular Detection**:
- Direct cycle (A→B→A)
- Indirect cycle (A→B→C→A)
- Self-dependency (A→A)
- Multiple cycles in graph

**Date Auto-Adjustment (FS only for MVP)**:
- Successor already after predecessor: no change
- Successor overlaps: adjust to end date + 1
- Chain reaction: A→B→C (adjust A affects C)
- Multiple predecessors: use latest constraint
- Weekend handling (if applicable)

**Example Test Suite**:
```typescript
describe('Dependency Graph - Circular Detection', () => {
  test('detects direct circular dependency', () => {
    const tasks = [taskA, taskB];
    const dependencies = [
      { from: 'A', to: 'B', type: 'FS' },
      { from: 'B', to: 'A', type: 'FS' }  // Circular!
    ];

    expect(hasCircularDependency(tasks, dependencies)).toBe(true);
    expect(findCycle(tasks, dependencies)).toEqual(['A', 'B', 'A']);
  });

  test('detects 3-node circular dependency', () => {
    const tasks = [taskA, taskB, taskC];
    const dependencies = [
      { from: 'A', to: 'B', type: 'FS' },
      { from: 'B', to: 'C', type: 'FS' },
      { from: 'C', to: 'A', type: 'FS' }  // Circular!
    ];

    expect(hasCircularDependency(tasks, dependencies)).toBe(true);
  });

  test('allows valid DAG with multiple paths', () => {
    // A→B→D, A→C→D (diamond shape - valid)
    const tasks = [taskA, taskB, taskC, taskD];
    const dependencies = [
      { from: 'A', to: 'B', type: 'FS' },
      { from: 'A', to: 'C', type: 'FS' },
      { from: 'B', to: 'D', type: 'FS' },
      { from: 'C', to: 'D', type: 'FS' }
    ];

    expect(hasCircularDependency(tasks, dependencies)).toBe(false);
  });

  test('rejects self-dependency', () => {
    const tasks = [taskA];
    const dependencies = [{ from: 'A', to: 'A', type: 'FS' }];

    expect(hasCircularDependency(tasks, dependencies)).toBe(true);
  });
});

describe('Dependency Date Auto-Adjustment (FS)', () => {
  test('adjusts successor when overlapping with predecessor', () => {
    const predecessor = { id: 'A', startDate: '2025-01-01', endDate: '2025-01-10' };
    const successor = { id: 'B', startDate: '2025-01-05', endDate: '2025-01-12' }; // Overlaps

    const adjusted = autoAdjustDates(predecessor, successor, 'FS');

    expect(adjusted.startDate).toBe('2025-01-11'); // Day after predecessor ends
    expect(adjusted.endDate).toBe('2025-01-18');   // Maintains 7-day duration
  });

  test('no adjustment when successor already after predecessor', () => {
    const predecessor = { id: 'A', startDate: '2025-01-01', endDate: '2025-01-10' };
    const successor = { id: 'B', startDate: '2025-01-15', endDate: '2025-01-22' }; // Already after

    const adjusted = autoAdjustDates(predecessor, successor, 'FS');

    expect(adjusted.startDate).toBe('2025-01-15'); // No change
    expect(adjusted.endDate).toBe('2025-01-22');
  });

  test('propagates changes through chain (A→B→C)', () => {
    const taskA = { id: 'A', startDate: '2025-01-01', endDate: '2025-01-05' };
    const taskB = { id: 'B', startDate: '2025-01-03', endDate: '2025-01-08' };
    const taskC = { id: 'C', startDate: '2025-01-05', endDate: '2025-01-10' };
    const dependencies = [
      { from: 'A', to: 'B', type: 'FS' },
      { from: 'B', to: 'C', type: 'FS' }
    ];

    const affectedTasks = propagateDateChanges(taskA, '2025-01-10', 'end', [taskA, taskB, taskC], dependencies);

    // A ends 2025-01-10, so B should start 2025-01-11, which pushes C to 2025-01-17
    expect(affectedTasks).toHaveLength(2); // B and C affected
    expect(affectedTasks.find(t => t.id === 'B').startDate).toBe('2025-01-11');
    expect(affectedTasks.find(t => t.id === 'C').startDate).toBe('2025-01-17');
  });

  test('handles multiple predecessors (uses latest constraint)', () => {
    const taskA = { id: 'A', startDate: '2025-01-01', endDate: '2025-01-10' };
    const taskB = { id: 'B', startDate: '2025-01-01', endDate: '2025-01-15' }; // Ends later
    const taskC = { id: 'C', startDate: '2025-01-05', endDate: '2025-01-12' };
    const dependencies = [
      { from: 'A', to: 'C', type: 'FS' },
      { from: 'B', to: 'C', type: 'FS' }
    ];

    const adjusted = autoAdjustDatesMultiple([taskA, taskB], taskC, dependencies);

    expect(adjusted.startDate).toBe('2025-01-16'); // Day after latest predecessor (B)
  });
});
```

**Total Dependency Tests**: Minimum 50, target 100 for comprehensive edge case coverage.

---

## 4. Integration Testing

### 4.1 Scope

Integration tests verify:
- Component interactions
- State management flows
- Data persistence (IndexedDB, file operations)
- Cross-cutting concerns (history, undo/redo)

### 4.2 Tools

- **Framework**: Vitest
- **Testing Library**: React Testing Library
- **Mock Browser APIs**: Vitest vi.stubGlobal for IndexedDB, FileReader, etc.

### 4.3 Integration Test Scenarios

#### 4.3.1 Task CRUD with State Management

```typescript
describe('Task Management Integration', () => {
  it('creates task, adds dependency, verifies state and UI update', async () => {
    render(<App />);

    // Create task 1
    await userEvent.click(screen.getByLabelText('Add Task'));
    await userEvent.type(screen.getByRole('textbox'), 'Task 1{Enter}');

    // Create task 2
    await userEvent.click(screen.getByLabelText('Add Task'));
    await userEvent.type(screen.getByRole('textbox'), 'Task 2{Enter}');

    // Create dependency: Task 1 → Task 2
    const task1Bar = screen.getByTestId('task-bar-1');
    await userEvent.hover(task1Bar);
    const handle = screen.getByLabelText('Create dependency from Task 1');
    await userEvent.dragAndDrop(handle, screen.getByTestId('task-bar-2'));

    // Verify dependency arrow rendered
    expect(screen.getByTestId('dependency-arrow-1-2')).toBeInTheDocument();

    // Verify state
    const { dependencies } = useTaskStore.getState();
    expect(dependencies).toHaveLength(1);
    expect(dependencies[0]).toMatchObject({
      fromTaskId: 'task-1',
      toTaskId: 'task-2',
      type: 'FS'
    });
  });
});
```

#### 4.3.2 File Save/Load Integration

```typescript
describe('File Operations Integration', () => {
  it('saves chart to file and reloads correctly', async () => {
    // Setup: Create chart with tasks and dependencies
    const { addTask, addDependency } = useTaskStore.getState();
    const task1 = addTask({ name: 'Design' });
    const task2 = addTask({ name: 'Development' });
    addDependency(task1, task2, 'FS');

    render(<App />);

    // Trigger save
    await userEvent.click(screen.getByLabelText('Save'));

    // Mock file download
    const blob = await getLastDownloadedBlob();
    const fileContent = await blob.text();
    const data = JSON.parse(fileContent);

    // Verify file structure
    expect(data.version).toBe('1.0');
    expect(data.tasks).toHaveLength(2);
    expect(data.dependencies).toHaveLength(1);

    // Reset state
    useTaskStore.setState(initialState, true);

    // Load file
    const file = new File([fileContent], 'test.ownchart', { type: 'application/json' });
    await userEvent.upload(screen.getByLabelText('Open'), file);

    // Verify UI and state restored
    expect(screen.getByText('Design')).toBeInTheDocument();
    expect(screen.getByText('Development')).toBeInTheDocument();

    const { tasks, dependencies } = useTaskStore.getState();
    expect(tasks).toHaveLength(2);
    expect(dependencies).toHaveLength(1);
  });
});
```

#### 4.3.3 Undo/Redo Integration

```typescript
describe('History System Integration', () => {
  it('undoes and redoes task creation and dependency', async () => {
    render(<App />);

    // Create task
    await userEvent.click(screen.getByLabelText('Add Task'));
    await userEvent.type(screen.getByRole('textbox'), 'Task 1{Enter}');

    expect(screen.getByText('Task 1')).toBeInTheDocument();

    // Undo task creation
    await userEvent.keyboard('{Control>}z{/Control}');

    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();

    // Redo
    await userEvent.keyboard('{Control>}{Shift>}z{/Shift}{/Control}');

    expect(screen.getByText('Task 1')).toBeInTheDocument();
  });

  it('undoes dependency creation and auto-adjusted dates', async () => {
    // Setup: Two tasks with dependency that causes date adjustment
    const { addTask, addDependency } = useTaskStore.getState();
    const task1 = addTask({ name: 'A', startDate: '2025-01-01', endDate: '2025-01-10' });
    const task2 = addTask({ name: 'B', startDate: '2025-01-05', endDate: '2025-01-12' }); // Overlaps

    render(<App />);

    const originalTask2Date = useTaskStore.getState().tasks.find(t => t.id === task2).startDate;

    // Create dependency (will auto-adjust task2)
    await createDependencyViaUI(task1, task2);

    const adjustedTask2 = useTaskStore.getState().tasks.find(t => t.id === task2);
    expect(adjustedTask2.startDate).toBe('2025-01-11'); // Adjusted

    // Undo
    await userEvent.keyboard('{Control>}z{/Control}');

    // Verify dependency removed AND date reverted
    const { dependencies, tasks } = useTaskStore.getState();
    expect(dependencies).toHaveLength(0);
    expect(tasks.find(t => t.id === task2).startDate).toBe(originalTask2Date);
  });
});
```

---

## 5. End-to-End (E2E) Testing

### 5.1 Tools

- **Framework**: Playwright
- **Browsers**: Chromium, Firefox, WebKit (Safari)
- **Headless**: Yes for CI, headed for debugging
- **Parallelization**: Yes (3 workers)

### 5.2 Critical User Workflows

Test complete user journeys from start to finish:

#### 5.2.1 E2E Test: Create Project Plan

```typescript
test('User creates complete project plan with dependencies', async ({ page }) => {
  await page.goto('/');

  // Step 1: Create tasks
  await page.click('button:has-text("Add Task")');
  await page.fill('input[name="task-name"]', 'Design');
  await page.press('input[name="task-name"]', 'Enter');

  await page.click('button:has-text("Add Task")');
  await page.fill('input[name="task-name"]', 'Development');
  await page.press('input[name="task-name"]', 'Enter');

  await page.click('button:has-text("Add Task")');
  await page.fill('input[name="task-name"]', 'Testing');
  await page.press('input[name="task-name"]', 'Enter');

  // Step 2: Set task dates
  await page.click('text=Design');
  await page.fill('input[name="start-date"]', '2025-01-01');
  await page.fill('input[name="end-date"]', '2025-01-10');
  await page.press('input[name="end-date"]', 'Enter');

  // Step 3: Create dependencies
  await page.hover('[data-testid="task-bar-design"]');
  await page.dragAndDrop(
    '[data-testid="connection-handle-design-right"]',
    '[data-testid="connection-handle-development-left"]'
  );

  await page.hover('[data-testid="task-bar-development"]');
  await page.dragAndDrop(
    '[data-testid="connection-handle-development-right"]',
    '[data-testid="connection-handle-testing-left"]'
  );

  // Step 4: Verify dependency arrows
  await expect(page.locator('[data-testid="dependency-arrow-design-development"]')).toBeVisible();
  await expect(page.locator('[data-testid="dependency-arrow-development-testing"]')).toBeVisible();

  // Step 5: Verify auto-adjusted dates
  const devStartDate = await page.inputValue('[data-testid="task-development-start-date"]');
  expect(devStartDate).toBe('2025-01-11'); // Day after Design ends

  // Step 6: Save file
  await page.click('button:has-text("Save")');
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Download")')
  ]);
  expect(download.suggestedFilename()).toContain('.ownchart');

  // Step 7: Verify success message
  await expect(page.locator('text=Saved successfully')).toBeVisible();
});
```

#### 5.2.2 E2E Test: Export PNG

```typescript
test('User exports Gantt chart to PNG', async ({ page }) => {
  // Setup: Load chart with tasks
  await page.goto('/');
  await loadTestChart(page, 'project-plan.ownchart');

  // Open export dialog
  await page.click('button:has-text("Export")');
  await page.click('text=PNG');

  // Configure export settings
  await page.selectOption('select[name="resolution"]', '300');
  await page.check('input[name="include-task-list"]');

  // Trigger export
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.click('button:has-text("Export PNG")')
  ]);

  // Verify download
  expect(download.suggestedFilename()).toMatch(/\.png$/);
  const path = await download.path();
  const fileSize = (await fs.stat(path)).size;
  expect(fileSize).toBeGreaterThan(10000); // At least 10KB
});
```

#### 5.2.3 E2E Test: Keyboard Navigation

```typescript
test('User navigates chart using only keyboard', async ({ page }) => {
  await page.goto('/');
  await loadTestChart(page, 'sample-chart.ownchart');

  // Tab to first task
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');

  // Verify focus on first task
  await expect(page.locator('[data-testid="task-1"]')).toBeFocused();

  // Navigate down with arrow keys
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('[data-testid="task-2"]')).toBeFocused();

  // Press Enter to edit
  await page.keyboard.press('Enter');
  await expect(page.locator('input[name="task-name"]')).toBeFocused();

  // Type new name
  await page.keyboard.type('Updated Task Name');
  await page.keyboard.press('Enter');

  // Verify update
  await expect(page.locator('text=Updated Task Name')).toBeVisible();

  // Test undo with keyboard
  await page.keyboard.press('Control+Z');
  await expect(page.locator('text=Updated Task Name')).not.toBeVisible();
});
```

### 5.3 Cross-Browser Testing Matrix

| Browser | Platform | Min Version | Test Frequency |
|---------|----------|-------------|----------------|
| Chrome  | All      | 90+         | Every PR       |
| Firefox | All      | 88+         | Every PR       |
| Safari  | macOS    | 14+         | Every PR       |
| Edge    | Windows  | 90+         | Weekly         |

---

## 6. Visual Regression Testing

### 6.1 Tool

- **Percy.io** (free tier: 5,000 snapshots/month) OR
- **Playwright Screenshots** + **pixelmatch** (fully free, self-hosted)

### 6.2 Snapshots

Capture visual snapshots of:
- Empty state
- Chart with 10 tasks
- Chart with 10 tasks + 5 dependencies
- All component states (hover, focus, active, disabled)
- All theme variations
- Responsive breakpoints

### 6.3 Implementation

```typescript
test('Visual regression: Gantt chart with dependencies', async ({ page }) => {
  await page.goto('/');
  await loadTestChart(page, 'visual-test-chart.ownchart');

  await page.waitForSelector('[data-testid="gantt-canvas"]');

  // Take full-page screenshot
  await expect(page).toHaveScreenshot('gantt-chart-dependencies.png', {
    fullPage: true,
    threshold: 0.2  // Allow 20% difference (fonts, rendering variations)
  });
});
```

---

## 7. Accessibility (a11y) Testing

### 7.1 Tools

- **axe-core** via @axe-core/playwright
- **Pa11y** for CI automation
- **Manual testing** with screen readers (NVDA, JAWS, VoiceOver)

### 7.2 Automated Accessibility Tests

```typescript
test('Accessibility: No violations on main page', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page }).analyze();

  expect(results.violations).toEqual([]);
});

test('Accessibility: Gantt chart canvas is keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await loadTestChart(page, 'sample-chart.ownchart');

  // Verify all interactive elements are reachable via Tab
  const focusableElements = await page.$$('[tabindex]:not([tabindex="-1"])');
  expect(focusableElements.length).toBeGreaterThan(10);

  // Verify ARIA labels
  const canvas = page.locator('[role="application"]');
  await expect(canvas).toHaveAttribute('aria-label', /Gantt chart/);
});

test('Accessibility: Color contrast meets WCAG AA', async ({ page }) => {
  await page.goto('/');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa'])
    .analyze();

  expect(results.violations.filter(v => v.id.includes('color-contrast'))).toEqual([]);
});
```

### 7.3 Manual Accessibility Checklist

- [ ] All interactive elements reachable via keyboard
- [ ] Focus indicators visible (not outline:none)
- [ ] Screen reader announces all actions
- [ ] Dependency creation accessible via keyboard (Select task, press 'D', select target)
- [ ] All images have alt text
- [ ] Color is not the only means of conveying information
- [ ] ARIA live regions announce state changes

---

## 8. Performance Testing

### 8.1 Performance Benchmarks

| Scenario | Target | Measurement |
|----------|--------|-------------|
| Initial load | < 2s | Lighthouse Performance Score > 90 |
| Render 100 tasks | 60fps | Chrome DevTools Performance |
| Render 500 tasks | 30fps | Chrome DevTools Performance |
| Render 100 arrows | 60fps | Chrome DevTools Performance |
| Undo/redo | < 100ms | Custom perf marks |
| File save (1000 tasks) | < 500ms | Custom perf marks |
| File load (1000 tasks) | < 1s | Custom perf marks |

### 8.2 Performance Testing Tools

- **Lighthouse CI**: Automated performance regression detection
- **Chrome DevTools Performance**: Manual profiling
- **React DevTools Profiler**: Component render performance

### 8.3 Lighthouse CI Configuration

```yaml
# .lighthouserc.json
{
  "ci": {
    "collect": {
      "startServerCommand": "npm run preview",
      "url": ["http://localhost:4173"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
        "interactive": ["error", {"maxNumericValue": 3000}],
        "speed-index": ["error", {"maxNumericValue": 3000}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

---

## 9. Security Testing

### 9.1 Automated Security Scans

- **npm audit**: Run on every PR (fail on high/critical)
- **Snyk** (free tier): Dependency vulnerability scanning
- **OWASP ZAP** (free): Web app security testing

### 9.2 Security Test Cases

```typescript
describe('Security: File Validation', () => {
  it('rejects files larger than 10MB', async () => {
    const largeFile = createMockFile(11 * 1024 * 1024); // 11MB

    await expect(loadChartFile(largeFile)).rejects.toThrow('File too large');
  });

  it('rejects files with invalid JSON', async () => {
    const invalidFile = new File(['not json'], 'test.ownchart');

    await expect(loadChartFile(invalidFile)).rejects.toThrow('Invalid file format');
  });

  it('sanitizes task names to prevent XSS', () => {
    const maliciousName = '<script>alert("xss")</script>';
    const sanitized = sanitizeTaskName(maliciousName);

    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toBe('alert("xss")'); // Tags stripped
  });

  it('validates against JSON Schema before loading', async () => {
    const invalidData = { version: '1.0', tasks: 'not an array' };
    const file = new File([JSON.stringify(invalidData)], 'test.ownchart');

    await expect(loadChartFile(file)).rejects.toThrow('Schema validation failed');
  });
});
```

---

## 10. CI/CD Quality Gates

### 10.1 Required Checks (Block Merge)

Every PR must pass:
1. ✅ All unit tests (80%+ coverage)
2. ✅ All integration tests
3. ✅ All E2E tests (Chrome, Firefox, Safari)
4. ✅ ESLint (zero errors, warnings allowed)
5. ✅ TypeScript compilation (strict mode)
6. ✅ npm audit (no high/critical vulnerabilities)
7. ✅ Lighthouse CI (Performance > 90, a11y > 95)

### 10.2 Optional Checks (Warning Only)

1. ⚠️ Visual regression (require manual review if failed)
2. ⚠️ Bundle size increase > 10%
3. ⚠️ Test coverage decrease

### 10.3 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run test:unit -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
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
          node-version: 20
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npm run test:e2e -- --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-screenshots-${{ matrix.browser }}
          path: test-results/

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - run: npm run lighthouse:ci

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm audit --audit-level=high
```

---

## 11. Test Data Management

### 11.1 Fixtures

Create reusable test data:

```typescript
// tests/fixtures/tasks.ts
export const mockTasks = {
  simple: {
    id: 'task-1',
    name: 'Simple Task',
    startDate: '2025-01-01',
    endDate: '2025-01-07',
    duration: 7,
    progress: 0
  },

  withDependency: [
    { id: 'task-1', name: 'Design', startDate: '2025-01-01', endDate: '2025-01-10' },
    { id: 'task-2', name: 'Development', startDate: '2025-01-11', endDate: '2025-01-25' }
  ],

  complex: () => generateTasks(100), // Factory function

  minimal: { id: 'task-1', name: 'Test' } // Only required fields
};
```

### 11.2 Test Chart Files

Provide `.ownchart` files for testing:
- `tests/fixtures/empty.ownchart` - Empty chart
- `tests/fixtures/simple-project.ownchart` - 5 tasks, 2 dependencies
- `tests/fixtures/complex-project.ownchart` - 50 tasks, 30 dependencies
- `tests/fixtures/stress-test.ownchart` - 1000 tasks, 500 dependencies

---

## 12. Testing Schedule

### 12.1 During Development (Continuous)

- Unit tests: Run on file save (watch mode)
- Linting: Run on file save (ESLint + Prettier)
- Type checking: Run on file save (TypeScript)

### 12.2 Pre-Commit

- Unit tests for changed files
- Linting and formatting
- Type checking

### 12.3 Pre-Push

- All unit tests
- Integration tests
- E2E smoke tests (critical paths only, ~1 min)

### 12.4 CI (Every PR)

- Full test suite (unit + integration + E2E)
- Visual regression
- Performance benchmarks
- Accessibility scans
- Security scans

### 12.5 Pre-Release

- Full test suite on all browsers
- Manual exploratory testing
- Manual accessibility testing (screen readers)
- Performance profiling with 1000 tasks
- Security audit

---

## 13. Bug Triage & Severity

| Severity | Definition | SLA | Examples |
|----------|------------|-----|----------|
| P0 (Critical) | App unusable, data loss | Fix immediately | Cannot save files, all tasks deleted |
| P1 (High) | Core feature broken | Fix within 24h | Dependencies don't create, undo doesn't work |
| P2 (Medium) | Feature partially broken | Fix within 1 week | Export PNG fails for large charts |
| P3 (Low) | Minor issue, workaround exists | Fix within 1 month | Tooltip position slightly off |
| P4 (Nice-to-have) | Cosmetic, enhancement | Backlog | Button animation could be smoother |

---

## 14. Test Maintenance

### 14.1 Regular Cleanup

- **Monthly**: Review and remove flaky tests
- **Quarterly**: Update test dependencies
- **After major refactor**: Update all affected tests

### 14.2 Test Code Quality

- Tests should be as maintainable as production code
- Use page objects for E2E tests (DRY principle)
- Avoid hardcoded waits (use waitFor* methods)
- Clear test names (Given-When-Then or Should-When format)

---

## 15. Success Metrics

### 15.1 Coverage Targets

- **Phase 0 (Foundation)**: 60%+ unit coverage (basic infrastructure)
- **Phase 1 (MVP)**: 80%+ unit coverage, all critical paths 100%
- **Phase 2 (Beta)**: 85%+ unit coverage, full E2E suite
- **Phase 3 (V1.0)**: 90%+ unit coverage, comprehensive test suite

### 15.2 Quality KPIs

- Zero critical bugs at release
- < 5 high-priority bugs at release
- 95%+ passing rate for automated tests
- < 5% flaky test rate
- CI pipeline < 10 minutes
- All accessibility criteria met (WCAG 2.1 AA)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-12
**Status**: Active
**Next Review**: After Phase 0 completion
