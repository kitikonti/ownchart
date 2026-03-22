# Performance & Optimization

Checklist for React performance, algorithmic efficiency, bundle size, and memory management.

## React Performance Patterns

- [ ] Check whether `React.memo()` is used on expensive components — especially components that re-render frequently but rarely receive new props
- [ ] Check whether `useMemo()` is used for expensive calculations — but NOT for trivial operations (premature optimization)
- [ ] Check whether `useCallback()` is used for event handlers passed to memoized children
- [ ] Check dependency arrays for correctness — missing dependencies = bugs, unnecessary dependencies = superfluous re-renders
- [ ] Check that list items have stable, unique keys — NOT the array index if the list can be reordered
- [ ] Check whether lazy loading would be useful for heavy components (`React.lazy` + Suspense)

## Algorithmic Efficiency

- [ ] Check for O(n²) nested loops where O(n) would be possible — use Map/Set for lookups instead of Array.find/Array.includes in loops
- [ ] Check that expensive calculations do NOT happen in the render path — use useMemo/useEffect
- [ ] Check whether debouncing/throttling is used for frequent events (scroll, resize, input)
- [ ] Check whether efficient data structures are used: Map for lookups, Set for uniqueness
- [ ] Check for early returns — avoid unnecessary work early
- [ ] Check whether pagination/virtualization is needed for long lists (>100 items)

## Bundle Size & Loading

- [ ] Check for unused library imports — tree-shaking only works when no side effects are imported
- [ ] Check whether large dependencies can be code-split
- [ ] Ensure that NO entire libraries are imported when only parts are needed (`import debounce from 'lodash/debounce'` NOT `import _ from 'lodash'`)
- [ ] Check whether images are optimized (WebP, compressed, responsive sizes)

## Memory Management

- [ ] Check that event listeners are cleaned up in useEffect cleanup (return function)
- [ ] Check that timers/intervals are cleaned up on unmount (clearTimeout, clearInterval)
- [ ] Check that subscriptions are unsubscribed
- [ ] Check for memory leaks: Large objects that are not freed, growing arrays/maps without limits
- [ ] Check that no closures close over stale state values (stale closures)

## Render Optimization

- [ ] Check whether expensive renders should be analyzed with React DevTools Profiler
- [ ] Check whether virtualization is needed for long lists (react-window/react-virtual)
- [ ] Check whether Suspense boundaries would be useful for loading states
- [ ] Check whether DOM updates are minimized — use batch updates where possible
