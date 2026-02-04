# UI/UX Specifications

> **Note**: This document reflects the original design specifications. The current implementation (v0.0.33) includes additional UI enhancements not fully documented here:
> - MS Office-style Ribbon UI (tabbed interface: File, Task, View, Help)
> - Smart Color Management with 5 color modes
> - Export dialog with Figma-style live preview
> - See CHANGELOG.md for complete implementation details

## 1. Design Principles

### 1.1 Core Principles

1. **Simplicity First**: Every feature must justify its presence
2. **Visual Hierarchy**: Important actions prominent, secondary actions discoverable
3. **Immediate Feedback**: All actions provide instant visual confirmation
4. **Consistency**: Same patterns throughout the interface
5. **Beauty by Default**: Professional appearance with zero configuration

### 1.2 Design Values

- **Speed**: Minimize clicks to accomplish tasks
- **Clarity**: Purpose of every element should be obvious
- **Delight**: Smooth animations, pleasant interactions
- **Accessibility**: Keyboard navigation, screen readers, high contrast

---

## 2. Layout Structure

### 2.1 Overall Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo]  Untitled Chart            [File] [Export] [?]  [|||]   │ ← Top Toolbar (60px)
├────────────┬────────────────────────────────────────────┬────────┤
│            │                                            │        │
│   Task     │                                            │ Settings│
│   List     │         Gantt Chart Canvas                 │ Panel  │
│   Panel    │                                            │ (Colla │
│            │                                            │ psible)│
│  (300px)   │                                            │ (280px)│
│            │                                            │        │
│            │                                            │        │
├────────────┴────────────────────────────────────────────┴────────┤
│  [<--] ●────●───────────────●───────────────────────────> [+]    │ ← History Timeline (80px)
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Responsive Behavior

**Desktop (1920x1080)**:
- Task List: 300px
- Settings Panel: 280px (collapsible)
- Chart Canvas: Remaining width

**Laptop (1366x768)**:
- Task List: 280px
- Settings Panel: Hidden by default (overlay when opened)
- Chart Canvas: Remaining width

**Minimum Supported**: 1280x720

---

## 3. Component Specifications

### 3.1 Top Toolbar

