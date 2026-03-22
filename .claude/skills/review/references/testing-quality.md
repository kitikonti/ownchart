# Testing & Quality Assurance

Checklist for test coverage, error handling, testing best practices, and logging.

## Test Coverage

- [ ] Check that unit tests exist for all utilities and pure functions (100% target for critical modules)
- [ ] Check that tests exist for custom hooks
- [ ] Check that component tests test behavior, NOT implementation details (no testing of internal state)
- [ ] Check that edge cases are covered: empty values, null, undefined, extreme values, empty arrays/objects
- [ ] Check that error cases are tested: What happens with invalid inputs?
- [ ] Check whether integration tests exist for feature flows
- [ ] Check whether E2E tests (Playwright) would be useful for user-facing features — especially for: new UI workflows (dialogs, upload flows, multi-step interactions), critical user journeys (export, file save/load), features with browser API dependencies (file input, drag & drop, clipboard). Not every feature needs E2E tests, but features that involve real user behavior across multiple components should preferably be covered with E2E rather than unit tests

## Error Handling

- [ ] Check that try-catch blocks exist where errors can occur (parsing, file operations, external calls)
- [ ] Check that error messages are user-friendly — no technical stack traces for the end user
- [ ] Ensure that NO silent failures exist — errors must be logged or displayed to the user
- [ ] Check whether error boundaries exist for React component errors
- [ ] Check for graceful degradation: Feature fails, app continues running
- [ ] Check whether recovery mechanisms exist (retry, reset, alternative paths)

## Testing Best Practices

- [ ] Check that tests are deterministic — no flaky tests (no dependency on timing, order, or external state)
- [ ] Check that tests are isolated — no shared state between tests (beforeEach with clean setup)
- [ ] Check that test names describe behavior: `it('should calculate business days excluding weekends')` not `it('test 1')`
- [ ] Check AAA pattern: Arrange (setup), Act (execution), Assert (verification) — clearly separated
- [ ] Check that mocks are used sparingly — test real code where possible, only mock external dependencies

## Logging & Observability

- [ ] Ensure that NO `console.log` exists in production code — only in test/dev helper code
- [ ] Ensure that NO debug code exists: `debugger`, test-only branches, temporary flags
- [ ] Check that error messages contain enough context for debugging (but no sensitive data)
- [ ] Check that errors are logged with context information (which operation, which data, where in the flow)
