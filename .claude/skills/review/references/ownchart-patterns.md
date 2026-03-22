# OwnChart-Specific Architecture

Checklist for project-specific patterns: Zustand state management, .ownchart file format, undo/redo, component architecture, and Tailwind.

## State Management (Zustand)

- [ ] Check that slices follow the project patterns: Actions are semantic (`addTask()` not `setState()`), selectors are extracted
- [ ] Check that Immer middleware is used correctly — NO manual object spreading in Immer actions, direct mutation of the draft state is correct
- [ ] Ensure that NO direct state mutation happens outside of Immer
- [ ] Check that state is normalized — no nested arrays/objects that duplicate data
- [ ] Check that store access happens through hooks: `useTaskStore()`, `useChartStore()` etc.
- [ ] Check that cross-store access uses `getState()` where needed (e.g., in navigateCell)

## File Format Compatibility (.ownchart)

- [ ] Check that changes maintain backward compatibility with existing .ownchart files
- [ ] Check that validation handles faulty data gracefully (no crashes on old files)
- [ ] Ensure that NO breaking changes are introduced without a migration strategy
- [ ] Check that the file format version is tracked when structural changes are made
- [ ] Check round-trip consistency: Save → Load → Save produces identical file

## Undo/Redo System (historySlice)

- [ ] Check that ALL user-initiated mutations are integrated into the history
- [ ] Check that the Command Pattern is correctly followed: Every operation must be invertible
- [ ] Check that the history does NOT capture intermediate drag states — only the final state
- [ ] Check that the history stack size is limited — no memory leaks during long sessions

## Component Architecture

- [ ] Check that SVAR-style layout patterns are followed: Sticky headers, synchronized scrolling
- [ ] Check that D3.js is ONLY used for what React cannot handle efficiently (scales, SVG helpers, axis rendering)
- [ ] Check that timeline rendering is optimized — only the visible area should be rendered for >1000 tasks
- [ ] Check that refs are used appropriately: DOM access, D3 integration, performance-critical DOM manipulation (e.g., SplitPane drag)

## TailwindCSS Usage

- [ ] Check that Tailwind classes are used, NOT inline styles or separate CSS
- [ ] Check that custom classes in `index.css` are ONLY for truly reusable utilities
- [ ] Ensure that NO hardcoded colors exist — use the Tailwind color system or custom theme
- [ ] Check whether responsive design with Tailwind breakpoints is needed

## Import Organization

- [ ] Check that absolute imports from `src/` are used (not relative paths like `../../../`)
- [ ] Check import grouping: React/libraries first, then local imports, then types
- [ ] Check for circular imports — if needed, use `madge --circular src/` to verify
