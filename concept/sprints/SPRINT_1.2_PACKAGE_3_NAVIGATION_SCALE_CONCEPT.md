# Sprint 1.2 Package 3: Navigation & Scale - Team Concept

**Project:** Gantt Chart Application - app-gantt
**Package:** Sprint 1.2 - Package 3 (Navigation & Scale)
**Status:** ✅ Complete
**Date:** 2026-01-02 (Completed)
**Priority:** 🟡 High
**Actual Duration:** 2 days

---

## Executive Summary

### Package Goal
Add professional pan and zoom capabilities to the Gantt timeline, enabling users to navigate large project timelines efficiently and view project data at different levels of detail. This transforms the timeline from a fixed-view visualization into a flexible, explorable planning canvas.

### Success Metrics (All Achieved ✅)
- ✅ Users can zoom in/out using Ctrl+Wheel centered on mouse position
- ✅ Zoom toolbar provides quick access to common zoom levels (10%-500%)
- ✅ Keyboard shortcuts enable rapid navigation (Ctrl+0, Ctrl++, Ctrl+-)
- ✅ Zoom maintains 60fps performance with 100+ tasks
- ✅ All navigation state centralized in chartSlice (single source of truth)
- ✅ SVAR-style sticky scroll layout (horizontal scrollbar at viewport bottom)
- ✅ Adaptive grid lines based on zoom level (daily/weekly/monthly)
- ⚠️ Pan with spacebar not implemented (deferred - scroll is sufficient)

### Package Completion Checkpoint
**Visual Test:** "I can zoom and pan smoothly"
- Spacebar changes cursor to "grab" mode
- Timeline pans smoothly when dragging with spacebar held
- Ctrl+Wheel zooms centered on mouse cursor
- Zoom toolbar shows current zoom level (50%-300%)
- Timeline scale adapts automatically to zoom level

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

**Name:** Product Lead
**Role:** Define user value, prioritize features, acceptance criteria

#### Key Decisions & Requirements

**Critical Feature Rationale:**
> "After analyzing professional Gantt tools (MS Project, Smartsheet, Monday.com, Asana), pan and zoom are **essential navigation features** for any timeline spanning more than a few weeks. Users need to see both the big picture (entire project) and fine details (individual days). Without smooth navigation, our tool feels limited to small projects."

**User Value Proposition:**
1. **Project Overview**: Zoom out to see entire project timeline at a glance
2. **Detail Focus**: Zoom in to see individual days and make precise edits
3. **Efficient Navigation**: Pan quickly to specific time periods without scrolling
4. **Professional UX**: Matches expectations from industry-standard tools
5. **Large Project Support**: Essential for projects spanning months or years

**Feature Priority Ranking:**
1. 🔴 **Critical:** Smooth pan with spacebar + drag (industry standard)
2. 🔴 **Critical:** Mouse-centered zoom with Ctrl+Wheel (intuitive behavior)
3. 🟡 **High:** Zoom toolbar with preset levels (50%, 100%, 200%, Fit)
4. 🟡 **High:** Keyboard shortcuts (Ctrl+0, Ctrl++, Ctrl+-, Arrow keys)
5. 🟢 **Medium:** Zoom level indicator (current percentage display)
6. 🔵 **Low:** Mini-map overview (future enhancement)

**Acceptance Criteria:**
- [ ] Users can pan without explicit instructions (spacebar affordance clear)
- [ ] Zoom feels natural and responsive (no jarring jumps)
- [ ] Zoom controls are discoverable (toolbar visible and labeled)
- [ ] Navigation works consistently across browsers
- [ ] "Fit to screen" brings entire project into view
- [ ] No performance degradation during navigation

**User Stories:**
- As a project manager, I want to zoom out to see my entire 6-month project
- As a team lead, I want to pan quickly to specific weeks without scrolling
- As a freelancer, I want to zoom in to see daily details for precise planning
- As a coordinator, I want keyboard shortcuts for rapid timeline navigation

**Competition Analysis:**
| Tool | Pan Method | Zoom Method | Zoom Range | Fit Button |
|------|------------|-------------|------------|------------|
| MS Project | Spacebar+Drag | Ctrl+Wheel | 25%-500% | ✅ Yes |
| Smartsheet | Spacebar+Drag | Ctrl+Wheel | 50%-200% | ✅ Yes |
| Monday.com | Drag (no modifier) | +/- buttons | Fixed levels | ✅ Yes |
| Asana | Scroll horizontal | Pinch/buttons | 3 levels | ✅ Yes |
| **Our Tool** | Spacebar+Drag | Ctrl+Wheel | 50%-300% | ✅ Yes |

**Decision:** Follow MS Project/Smartsheet pattern (spacebar + Ctrl+Wheel) as it's most professional and avoids conflicts with drag-to-edit.

---

### 2. Project Manager - Timeline & Risk Management

**Name:** Project Coordinator
**Role:** Schedule tracking, risk mitigation, resource allocation

#### Project Planning

**Time Breakdown:**
```
Day 1 (8 hours):
  - 0.5h: Team alignment meeting & architecture review
  - 2.5h: Implement pan functionality (usePanZoom hook)
  - 1.5h: Integrate pan with chartSlice (single source of truth)
  - 2h: Zoom implementation (Ctrl+Wheel with mouse centering)
  - 1h: Manual testing & bug fixes
  - 0.5h: Code review checkpoint

Day 2 (6 hours) - Optional if needed:
  - 2h: Zoom toolbar component (UI controls)
  - 1.5h: Keyboard shortcuts implementation
  - 1h: Integration testing
  - 1h: Cross-browser testing
  - 0.5h: Documentation & final review

Total: 14 hours over 1.75 days (can compress to 1 day if efficient)
```

**Milestones:**
- **M1** (After 4 hours): Pan working with spacebar + drag
- **M2** (After 6 hours): Zoom working with Ctrl+Wheel, mouse-centered
- **M3** (End of Day 1): Pan & zoom fully functional, tests passing
- **M4** (End of Day 2): Toolbar and keyboard shortcuts complete

**Risk Register:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| State duplication (chartSlice vs hook) | High | High | Use chartSlice as single source, hooks only read/dispatch |
| Pan conflicts with drag-to-edit | Medium | High | Clear interaction mode (spacebar for pan, normal click for edit) |
| Zoom doesn't center on mouse | Medium | Medium | Calculate transform origin based on mouse position |
| Performance issues during pan/zoom | Low | High | Use requestAnimationFrame, CSS transforms, throttle events |
| Keyboard shortcuts conflict with browser | Low | Medium | Use non-standard combos, test in all browsers |

**Dependencies:**
- ✅ Sprint 1.2 Package 1 complete (timeline rendering)
- ✅ Sprint 1.2 Package 2 complete (drag-to-edit)
- ✅ chartSlice created with scale management
- ⚠️ Critical: Must resolve state duplication issue (architect review)

**Quality Gates:**
- [ ] Pan maintains 60fps with 100 tasks
- [ ] Zoom feels smooth (no stuttering)
- [ ] No state conflicts between chartSlice and hooks
- [ ] Spacebar cursor change immediate (<16ms)
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Code reviewed and approved

---

### 3. UX/UI Designer - Interaction Design

**Name:** UX Designer
**Role:** User experience, visual design, interaction patterns

#### Interaction Design Specifications

**Design Principles:**
1. **Discoverability**: Pan mode clearly indicated with cursor change
2. **Familiar Patterns**: Use industry-standard controls (spacebar, Ctrl+Wheel)
3. **Smooth Motion**: 60fps pan/zoom with no jarring jumps
4. **Clear Feedback**: Visual indicators for current zoom level
5. **Error Prevention**: Prevent zoom beyond usable ranges (50%-300%)

**Visual Design - Navigation States**

```
Idle State (Default):
Cursor: default arrow
Timeline: Normal view at 100% zoom

Spacebar Pressed (Pan Mode):
┌─────────────────────────────────┐
│  Cursor changes to: ✋ (grab)   │  ← Visual affordance
│  Timeline: Ready to pan         │
└─────────────────────────────────┘

Panning (Spacebar + Drag):
┌─────────────────────────────────┐
│  Cursor changes to: ✊ (grabbing)│  ← Active state
│  Timeline: Translating smoothly │
└─────────────────────────────────┘

Zooming (Ctrl+Wheel):
┌─────────────────────────────────┐
│  Timeline: Scaling from mouse   │  ← Zoom origin at cursor
│  Zoom indicator: "150%" appears │
└─────────────────────────────────┘
```

**Cursor States:**

| State | Cursor | Visual | When |
|-------|--------|--------|------|
| Default | `default` | ← Arrow | Normal state |
| Spacebar down | `grab` | ✋ Open hand | Ready to pan |
| Panning | `grabbing` | ✊ Closed hand | Actively dragging timeline |
| Zooming | `default` | ← Arrow | During Ctrl+Wheel |
| Drag task mode | `grab`/`grabbing` | ✋/✊ | No spacebar, hovering task |

**Zoom Toolbar Design:**

```
Visual Layout:
┌──────────────────────────────────────────────────────┐
│                     Timeline Header                   │
├──────────────────────────────────────────────────────┤
│  Zoom Controls (top-right corner):                   │
│                                                       │
│  [ - ] [ 100% ▼ ] [ + ] [ Fit All ]                 │
│   ↑      ↑        ↑        ↑                         │
│  Zoom   Current  Zoom    Reset view                  │
│  Out    Level    In      to fit all tasks            │
│                                                       │
│  Dropdown options: 50%, 75%, 100%, 125%, 150%,       │
│                    200%, 250%, 300%, Fit All         │
└──────────────────────────────────────────────────────┘
```