**Height**: 60px
**Background**: White (#FFFFFF) or Dark (#1f2937) based on theme
**Border**: Bottom 1px solid #e5e7eb

**Layout**:
```
[App Icon/Logo]  [Chart Title (editable)]              [Actions]
                                                   [Save] [Export] [?]
```

**Components**:

1. **App Logo/Icon** (Left)
   - Size: 32x32px
   - Click: Show app menu (New, Open, Settings, About)

2. **Chart Title** (Center-Left)
   - Font: 18px, semibold
   - Editable: Click to edit inline
   - Max width: 400px, truncate with ellipsis

3. **Action Buttons** (Right)
   - Button size: 36x36px
   - Icon size: 20x20px
   - Spacing: 8px gap
   - Buttons:
     - **New** (page icon)
     - **Open** (folder icon)
     - **Save** (download icon)
     - **Export** (share icon) → Opens export menu
     - **Undo** (↶ icon) - Disabled state when nothing to undo
     - **Redo** (↷ icon) - Disabled state when nothing to redo
     - **Help** (? icon)
     - **Settings** (gear icon) → Toggles settings panel

**Interactions**:
- Hover: Background color change (#f3f4f6)
- Active: Scale 0.95
- Tooltips on all buttons (show shortcut if available)

---

### 3.2 Task List Panel

**Width**: 300px (resizable 200-500px)
**Background**: #f9fafb
**Border**: Right 1px solid #e5e7eb

**Header**:
```
Tasks (12)                                           [+ Add Task]
```
- Font: 14px, semibold, uppercase, #6b7280
- Add button: Primary color, hover lift effect

**Task Row**:
```
┌────────────────────────────────────────────────────┐
│ [≡] Design mockups                        [●] [×]  │
│     Dec 15 - Dec 22 (7 days)              60%      │
└────────────────────────────────────────────────────┘
```

**Components**:
1. **Drag Handle** ([≡])
   - 6px wide, shows on hover
   - Cursor: grab/grabbing

2. **Task Name**
   - Font: 14px, medium
   - Double-click: Inline edit
   - Single-click: Select (highlight chart bar)

3. **Date Range**
   - Font: 12px, regular, #6b7280
   - Format: "MMM DD - MMM DD (N days)"

4. **Progress** (if set)
   - Font: 12px, semibold, colored
   - Position: Bottom right

5. **Color Indicator** ([●])
   - 16x16px circle, task color
   - Click: Color picker dropdown

6. **Delete** ([×])
   - Shows on hover
   - Click: Confirm delete (modal or inline)

**States**:
- Default: White background
- Hover: #f3f4f6 background
- Selected: Primary color (10% opacity) background, left border 3px
- Dragging: Shadow, 50% opacity

---

### 3.3 Gantt Chart Canvas

**Background**: White (#FFFFFF)
**Grid**: Vertical lines for time divisions, #e5e7eb

**Components**:

1. **Timeline Header** (Top, 60px height)
   ```
   ┌─────────────────────────────────────────────────┐
   │         December 2025         │   January 2026  │ ← Month row
   ├────┬────┬────┬────┬────┬────┬─┼─────────────────┤
   │ 15 │ 16 │ 17 │ 18 │ 19 │ 20 │ ... │ 01 │ 02 │  ← Day row
   └────┴────┴────┴────┴────┴────┴─┴─────────────────┘
   ```
   - Month row: 30px, 16px font, semibold, #1f2937
   - Day/Week row: 30px, 13px font, #6b7280
   - Today: Highlighted background (#fef3c7)
   - Weekend: Lighter background (#f9fafb) if enabled

2. **Task Bars**
   - Height: 32px
   - Corner radius: 4px
   - Background: Task color
   - Border: 1px solid (darker shade of task color)
   - Padding: 8px horizontal
   - Shadow: 0 1px 3px rgba(0,0,0,0.1)

   **Task Bar Content**:
   ```
   ┌──────────────────────────────────┐
   │ Design mockups            60%    │
   └──────────────────────────────────┘
   ```
   - Text: 13px, medium, white (if dark background) or black (if light)
   - Progress: Right-aligned, 12px

   **Progress Indicator** (Optional):
   - Fill from left: Semi-transparent overlay (20% darker)
   - Width: percentage of task bar

   **States**:
   - Default: As described
   - Hover: Brightness +10%, cursor: move, connection handles visible
   - Selected: Brightness +20%, outline 2px solid primary
   - Dragging: Opacity 70%, shadow elevation increased
   - Resize handles: 4px width on left/right edges, cursor: ew-resize

   **Connection Handles** (for creating dependencies):
   - **Purpose**: Make dependency creation discoverable (no Alt+Drag required)
   - **Visibility**: Appear only on hover over task bar
   - **Position**: Small circles at left and right edges, vertically centered
   - **Size**: 10px diameter (16px touch target with padding)
   - **Style**:
     - Background: White
     - Border: 2px solid #3b82f6 (primary blue)
     - Shadow: 0 1px 3px rgba(0,0,0,0.3)
     - Icon: Small arrow inside (→ for right, ← for left)
   - **States**:
     - Default (on hover): Border color #3b82f6, slight pulse animation
     - Hover: Scale 1.2, border color #2563eb (darker blue)
     - Active (dragging): Scale 1.1, cursor: crosshair
     - Connecting: Show temporary arrow following cursor
   - **Interaction Flow**:
     1. User hovers over task bar → Connection handles appear at left/right edges
     2. User hovers over connection handle → Handle scales up, tooltip shows "Drag to create dependency"
     3. User drags from right handle → Arrow follows cursor, valid drop targets highlight
     4. User drops on another task's left handle → Dependency created (FS type)
     5. Invalid target (self, circular) → Red highlight, cursor: not-allowed
   - **Accessibility**:
     - Connection handles have aria-label: "Create dependency from [task name]"
     - Keyboard alternative: Select task, press 'D' key, arrow keys to select target, Enter to create
   - **Visual Example**:
     ```
     Task Bar Default:
     ┌──────────────────────────────────┐
     │ Design mockups            60%    │
     └──────────────────────────────────┘

     Task Bar Hover (connection handles visible):
     ┌──────────────────────────────────┐
   ◯ │ Design mockups            60%    │ ◯
     └──────────────────────────────────┘
     ^                                   ^
     Left handle                    Right handle
     (for SS/FF - V1.1)            (for FS - MVP)

     Dragging to create dependency:
     ┌──────────────────────────────────┐
     │ Design mockups            60%    │ ⊙────────→ (cursor)
     └──────────────────────────────────┘

     Drop target highlighted:
                   ┌──────────────────────────────────┐
                 ⊙ │ Development               0%     │
                   └──────────────────────────────────┘
                   ^
               Valid drop target (green border)
     ```
   - **Implementation Notes**:
     - MVP: Only right handle active (FS dependencies only)
     - V1.1: Both handles active (SS/FF/SF dependencies)
     - Connection handles render above task bars (z-index: 10)
     - Handles hidden during task drag/resize to avoid confusion
     - Alt+Drag method still works as power-user alternative

3. **Dependencies (Arrows)**
   - Path: SVG line from predecessor end to successor start
   - Color: #6b7280
   - Width: 2px
   - Style:
     - Horizontal from task end
     - Down/up to target level
     - Horizontal to task start
     - Arrow head at end
   - Hover: Color changes to primary, width 3px
   - Click: Select (highlight, show delete button)

4. **Milestones**
   - Shape: Diamond (rotated square)
   - Size: 16x16px
   - Color: Milestone color
   - Border: 2px solid
   - Label: Below, 12px, centered
   - Hover: Scale 1.2, show tooltip with description

5. **Today Marker**
   - Vertical line: Full height
   - Color: #ef4444 (red)
   - Width: 2px
   - Style: Solid
   - Label: "Today" at top, small badge

6. **Grid Lines**
   - Vertical: Every day/week/month (based on zoom)
   - Color: #e5e7eb
   - Width: 1px
   - Style: Solid (major) or dashed (minor)

**Interactions**:
- **Pan**: Horizontal scroll (mouse wheel, trackpad, scrollbar)
- **Zoom**: Ctrl/Cmd + scroll, or pinch gesture
- **Select**: Click on task bar or row
- **Multi-select**: Ctrl/Cmd + click
- **Move Task**: Drag task bar horizontally
- **Resize Task**: Drag left/right edges
- **Create Dependency**: Drag from connection handle (appears on hover) OR Alt/Option + drag from task to task
- **Context Menu**: Right-click on task

---

### 3.4 Settings Panel

**Width**: 280px
**Background**: #f9fafb
**Border**: Left 1px solid #e5e7eb

**Collapsible**: Click gear icon or chevron to collapse

**Sections** (Accordion style):

1. **View Settings**
   ```
   View Settings                              [˄]
   ───────────────────────────────────────────
   View Mode:  [Day] [Week] [Month]  ← Toggle buttons
   Zoom: [━━━━●━━━━━] 100%          ← Slider
   □ Show Weekends                   ← Checkbox
   □ Show Today Marker               ← Checkbox
   ```

2. **Colors & Theme**
   ```
   Colors & Theme                             [˄]
   ───────────────────────────────────────────
   Theme: [Default ˅]                ← Dropdown

   Task Colors:
   [■][■][■][■][■][■][■][■]         ← Color palette

   [+ Custom Color]                  ← Button
   ```

3. **Chart Settings**
   ```
   Chart Settings                             [˄]
   ───────────────────────────────────────────
   Chart Name: [Untitled Chart____]  ← Input
   Description: [____________]       ← Textarea
   Tags: [web, q1] [×]              ← Tag input
   ```

4. **Export Settings**
   ```
   Export Settings                            [˄]
   ───────────────────────────────────────────
   Format: [PNG ˅] [SVG] [PDF]      ← Tabs

   Resolution: [━━━●━━━] 300 DPI    ← Slider
   Background: [■ White ˅]          ← Color picker

   [Export]                          ← Primary button
   ```

5. **History**
   ```
   History                                    [˄]
   ───────────────────────────────────────────
   Max entries: [1000_____]         ← Number input
   Current: 245 entries              ← Info text

   [Clear History]                   ← Secondary button
   ```

---

### 3.5 History Timeline Slider

**Height**: 80px
**Background**: #f9fafb
**Border**: Top 1px solid #e5e7eb

**Layout**:
```
┌───────────────────────────────────────────────────────────┐
│  10:30 AM    11:15 AM    12:00 PM    2:30 PM    Now       │
│     ●──────────●──────────●──────────────●────────●       │
│                           ▲                                │
│     [<]                [Current]                   [+]     │
└───────────────────────────────────────────────────────────┘
```

**Components**:

1. **Timeline Track**
   - Width: Full width minus margins
   - Height: 4px
   - Color: #d1d5db
   - Active (left of cursor): Primary color

2. **History Points** (●)
   - Size: 8px
   - Color: #6b7280
   - Hover: Scale 1.5, show tooltip with description
   - Click: Jump to that point

3. **Snapshot Markers** (■)
   - Size: 12x12px (square)
   - Color: Primary color
   - Label: Snapshot name on hover
   - Click: Jump to snapshot

4. **Current Position Marker** (▲)
   - Size: 12px triangle
   - Color: Primary color
   - Draggable: Scrub through history

5. **Time Labels**
   - Font: 11px, #6b7280
   - Position: Above track
   - Show: 5-7 labels evenly distributed

6. **Controls**
   - [<] Previous: Go to previous history point
   - [+] Snapshot: Create named snapshot at current position
   - Both: 32x32px buttons

**Interactions**:
- **Drag marker**: Scrub through history, chart updates in real-time
- **Click track**: Jump to that point in history
- **Keyboard**: Arrow keys to move forward/back
- **Scroll**: Zoom timeline (show more/less detail)

---

## 4. Visual Design System

### 4.1 Typography

**Font Family**: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif

**Font Scales**:
- **Heading 1**: 24px, bold (Chart title in modals)
- **Heading 2**: 18px, semibold (Chart title in toolbar)
- **Heading 3**: 16px, semibold (Section headers)
- **Body**: 14px, regular (Main text)
- **Small**: 12px, regular (Secondary text, dates)
- **Tiny**: 11px, regular (Labels, hints)

**Font Weights**:
- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700

### 4.2 Color Palette

**Primary Colors** (Default Theme):
```
Primary Blue:   #3b82f6 (Main actions, selected states)
Primary Dark:   #2563eb (Hover states)
Primary Light:  #dbeafe (Backgrounds, subtle highlights)
```

**Grayscale**:
```
Gray 900:  #111827 (Primary text)
Gray 800:  #1f2937 (Headings)
Gray 700:  #374151
Gray 600:  #4b5563
Gray 500:  #6b7280 (Secondary text)
Gray 400:  #9ca3af
Gray 300:  #d1d5db (Borders)
Gray 200:  #e5e7eb (Dividers)
Gray 100:  #f3f4f6 (Hover backgrounds)
Gray 50:   #f9fafb (Panel backgrounds)
White:     #ffffff
```

**Semantic Colors**:
```
Success:   #10b981 (Green)
Warning:   #f59e0b (Orange)
Error:     #ef4444 (Red)
Info:      #06b6d4 (Cyan)
```

**Task Color Palette**:
```
Blue:      #3b82f6
Green:     #10b981
Orange:    #f59e0b
Red:       #ef4444
Purple:    #8b5cf6
Pink:      #ec4899
Cyan:      #06b6d4
Lime:      #84cc16
```

### 4.3 Spacing System

**Base Unit**: 4px

```
xs:  4px   (0.25rem)
sm:  8px   (0.5rem)
md:  16px  (1rem)
lg:  24px  (1.5rem)
xl:  32px  (2rem)
2xl: 48px  (3rem)
3xl: 64px  (4rem)
```

### 4.4 Shadows

```
sm:   0 1px 2px rgba(0, 0, 0, 0.05)
md:   0 4px 6px rgba(0, 0, 0, 0.1)
lg:   0 10px 15px rgba(0, 0, 0, 0.1)
xl:   0 20px 25px rgba(0, 0, 0, 0.15)
```

### 4.5 Border Radius

```
sm:   2px
md:   4px
lg:   8px
xl:   12px
full: 9999px (pill shape)
```

---

## 5. Interaction Patterns

### 5.1 Button States

**Primary Button**:
- Default: Primary color background, white text
- Hover: Primary dark background, scale 1.02
- Active: Primary darker, scale 0.98
- Disabled: Gray 300 background, Gray 500 text, cursor not-allowed
- Loading: Spinner icon, disabled state

**Secondary Button**:
- Default: White background, Gray 700 text, Gray 300 border
- Hover: Gray 50 background
- Active: Gray 100 background, scale 0.98
- Disabled: Gray 100 background, Gray 400 text

**Icon Button**:
- Default: Transparent background, Gray 600 icon
- Hover: Gray 100 background, Gray 900 icon
- Active: Gray 200 background
- Size: 32x32px or 36x36px

### 5.2 Form Elements

**Text Input**:
```
┌──────────────────────────────┐
│ Placeholder text              │
└──────────────────────────────┘
```
- Border: 1px solid Gray 300
- Padding: 8px 12px
- Focus: Primary color border, shadow
- Error: Red border, error message below

**Dropdown/Select**:
```
┌────────────────────────────┬─┐
│ Selected option            │˅│
└────────────────────────────┴─┘
```
- Same as text input
- Chevron icon on right
- Dropdown panel: White background, shadow lg, max-height 300px

**Checkbox**:
```
☑ Label text
```
- Size: 16x16px
- Checked: Primary color background, white checkmark
- Unchecked: Gray 300 border
- Hover: Gray 100 background

**Slider**:
```
━━━━━●━━━━━━  50%
```
- Track: 4px height, Gray 300
- Active track: Primary color
- Thumb: 16px circle, Primary color, shadow md
- Hover thumb: Scale 1.1
- Value label: Right side, 12px

**Date Picker**:
- Opens modal calendar
- Today highlighted
- Selected date: Primary color background
- Range selection (start/end dates)

**Color Picker**:
- Preset colors: 8x8 grid of squares
- Custom color: Opens native color picker or advanced picker modal

### 5.3 Modals

**Structure**:
```
┌─────────────────────────────────────────────────────────┐
│                                                  [×]    │
│  Modal Title                                            │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Modal content goes here...                             │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                              [Cancel]  [Primary Action] │
└─────────────────────────────────────────────────────────┘
```
- Background overlay: rgba(0, 0, 0, 0.5)
- Modal: White, shadow xl, border-radius lg
- Max width: 500px (small) or 800px (large)
- Centered on screen
- Animation: Fade in + scale from 0.95 to 1.0
- Close: X button, Escape key, click outside

### 5.4 Tooltips

```
        ↓
┌──────────────┐
│ Tooltip text │
└──────────────┘
```
- Background: Gray 900, 90% opacity
- Text: White, 12px
- Padding: 4px 8px
- Border radius: 4px
- Arrow: 6px triangle
- Show delay: 500ms
- Hide delay: Immediate on mouse out

### 5.5 Context Menu

Right-click on task:
```
┌──────────────────────┐
│ ✏ Edit Task         │
│ 🎨 Change Color     │
│ ├─ Create Dependency│
│ 📋 Duplicate        │
│ ──────────────────  │
│ 🗑 Delete           │
└──────────────────────┘
```
- Background: White, shadow lg
- Items: 36px height, 8px padding
- Hover: Gray 100 background
- Icons: 16px, Gray 600
- Divider: 1px Gray 200

### 5.6 Drag and Drop

**Visual Feedback**:
1. **Grab**: Cursor changes to grab
2. **Dragging**:
   - Element opacity 70%
   - Shadow elevation increased
   - Cursor: grabbing
3. **Drop Zone**:
   - Valid: Highlight with primary color (20% opacity)
   - Invalid: Red highlight (20% opacity), cursor: not-allowed
4. **Drop**:
   - Snap animation to final position
   - Success feedback (brief highlight)

---

## 6. Animations

### 6.1 Animation Timings

```
Fast:     150ms  (Hover, simple state changes)
Medium:   250ms  (Modal open, panel slide)
Slow:     400ms  (Page transitions, complex animations)
```

### 6.2 Easing Functions

```
Ease In:     cubic-bezier(0.4, 0, 1, 1)
Ease Out:    cubic-bezier(0, 0, 0.2, 1)  ← Most common
Ease In-Out: cubic-bezier(0.4, 0, 0.2, 1)
Spring:      Custom spring physics for drag/drop
```

### 6.3 Key Animations

1. **Task Bar Movement**: 250ms ease-out, transform translate
2. **History Scrubbing**: Immediate (no animation, 60fps updates)
3. **Panel Slide**: 250ms ease-out, transform translateX
4. **Modal**: 200ms ease-out, opacity + scale
5. **Tooltip**: 150ms ease-out, opacity
6. **Button Hover**: 150ms ease-out, background-color
7. **Drag Preview**: Follow cursor (RAF), spring physics on drop

---

## 7. Accessibility

**Target Standard**: WCAG 2.1 Level AA Compliance

### 7.1 Keyboard Navigation

#### 7.1.1 Global Shortcuts
```
Ctrl/Cmd + S       Save chart
Ctrl/Cmd + O       Open chart
Ctrl/Cmd + N       New chart
Ctrl/Cmd + Z       Undo
Ctrl/Cmd + Y       Redo
Ctrl/Cmd + E       Export menu
Ctrl/Cmd + /       Show keyboard shortcuts
Delete             Delete selected task
Esc                Close modal/deselect
Tab                Next focusable element
Shift + Tab        Previous focusable element
```

#### 7.1.2 Chart Navigation
```
Arrow Keys         Navigate tasks (when list focused)
Enter              Edit selected task
Space              Toggle selection
Ctrl/Cmd + A       Select all tasks
Home               Jump to first task
End                Jump to last task
```

#### 7.1.3 History Navigation
```
Alt + Left         Previous history point
Alt + Right        Next history point
Ctrl/Cmd + H       Toggle history panel
```

#### 7.1.4 Focus Management Rules

**Focus Trap**: When modal dialogs open, trap focus within the modal

```typescript
function trapFocus(containerElement: HTMLElement) {
  const focusableElements = containerElement.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const firstElement = focusableElements[0] as HTMLElement;
  const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

  containerElement.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }

    if (e.key === 'Escape') {
      closeModal();
    }
  });
}
```

**Focus Restoration**: After closing a modal, return focus to the trigger element

```typescript
let lastFocusedElement: HTMLElement | null = null;

function openModal(modal: HTMLElement) {
  lastFocusedElement = document.activeElement as HTMLElement;
  modal.showModal();
  trapFocus(modal);

  // Focus first focusable element in modal
  const firstFocusable = modal.querySelector('button, input') as HTMLElement;
  firstFocusable?.focus();
}

function closeModal() {
  modal.close();
  lastFocusedElement?.focus(); // Restore focus
}
```

### 7.2 Focus Indicators

**Specification**:
- Visible outline: 2px solid #0066CC (primary blue)
- Offset: 2px from element
- Border radius: matches element
- Always visible (no :focus-visible suppression on mouse)

**Implementation**:
```css
*:focus {
  outline: 2px solid var(--focus-color);
  outline-offset: 2px;
  border-radius: inherit;
}

/* Skip link special styling */
.skip-link:focus {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 9999;
  background: var(--focus-color);
  color: white;
  padding: 1rem;
}
```

**Tab Order**: Logical flow top-to-bottom, left-to-right:
1. Skip links
2. Main toolbar (New, Open, Save, Export)
3. Task list
4. Chart canvas (interactive elements)
5. Settings panel (if visible)
6. History timeline

### 7.3 ARIA Roles and Labels

#### 7.3.1 Component-Level Specifications

**Toolbar**:
```tsx
<div role="toolbar" aria-label="Main toolbar" aria-controls="gantt-chart">
  <button aria-label="New chart (Ctrl+N)">
    <PlusIcon aria-hidden="true" />
  </button>
  <button aria-label="Open chart (Ctrl+O)">
    <FolderIcon aria-hidden="true" />
  </button>
  <button aria-label="Save chart (Ctrl+S)" aria-disabled="false">
    <SaveIcon aria-hidden="true" />
  </button>
</div>
```

**Task List**:
```tsx
<div
  role="list"
  aria-label="Task list"
  aria-describedby="task-list-description"
>
  <div id="task-list-description" className="sr-only">
    {tasks.length} tasks. Use arrow keys to navigate, Enter to edit, Space to select.
  </div>

  {tasks.map(task => (
    <div
      key={task.id}
      role="listitem"
      aria-label={`Task: ${task.name}, ${format(task.startDate)} to ${format(task.endDate)}`}
      aria-selected={selectedTaskIds.includes(task.id)}
      tabIndex={0}
      onKeyDown={handleTaskKeyDown}
    >
      {task.name}
    </div>
  ))}
</div>
```

**Chart Canvas (Interactive SVG)**:
```tsx
<svg
  role="img"
  aria-label={`Gantt chart: ${chartName}, ${tasks.length} tasks, ${dateRange}`}
  aria-describedby="chart-description"
  tabIndex={0}
>
  <desc id="chart-description">
    Timeline visualization showing {tasks.length} tasks spanning from {startDate} to {endDate}.
    Tasks are shown as horizontal bars with dependencies indicated by arrows.
  </desc>

  {tasks.map(task => (
    <g
      key={task.id}
      role="button"
      aria-label={`${task.name}: ${task.duration} days, ${task.progress}% complete`}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') editTask(task);
      }}
    >
      <rect className="task-bar" {...taskBarProps} />
      <text className="task-label">{task.name}</text>
    </g>
  ))}
</svg>
```

**Dependency Arrows**:
```tsx
<g
  role="img"
  aria-label={`Dependency: ${fromTask.name} must finish before ${toTask.name} starts`}
>
  <path d={arrowPath} />
</g>
```

**History Timeline Slider**:
```tsx
<div
  role="slider"
  aria-label="History timeline"
  aria-valuenow={currentHistoryIndex}
  aria-valuemin={0}
  aria-valuemax={history.length - 1}
  aria-valuetext={`History point ${currentHistoryIndex + 1} of ${history.length}: ${history[currentHistoryIndex].description}`}
  tabIndex={0}
  onKeyDown={handleSliderKeyDown}
>
  {/* Visual slider */}
</div>
```

**Modal Dialogs**:
```tsx
<dialog
  role="dialog"
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  aria-modal="true"
>
  <h2 id="dialog-title">Export Chart</h2>
  <div id="dialog-description">
    Choose export format and options for your Gantt chart.
  </div>

  {/* Dialog content */}

  <div role="group" aria-label="Dialog actions">
    <button onClick={handleCancel}>Cancel</button>
    <button onClick={handleExport}>Export</button>
  </div>
</dialog>
```

### 7.4 Live Regions (Screen Reader Announcements)

**ARIA Live Regions** for dynamic updates:

```tsx
// Status announcements (polite)
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>

// Error announcements (assertive)
<div
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
  className="sr-only"
>
  {errorMessage}
</div>
```

**Announcement Examples**:
```typescript
// Task operations
announceStatus('Task added: Design mockups');
announceStatus('Task "Frontend Development" moved to December 20');
announceStatus('Dependency created from Design to Development');

// File operations
announceStatus('File saved successfully');
announceError('Failed to save file: Storage quota exceeded');

// History operations
announceStatus('History restored to 2:30 PM');
announceStatus('Undone: Task deletion');

// Selection
announceStatus('3 tasks selected');
announceStatus('All tasks deselected');
```

### 7.5 Color and Contrast

**Minimum Contrast Ratios** (WCAG AA):
- Normal text (< 18px): 4.5:1
- Large text (≥ 18px): 3:1
- UI components: 3:1
- Graphical objects: 3:1

**Color Usage**:
- Never use color alone to convey information
- Always provide text labels, icons, or patterns
- Example: Task status shown with color + icon

```tsx
<div className={`task-status ${task.status}`}>
  {task.status === 'completed' && <CheckIcon aria-hidden="true" />}
  {task.status === 'in-progress' && <SpinnerIcon aria-hidden="true" />}
  {task.status === 'blocked' && <AlertIcon aria-hidden="true" />}
  <span>{task.status}</span>
</div>
```

**High Contrast Mode Support**:
```css
@media (prefers-contrast: high) {
  :root {
    --border-width: 2px;
    --focus-outline-width: 3px;
  }

  .task-bar {
    border: var(--border-width) solid currentColor;
  }

  .dependency-arrow {
    stroke-width: 2px;
    stroke: currentColor;
  }
}
```

### 7.6 Reduced Motion Support

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  /* Keep critical state transitions */
  .focus-indicator {
    transition-duration: 0ms;
  }
}
```

### 7.7 Screen Reader Testing Checklist

**Per Component**:

**Task List**:
- [ ] Role="list" announced
- [ ] Task count announced
- [ ] Navigation instructions provided
- [ ] Selected tasks announced
- [ ] Task details (dates, progress) announced on focus
- [ ] Actions (edit, delete) announced

**Gantt Chart Canvas**:
- [ ] Chart description announced
- [ ] Individual task bars focusable and announced
- [ ] Dependency arrows described
- [ ] Date range announced
- [ ] Keyboard navigation works

**Toolbar**:
- [ ] All buttons have accessible names
- [ ] Keyboard shortcuts announced
- [ ] Disabled state announced
- [ ] Tooltips read by screen reader

**Modals/Dialogs**:
- [ ] Dialog role announced
- [ ] Title announced
- [ ] Focus trapped within dialog
- [ ] Escape key closes dialog
- [ ] Focus restored on close

**History Timeline**:
- [ ] Slider role announced
- [ ] Current position announced
- [ ] Total range announced
- [ ] History entry description announced
- [ ] Arrow keys work

### 7.8 Accessibility Testing Strategy

**Automated Tests** (70% coverage):
```typescript
import { axe } from 'jest-axe';

describe('Accessibility', () => {
  it('should have no axe violations on main screen', async () => {
    const { container } = render(<GanttChart />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels on task bars', () => {
    const { getByRole } = render(<TaskBar task={mockTask} />);
    const taskBar = getByRole('button', { name: /Design mockups/i });
    expect(taskBar).toHaveAttribute('aria-label');
  });

  it('should trap focus in modal', () => {
    const { getByRole } = render(<ExportDialog />);
    const dialog = getByRole('dialog');

    // Simulate tab navigation
    const focusableElements = within(dialog).queryAllByRole(/(button|textbox)/);
    expect(focusableElements.length).toBeGreaterThan(0);

    // Focus should cycle within dialog
    userEvent.tab();
    expect(document.activeElement).toBe(focusableElements[0]);
  });
});
```

**Manual Screen Reader Testing** (30% coverage):
- NVDA (Windows) - Primary target
- JAWS (Windows) - Secondary
- VoiceOver (macOS) - Secondary
- TalkBack (Android) - If mobile support added

**Test Scenarios**:
1. Create a new task using only keyboard
2. Navigate task list with arrow keys
3. Edit task using screen reader
4. Create dependency between tasks
5. Export chart with keyboard only
6. Use history timeline with screen reader
7. Recover from error state

### 7.9 Accessibility Acceptance Criteria

**WCAG 2.1 Level AA Requirements**:
- [ ] 1.1.1 Non-text Content - All images/icons have alt text
- [ ] 1.3.1 Info and Relationships - Proper semantic HTML/ARIA
- [ ] 1.4.3 Contrast (Minimum) - 4.5:1 for text, 3:1 for UI
- [ ] 2.1.1 Keyboard - All functionality via keyboard
- [ ] 2.1.2 No Keyboard Trap - Focus never trapped
- [ ] 2.4.3 Focus Order - Logical tab order
- [ ] 2.4.7 Focus Visible - Visible focus indicator
- [ ] 3.2.1 On Focus - No unexpected context changes
- [ ] 3.3.1 Error Identification - Errors clearly identified
- [ ] 3.3.2 Labels or Instructions - Form fields labeled
- [ ] 4.1.2 Name, Role, Value - All UI components identified
- [ ] 4.1.3 Status Messages - Live regions for updates

**Additional Best Practices**:
- [ ] Skip links present ("Skip to main content")
- [ ] Heading structure logical (h1 → h2 → h3)
- [ ] Language attribute set on HTML element
- [ ] Page title descriptive and unique
- [ ] Link text descriptive (no "click here")
- [ ] Form validation accessible
- [ ] Error messages associated with fields
- [ ] Required fields indicated
- [ ] Instructions provided before form
- [ ] Timeout warnings with extension option (if applicable)

---

## 8. Responsive Design

### 8.1 Breakpoints

```
Desktop:  1920px+  (Full layout with all panels)
Laptop:   1366px   (Settings panel overlay)
Tablet:   1024px   (Not primary target, minimal support)
Minimum:  1280px   (Absolute minimum width)
```

### 8.2 Panel Behavior

| Width   | Task List | Chart Canvas | Settings Panel |
|---------|-----------|--------------|----------------|
| 1920px+ | 300px     | Flex-grow    | 280px visible  |
| 1366px  | 280px     | Flex-grow    | Overlay only   |
| 1280px  | 250px     | Flex-grow    | Overlay only   |

---

## 9. Loading States

### 9.1 Initial Load

```
┌──────────────────────────────────────┐
│                                      │
│         [App Logo]                   │
│                                      │
│    Loading GanttFlow...              │
│    ━━━━●━━━━━                       │
│                                      │
└──────────────────────────────────────┘
```
- Centered spinner with app logo
- Progress bar if loading large file
- Estimated time for files > 1MB

### 9.2 File Operations

**Saving**:
- Button shows spinner
- Text: "Saving..."
- Disabled during operation
- Success: Brief green checkmark animation

**Loading**:
- Modal with progress bar
- "Loading chart..."
- Percentage if file is large

**Exporting**:
- Modal with progress
- "Generating PDF... 45%"
- Preview thumbnail if possible

### 9.3 Chart Rendering

**Large Charts** (> 100 tasks):
- Skeleton UI: Gray placeholder bars while calculating layout
- Progressive rendering: Visible area first, then rest
- Loading indicator in bottom right corner

---

## 10. Error States

### 10.1 Error Types

**Validation Errors**:
```
┌──────────────────────────────┐
│ End date                     │
│ ⚠ Must be after start date  │
└──────────────────────────────┘
```
- Inline, below input
- Red text, warning icon
- Prevent form submission

**File Errors**:
```
┌──────────────────────────────────────┐
│  ⚠ Unable to Open File               │
│  ──────────────────────────────────  │
│  This file appears to be corrupted   │
│  or from an incompatible version.    │
│                                      │
│  Details: Invalid JSON structure     │
│                           [OK]       │
└──────────────────────────────────────┘
```
- Modal dialog
- Clear error message
- Technical details (collapsible)
- Action button

**Network Errors** (if applicable):
- Toast notification: "No internet connection"
- Auto-retry with countdown
- Graceful degradation

### 10.2 Empty States

**No Tasks**:
```
┌─────────────────────────────────────┐
│                                     │
│         [Empty box icon]            │
│                                     │
│     No tasks yet                    │
│     Get started by adding a task    │
│                                     │
│         [+ Add Task]                │
│                                     │
└─────────────────────────────────────┘
```
- Centered in task list
- Friendly message
- Clear call-to-action

**No History**:
- "No history yet. Start making changes!"
- Timeline slider disabled

---

## 11. Success States

### 11.1 Feedback Messages

**Save Success**:
- Toast notification (bottom right)
- "Chart saved successfully"
- Green checkmark icon
- Auto-dismiss after 3 seconds

**Export Success**:
- "Chart exported as PNG"
- "Download started" (if applicable)
- Link to open file location

**Snapshot Created**:
- "Snapshot 'Version 1' created"
- Appear as marker on timeline
- Brief highlight animation

---

## 12. Onboarding

### 12.1 First-Time Experience

**Welcome Modal** (optional, dismissible):
```
┌──────────────────────────────────────────────┐
│  Welcome to GanttFlow!               [×]    │
│  ──────────────────────────────────────────  │
│                                              │
│  Create beautiful Gantt charts in minutes.   │
│                                              │
│  • No login required                         │
│  • Works offline                             │
│  • Your data stays private                   │
│                                              │
│  [Take a Tour]  [Start Blank]  [Open File]  │
└──────────────────────────────────────────────┘
```

**Interactive Tour** (if user chooses):
- Highlight each main area with overlay
- Brief explanation of each section
- "Next" / "Skip Tour" buttons
- 5-7 steps total

### 12.2 Tooltips for New Features

- Show for first 3 uses
- Dismiss: Click X or use feature
- Small badge: "New!" on feature

---

## 13. Synced Copies UI (Future Feature - Post-MVP)

### 13.1 Visual Indicators

**Synced Task in Task List**:
```
┌────────────────────────────────────────────────────┐
│ [≡] 🔗 Design Review                      [●] [×]  │  ← Link icon
│     Dec 15 - Dec 22 (7 days)              60%      │
│     Synced with 3 other tasks                      │  ← Subtle info text
└────────────────────────────────────────────────────┘
```

**Synced Task on Chart**:
```
┌··································┐
│ Design Review             60%    │  ← Dotted border
└··································┘
     ↑
 Link icon badge in top-left corner
```

**Visual Specifications**:
- **Link icon**: 🔗 or custom chain link icon, 14px
- **Position**: Next to task name (list) or top-left corner (chart)
- **Color**: Primary blue (#3b82f6) or sync group color
- **Border**: 1px dotted, sync group color (chart only)
- **Tooltip**: "Synced with 3 other tasks (Design Review Tasks)"
- **Hover effect**: Pulse animation, shows sync group name

### 13.2 Create Synced Copy

**Context Menu**:
```
┌──────────────────────────┐
│ ✏ Edit Task             │
│ 🎨 Change Color         │
│ 🔗 Create Synced Copy    │  ← New option
│ 📋 Duplicate            │
│ ──────────────────────  │
│ 🗑 Delete               │
└──────────────────────────┘
```

**Keyboard Shortcut**: Ctrl/Cmd + Shift + D

**Success Notification**:
```
┌──────────────────────────────────────┐
│ ✓ Synced copy created                │
│   "Design Review" (2 tasks synced)   │
└──────────────────────────────────────┘
```
- Toast notification, bottom-right
- Auto-dismiss after 3 seconds
- Green checkmark icon

### 13.3 Edit Warning

**Warning Banner** (appears when editing synced field):
```
┌─────────────────────────────────────────────────────┐
│ ⚠ This task is synced with 3 other tasks           │
│   Changes will affect: Phase 2, Phase 3, Phase 4   │
│   [Don't show again]  [×]                           │
└─────────────────────────────────────────────────────┘
```

**Position**: Above task editor, slides down with animation
**Color**: Warning yellow (#fef3c7 background, #f59e0b border)
**Animation**: Slide down 250ms ease-out
**Dismissible**: X button or "Don't show again" checkbox

**Visual Feedback During Edit**:
- All synced copies pulse subtly (opacity 0.8 → 1.0, 1s loop)
- Sync icon glows (box-shadow: 0 0 8px #3b82f6)
- Status text: "Editing synced task..."

**After Save**:
- Brief highlight on all affected tasks (flash green, 500ms)
- Success message: "Updated 4 synced tasks"

### 13.4 Decouple Dialog

**Decouple Options**:
```
┌─────────────────────────────────────────────────┐
│  Decouple "Design Review"?              [×]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  This task is synced with 3 other tasks.       │
│  Choose how to decouple:                        │
│                                                 │
│  ◉ Decouple this task only                     │
│     Remove from sync group. Others stay synced.│
│                                                 │
│  ○ Decouple recursively (task + children)      │
│     Remove this task and all 5 children.       │
│                                                 │
│  ○ Dissolve entire sync group                  │
│     Break all sync links (4 tasks affected).   │
│                                                 │
│  ─────────────────────────────────────────────  │
│  Remaining synced tasks: 3                      │
│  Affected children: 5 (if recursive)            │
│                                                 │
│                    [Cancel]  [Decouple]         │
└─────────────────────────────────────────────────┘
```

**Design Specs**:
- Width: 500px
- Radio buttons: 18px, primary color when selected
- Explanatory text: 12px, #6b7280
- Info summary: 14px, #374151, subtle background (#f9fafb)
- Primary action: "Decouple" button, warning color (#f59e0b)

**Visual Feedback**:
- Link icons fade out on affected tasks (500ms)
- Dotted borders removed (250ms fade)
- Brief "decoupled" badge appears (flash, 1s)

### 13.5 Sync Groups Panel

**Panel Layout**:
```
┌─────────────────────────────────────────────────┐
│ Sync Groups                              [×]    │
├─────────────────────────────────────────────────┤
│ Search: [________________]  [+ New Group]       │
├─────────────────────────────────────────────────┤
│                                                 │
│ ● Design Review Tasks            (4 tasks) [˅]  │
│   ├─ Phase 1 - Design Review                   │
│   ├─ Phase 2 - Design Review                   │
│   ├─ Phase 3 - Design Review                   │
│   └─ Phase 4 - Design Review                   │
│                                                 │
│   Synced: Name, Color, Duration                 │
│   [Rename] [Configure] [Dissolve]              │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ ● Testing Activities             (3 tasks) [>]  │
│   Collapsed (click to expand)                   │
│                                                 │
│ ─────────────────────────────────────────────  │
│                                                 │
│ ○ Empty Group                    (0 tasks) [>]  │
│   No members yet                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

**Design Specs**:
- Width: 350px (resizable 280-500px)
- Position: Right side overlay or docked panel
- Background: #f9fafb
- Border: 1px solid #e5e7eb
- Search bar: 280px, 36px height
- Group item: Accordion-style, 48px header
- Member item: 36px height, indented 16px
- Buttons: 32px height, 8px gap

**Sync Group Header**:
```
● Design Review Tasks            (4 tasks) [˅]
↑                                          ↑
Color dot (sync group color)        Expand/collapse
```

**Interactions**:
- Click member → Jump to task on chart, highlight briefly
- Click "Rename" → Inline edit, auto-focus
- Click "Configure" → Opens configure dialog
- Click "Dissolve" → Confirmation dialog
- Hover on member → Highlight task on chart (subtle glow)

### 13.6 Configure Synced Fields Dialog

**Dialog Layout**:
```
┌─────────────────────────────────────────────────┐
│  Configure: "Design Review Tasks"       [×]    │
├─────────────────────────────────────────────────┤
│                                                 │
│  Which fields should be synced?                 │
│                                                 │
│  ☑ Task Name                                   │
│  ☑ Description                                 │
│  ☑ Color                                       │
│  ☐ Duration (⚠ will update end dates)         │
│  ☑ Tags                                        │
│  ☐ Custom Fields                               │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  Changes will update all 4 tasks immediately.  │
│                                                 │
│                       [Cancel]  [Update]        │
└─────────────────────────────────────────────────┘
```

**Design Specs**:
- Width: 450px
- Checkboxes: 18px, primary color when checked
- Warning icon: ⚠ for fields with side effects
- Info text: 12px, #6b7280
- Update button: Primary color, triggers immediate re-sync

**Visual Feedback**:
- On update: Progress indicator (if > 10 tasks)
- Success notification: "Re-synced 4 tasks with new field configuration"
- All affected tasks flash briefly

### 13.7 Sync Inheritance Indicators

**Synced Group with Children**:
```
Task List:
┌────────────────────────────────────────────────┐
│ [≡] 🔗 Phase 1                        [●] [>]  │  ← Group is synced
│     ├─ 🔗 Task A (Design)                      │  ← Child is synced
│     ├─ 🔗 Task B (Development)                 │  ← Child is synced
│     └─ 🔗 Task C (Testing)                     │  ← Child is synced
└────────────────────────────────────────────────┘

Tooltip on group: "Synced group with inherited sync for all children"
```

**Adding Task to Synced Group Notification**:
```
┌──────────────────────────────────────────────┐
│ ✓ Task added to synced group                │
│   Created in 2 groups with automatic sync   │
└──────────────────────────────────────────────┘
```

### 13.8 Color Scheme

**Sync Group Colors** (auto-assigned):
```
Group 1: #3b82f6 (Blue)
Group 2: #10b981 (Green)
Group 3: #f59e0b (Orange)
Group 4: #8b5cf6 (Purple)
Group 5: #ec4899 (Pink)
... (cycles through palette)
```

**Visual Elements**:
- Link icon: Sync group color
- Dotted border: Sync group color at 50% opacity
- Color dot: Solid sync group color
- Hover effect: Sync group color at 20% opacity background

### 13.9 Animations

**Sync Propagation**:
- Duration: 250ms
- Easing: ease-out
- Effect: Ripple from source task to all synced copies
- Color: Sync group color pulse (opacity 0.3 → 0)

**Decouple**:
- Duration: 400ms
- Easing: ease-in-out
- Effect: Link icon fade out, border fade out
- Final: Brief "decoupled" badge (flash)

**Highlight Synced Copies**:
- Hover on one synced task → All others glow subtly
- Duration: 200ms fade in
- Effect: Box-shadow: 0 0 8px [sync-group-color]
- Fade out: 300ms after mouse leave

### 13.10 Keyboard Shortcuts

```
Ctrl/Cmd + Shift + D    Create synced copy
Ctrl/Cmd + Shift + U    Decouple (unlink)
Ctrl/Cmd + Shift + G    Open sync groups panel
```

**Focus Management**:
- Tab through sync group members
- Enter on member → Jump to task
- Delete on member → Decouple confirmation

### 13.11 Accessibility

**ARIA Labels**:
```tsx
<div
  role="button"
  aria-label="Design Review, synced with 3 other tasks in Design Review Tasks group"
  aria-describedby="sync-indicator-description"
  className="synced-task"
>
  <span aria-hidden="true">🔗</span>
  <span id="sync-indicator-description" className="sr-only">
    This task is synced. Changes will affect 3 other tasks.
  </span>
  Design Review
</div>
```

**Screen Reader Announcements**:
```
- "Synced copy created. 2 tasks now synced."
- "Updating 4 synced tasks..."
- "Updated 4 synced tasks successfully"
- "Task decoupled from sync group"
- "Editing synced task. Changes will affect 3 other tasks."
```

**Keyboard Navigation**:
- All sync operations keyboard accessible
- Focus indicators on all interactive elements
- Esc closes sync groups panel
- Tab cycles through sync group members

---

**Document Version**: 1.3
**Last Updated**: 2025-12-12
**Status**: Draft

**Recent Updates (v1.3)** - Synced Copies UI Specifications:
- Added comprehensive Synced Copies UI/UX design (Section 13):
  - Visual indicators: link icons, dotted borders, sync group colors
  - Warning banners and edit feedback for synced field changes
  - Decouple dialog with three modes (single, recursive, dissolve)
  - Sync Groups management panel with accordion-style layout
  - Configure Synced Fields dialog for customizing sync behavior
  - Sync inheritance indicators for groups and children
  - Complete animation specifications (propagation, decouple, highlights)
  - Keyboard shortcuts and accessibility (ARIA labels, screen reader announcements)
  - Color scheme with auto-assigned sync group colors

**Previous Updates (v1.2)** - Based on Second Professional Review:
- Comprehensive Accessibility specifications (Section 7) targeting WCAG 2.1 Level AA:
  - Detailed focus management rules with code examples
  - Component-level ARIA roles and labels (toolbar, task list, chart, modals)
  - Live regions for screen reader announcements
  - Accessibility testing strategy (automated + manual)
  - Complete WCAG 2.1 acceptance criteria checklist
  - High contrast and reduced motion support

**Recent Updates (v1.1)**:
- UI Density modes: Compact (28px rows), Normal (36px rows), Comfortable (44px rows)
- Task grouping/phases UI with collapsible sections and summary bars
- Copy/paste task operations (Ctrl/Cmd+C/V)
- Multi-select with visual indicators
- Task name position: inside bar / above / below / smart (global setting)
- Optional history timeline show/hide toggle
- Optional duplicate timeline at bottom of chart
- First day of week setting (affects calendar displays)
- Date format preference setting
