# Refactoring Opportunities

Checklist for refactoring opportunities: Constants, DRY, Component Extraction, Function Naming.

## Hardcoded Values → Constants/Config

- [ ] Check for magic numbers — every number without obvious meaning must become a named constant (e.g., `DEBOUNCE_DELAY_MS = 300` instead of `300`)
- [ ] Check for hardcoded color hex codes — these belong in `src/constants/colors.ts` or the Tailwind theme system
- [ ] Check for hardcoded strings — error messages and labels belong in `src/constants/messages.ts`
- [ ] Check for hardcoded configuration — API endpoints, feature flags, etc. belong in `src/config/`
- [ ] Check for hardcoded timeouts/durations — use named constants

## Duplication → DRY (Don't Repeat Yourself)

- [ ] Check for repeated logic → Extract to `src/utils/`
- [ ] Check for similar components → Create generic component with Props/Slots
- [ ] Check for copy-paste code blocks → Extract shared function
- [ ] Check for similar hooks → Create generalized custom hook
- [ ] Check for repeated JSX → Component extraction
- [ ] Check for repeated type definitions → Shared types file

## Component Extraction & Composition

- [ ] Check for nested JSX >20 lines → Extract sub-component
- [ ] Check for reusable UI patterns → Use `src/components/common/`
- [ ] Check for complex conditional rendering → Separate components + conditional mount instead of long ternaries
- [ ] Check for business logic in components → Extract custom hook (e.g., useTaskValidation)
- [ ] Check whether render props or children props would improve flexibility
- [ ] Check whether the Compound Component Pattern would be useful for complex UI (e.g., Dropdown.Trigger, Dropdown.Menu)

## Function Extraction & Naming

- [ ] Check for complex expressions → Named function that explains the intent
- [ ] Check for anonymous callback functions → Named function with clear purpose
- [ ] Check for long functions → Extract coherent sub-tasks
- [ ] Check naming: Names explain WHY, not WHAT — `calculateBusinessDays()` not `loopDates()`, `filterVisibleTasks()` not `filter()`
