# Sprint 1.6: PNG Export & Polish - Team Concept

**Project:** Gantt Chart Application - OwnChart
**Sprint:** Sprint 1.6 - PNG Export & Polish
**Status:** ✅ COMPLETE
**Date:** 2026-01-05 (Completed)
**Priority:** High (MVP Completion)
**Estimated Duration:** 1-2 weeks

---

## Executive Summary

### Sprint Goal
Complete the MVP with professional PNG export capabilities and polish features that enhance the user experience. This sprint delivers the final MVP milestone: users can create charts, save them, and export presentation-ready images.

### Success Metrics
- [x] Users can export their chart to high-resolution PNG
- [x] Export options allow customization (dimensions, task list inclusion)
- [x] Complete keyboard shortcut reference available
- [x] Help documentation accessible in-app
- [x] First-time users see welcome guidance
- [x] Charts look professional with default styling

### Sprint Completion Checkpoint
**Visual Test:** "I can share my chart as an image"
- User creates a 10-task chart with dependencies
- User clicks Export → PNG
- User selects options (include task list, 1920px width)
- High-quality PNG downloads
- Image looks professional and readable
- User presses ? key → help panel opens

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

**Name:** Product Lead
**Role:** Define user value, prioritize features, acceptance criteria

#### Key Decisions & Requirements

**Critical Feature Rationale:**
> "PNG export is the primary output format for most users. They need to share their Gantt charts in presentations, emails, reports, and documentation. Without export, our app is just a viewer - with export, it becomes a production tool. This completes the core workflow: Create → Edit → Save → Export."

**User Value Proposition:**
1. **Shareability**: Export charts for presentations, reports, emails
2. **Documentation**: Include charts in project documentation
3. **Printing**: High-resolution output for physical prints
4. **Collaboration**: Share with stakeholders who don't have the app
5. **Professional Output**: Charts look polished without manual styling

**Feature Priority Ranking:**
1. 🔴 **Critical:** PNG export with high resolution (minimum 1920px)
2. 🔴 **Critical:** Export options dialog (dimensions, task list toggle)
3. 🟡 **High:** Keyboard shortcut help (? key or Help button)
4. 🟡 **High:** Complete keyboard shortcut coverage
5. 🟢 **Medium:** Welcome tour for first-time users
6. 🟢 **Medium:** Export preview before download
7. 🔵 **Low:** Custom watermark option (V1.1)
8. 🔵 **Low:** PDF export (V1.1)

**Acceptance Criteria:**
- [ ] Export button in toolbar (Phosphor Export icon)
- [ ] Ctrl+E opens export dialog
- [ ] Export dialog shows preview of output
- [ ] Options: Width (1280/1920/2560/Custom), Include task list (toggle)
- [ ] Export produces PNG with correct dimensions
- [ ] Exported image is high-quality (no blur, readable text)
- [ ] Export works with 100+ tasks without crashing
- [ ] Help button (?) in toolbar opens help panel
- [ ] ? key opens help panel from anywhere
- [ ] Help panel lists all keyboard shortcuts
- [ ] First-time users see non-intrusive welcome message

**User Stories:**
- As a project manager, I want to export my Gantt chart for my status presentation
- As a freelancer, I want to send a PNG to my client showing the project timeline
- As a student, I want to include my chart in my thesis document
- As a new user, I want to see what keyboard shortcuts are available
- As a returning user, I want quick access to help without leaving my workflow

---

### 2. Project Manager - Timeline & Risk Management

**Name:** Project Coordinator
**Role:** Schedule tracking, risk mitigation, resource allocation

#### Project Planning