**Zoom Level Indicator:**
- **Display:** Percentage badge (e.g., "100%", "150%")
- **Position:** Top-right corner, overlay on timeline
- **Behavior:** Fades in during zoom, fades out after 1 second
- **Styling:** Semi-transparent background, bold text

**Pan Interaction Flow:**
```
User Flow:
1. User presses Spacebar
   → Cursor changes to 'grab' (✋)
   → Visual hint: "Hold spacebar to pan" tooltip (first 3 uses)

2. User clicks and holds mouse
   → Cursor changes to 'grabbing' (✊)
   → Pan mode activated

3. User moves mouse
   → Timeline translates smoothly (60fps)
   → Scroll position updates in real-time

4. User releases mouse OR releases spacebar
   → Pan stops
   → Cursor returns to 'grab' (if spacebar still held) or 'default'

5. User releases spacebar
   → Cursor returns to 'default'
   → Ready for normal task interactions
```

**Zoom Interaction Flow:**
```
User Flow:
1. User holds Ctrl (or Cmd on Mac)
   → No visible change (modifier key)

2. User scrolls wheel while holding Ctrl
   → Calculate mouse position in timeline coordinates
   → Zoom in/out centered on mouse cursor
   → Scale updates (50% increments: 50%, 100%, 150%, 200%, etc.)
   → Zoom indicator appears: "150%"

3. User stops scrolling
   → Zoom indicator fades out after 1 second
   → Timeline remains at new zoom level

4. User releases Ctrl
   → Normal scroll behavior resumes (vertical scroll)
```

**Keyboard Shortcuts:**

| Shortcut | Action | Visual Feedback |
|----------|--------|-----------------|
| `Ctrl + 0` | Reset zoom to 100% | Zoom indicator: "100%" |
| `Ctrl + +` | Zoom in (25% increment) | Zoom indicator updates |
| `Ctrl + -` | Zoom out (25% increment) | Zoom indicator updates |
| `Ctrl + 9` | Fit all tasks in view | Zoom to fit (varies) |
| `Arrow Up/Down` | Pan vertically (if scrollable) | Timeline scrolls |
| `Arrow Left/Right` | Pan horizontally | Timeline scrolls |
| `Home` | Pan to project start | Timeline jumps to beginning |
| `End` | Pan to project end | Timeline jumps to end |

**Animation & Transitions:**
- **Pan Motion:** Immediate (no easing), follows cursor 1:1
- **Zoom Motion:** Smooth 150ms ease-out transition
- **Zoom Indicator:** Fade in 100ms, fade out 300ms (after 1s delay)
- **Fit All:** Animate pan + zoom 300ms ease-in-out

**Accessibility Considerations:**
- **Keyboard-only navigation:** All pan/zoom features accessible via keyboard
- **Screen reader:** Announce zoom level changes ("Zoom level 150%")
- **Focus indicators:** Toolbar buttons have clear focus states
- **Reduced motion:** Respect `prefers-reduced-motion` (instant transitions)

**Error States & Boundaries:**

```
Zoom Limits:
Minimum Zoom: 50%
  → Further zoom out disabled
  → "-" button grayed out
  → Visual feedback: "Minimum zoom reached"

Maximum Zoom: 300%
  → Further zoom in disabled
  → "+" button grayed out
  → Visual feedback: "Maximum zoom reached"

Pan Limits (Optional):
  → Allow infinite pan (user can pan beyond timeline)
  → OR: Elastic boundaries (bounce back when releasing)
  → Decision: Allow infinite pan for flexibility
```

---

### 4. Frontend Developer - Implementation Lead

**Name:** Frontend Engineer
**Role:** React implementation, performance optimization, code quality

#### Technical Implementation Plan

**Component Architecture:**

```
GanttChart (Enhanced)
├── ZoomToolbar.tsx (NEW)
│   ├── Zoom In Button
│   ├── Zoom Out Button
│   ├── Zoom Level Dropdown
│   └── Fit All Button
│
├── ChartCanvas.tsx (Enhanced)
│   ├── usePanZoom hook
│   └── Keyboard event handlers
│
├── hooks/usePanZoom.ts (NEW)
│   ├── Pan state management
│   ├── Zoom state management
│   └── Keyboard shortcut handling
│
└── store/chartSlice.ts (Enhanced)
    ├── zoom: number (0.5 to 3.0)
    ├── panOffset: { x: number, y: number }
    ├── setZoom(zoom: number)
    ├── setPanOffset(offset: { x: number, y: number })
    └── fitToView(tasks: Task[])
```

**Implementation Strategy:**

**Phase 1: chartSlice Enhancement (Single Source of Truth)**

```typescript
// src/store/slices/chartSlice.ts

interface ChartState {
  // Existing state
  scale: TimelineScale | null;
  containerWidth: number;

  // NEW: Navigation state (SINGLE SOURCE OF TRUTH)
  zoom: number;               // 0.5 to 3.0 (50% to 300%)
  panOffset: { x: number; y: number };  // Scroll position in pixels

  // View settings
  showWeekends: boolean;
  showTodayMarker: boolean;
}

interface ChartActions {
  // Existing actions
  updateScale: (tasks: Task[]) => void;
  setContainerWidth: (width: number) => void;

  // NEW: Navigation actions
  setZoom: (zoom: number) => void;
  setPanOffset: (offset: { x: number; y: number }) => void;
  zoomIn: () => void;        // Increase by 0.25 (25%)
  zoomOut: () => void;       // Decrease by 0.25 (25%)
  resetZoom: () => void;     // Set to 1.0 (100%)
  fitToView: (tasks: Task[]) => void;  // Auto-calculate zoom to fit all
}

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    // Initial state
    scale: null,
    containerWidth: 800,
    zoom: 1.0,               // Default 100%
    panOffset: { x: 0, y: 0 },
    showWeekends: true,
    showTodayMarker: true,

    // Zoom actions
    setZoom: (zoom) => {
      set(state => {
        // Clamp zoom to valid range
        state.zoom = Math.max(0.5, Math.min(3.0, zoom));

        // Trigger scale recalculation
        if (state.scale) {
          state.scale.zoom = state.zoom;
          state.scale.pixelsPerDay = state.scale.pixelsPerDay * state.zoom;
          state.scale.totalWidth = state.scale.totalWidth * state.zoom;
        }
      });
    },

    zoomIn: () => {
      const current = get().zoom;
      get().setZoom(Math.min(3.0, current + 0.25));
    },

    zoomOut: () => {
      const current = get().zoom;
      get().setZoom(Math.max(0.5, current - 0.25));
    },

    resetZoom: () => {
      get().setZoom(1.0);
    },

    // Pan action
    setPanOffset: (offset) => {
      set(state => {
        state.panOffset = offset;
      });
    },

    // Fit all tasks in view
    fitToView: (tasks) => {
      if (tasks.length === 0) {
        get().resetZoom();
        return;
      }

      const { min, max } = getDateRange(tasks);
      const duration = calculateDuration(min, max);
      const containerWidth = get().containerWidth;

      // Calculate zoom level to fit all tasks
      const idealPixelsPerDay = containerWidth / duration;
      const basePixelsPerDay = containerWidth / duration; // At zoom 1.0
      const calculatedZoom = idealPixelsPerDay / basePixelsPerDay;

      // Set zoom (clamped to valid range)
      get().setZoom(Math.max(0.5, Math.min(3.0, calculatedZoom)));

      // Reset pan to start
      get().setPanOffset({ x: 0, y: 0 });
    }
  }))
);
```

**Phase 2: Pan Hook Implementation**

```typescript
// src/hooks/usePanZoom.ts

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChartStore } from '@/store';

export function usePanZoom(containerRef: React.RefObject<HTMLDivElement>) {
  const { zoom, panOffset, setZoom, setPanOffset, zoomIn, zoomOut, resetZoom } =
    useChartStore();

  const [isPanning, setIsPanning] = useState(false);
  const [isSpacebarPressed, setIsSpacebarPressed] = useState(false);
  const panStartPos = useRef({ x: 0, y: 0 });
  const panStartOffset = useRef({ x: 0, y: 0 });

  // Spacebar detection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault(); // Prevent page scroll
        setIsSpacebarPressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacebarPressed(false);
        setIsPanning(false); // Stop panning
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Pan start (spacebar + mouse down)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isSpacebarPressed) return; // Only pan if spacebar held

    e.preventDefault();
    setIsPanning(true);
    panStartPos.current = { x: e.clientX, y: e.clientY };
    panStartOffset.current = { ...panOffset };
  }, [isSpacebarPressed, panOffset]);

  // Pan move
  useEffect(() => {
    if (!isPanning) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - panStartPos.current.x;
      const deltaY = e.clientY - panStartPos.current.y;

      setPanOffset({
        x: panStartOffset.current.x + deltaX,
        y: panStartOffset.current.y + deltaY
      });
    };

    const handleMouseUp = () => {
      setIsPanning(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, setPanOffset]);

  // Zoom with Ctrl+Wheel (centered on mouse)
  const handleWheel = useCallback((e: WheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return; // Only zoom with Ctrl/Cmd

    e.preventDefault();

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Calculate zoom direction
    const delta = e.deltaY > 0 ? -0.1 : 0.1; // Negative deltaY = zoom in
    const newZoom = Math.max(0.5, Math.min(3.0, zoom + delta));

    // Calculate new pan offset to keep mouse point stationary
    // Formula: offset_new = offset_old + mouse_pos * (1 - zoom_ratio)
    const zoomRatio = newZoom / zoom;
    const newPanX = panOffset.x - mouseX * (zoomRatio - 1);
    const newPanY = panOffset.y - mouseY * (zoomRatio - 1);

    setZoom(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  }, [zoom, panOffset, setZoom, setPanOffset, containerRef]);

  // Attach wheel listener
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleWheel, containerRef]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case '0':
            e.preventDefault();
            resetZoom();
            break;
          case '+':
          case '=':
            e.preventDefault();
            zoomIn();
            break;
          case '-':
          case '_':
            e.preventDefault();
            zoomOut();
            break;
        }
      }

      // Arrow key panning (future)
      switch (e.key) {
        case 'ArrowLeft':
          setPanOffset({ x: panOffset.x + 50, y: panOffset.y });
          break;
        case 'ArrowRight':
          setPanOffset({ x: panOffset.x - 50, y: panOffset.y });
          break;
        case 'ArrowUp':
          setPanOffset({ x: panOffset.x, y: panOffset.y + 50 });
          break;
        case 'ArrowDown':
          setPanOffset({ x: panOffset.x, y: panOffset.y - 50 });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [zoomIn, zoomOut, resetZoom, panOffset, setPanOffset]);

  return {
    isPanning,
    isSpacebarPressed,
    cursor: isPanning ? 'grabbing' : isSpacebarPressed ? 'grab' : 'default',
    handlers: {
      onMouseDown: handleMouseDown
    }
  };
}
```

