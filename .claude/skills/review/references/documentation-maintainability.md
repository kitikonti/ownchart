# Documentation & Maintainability

Checklist for code documentation, self-documenting code, and commit standards.

## Code Documentation

- [ ] Check that complex logic has comments explaining the WHY (not the what — code explains itself)
- [ ] Ensure that NO obvious comments exist: `// increment i` for `i++` is unnecessary
- [ ] Check whether JSDoc is present for public APIs/utilities (parameters, return, examples)
- [ ] Check that type definitions serve as inline documentation — good types replace many comments
- [ ] Check whether README/docs need to be updated when public APIs change
- [ ] Check whether architecture decisions are documented (in the code as comments or in docs/)

## Self-Documenting Code

- [ ] Check that variable names explain the purpose: `isTaskCompleted` not `flag`, `selectedTaskIds` not `ids`
- [ ] Check that function names are verbs: `calculateTotalDuration()` not `total()`, `filterVisibleTasks()` not `filter()`
- [ ] Check that boolean names are questions: `hasChildren`, `canEdit`, `isVisible`, `shouldAutoScroll`
- [ ] Check that constant names explain meaning: `MAX_TASK_DEPTH = 10` not `MAX = 10`, `SCROLL_DEBOUNCE_MS = 150` not `DELAY = 150`
- [ ] Check that enum/union values are self-explanatory: `'fit-to-page' | 'custom-zoom'` not `'mode1' | 'mode2'`

## Help Documentation Completeness

- [ ] New user-facing features have a HelpTopic in `src/config/helpContent.ts`
- [ ] Changed shortcuts are reflected in the shortcuts tab data in `helpContent.ts`
- [ ] Removed features don't have stale help topics
- [ ] Help topic descriptions match current implementation

## Commit Messages

- [ ] Check that Conventional Commits format is followed (feat:, fix:, refactor:, perf:, test:, docs:, chore:, ui:)
- [ ] Check that messages are descriptive: "fix: prevent crash when loading file with missing dates" not "fix bug"
- [ ] Check that commits are atomic: One logical change per commit, not multiple unrelated changes