**Time Breakdown:**
```
Day 1 (6 hours):
  - 0.5h: Team alignment meeting
  - 2h: Research html2canvas vs manual canvas rendering
  - 2h: Implement basic PNG export (full chart capture)
  - 1h: Unit tests for export utilities
  - 0.5h: Code review

Day 2 (6 hours):
  - 2h: Export options dialog (ExportDialog component)
  - 2h: Dimension options (preset widths, custom input)
  - 1h: Task list toggle implementation
  - 1h: Integration tests

Day 3 (5 hours):
  - 2h: Export preview component
  - 1.5h: High-resolution scaling logic
  - 1h: Progress indicator for large exports
  - 0.5h: Performance testing

Day 4 (5 hours):
  - 2h: Help panel component (HelpPanel)
  - 1.5h: Keyboard shortcut documentation
  - 1h: ? key handler integration
  - 0.5h: Styling and polish

Day 5 (4 hours):
  - 1.5h: Welcome tour component (WelcomeTour)
  - 1h: First-time user detection (localStorage)
  - 1h: Cross-browser testing
  - 0.5h: Documentation

Day 6 (3 hours):
  - 1h: Bug fixes & edge cases
  - 1h: Final testing (export quality verification)
  - 0.5h: README & CHANGELOG updates
  - 0.5h: Final code review

Total: 29 hours over 6 days
```

**Milestones:**
- **M1** (End of Day 1): Basic PNG export working
- **M2** (End of Day 2): Export options dialog complete
- **M3** (End of Day 3): Preview and scaling complete
- **M4** (End of Day 4): Help panel complete
- **M5** (End of Day 5): Welcome tour complete
- **M6** (End of Day 6): Sprint complete, all tests passing

**Risk Register:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| html2canvas rendering issues | Medium | High | Have fallback to manual canvas, test SVG elements |
| Large charts cause memory issues | Medium | Medium | Implement chunked rendering, limit max dimensions |
| Cross-browser canvas differences | Low | Medium | Test on all browsers, use consistent APIs |
| Export quality insufficient | Medium | High | Use high devicePixelRatio, test at various scales |
| Welcome tour annoying users | Low | Low | Make dismissible, remember preference |

**Dependencies:**
- ✅ All previous sprints complete (1.1-1.5.4)
- ✅ Chart rendering stable (SVG-based)
- ✅ Task table rendering stable
- ❓ html2canvas library (needs evaluation)
- ❓ Alternative: dom-to-image-more library

**Quality Gates:**
- [ ] All unit tests pass (>80% coverage on new code)
- [ ] Export produces correct output at all preset sizes
- [ ] Export works with 100+ tasks in < 5 seconds
- [ ] Exported PNG is sharp at 100% zoom
- [ ] Cross-browser tested (Chrome, Firefox, Safari, Edge)
- [ ] Help panel lists all 20+ keyboard shortcuts accurately
- [ ] Welcome tour works for first-time users only
- [ ] Code reviewed and approved

---

### 3. UX/UI Designer - Interaction Design

**Name:** UX Designer
**Role:** User experience, visual design, interaction patterns

#### Interaction Design Specifications

**Design Principles:**
1. **Professional Output**: Exports should look better than screenshots
2. **Predictable**: Preview shows exactly what will be exported
3. **Flexible**: Options for different use cases (presentation, document, print)
4. **Accessible**: Help always one keystroke away

**Toolbar Addition:**

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│ [📄] [📂] [💾]  |  [↶] [↷]  |  [+] [↑] [↓] [🗑️]  |  [→] [←]  |  [📤]  |  [?]       │
│  New  Open Save    Undo Redo   Add  ↑   ↓  Del     Indent      Export    Help        │
└──────────────────────────────────────────────────────────────────────────────────────┘
                                                       ↑          ↑
                                                    NEW: Export   NEW: Help
                                                    Phosphor:     Phosphor:
                                                    Export        Question