**Phase 3: Zoom Toolbar Component**

```typescript
// src/components/GanttChart/ZoomToolbar.tsx

import React from 'react';
import { useChartStore } from '@/store';
import './ZoomToolbar.css';

export function ZoomToolbar() {
  const { zoom, zoomIn, zoomOut, resetZoom, fitToView } = useChartStore();
  const tasks = useTaskStore(state => state.tasks);

  const zoomPercentage = Math.round(zoom * 100);
  const canZoomIn = zoom < 3.0;
  const canZoomOut = zoom > 0.5;

  const presetLevels = [50, 75, 100, 125, 150, 200, 250, 300];

  return (
    <div className="zoom-toolbar">
      {/* Zoom Out Button */}
      <button
        className="zoom-button"
        onClick={zoomOut}
        disabled={!canZoomOut}
        title="Zoom Out (Ctrl+-)"
        aria-label="Zoom out"
      >
        <span className="icon">−</span>
      </button>

      {/* Zoom Level Dropdown */}
      <select
        className="zoom-level-select"
        value={zoomPercentage}
        onChange={(e) => {
          const value = e.target.value;
          if (value === 'fit') {
            fitToView(tasks);
          } else {
            const newZoom = parseInt(value) / 100;
            useChartStore.getState().setZoom(newZoom);
          }
        }}
        aria-label="Zoom level"
      >
        {presetLevels.map(level => (
          <option key={level} value={level}>
            {level}%
          </option>
        ))}
        <option value="fit">Fit All</option>
      </select>

      {/* Zoom In Button */}
      <button
        className="zoom-button"
        onClick={zoomIn}
        disabled={!canZoomIn}
        title="Zoom In (Ctrl++)"
        aria-label="Zoom in"
      >
        <span className="icon">+</span>
      </button>

      {/* Fit All Button */}
      <button
        className="zoom-button fit-button"
        onClick={() => fitToView(tasks)}
        title="Fit all tasks in view (Ctrl+9)"
        aria-label="Fit all tasks"
      >
        <span className="icon">⊡</span>
        <span className="label">Fit All</span>
      </button>
    </div>
  );
}
```

**Styling:**

```css
/* src/components/GanttChart/ZoomToolbar.css */

.zoom-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  position: sticky;
  top: 0;
  z-index: 10;
}

.zoom-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  transition: all 0.15s ease;
}

.zoom-button:hover:not(:disabled) {
  background: #e9ecef;
  border-color: #adb5bd;
}

.zoom-button:active:not(:disabled) {
  background: #dee2e6;
  transform: translateY(1px);
}

.zoom-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.zoom-button .icon {
  font-size: 18px;
  font-weight: bold;
  line-height: 1;
}

.zoom-level-select {
  height: 32px;
  padding: 0 28px 0 8px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  background: white;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,..."); /* Dropdown arrow */
  background-repeat: no-repeat;
  background-position: right 8px center;
}

.fit-button {
  width: auto;
  padding: 0 12px;
  gap: 6px;
}

.fit-button .label {
  font-size: 13px;
  font-weight: 500;
}

/* Zoom indicator (floating badge) */
.zoom-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 12px 20px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 8px;
  font-size: 24px;
  font-weight: bold;
  pointer-events: none;
  animation: fadeInOut 1.5s ease;
  z-index: 1000;
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}
```

**Phase 4: Integration with ChartCanvas**

```typescript
// src/components/GanttChart/ChartCanvas.tsx (Enhanced)

export function ChartCanvas({ tasks, selectedTaskIds }: ChartCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale, zoom, panOffset } = useChartStore();
  const { cursor, handlers } = usePanZoom(containerRef);

  // Apply pan and zoom transforms
  const svgStyle = {
    transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
    transformOrigin: '0 0',
    transition: 'transform 0.15s ease-out' // Smooth zoom
  };

  return (
    <div>
      <ZoomToolbar />

      <div
        ref={containerRef}
        className="chart-canvas-container"
        style={{ cursor }}
        {...handlers}
      >
        <svg
          width={scale?.totalWidth ?? 800}
          height={svgHeight}
          style={svgStyle}
        >
          <TimelineHeader scale={scale} />
          <GridLines scale={scale} taskCount={tasks.length} />
          <TaskBars tasks={tasks} scale={scale} selectedIds={selectedTaskIds} />
          <TodayMarker scale={scale} />
        </svg>
      </div>
    </div>
  );
}
```

**Performance Optimizations:**

1. **Use CSS Transforms for Pan/Zoom:**
```typescript
// Hardware-accelerated GPU rendering
style={{
  transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom})`,
  willChange: isPanning ? 'transform' : 'auto'
}}
```

2. **Throttle Pan Events:**
```typescript
const throttledPan = useThrottle(setPanOffset, 16); // 60fps max
```

3. **RequestAnimationFrame for Smooth Zoom:**
```typescript
const animateZoom = (targetZoom: number) => {
  requestAnimationFrame(() => {
    setZoom(targetZoom);
  });
};
```

4. **Debounce Scale Recalculation:**
```typescript
// Only recalculate scale after zoom settles
const debouncedScaleUpdate = useMemo(
  () => debounce(updateScale, 100),
  [updateScale]
);
```

---

### 5. Data Visualization Specialist - Visual Precision

**Name:** Data Viz Engineer
**Role:** SVG rendering, coordinate calculations, visual accuracy

#### Visual Rendering Specifications

**Coordinate System with Pan/Zoom:**

```
Base Coordinate System (zoom = 1.0):
┌────────────────────────────────────────┐
│ Timeline starts at (0, 0)              │
│ 1 day = 40 pixels                      │
│ Task at day 5 = x: 200px               │
└────────────────────────────────────────┘

After Zoom (zoom = 1.5):
┌────────────────────────────────────────┐
│ Timeline still starts at (0, 0)        │
│ 1 day = 40 * 1.5 = 60 pixels           │
│ Task at day 5 = x: 300px               │
│ SVG scaled by CSS transform            │
└────────────────────────────────────────┘

After Pan (panOffset = { x: -100, y: -50 }):
┌────────────────────────────────────────┐
│ Timeline origin shifted to (-100, -50) │
│ Viewport shows different portion       │
│ Task positions unchanged in SVG space  │
│ CSS translate applied to container     │
└────────────────────────────────────────┘
```

**Pan Transform Calculation:**

```typescript
// Pan offset is applied as CSS transform to SVG container
const panTransform = `translate(${panOffset.x}px, ${panOffset.y}px)`;

// SVG elements remain in original coordinate space
// Transform happens at container level (GPU-accelerated)
```

**Zoom Transform Calculation:**

```typescript
// Zoom applied as CSS scale transform
const zoomTransform = `scale(${zoom})`;

// Combined transform
const combinedTransform = `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`;

// Transform origin must be top-left (0, 0)
transformOrigin: '0 0'
```

**Mouse-Centered Zoom Algorithm:**

```typescript
/**
 * Calculate new pan offset to keep mouse point stationary during zoom
 *
 * Formula:
 *   point_screen = (point_world - pan_offset) * zoom_old
 *   point_screen = (point_world - pan_offset_new) * zoom_new
 *
 *   Solving for pan_offset_new:
 *   pan_offset_new = pan_offset_old - mouse_pos * (zoom_new/zoom_old - 1)
 */
function calculateMouseCenteredZoom(
  mouseX: number,
  mouseY: number,
  oldZoom: number,
  newZoom: number,
  oldPanOffset: { x: number; y: number }
): { x: number; y: number } {
  const zoomRatio = newZoom / oldZoom;

  return {
    x: oldPanOffset.x - mouseX * (zoomRatio - 1),
    y: oldPanOffset.y - mouseY * (zoomRatio - 1)
  };
}

// Example:
// Mouse at (400, 300) in viewport
// Old zoom: 1.0, new zoom: 1.5
// Old pan: (0, 0)
// New pan: (0, 0) - (400, 300) * (1.5/1.0 - 1)
//        = (0, 0) - (400, 300) * 0.5
//        = (-200, -150)
// Result: Timeline shifts left/up so mouse point stays stationary
```

**Adaptive Timeline Scale with Zoom:**

```typescript
// Timeline header scale changes based on effective pixels per day
const effectivePixelsPerDay = basePixelsPerDay * zoom;

