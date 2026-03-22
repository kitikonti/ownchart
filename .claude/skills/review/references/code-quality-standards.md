# Code Quality & Standards

Checklist for TypeScript quality, naming, dead code, and code smells. Systematically check each item.

## TypeScript Strict Mode

- [ ] Check that NO `any` types are present — use `unknown` with type guards or proper typing
- [ ] Check that all functions have explicit return types
- [ ] Check that no unsafe type assertions (`as`) exist without a justification comment
- [ ] Check correct interface/type definitions: Interface for objects, Type for unions
- [ ] Check whether generic types are used where they would improve reusability
- [ ] Check whether discriminated unions are used for complex state types instead of string literals

## Code Organization

- [ ] Check that NO function is longer than 50 lines — if exceeded: Extract Method with a clear name
- [ ] Check that NO component is longer than 200 lines — if exceeded: Split into sub-components
- [ ] Check that Single Responsibility is maintained — one function = one task
- [ ] Check naming: Clear, descriptive names without abbreviations (`userData` not `usrDat`, `isTaskCompleted` not `flag`)
- [ ] Check logical grouping: Related functions are placed together
- [ ] Check export organization: Types first, then Functions/Components

## Dead Code Removal

- [ ] Check for unused imports — every import must be used
- [ ] Check for commented-out code — must be deleted (Git history exists)
- [ ] Check for unreachable code paths (code after return, unreachable branches)
- [ ] Check for unused variables, functions, or props
- [ ] Check for debug code: `console.log`, `console.debug`, `debugger` statements must be removed

## Code Smells (Martin Fowler's Catalog)

- [ ] **Long Method**: Functions >50 lines → Apply Extract Method
- [ ] **Large Class**: Files with too many responsibilities → Split into focused modules
- [ ] **Duplicated Code**: Identical or very similar code blocks → Extract to utility/hook
- [ ] **Long Parameter List**: More than 3-4 parameters → Use Parameter Object Pattern
- [ ] **Primitive Obsession**: Primitive types where domain types would be better → Create custom types (e.g., `TaskId` instead of `string`)
- [ ] **Switch Statements**: Long switch/if-else chains → Use Map/Record or polymorphism
- [ ] **Temporary Field**: Fields that are only sometimes set → Refactor state management
- [ ] **Message Chains**: `a.b.c.d.method()` → Follow the Law of Demeter, use intermediate variables or delegation