```

**Export Dialog Design:**

```
┌─────────────────────────────────────────────────────────────────┐
│  📤 Export to PNG                                         [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                          │    │
│  │                    [PREVIEW IMAGE]                       │    │
│  │                                                          │    │
│  │            (Scaled preview of export output)             │    │
│  │                                                          │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Export Options                                                  │
│  ─────────────────────────────────────────────────────────────  │
│                                                                  │
│  Width:  ○ 1280px (HD)                                          │
│          ● 1920px (Full HD) - Recommended                       │
│          ○ 2560px (QHD)                                         │
│          ○ 3840px (4K)                                          │
│          ○ Custom: [____] px                                    │
│                                                                  │
│  Include:                                                        │
│          ☑ Task list (left panel)                               │
│          ☑ Timeline header                                       │
│          ☐ Today marker highlight                               │
│                                                                  │
│  Background:                                                     │
│          ● White                                                 │
│          ○ Transparent                                           │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                               [Cancel]  [📥 Export PNG]          │
└─────────────────────────────────────────────────────────────────┘
```

**Help Panel Design:**

```
┌─────────────────────────────────────────────────────────────────┐
│  ❓ Keyboard Shortcuts                                    [✕]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  File Operations                                                 │
│  ───────────────────────────────────────────────────────────    │
│  Ctrl+N          New chart                                       │
│  Ctrl+O          Open file                                       │
│  Ctrl+S          Save                                            │
│  Ctrl+Shift+S    Save As                                         │
│  Ctrl+E          Export to PNG                                   │
│                                                                  │
│  Edit Operations                                                 │
│  ───────────────────────────────────────────────────────────    │
│  Ctrl+Z          Undo                                            │
│  Ctrl+Shift+Z    Redo                                            │
│  Ctrl+Y          Redo (alternative)                              │
│  Ctrl+C          Copy selected tasks                             │
│  Ctrl+X          Cut selected tasks                              │
│  Ctrl+V          Paste tasks                                     │
│  Ctrl+A          Select all tasks                                │
│  Delete          Delete selected tasks                           │
│                                                                  │
│  Selection                                                       │
│  ───────────────────────────────────────────────────────────    │
│  Click           Select task                                     │
│  Ctrl+Click      Add to selection                                │
│  Shift+Click     Range select                                    │
│  Drag            Marquee select (timeline)                       │
│  Escape          Clear selection                                 │
│                                                                  │
│  Hierarchy                                                       │
│  ───────────────────────────────────────────────────────────    │
│  Tab             Indent task (make child)                        │
│  Shift+Tab       Outdent task (make sibling)                     │
│                                                                  │
│  View                                                            │
│  ───────────────────────────────────────────────────────────    │
│  Ctrl+0          Reset zoom to 100%                              │
│  Ctrl++          Zoom in                                         │
│  Ctrl+-          Zoom out                                        │
│  Ctrl+Wheel      Zoom at cursor                                  │
│                                                                  │
│  Navigation                                                      │
│  ───────────────────────────────────────────────────────────    │
│  ?               Show this help                                  │
│  Escape          Close dialog / Clear selection                  │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  💡 Tip: Most shortcuts work with Cmd on Mac                     │
└─────────────────────────────────────────────────────────────────┘
```

**Welcome Tour Design (First-Time Users):**

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│         👋 Welcome to OwnChart!                                  │
│                                                                  │
│    Your privacy-first Gantt chart creator.                      │
│    All data stays on your device - no cloud, no tracking.       │
│                                                                  │
│    Quick tips:                                                   │
│    • Click the empty row to add your first task                 │
│    • Drag task bars to change dates                             │
│    • Press ? anytime for keyboard shortcuts                     │
│                                                                  │
│              [Get Started]  [Show Tour]                          │
│                                                                  │
│    ☐ Don't show this again                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Interaction Specifications:**

| Action | Trigger | Result |
|--------|---------|--------|
| Open export dialog | Click Export button or Ctrl+E | Dialog opens with preview |
| Change export width | Select radio option | Preview updates immediately |
| Toggle task list | Click checkbox | Preview updates immediately |
| Export PNG | Click "Export PNG" button | PNG downloads, dialog closes |
| Cancel export | Click Cancel or Escape | Dialog closes, no export |
| Open help | Click ? button or press ? key | Help panel opens |
| Close help | Click ✕ or press Escape | Help panel closes |
| Dismiss welcome | Click "Get Started" | Welcome closes, preference saved |
| Show tour | Click "Show Tour" | Interactive tour begins |

**Keyboard Shortcuts Added:**
- `Ctrl+E` - Export to PNG
- `?` - Open help panel
- `Escape` - Close any open dialog

---

### 4. Software Architect - Technical Design

**Name:** Tech Lead
**Role:** System design, architecture decisions, technical standards

#### Technical Architecture

**PNG Export Strategy:**

After evaluating options, recommend **html2canvas** as primary approach with fallbacks:

1. **Primary: html2canvas**
   - Captures DOM as canvas
   - Handles SVG, CSS, images
   - Well-maintained library
   - Limitations: Custom fonts may need preloading

2. **Fallback: dom-to-image-more**
   - Better SVG support
   - Smaller bundle size
   - Use if html2canvas has issues

3. **Manual Canvas (Last Resort)**
   - Direct canvas API rendering
   - Full control but high effort
   - Only if libraries fail

**Export Pipeline:**

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Capture   │ ──▶ │   Scale     │ ──▶ │  Convert    │ ──▶ │  Download   │
│   DOM       │     │   to Size   │     │  to Blob    │     │   File      │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
     │                    │                   │                    │
     ▼                    ▼                   ▼                    ▼
 html2canvas()      scale option         canvas.toBlob()    <a download>
 or dom-to-image    devicePixelRatio     'image/png'        click()
```

**File Structure:**

```
src/
├── components/
│   ├── Export/
│   │   ├── ExportDialog.tsx      # Main export dialog
│   │   ├── ExportPreview.tsx     # Live preview component
│   │   ├── ExportOptions.tsx     # Options form
│   │   └── index.ts
│   ├── Help/
│   │   ├── HelpPanel.tsx         # Keyboard shortcut reference
│   │   ├── WelcomeTour.tsx       # First-time user experience
│   │   └── index.ts
│   └── Toolbar/
│       ├── ExportButton.tsx      # Export toolbar button
│       └── HelpButton.tsx        # Help toolbar button
├── hooks/
│   ├── useExport.ts              # Export logic and state
│   ├── useFirstTimeUser.ts       # First-time detection
│   └── useHelpPanel.ts           # Help panel state
├── utils/
│   └── export/
│       ├── captureChart.ts       # DOM capture logic
│       ├── scaleCanvas.ts        # Resolution scaling
│       └── downloadPng.ts        # File download helper
└── store/
    └── slices/
        └── uiSlice.ts            # Add export/help UI state
```

**Key Interfaces:**

```typescript
// Export options
interface ExportOptions {
  width: number;                    // Target width in pixels
  includeTaskList: boolean;         // Include left panel
  includeHeader: boolean;           // Include timeline header
  background: 'white' | 'transparent';
  quality: number;                  // 0.0 - 1.0 for JPEG (unused for PNG)
}

// Export state
interface ExportState {
  isExporting: boolean;
  progress: number;                 // 0-100
  error: string | null;
}

// Help panel state
interface HelpState {
  isOpen: boolean;
}

// First-time user state
interface FirstTimeState {
  hasSeenWelcome: boolean;
  hasCompletedTour: boolean;
}
```

**Export Implementation Pseudocode:**

```typescript
async function exportToPng(options: ExportOptions): Promise<void> {
  const { width, includeTaskList, background } = options;

  // 1. Get the element to capture
  const chartElement = document.querySelector('.ownchart-layout');
  if (!chartElement) throw new Error('Chart not found');

  // 2. Calculate scale factor for high resolution
  const currentWidth = chartElement.offsetWidth;
  const scale = width / currentWidth;

  // 3. Prepare element for capture (hide scrollbars, etc.)
  const cleanup = prepareForCapture(chartElement);

  try {
    // 4. Capture to canvas
    const canvas = await html2canvas(chartElement, {
      scale: scale * window.devicePixelRatio,
      backgroundColor: background === 'white' ? '#ffffff' : null,
      useCORS: true,
      logging: false,
      // Exclude elements if needed
      ignoreElements: (el) => {
        if (!includeTaskList && el.classList.contains('task-table')) {
          return true;
        }
        return false;
      }
    });

    // 5. Convert to blob and download
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => b ? resolve(b) : reject(new Error('Failed to create blob')),
        'image/png',
        1.0
      );
    });

    // 6. Trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gantt-chart-${Date.now()}.png`;
    link.click();
    URL.revokeObjectURL(url);

  } finally {
    cleanup();
  }
}
```

**Performance Considerations:**

| Scenario | Expected Time | Mitigation |
|----------|---------------|------------|
| 10 tasks, 1920px | < 500ms | No mitigation needed |
| 50 tasks, 1920px | < 1s | Show progress indicator |
| 100 tasks, 1920px | < 2s | Show progress indicator |
| 100 tasks, 4K | < 5s | Show progress, warn user |
| 500+ tasks | > 10s | Warn user, consider pagination |

**Bundle Impact:**
- html2canvas: ~40KB gzipped
- dom-to-image-more: ~15KB gzipped
- Recommend html2canvas for better compatibility

---

### 5. QA Engineer - Testing Strategy

**Name:** QA Lead
**Role:** Test planning, quality assurance, bug tracking

#### Test Plan

**Export Testing Matrix:**

| Browser | 1280px | 1920px | 2560px | 4K | Task List | No Task List |
|---------|--------|--------|--------|-----|-----------|--------------|
| Chrome  | ☐      | ☐      | ☐      | ☐   | ☐         | ☐            |
| Firefox | ☐      | ☐      | ☐      | ☐   | ☐         | ☐            |
| Safari  | ☐      | ☐      | ☐      | ☐   | ☐         | ☐            |
| Edge    | ☐      | ☐      | ☐      | ☐   | ☐         | ☐            |

**Test Cases:**

```typescript
// Unit Tests
describe('Export Utils', () => {
  describe('captureChart', () => {
    it('should capture chart element to canvas');
    it('should handle missing element gracefully');
    it('should respect scale option');
    it('should exclude task list when option is false');
  });

  describe('scaleCanvas', () => {
    it('should scale canvas to target width');
    it('should maintain aspect ratio');
    it('should handle devicePixelRatio');
  });

  describe('downloadPng', () => {
    it('should create download link');
    it('should use correct filename format');
    it('should clean up object URL after download');
  });
});