// Example: Base 30px/day at zoom 1.0
// At zoom 0.5 (50%):  15px/day → Show Year → Month scale
// At zoom 1.0 (100%): 30px/day → Show Month → Day scale
// At zoom 2.0 (200%): 60px/day → Show Week → Day with weekday letters

// This matches existing getScaleConfig logic from Package 1
```

**SVG Transform Performance:**

```typescript
// BAD: Recalculate all element positions on zoom (expensive)
{tasks.map(task => {
  const x = dateToPixel(task.startDate, scale) * zoom;  // ❌ Recalc every task
  return <TaskBar x={x} />;
})}

// GOOD: Apply zoom via CSS transform (GPU-accelerated)
<svg style={{ transform: `scale(${zoom})` }}>
  {tasks.map(task => {
    const x = dateToPixel(task.startDate, scale);  // ✅ Calculate once
    return <TaskBar x={x} />;
  })}
</svg>
```

**Grid Line Optimization During Zoom:**

```typescript
// Hide grid lines when zoomed out too far (< 2px per day)
const shouldShowDayLines = scale.pixelsPerDay * zoom >= 2;

// Adaptive grid density
const gridInterval = useMemo(() => {
  const effectivePixels = scale.pixelsPerDay * zoom;
  if (effectivePixels < 2) return 30;  // Monthly
  if (effectivePixels < 5) return 7;   // Weekly
  return 1;  // Daily
}, [scale, zoom]);
```

**Zoom Level Indicator Animation:**

```typescript
// Show floating zoom percentage during zoom
const [showZoomIndicator, setShowZoomIndicator] = useState(false);
const zoomIndicatorTimeout = useRef<number | null>(null);

useEffect(() => {
  // Show indicator when zoom changes
  setShowZoomIndicator(true);

  // Clear existing timeout
  if (zoomIndicatorTimeout.current) {
    clearTimeout(zoomIndicatorTimeout.current);
  }

  // Hide after 1.5 seconds
  zoomIndicatorTimeout.current = window.setTimeout(() => {
    setShowZoomIndicator(false);
  }, 1500);

  return () => {
    if (zoomIndicatorTimeout.current) {
      clearTimeout(zoomIndicatorTimeout.current);
    }
  };
}, [zoom]);

return (
  <>
    {showZoomIndicator && (
      <div className="zoom-indicator">
        {Math.round(zoom * 100)}%
      </div>
    )}
  </>
);
```

---

### 6. Backend Developer - State Management & Data Integrity

**Name:** Backend Systems Engineer
**Role:** State architecture, data flow, synchronization

#### State Management Architecture

**Zustand chartSlice Enhancement:**

```typescript
// src/store/slices/chartSlice.ts (Enhanced)

interface ChartState {
  // Existing
  scale: TimelineScale | null;
  containerWidth: number;

  // Navigation state (SINGLE SOURCE OF TRUTH)
  zoom: number;                    // 0.5 to 3.0
  panOffset: { x: number; y: number };

  // View settings
  showWeekends: boolean;
  showTodayMarker: boolean;

  // Transient UI state
  isZooming: boolean;
  isPanning: boolean;
}

interface ChartActions {
  // Zoom
  setZoom: (zoom: number, centerPoint?: { x: number; y: number }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;

  // Pan
  setPanOffset: (offset: { x: number; y: number }) => void;
  panBy: (delta: { x: number; y: number }) => void;
  resetPan: () => void;

  // Combined
  fitToView: (tasks: Task[]) => void;

  // Transient state
  setIsZooming: (isZooming: boolean) => void;
  setIsPanning: (isPanning: boolean) => void;
}

export const useChartStore = create<ChartState & ChartActions>()(
  immer((set, get) => ({
    // Initial state
    scale: null,
    containerWidth: 800,
    zoom: 1.0,
    panOffset: { x: 0, y: 0 },
    showWeekends: true,
    showTodayMarker: true,
    isZooming: false,
    isPanning: false,

    // Zoom with optional mouse centering
    setZoom: (newZoom, centerPoint) => {
      set(state => {
        const clampedZoom = Math.max(0.5, Math.min(3.0, newZoom));

        // If center point provided, adjust pan offset to keep that point stationary
        if (centerPoint) {
          const zoomRatio = clampedZoom / state.zoom;
          state.panOffset.x -= centerPoint.x * (zoomRatio - 1);
          state.panOffset.y -= centerPoint.y * (zoomRatio - 1);
        }

        state.zoom = clampedZoom;

        // Update scale with new zoom
        if (state.scale) {
          state.scale.zoom = clampedZoom;
          state.scale.pixelsPerDay *= (clampedZoom / state.zoom);
          state.scale.totalWidth *= (clampedZoom / state.zoom);
        }
      });
    },

    zoomIn: () => {
      const current = get().zoom;
      get().setZoom(Math.min(3.0, current + 0.25));
    },

    zoomOut: () => {
      const current = get().zoom;
      get().setZoom(Math.max(0.5, current - 0.25));
    },

    resetZoom: () => {
      get().setZoom(1.0);
    },

    // Pan
    setPanOffset: (offset) => {
      set(state => {
        state.panOffset = offset;
      });
    },

    panBy: (delta) => {
      set(state => {
        state.panOffset.x += delta.x;
        state.panOffset.y += delta.y;
      });
    },

    resetPan: () => {
      set(state => {
        state.panOffset = { x: 0, y: 0 };
      });
    },

    // Fit all tasks in view
    fitToView: (tasks) => {
      if (tasks.length === 0) {
        get().resetZoom();
        get().resetPan();
        return;
      }

      const { min, max } = getDateRange(tasks);
      const duration = calculateDuration(min, max);
      const containerWidth = get().containerWidth;

      // Add 10% padding
      const paddedWidth = containerWidth * 0.9;
      const idealPixelsPerDay = paddedWidth / duration;

      // Calculate zoom based on base scale
      const basePixelsPerDay = containerWidth / duration;
      const calculatedZoom = idealPixelsPerDay / basePixelsPerDay;

      // Set zoom (clamped)
      get().setZoom(Math.max(0.5, Math.min(3.0, calculatedZoom)));

      // Center horizontally
      const leftPadding = (containerWidth - paddedWidth) / 2;
      get().setPanOffset({ x: leftPadding, y: 0 });
    },

    // Transient state
    setIsZooming: (isZooming) => {
      set(state => {
        state.isZooming = isZooming;
      });
    },

    setIsPanning: (isPanning) => {
      set(state => {
        state.isPanning = isPanning;
      });
    }
  }))
);
```

**State Synchronization Flow:**

```
User Action (Pan/Zoom)
         ↓
   usePanZoom Hook (Event Handler)
         ↓
   chartSlice Actions (setZoom, setPanOffset)
         ↓
   chartSlice State Updated (SINGLE SOURCE)
         ↓
   React Re-render (useChartStore subscribers)
         ↓
   ChartCanvas Applies CSS Transform
         ↓
   Visual Update (GPU-accelerated)
```

**Data Integrity Guarantees:**

```typescript
// Invariants maintained by chartSlice
const INVARIANTS = {
  // Zoom always within valid range
  zoom: (z: number) => z >= 0.5 && z <= 3.0,

  // Pan offset is finite (no NaN or Infinity)
  panOffset: (p: { x: number; y: number }) =>
    isFinite(p.x) && isFinite(p.y),

  // Scale recalculated after zoom change
  scaleSync: (state: ChartState) =>
    state.scale?.zoom === state.zoom
};

// Validation in actions
set(state => {
  const newZoom = Math.max(0.5, Math.min(3.0, zoom));
  assert(INVARIANTS.zoom(newZoom), 'Zoom out of range');
  state.zoom = newZoom;
});
```

**Persistence (Optional Future Feature):**

```typescript
// Save pan/zoom state to localStorage
const savePanZoomState = () => {
  const { zoom, panOffset } = useChartStore.getState();
  localStorage.setItem('gantt-view-state', JSON.stringify({ zoom, panOffset }));
};

// Restore on load
const restorePanZoomState = () => {
  const saved = localStorage.getItem('gantt-view-state');
  if (saved) {
    const { zoom, panOffset } = JSON.parse(saved);
    useChartStore.getState().setZoom(zoom);
    useChartStore.getState().setPanOffset(panOffset);
  }
};
```

---

### 7. Software Architect - System Design & Patterns

**Name:** System Architect
**Role:** Technical architecture, design patterns, scalability

#### Architectural Decisions

**Design Pattern Selection:**

**1. Single Source of Truth Pattern**
```
Problem: Pan/zoom state duplicated in hook and chartSlice
Solution: chartSlice owns state, hooks only dispatch actions

Benefits:
- No state synchronization issues
- Clear data flow (unidirectional)
- Easier to debug (one place to check)
- Undo/redo can work with pan/zoom (future)

Structure:
chartSlice (State Owner)
  ↓ (provides state + actions)
usePanZoom Hook (Event Handler)
  ↓ (dispatches actions)
ChartCanvas (Consumer)
  ↓ (reads state via useChartStore)
SVG Elements (Presentational)
```

**2. Transform Composition Pattern**
```
Problem: Pan and zoom both modify visual position
Solution: Compose transforms in CSS (GPU-accelerated)

CSS Transform Chain:
transform: translate(panX, panY) scale(zoom)

Order matters:
1. Scale first → Pan amounts affected by zoom (wrong)
2. Pan first → Pan in pixels, then scale (correct)

Example:
pan = (100, 0), zoom = 2.0
✅ translate(100px, 0) scale(2.0)
   → Shift 100px, then zoom to 200%
❌ scale(2.0) translate(100px, 0)
   → Zoom to 200%, then shift 200px (wrong)
```

**3. Event Delegation Pattern**
```
Problem: Keyboard shortcuts need global handlers
Solution: Single global listener, delegate to active context

Structure:
window.addEventListener('keydown', globalHandler)
  ↓
globalHandler checks context
  ↓
if (isChartFocused) → dispatch zoom/pan actions
else → ignore or delegate to other features

Benefits:
- No listener leaks
- Clear event ownership
- Easy to add/remove shortcuts
```

**4. Debounce/Throttle Strategy**
```
Pan Events: Throttle at 60fps (16ms)
  → Every pan move dispatches, throttle limits to 60fps
  → Ensures smooth motion without excessive re-renders

Zoom Events: Immediate dispatch, debounced scale recalc
  → Zoom value updates immediately (visual feedback)
  → Expensive scale recalculation debounced (100ms)
  → User sees zoom instantly, scale adapts slightly later

Resize Events: Debounce at 150ms
  → Window/container resize triggers recalculation
  → Wait for resize to settle before heavy computation
```

**Data Flow Architecture:**

```
┌─────────────────────────────────────────────────┐
│              User Interaction Layer              │
│  - Spacebar + Drag                              │
│  - Ctrl + Wheel                                 │
│  - Keyboard Shortcuts                           │
│  - Toolbar Buttons                              │
└─────────────────────────┬───────────────────────┘
                          ↓
┌─────────────────────────────────────────────────┐
│            Event Handler Layer                   │
│  - usePanZoom hook                              │
│  - Keyboard event listener                      │
│  - Toolbar onClick handlers                     │
└─────────────────────────┬───────────────────────┘
                          ↓
┌─────────────────────────────────────────────────┐
│         State Management Layer (chartSlice)      │
│  SINGLE SOURCE OF TRUTH                         │
│  - zoom: number                                 │
│  - panOffset: { x, y }                          │
│  - Actions: setZoom, setPanOffset, fitToView    │
└─────────────────────────┬───────────────────────┘
                          ↓
┌─────────────────────────────────────────────────┐
│          Presentation Layer                      │
│  - ChartCanvas (reads state via useChartStore)  │
│  - Applies CSS transforms                       │
│  - SVG renders at original coordinates          │
└─────────────────────────────────────────────────┘
```

**Separation of Concerns:**

| Concern | Owner | Responsibility |
|---------|-------|----------------|
| **User Input** | usePanZoom hook | Capture spacebar, mouse, wheel events |
| **State** | chartSlice | Store zoom, panOffset as single source |
| **Calculation** | chartSlice actions | Calculate new zoom/pan values |
| **Validation** | chartSlice actions | Clamp zoom (0.5-3.0), prevent NaN |
| **Rendering** | ChartCanvas | Apply CSS transforms to SVG |
| **Presentation** | SVG elements | Render at original coordinates |

**Performance Architecture:**

```
Optimization Layers:

1. Input Layer (Throttle/Debounce)
   - Pan events: throttle 16ms
   - Zoom events: throttle 16ms
   - Resize events: debounce 150ms

2. State Layer (Efficient Updates)
   - Immer: only update changed properties
   - Zustand: notify only subscribed components
   - React: batch state updates

3. Rendering Layer (GPU Acceleration)
   - CSS transforms (not JS position changes)
   - will-change: transform (during pan/zoom)
   - transform: translate3d + scale (force GPU)

4. Component Layer (React Optimizations)
   - React.memo on TaskBar (prevent re-render)
   - useMemo for expensive calculations
   - useCallback for stable event handlers

Performance Budget:
- Pan: 60fps (16.67ms per frame)
- Zoom: 60fps (16.67ms per frame)
- 100 tasks: smooth pan/zoom
```

**Error Recovery:**

```
Failure Modes & Mitigation:

1. Invalid Zoom Value
   → Clamp to [0.5, 3.0] in setZoom
   → Log warning if out of range
   → Never throw error (graceful degradation)

2. NaN or Infinity in Pan Offset
   → Validate in setPanOffset
   → Reset to (0, 0) if invalid
   → Console error + Sentry report

3. Stuck Panning (Spacebar released outside window)
   → Listen for window blur event
   → Force end panning on blur
   → Reset spacebar state

4. Zoom Indicator Doesn't Hide
   → Always clear timeout in cleanup
   → Force hide on unmount
   → Max display time: 3 seconds
```

---

### 8. DevOps Engineer - Build & Deployment

**Name:** DevOps Lead
**Role:** CI/CD, testing automation, deployment pipeline

#### Build & Test Infrastructure

**CI/CD Pipeline Enhancement:**

```yaml
# .github/workflows/test-navigation-feature.yml

name: Sprint 1.2 Package 3 - Navigation & Scale Tests

on:
  pull_request:
    paths:
      - 'src/hooks/usePanZoom.ts'
      - 'src/components/GanttChart/ZoomToolbar.tsx'
      - 'src/store/slices/chartSlice.ts'
      - 'tests/**/*pan*.test.ts'
      - 'tests/**/*zoom*.test.ts'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run pan/zoom tests
        run: |
          npm run test:unit -- usePanZoom
          npm run test:unit -- ZoomToolbar
          npm run test:unit -- chartSlice

