# Architecture & Design Patterns

Checklist for architecture and design decisions. Systematically check each item against the file under review.

## Architecture Decisions

- [ ] Check that the file is located in the correct layer (components vs utils vs store vs hooks vs config vs types)
- [ ] Check that established architecture patterns of the project are followed
- [ ] Ensure that UI, Business Logic, State, and Side Effects are cleanly separated
- [ ] Check whether the right level of abstraction was chosen — not too generic, not too specific

## SOLID Principles

- [ ] **Single Responsibility**: Does this file/component have exactly one clearly defined purpose? If the description contains "and", it should be split
- [ ] **Open/Closed**: Can the functionality be extended without modifying existing code? (e.g., through Props, configuration, callbacks)
- [ ] **Dependency Inversion**: Does the code depend on abstractions, not concrete implementations? (e.g., interfaces instead of direct imports)
- [ ] **Interface Segregation**: Are there no unused Props or bloated interfaces? Every property should actually be used by the consumer

## Design Patterns Usage

- [ ] Check whether the right pattern was chosen for the problem (Observer, Factory, Command, etc.)
- [ ] Check that Zustand slices follow the established patterns (Actions, Selectors, Immer middleware)
- [ ] Check that the Command Pattern is used correctly for Undo/Redo (invertible operations)
- [ ] Question: Is there a simpler pattern that would work better here?

## Coupling & Cohesion

- [ ] **Low Coupling**: Minimal dependencies between modules. Check the import list — too many imports = too high coupling
- [ ] **High Cohesion**: Related functionality is grouped together. Unrelated functionality belongs in separate files
- [ ] Check for circular dependencies — A imports B imports A is an architecture problem
- [ ] Are there dependency injection opportunities that would improve testability?

## State Management Architecture

- [ ] Check that state lives at the correct level: Local state (useState) vs. global state (Zustand Store)
- [ ] Check that Zustand slices are focused and properly organized (taskSlice, chartSlice, historySlice, etc.)
- [ ] Ensure that no prop drilling is happening — use the Zustand Store directly instead
- [ ] Check that state updates are immutable and Immer middleware is used correctly (no manual object spreads in Immer actions)