// Integration Tests
describe('Export Dialog', () => {
  it('should open on Ctrl+E');
  it('should show preview when opened');
  it('should update preview when options change');
  it('should close on Cancel');
  it('should close on Escape');
  it('should export PNG on button click');
  it('should show progress during export');
  it('should handle export errors gracefully');
});

describe('Help Panel', () => {
  it('should open on ? key press');
  it('should open on Help button click');
  it('should close on Escape');
  it('should close on backdrop click');
  it('should list all keyboard shortcuts');
  it('should show Mac shortcuts on Mac');
});

describe('Welcome Tour', () => {
  it('should show for first-time users');
  it('should not show for returning users');
  it('should save preference on dismiss');
  it('should start tour on "Show Tour" click');
});
```

**Manual Testing Checklist:**

- [ ] Export produces sharp image at 100% zoom
- [ ] Text is readable in exported image
- [ ] Colors match on-screen appearance
- [ ] Task bars render correctly
- [ ] Dependencies/arrows render correctly
- [ ] Grid lines render correctly
- [ ] Today marker renders correctly (if included)
- [ ] Progress bars render correctly
- [ ] Summary brackets render correctly
- [ ] Milestones render correctly
- [ ] Export filename includes timestamp
- [ ] Large export (100+ tasks) completes without crash
- [ ] Memory is released after export

**Accessibility Testing:**

- [ ] Export dialog is keyboard navigable
- [ ] Help panel is keyboard navigable
- [ ] Focus trap works in dialogs
- [ ] Screen reader announces dialog content
- [ ] Escape key closes dialogs
- [ ] Color contrast meets WCAG AA

---

### 6. DevOps Engineer - Build & Deployment

**Name:** DevOps Lead
**Role:** Build pipeline, deployment, monitoring

#### Build Configuration

**New Dependencies:**

```json
{
  "dependencies": {
    "html2canvas": "^1.4.1"
  }
}
```

**Bundle Size Impact:**
- Before: ~XXX KB
- After: ~XXX KB + 40KB (html2canvas)
- Acceptable for MVP

**Lazy Loading Strategy:**
```typescript
// Lazy load html2canvas only when export is triggered
const exportChart = async (options: ExportOptions) => {
  const html2canvas = (await import('html2canvas')).default;
  // ... export logic
};
```

**Environment Variables:**
- None required for this sprint

**CI/CD Considerations:**
- Add visual regression tests for export output
- Test export in headless Chrome
- Monitor bundle size increase

---

## Implementation Plan

### Phase 1: Core Export (Days 1-3)

1. **Setup & Research** (Day 1)
   - Install html2canvas
   - Create proof of concept
   - Test SVG element capture
   - Verify font rendering

2. **Export Dialog** (Day 2)
   - Create ExportDialog component
   - Implement options form
   - Add preview functionality
   - Connect to keyboard shortcut

3. **Export Quality** (Day 3)
   - Implement scaling logic
   - Test at various resolutions
   - Handle edge cases
   - Performance optimization

### Phase 2: Help & Polish (Days 4-5)

4. **Help Panel** (Day 4)
   - Create HelpPanel component
   - Document all shortcuts
   - Add ? key handler
   - Style and polish

5. **Welcome Tour** (Day 5)
   - Create WelcomeTour component
   - Implement first-time detection
   - Add localStorage persistence
   - Optional: interactive tour

### Phase 3: Testing & Release (Day 6)

6. **Final Testing** (Day 6)
   - Cross-browser testing
   - Export quality verification
   - Bug fixes
   - Documentation

---

## Success Criteria

### MVP Complete When:
1. ✅ User can export chart to PNG at multiple resolutions
2. ✅ Export options allow customization
3. ✅ Exported images are high-quality and professional
4. ✅ Help panel documents all shortcuts
5. ✅ First-time users see welcome message
6. ✅ All tests pass
7. ✅ Cross-browser compatibility verified

### Definition of Done:
- [ ] All acceptance criteria met
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests written and passing
- [ ] Manual testing checklist completed
- [ ] Code reviewed and approved
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] No critical bugs

---

## Appendix

### A. Keyboard Shortcut Reference (Complete List)

| Category | Shortcut | Action |
|----------|----------|--------|
| **File** | Ctrl+N | New chart |
| | Ctrl+O | Open file |
| | Ctrl+S | Save |
| | Ctrl+Shift+S | Save As |
| | Ctrl+E | Export to PNG |
| **Edit** | Ctrl+Z | Undo |
| | Ctrl+Shift+Z | Redo |
| | Ctrl+Y | Redo (alt) |
| | Ctrl+C | Copy |
| | Ctrl+X | Cut |
| | Ctrl+V | Paste |
| | Ctrl+A | Select all |
| | Delete | Delete selected |
| **Selection** | Click | Select task |
| | Ctrl+Click | Add to selection |
| | Shift+Click | Range select |
| | Drag (timeline) | Marquee select |
| | Escape | Clear selection |
| **Hierarchy** | Tab | Indent |
| | Shift+Tab | Outdent |
| **View** | Ctrl+0 | Reset zoom |
| | Ctrl++ | Zoom in |
| | Ctrl+- | Zoom out |
| | Ctrl+Wheel | Zoom at cursor |
| **Help** | ? | Open help |
| | Escape | Close dialog |

### B. Export Quality Guidelines

**Recommended Settings by Use Case:**

| Use Case | Width | Task List | Notes |
|----------|-------|-----------|-------|
| Email attachment | 1280px | Yes | Smaller file size |
| Presentation slide | 1920px | Optional | Standard HD |
| Document embed | 1920px | Yes | Good quality |
| Print (A4) | 2560px | Yes | Higher resolution |
| Print (poster) | 3840px | Yes | Maximum quality |

### C. Library Comparison

| Feature | html2canvas | dom-to-image-more | Manual Canvas |
|---------|-------------|-------------------|---------------|
| Bundle size | 40KB | 15KB | 0KB |
| SVG support | Good | Better | Full control |
| CSS support | Good | Good | Manual |
| Font support | Requires preload | Better | Manual |
| Maintenance | Active | Active | N/A |
| Ease of use | Easy | Easy | Hard |

**Decision:** Use html2canvas as primary, with dom-to-image-more as fallback if needed.

---

**Document Version:** 1.0
**Created:** 2026-01-05
**Author:** Claude AI (with Martin)
**Status:** Ready for Implementation