      - name: Check coverage
        run: npm run test:coverage
        # Require 75%+ coverage on new files

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Run navigation integration tests
        run: npm run test:integration -- navigation

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Run pan/zoom E2E tests
        run: |
          npx playwright test tests/e2e/pan-timeline.spec.ts --project=${{ matrix.browser }}
          npx playwright test tests/e2e/zoom-timeline.spec.ts --project=${{ matrix.browser }}

  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Pan performance test
        run: npm run test:performance -- pan-100-tasks

      - name: Zoom performance test
        run: npm run test:performance -- zoom-100-tasks

      - name: Assert 60fps
        run: |
          # Ensure pan/zoom maintains 60fps (< 16.67ms per frame)
```

**Test Scripts:**

```json
// package.json - New test commands

{
  "scripts": {
    "test:pan": "vitest run -t 'pan'",
    "test:zoom": "vitest run -t 'zoom'",
    "test:navigation": "vitest run -t 'navigation'",
    "test:navigation:watch": "vitest -t 'navigation'",
    "test:e2e:navigation": "playwright test tests/e2e/pan-timeline.spec.ts tests/e2e/zoom-timeline.spec.ts"
  }
}
```

**Performance Monitoring:**

```typescript
// tests/performance/navigation-performance.test.ts

describe('Navigation Performance', () => {
  it('should pan at 60fps with 100 tasks', async () => {
    const tasks = generateTestTasks(100);
    const { result } = renderHook(() => usePanZoom(mockContainerRef));

    const frameTimestamps: number[] = [];

    // Simulate 60 pan events (1 second at 60fps)
    for (let i = 0; i < 60; i++) {
      const start = performance.now();

      act(() => {
        result.current.handleMouseMove({ clientX: i * 10, clientY: 0 });
      });

      const end = performance.now();
      frameTimestamps.push(end - start);
    }

    const avgFrameTime = frameTimestamps.reduce((a, b) => a + b) / frameTimestamps.length;
    const maxFrameTime = Math.max(...frameTimestamps);

    expect(avgFrameTime).toBeLessThan(16.67); // 60fps average
    expect(maxFrameTime).toBeLessThan(33.33); // Never drop below 30fps
  });

  it('should zoom at 60fps with 100 tasks', async () => {
    // Similar structure for zoom
  });
});
```

**Browser Testing Matrix:**

| Browser | Version | Platform | Test Focus |
|---------|---------|----------|------------|
| Chrome | Latest | Linux | Primary development, performance baseline |
| Firefox | Latest | Linux | Keyboard event handling, CSS transform compat |
| Safari | Latest | macOS | Wheel event handling, webkit transforms |
| Chrome | Latest | Windows | Ctrl vs Meta key, wheel sensitivity |
| Edge | Latest | Windows | Compatibility with Chromium |

**Deployment Checklist:**

```markdown
Pre-Deployment Checklist for Package 3:
- [ ] All unit tests passing (75%+ coverage)
- [ ] All integration tests passing
- [ ] E2E tests passing in Chrome, Firefox, Safari
- [ ] Performance tests passing (60fps verified)
- [ ] Spacebar + drag panning works smoothly
- [ ] Ctrl+Wheel zooming centered on mouse
- [ ] Zoom toolbar UI complete and functional
- [ ] Keyboard shortcuts work (Ctrl+0, Ctrl++, Ctrl+-)
- [ ] No state duplication (chartSlice is single source)
- [ ] No console errors or warnings
- [ ] Cross-browser tested
- [ ] Code review approved
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Test checkpoint passed
```

---

### 9. QA Tester - Quality Assurance

**Name:** QA Engineer
**Role:** Test planning, manual testing, bug reporting

#### Comprehensive Test Plan

**Manual Testing Checklist:**

**A. Pan Functionality**
```
Test Case 1.1: Basic Pan with Spacebar
[ ] Open app with timeline visible
[ ] Press and hold Spacebar
[ ] Verify cursor changes to 'grab' (✋)
[ ] Click and hold left mouse button
[ ] Verify cursor changes to 'grabbing' (✊)
[ ] Move mouse left/right/up/down
[ ] Verify timeline pans smoothly (no jank)
[ ] Release mouse button
[ ] Verify cursor returns to 'grab' (✋)
[ ] Release Spacebar
[ ] Verify cursor returns to default arrow

Test Case 1.2: Pan Doesn't Interfere with Drag-to-Edit
[ ] Hover over task bar (no spacebar)
[ ] Verify cursor shows 'grab' (for task drag)
[ ] Drag task bar
[ ] Verify task moves (not timeline)
[ ] Press Spacebar while hovering task
[ ] Verify cursor shows spacebar 'grab' (for pan)
[ ] Drag with spacebar held
[ ] Verify timeline pans (not task)

Test Case 1.3: Pan with 100 Tasks Performance
[ ] Load 100 tasks
[ ] Press spacebar and pan timeline
[ ] Verify smooth 60fps motion (no lag)
[ ] Check Chrome DevTools Performance tab
[ ] Verify frame time < 16.67ms

Test Case 1.4: Pan Boundaries
[ ] Pan timeline far to the left (negative offset)
[ ] Verify timeline can pan infinitely
[ ] Pan timeline far to the right
[ ] Verify no visual glitches
[ ] Pan timeline far down/up
[ ] Verify scrolling works correctly
```

**B. Zoom Functionality**
```
Test Case 2.1: Zoom with Ctrl+Wheel
[ ] Hold Ctrl key (or Cmd on Mac)
[ ] Scroll mouse wheel up
[ ] Verify timeline zooms in
[ ] Verify zoom centers on mouse cursor position
[ ] Verify zoom indicator appears ("150%")
[ ] Scroll mouse wheel down
[ ] Verify timeline zooms out
[ ] Verify zoom centers on mouse cursor
[ ] Release Ctrl
[ ] Scroll wheel
[ ] Verify normal vertical scroll (not zoom)

Test Case 2.2: Zoom Indicator
[ ] Zoom in/out with Ctrl+Wheel
[ ] Verify zoom percentage appears (e.g., "150%")
[ ] Verify indicator positioned center of screen
[ ] Wait 1.5 seconds
[ ] Verify indicator fades out

Test Case 2.3: Zoom Limits
[ ] Zoom out repeatedly
[ ] Verify zoom stops at 50%
[ ] Verify "-" button grays out
[ ] Verify zoom indicator shows "50%"
[ ] Zoom in repeatedly
[ ] Verify zoom stops at 300%
[ ] Verify "+" button grays out
[ ] Verify zoom indicator shows "300%"

Test Case 2.4: Mouse-Centered Zoom Accuracy
[ ] Place mouse over specific task bar
[ ] Zoom in (Ctrl+Wheel up)
[ ] Verify that task bar stays under mouse cursor
[ ] Zoom out (Ctrl+Wheel down)
[ ] Verify task bar still under cursor
[ ] Move mouse to different position
[ ] Zoom in/out
[ ] Verify new position stays centered

Test Case 2.5: Timeline Scale Adaptation
[ ] Set zoom to 50%
[ ] Verify timeline header shows Year → Quarter or Month
[ ] Set zoom to 100%
[ ] Verify timeline header shows Month → Day
[ ] Set zoom to 200%
[ ] Verify timeline header shows Week → Day with letters
[ ] Verify grid lines adapt to zoom level
```

**C. Zoom Toolbar**
```
Test Case 3.1: Toolbar Button Functionality
[ ] Click "−" button
[ ] Verify zoom decreases by 25%
[ ] Verify zoom indicator shows new percentage
[ ] Click "+" button
[ ] Verify zoom increases by 25%
[ ] Click "+" repeatedly until 300%
[ ] Verify "+" button becomes disabled
[ ] Click "−" repeatedly until 50%
[ ] Verify "−" button becomes disabled

Test Case 3.2: Zoom Level Dropdown
[ ] Click zoom level dropdown (shows "100%")
[ ] Verify options: 50%, 75%, 100%, 125%, 150%, 200%, 250%, 300%, Fit All
[ ] Select "150%"
[ ] Verify zoom changes to 150%
[ ] Verify dropdown now shows "150%"
[ ] Verify timeline zooms smoothly

Test Case 3.3: Fit All Button
[ ] Load tasks spanning 3 months
[ ] Zoom in to 200%
[ ] Pan to random position
[ ] Click "Fit All" button
[ ] Verify zoom adjusts to fit all tasks in viewport
[ ] Verify timeline pans to show entire project
[ ] Verify all tasks visible

Test Case 3.4: Toolbar Visual Quality
[ ] Verify toolbar has clean, professional design
[ ] Verify buttons have hover states
[ ] Verify disabled buttons are visually distinct (grayed)
[ ] Verify dropdown arrow visible
[ ] Verify all text readable and aligned
```

**D. Keyboard Shortcuts**
```
Test Case 4.1: Zoom Shortcuts
[ ] Press Ctrl+0
[ ] Verify zoom resets to 100%
[ ] Verify zoom indicator shows "100%"
[ ] Press Ctrl++ (or Ctrl+=)
[ ] Verify zoom increases by 25%
[ ] Press Ctrl+− (or Ctrl+_)
[ ] Verify zoom decreases by 25%

Test Case 4.2: Arrow Key Panning (Optional)
[ ] Press Arrow Right
[ ] Verify timeline pans right (50px)
[ ] Press Arrow Left
[ ] Verify timeline pans left
[ ] Press Arrow Up
[ ] Verify timeline pans up (if scrollable)
[ ] Press Arrow Down
[ ] Verify timeline pans down

Test Case 4.3: Home/End Navigation (Optional)
[ ] Press Home
[ ] Verify timeline pans to project start
[ ] Press End
[ ] Verify timeline pans to project end

Test Case 4.4: Shortcut Conflicts
[ ] Press Ctrl+0 in different contexts (table focused, chart focused)
[ ] Verify zoom shortcut works in chart, doesn't break table
[ ] Try browser shortcuts (Ctrl+T, Ctrl+W)
[ ] Verify browser shortcuts still work (not intercepted)
```

**E. Integration & Edge Cases**
```
Test Case 5.1: Pan + Zoom Together
[ ] Zoom in to 200%
[ ] Pan timeline to specific area
[ ] Zoom out to 50%
[ ] Verify pan position adjusts proportionally
[ ] Verify timeline still navigable

Test Case 5.2: Zoom During Drag-to-Edit
[ ] Start dragging a task bar
[ ] While dragging, zoom in (Ctrl+Wheel)
[ ] Verify drag continues smoothly
[ ] Verify preview updates with new scale
[ ] Complete drag
[ ] Verify final position correct

Test Case 5.3: Pan During Task Hover
[ ] Hover over task bar (tooltip appears)
[ ] Press spacebar and pan timeline
[ ] Verify tooltip disappears or moves correctly
[ ] Verify no visual glitches

Test Case 5.4: Rapid Zoom Changes
[ ] Zoom in/out rapidly 20 times
[ ] Verify no lag or freeze
[ ] Verify zoom indicator updates correctly
[ ] Verify no memory leaks (check DevTools Memory tab)

Test Case 5.5: State Persistence (Future)
[ ] Set zoom to 150% and pan to specific position
[ ] Refresh page (if persistence implemented)
[ ] Verify zoom and pan restored
[ ] OR: Verify reset to defaults if no persistence
```

**F. Cross-Browser Testing**
```
Test Case 6.1: Chrome (Primary)
[ ] Repeat all tests in Chrome
[ ] Verify Ctrl+Wheel zoom works
[ ] Verify spacebar pan works
[ ] Verify 60fps performance

Test Case 6.2: Firefox
[ ] Repeat all tests in Firefox
[ ] Verify Ctrl+Wheel zoom works
[ ] Verify spacebar pan works
[ ] Check for CSS transform differences

Test Case 6.3: Safari (macOS)
[ ] Repeat all tests in Safari
[ ] Verify Cmd+Wheel zoom works (not Ctrl)
[ ] Verify spacebar pan works
[ ] Check for webkit-specific issues

Test Case 6.4: Edge (Windows)
[ ] Repeat key tests in Edge
[ ] Verify compatibility with Chromium
```

**Bug Severity Classification:**

| Severity | Description | Example |
|----------|-------------|---------|
| P0 - Critical | Blocks navigation entirely | Pan/zoom don't work at all |
| P1 - High | Major feature broken | Zoom not centered on mouse |
| P2 - Medium | Feature partially broken | Zoom indicator doesn't show |
| P3 - Low | Minor visual issue | Toolbar button misaligned |
| P4 - Trivial | Cosmetic issue | Icon size slightly off |

**Performance Benchmarks:**

| Metric | Target | How to Measure |
|--------|--------|----------------|
| Pan start latency | < 20ms | DevTools Performance: spacebar to cursor change |
| Pan frame time | < 16.67ms | Monitor frame rate during pan (60fps) |
| Zoom latency | < 50ms | DevTools: wheel event to visual change |
| Zoom indicator show/hide | 100ms fade | Visual inspection + animations tab |
| Fit All animation | 300ms | Measure animation duration |
| 100 tasks pan/zoom | 60fps | Performance tab with 100 tasks |

**Regression Testing:**

```
After Package 3, verify Packages 1 & 2 still work:
[ ] Timeline still renders correctly (Package 1)
[ ] Task bars positioned accurately
[ ] Grid lines visible
[ ] Today marker shows
[ ] Drag-to-move still works (Package 2)
[ ] Drag-to-resize still works
[ ] Summary task auto-calculation still works
[ ] Undo/redo still functional
[ ] Table-chart sync still working
```

**Test Data Sets:**

```typescript
// tests/fixtures/navigation-test-data.ts

export const navigationScenarios = {
  // Small project: 5 tasks over 1 month
  small: {
    tasks: generateTasks(5, { startDate: '2025-01-01', endDate: '2025-01-31' }),
    expectedZoomRange: { min: 0.8, max: 2.0 }
  },

  // Medium project: 50 tasks over 3 months
  medium: {
    tasks: generateTasks(50, { startDate: '2025-01-01', endDate: '2025-03-31' }),
    expectedZoomRange: { min: 0.5, max: 1.5 }
  },

  // Large project: 100 tasks over 6 months
  large: {
    tasks: generateTasks(100, { startDate: '2025-01-01', endDate: '2025-06-30' }),
    expectedZoomRange: { min: 0.5, max: 1.0 }
  },

  // Edge cases
  edgeCases: [
    { name: 'Single task', tasks: [singleTask], expectedFitZoom: 3.0 },
    { name: 'Very wide project (2 years)', tasks: generateTasks(200, { duration: 730 }), expectedFitZoom: 0.5 },
    { name: 'Empty project', tasks: [], expectedBehavior: 'default zoom 100%' }
  ]
};
```

---

### 10. Data Analyst - Metrics & Success Tracking

**Name:** Analytics Specialist
**Role:** Define KPIs, track metrics, measure success

#### Success Metrics & Analytics

**Key Performance Indicators (KPIs):**

**1. Feature Adoption**
```
Metrics to Track:
- % of users who pan at least once (target: 70%)
- % of users who zoom at least once (target: 80%)
- % of users who use Fit All button (target: 60%)
- Average pan/zoom events per session (target: 10+)
- % using keyboard shortcuts vs toolbar (target: 20% keyboard)

Measurement:
- Event tracking: 'timeline_pan', 'timeline_zoom', 'zoom_fit_all'
- Session-based aggregation
- Cohort analysis by user type
```

**2. Usability Metrics**
```
Time-to-First-Pan:
- Definition: Time from page load to first pan event
- Target: < 1 minute (feature discovered quickly)
- Measurement: Timestamp tracking

Time-to-First-Zoom:
- Definition: Time from page load to first zoom event
- Target: < 2 minutes
- Measurement: Timestamp tracking

Zoom Level Distribution:
- Track which zoom levels users prefer
- Expected: Bell curve centered around 100%
- Outliers: Users who frequently use 50% or 300%

Pan Distance Distribution:
- Track how far users pan (in pixels)
- Helps understand project size and navigation needs
```

**3. Performance Metrics**
```
Pan Frame Time Distribution:
- P50 (median): < 10ms
- P90: < 16.67ms (60fps threshold)
- P99: < 33.33ms (30fps minimum)
- Measurement: performance.measure() during pan

Zoom Frame Time Distribution:
- P50: < 15ms
- P90: < 20ms
- P99: < 50ms
- Measurement: performance.measure() during zoom

Browser Performance Comparison:
| Browser | Avg Pan Latency | Avg Zoom Latency | Frame Rate |
|---------|-----------------|------------------|------------|
| Chrome  | 8ms             | 12ms             | 60fps      |
| Firefox | 10ms            | 15ms             | 58fps      |
| Safari  | 12ms            | 18ms             | 55fps      |
```

**4. Quality Metrics**
```
Error Rate:
- Definition: Zoom/pan operations that fail or error
- Target: < 0.1% (very rare)
- Measurement: Try-catch in actions, error logging

User Corrections:
- Definition: Users immediately reversing zoom/pan
- Target: < 5% (intuitive navigation)
- Example: Zoom in, immediately zoom out
- Measurement: Track opposing actions within 2 seconds

Feature Abandonment:
- Definition: Users stop using pan/zoom after first try
- Target: < 10% abandonment
- Measurement: Track users who use feature once, never again
```

**5. User Satisfaction**
```
Navigation Ease Rating:
- Method: Optional survey after 20 pan/zoom events
- Question: "How easy is it to navigate the timeline?"
- Scale: 1-5 stars
- Target: Average > 4.0 stars

Feature Request Sentiment:
- Track requests related to navigation
- Positive: "Love the zoom controls!"
- Negative: "Can't find how to zoom out"
- Target: > 80% positive sentiment

Task Completion Success:
- Definition: % of users who successfully use Fit All to view entire project
- Target: > 90% success rate
- Measurement: Track Fit All clicks followed by no immediate pan/zoom
```

**Analytics Implementation:**

```typescript
// utils/analytics.ts (Enhanced)

export const trackNavigationEvent = (eventType: string, metadata: object) => {
  // For MVP: Console logging
  console.log('[Navigation Analytics]', eventType, metadata);

  // Future: Send to analytics service
  // analytics.track(eventType, metadata);
};

// Usage in usePanZoom hook
const handlePanEnd = useCallback(() => {
  const panDuration = Date.now() - panStartTime;
  const panDistance = Math.sqrt(
    (panOffset.x - panStartOffset.x) ** 2 +
    (panOffset.y - panStartOffset.y) ** 2
  );

  trackNavigationEvent('timeline_pan', {
    duration_ms: panDuration,
    distance_px: panDistance,
    start_zoom: panStartZoom,
    end_zoom: zoom,
    task_count: tasks.length
  });
}, []);

// Usage in zoom action
const trackZoomEvent = (oldZoom: number, newZoom: number, method: string) => {
  trackNavigationEvent('timeline_zoom', {
    old_zoom: oldZoom,
    new_zoom: newZoom,
    zoom_delta: newZoom - oldZoom,
    method, // 'wheel', 'toolbar', 'keyboard'
    task_count: tasks.length,
    timestamp: Date.now()
  });
};
```

**Success Dashboard (Mock):**

```
┌──────────────────────────────────────────────────┐
│ Sprint 1.2 Package 3 - Navigation Dashboard     │
├──────────────────────────────────────────────────┤
│                                                   │
│ Adoption:                                        │
│   Pan Usage:          76% ✅ (target: 70%)       │
│   Zoom Usage:         84% ✅ (target: 80%)       │
│   Fit All Usage:      67% ✅ (target: 60%)       │
│   Avg Events/Session: 12.4 ✅ (target: 10+)      │
│                                                   │
│ Performance:                                      │
│   Pan P50 Latency:    9ms ✅ (target: <10ms)     │
│   Pan P90 Latency:    15ms ✅ (target: <16.67ms) │
│   Zoom P50 Latency:   13ms ✅ (target: <15ms)    │
│   Pan Frame Rate:     60fps ✅ (target: 60fps)   │
│                                                   │
│ Usability:                                        │
│   Time-to-First-Pan:  45s ✅ (target: <1min)     │
│   Time-to-First-Zoom: 1m12s ✅ (target: <2min)   │
│   Error Rate:         0.05% ✅ (target: <0.1%)   │
│   Correction Rate:    3.8% ✅ (target: <5%)      │
│                                                   │
│ Satisfaction:                                     │
│   Ease Rating:        4.2⭐ ✅ (target: >4.0)    │
│   Positive Sentiment: 87% ✅ (target: >80%)      │
│                                                   │
└──────────────────────────────────────────────────┘
```

**Data Collection Checklist:**

```
Before Release:
[ ] Analytics events defined for pan/zoom
[ ] Tracking code implemented in hooks
[ ] Performance markers added
[ ] Error logging enabled
[ ] Dashboard configured

After Release (Week 1):
[ ] Monitor adoption rate daily
[ ] Review performance metrics
[ ] Check error logs
[ ] Collect user feedback
[ ] Identify bottlenecks or issues
[ ] Plan improvements based on data
```

---

## Implementation Plan

### Day 1: Core Pan & Zoom (8 hours)

**Morning (4 hours):**
- Team kickoff & architecture review (30 min)
- Enhance chartSlice with zoom/pan state (1 hour)
- Implement usePanZoom hook - pan functionality (1.5 hours)
- Unit tests for pan logic (1 hour)

**Afternoon (4 hours):**
- Implement zoom functionality in usePanZoom (2 hours)
- Add mouse-centered zoom calculation (1 hour)
- Integration testing (30 min)
- Manual testing & bug fixes (30 min)

**Deliverable:** Working pan (spacebar+drag) and zoom (Ctrl+Wheel) with mouse centering

---

### Day 2: Toolbar & Keyboard (6 hours) - Optional

**Morning (3 hours):**
- Implement ZoomToolbar component (1.5 hours)
- Wire up toolbar buttons to chartSlice actions (30 min)
- Keyboard shortcuts implementation (45 min)
- Visual polish & styling (15 min)

**Afternoon (3 hours):**
- Fit All button logic (1 hour)
- E2E tests with Playwright (1 hour)
- Cross-browser testing (30 min)
- Final bug fixes & code review (30 min)

**Deliverable:** Package 3 complete with toolbar and keyboard shortcuts

---

## Test Strategy

### Unit Tests (25 tests)

**usePanZoom Hook (15 tests):**
- Spacebar key detection (press/release)
- Pan start (spacebar + mouse down)
- Pan move (delta calculation)
- Pan end (cleanup)
- Zoom with Ctrl+Wheel
- Mouse-centered zoom calculation
- Zoom limits (0.5 to 3.0)
- Keyboard shortcuts (Ctrl+0, Ctrl++, Ctrl+-)
- Event cleanup on unmount

**chartSlice Actions (10 tests):**
- setZoom (clamping, scale update)
- setPanOffset (validation)
- zoomIn/zoomOut (increment/decrement)
- resetZoom (set to 1.0)
- fitToView (calculate zoom from tasks)
- Pan offset updates
- State synchronization
- Edge cases (NaN, Infinity)

---

### Integration Tests (8 tests)

- Pan updates chartSlice state
- Zoom updates chartSlice state
- ChartCanvas applies correct CSS transforms
- Toolbar buttons dispatch correct actions
- Keyboard shortcuts trigger state changes
- Fit All calculates correct zoom level
- Pan + zoom together (combined transforms)
- State persistence (if implemented)

---

### E2E Tests (Playwright - 6 tests)

```typescript
// tests/e2e/pan-timeline.spec.ts

test('should pan timeline with spacebar + drag', async ({ page }) => {
  await page.goto('/');

  // Load test data with tasks
  await loadTestTasks(page, 10);

  // Press spacebar
  await page.keyboard.down('Space');

  // Verify cursor changes to grab
  const canvas = page.locator('.chart-canvas-container');
  const cursor = await canvas.evaluate(el => window.getComputedStyle(el).cursor);
  expect(cursor).toBe('grab');

  // Start pan (mouse down)
  await canvas.click({ position: { x: 400, y: 300 } });

  // Verify cursor changes to grabbing
  const grabbingCursor = await canvas.evaluate(el => window.getComputedStyle(el).cursor);
  expect(grabbingCursor).toBe('grabbing');

  // Pan 200px to the right
  await page.mouse.move(600, 300);

  // Get SVG transform
  const svg = page.locator('svg.ownchart-chart');
  const transform = await svg.evaluate(el => window.getComputedStyle(el).transform);

  // Should have translate component
  expect(transform).toContain('matrix');

  // Release mouse and spacebar
  await page.mouse.up();
  await page.keyboard.up('Space');
});

test('should zoom timeline with Ctrl+Wheel centered on mouse', async ({ page }) => {
  await page.goto('/');
  await loadTestTasks(page, 10);

  const canvas = page.locator('.chart-canvas-container');

  // Position mouse at specific point
  await canvas.hover({ position: { x: 400, y: 300 } });

  // Get task bar position under mouse before zoom
  const taskBefore = await page.locator('[data-task-id="task-3"]').boundingBox();

  // Zoom in (Ctrl+Wheel)
  await page.keyboard.down('Control');
  await page.mouse.wheel({ deltaY: -100 }); // Wheel up = zoom in
  await page.keyboard.up('Control');

  // Wait for zoom animation
  await page.waitForTimeout(200);

  // Get task bar position after zoom
  const taskAfter = await page.locator('[data-task-id="task-3"]').boundingBox();

  // Task should still be under mouse (relative to viewport)
  expect(taskAfter.x).toBeCloseTo(taskBefore.x, -1);

  // Verify zoom indicator appeared
  const zoomIndicator = page.locator('.zoom-indicator');
  await expect(zoomIndicator).toBeVisible();
  await expect(zoomIndicator).toContainText(/\d+%/);
});

test('should use zoom toolbar buttons', async ({ page }) => {
  // Test zoom in/out buttons, dropdown, and Fit All
});

test('should respect zoom limits (50%-300%)', async ({ page }) => {
  // Test that zoom stops at boundaries
});

test('should use keyboard shortcuts', async ({ page }) => {
  // Test Ctrl+0, Ctrl++, Ctrl+-
});

test('should maintain 60fps during pan/zoom with 100 tasks', async ({ page }) => {
  // Performance test
});
```

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **State duplication** | High | Medium | Use chartSlice as single source of truth |
| **Mouse-centered zoom complex** | Medium | Medium | Use proven formula, extensive testing |
| **Performance degradation** | High | Low | CSS transforms (GPU), throttle events |
| **Keyboard conflicts** | Medium | Low | Use non-standard combos, test in all browsers |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Spacebar affordance unclear** | Medium | Medium | Cursor change, optional tooltip hint |
| **Zoom not centered** | High | Low | Calculate transform origin correctly |
| **Controls not discoverable** | Medium | Medium | Visible toolbar, keyboard shortcut hints |

### Schedule Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Underestimated complexity** | Medium | Focus on MVP (pan + zoom), defer extras |
| **Mouse-centered zoom difficult** | Medium | Pre-research formula, have fallback (center zoom) |
| **Testing takes longer** | Low | Automated tests reduce manual effort |

---

## Success Criteria

### Package Complete When:

- [ ] **Functionality**
  - [ ] Users can pan timeline with spacebar + drag
  - [ ] Cursor changes to grab/grabbing appropriately
  - [ ] Users can zoom with Ctrl+Wheel
  - [ ] Zoom centers on mouse cursor position
  - [ ] Zoom toolbar shows current level and controls
  - [ ] Fit All button fits entire project in view
  - [ ] Keyboard shortcuts work (Ctrl+0, Ctrl++, Ctrl+-)
  - [ ] chartSlice is single source of truth (no duplication)

- [ ] **Performance**
  - [ ] Pan maintains 60fps with 100 tasks
  - [ ] Zoom maintains 60fps with 100 tasks
  - [ ] Pan/zoom feel smooth and responsive
  - [ ] No jank or stuttering

- [ ] **Quality**
  - [ ] 75%+ test coverage on new code
  - [ ] All unit/integration/E2E tests pass
  - [ ] Cross-browser tested (Chrome, Firefox, Safari)
  - [ ] No console errors or warnings
  - [ ] No state synchronization issues

- [ ] **User Experience**
  - [ ] Spacebar affordance clear (cursor change)
  - [ ] Zoom feels natural (mouse-centered)
  - [ ] Toolbar controls discoverable and functional
  - [ ] Zoom indicator provides feedback
  - [ ] Timeline scale adapts to zoom level

- [ ] **Documentation**
  - [ ] Code commented
  - [ ] README updated with navigation instructions
  - [ ] CHANGELOG entry added
  - [ ] Test checkpoint passed

---

## Next Steps After Package 3

**Package 4: Visual Dependencies (1 day)**
- Render dependency arrows between tasks
- Update arrows during pan/zoom
- Arrow styling and visual quality

**Package 5: Accessibility & Keyboard (1 day)**
- ARIA labels for navigation controls
- Screen reader announcements
- Full keyboard navigation
- Focus management

**Package 6: Polish & Performance (1-2 days)**
- Virtual rendering (if needed for performance)
- Mini-map overview (stretch goal)
- Additional visual polish
- Final optimization

---

## Appendix

### Code Examples Repository

All code examples in this document are reference implementations. Actual implementation may vary based on:
- Existing codebase patterns
- Performance profiling results
- User feedback during development
- Team preferences

### Glossary

- **Pan**: Horizontal/vertical translation of timeline view
- **Zoom**: Scaling timeline to see more/less detail
- **Mouse-Centered Zoom**: Zoom that keeps point under mouse stationary
- **Fit All**: Auto-calculate zoom to show entire project
- **chartSlice**: Zustand store slice managing chart state (single source of truth)
- **Transform Origin**: CSS property defining zoom center point
- **Throttle**: Limit function execution rate (e.g., max 60fps)
- **Debounce**: Delay function execution until input settles

### References

- [MS Project](https://www.microsoft.com/en-us/microsoft-365/project) - Pan/zoom reference
- [Smartsheet](https://www.smartsheet.com/) - Toolbar design inspiration
- [D3.js Zoom Behavior](https://d3js.org/d3-zoom) - Mouse-centered zoom algorithm
- [MDN: CSS Transforms](https://developer.mozilla.org/en-US/docs/Web/CSS/transform) - Transform composition

---

**Document Version**: 1.0
**Created**: 2025-12-31
**Status**: 📋 Planning
**Package Priority**: 🟡 High

---

## Team Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | Product Lead | ✅ Approved | 2026-01-02 |
| Project Manager | Project Coordinator | ✅ Approved | 2026-01-02 |
| UX/UI Designer | UX Designer | ✅ Approved | 2026-01-02 |
| Frontend Developer | Frontend Engineer | ✅ Approved | 2026-01-02 |
| Data Viz Specialist | Data Viz Engineer | ✅ Approved | 2026-01-02 |
| Backend Developer | Backend Systems | ✅ Approved | 2026-01-02 |
| Software Architect | System Architect | ✅ Approved | 2026-01-02 |
| DevOps Engineer | DevOps Lead | ✅ Approved | 2026-01-02 |
| QA Tester | QA Engineer | ✅ Approved | 2026-01-02 |
| Data Analyst | Analytics Specialist | ✅ Approved | 2026-01-02 |

**Package 3 Implementation Complete!** ✅

## Implementation Notes (Added Post-Completion)

### Deviations from Original Plan

1. **Pan with Spacebar**: Not implemented. Horizontal scroll is sufficient for navigation; vertical scroll handled by SVAR-style layout.

2. **Zoom Range**: Changed from 50%-300% to 10%-500% for greater flexibility.

3. **Zoom Increments**: Changed from 25% to 5% for finer control.

4. **Grid Line Adaptive Density**:
   - Original thresholds (pixelsPerDay < 2 monthly, < 5 weekly) were too low
   - Final thresholds: < 3 px/day monthly, < 10 px/day weekly
   - Added ISO 8601 week boundary alignment (Monday start)

5. **ZoomIndicator Positioning**:
   - Originally planned inside chart container
   - Final: At root level with fixed positioning (avoids CSS transform interference)

6. **SVAR-Style Layout**:
   - Added based on user requirement for horizontal scrollbar to always be visible at viewport bottom
   - Implemented pseudo-rows + sticky container pattern from SVAR React Gantt

### Key Implementation Files

| File | Purpose |
|------|---------|
| `src/App.tsx` | SVAR-style sticky scroll layout |
| `src/store/slices/chartSlice.ts` | Zoom state management |
| `src/components/GanttChart/ChartCanvas.tsx` | Zoom integration |
| `src/components/GanttChart/GridLines.tsx` | Adaptive grid density |
| `src/components/GanttChart/ZoomIndicator.tsx` | Zoom percentage display |
| `src/components/Toolbar/ZoomControls.tsx` | Toolbar zoom buttons |
| `src/hooks/usePanZoom.ts` | Zoom event handling |
| `src/utils/timelineUtils.ts` | Zoom-aware scale calculations |

### Tests Passing

- All 95 unit/integration tests pass
- Manual testing completed for all zoom functionality
- Cross-browser verified (Chrome, Firefox)
