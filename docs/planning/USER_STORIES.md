# User Stories

## Overview

This document contains user stories organized by user persona and feature area. Each story follows the format:

**As a** [user type], **I want** [goal], **so that** [benefit/reason].

---

## User Personas

### 1. Sarah - Freelance Designer
- Age: 28
- Tech savvy: Medium
- Use case: Creating project timelines for client proposals
- Priority: Visual appeal and quick creation

### 2. Mike - Small Business Owner
- Age: 42
- Tech savvy: Low-Medium
- Use case: Planning business initiatives and tracking progress
- Priority: Simplicity and ease of use

### 3. Emma - University Student
- Age: 21
- Tech savvy: High
- Use case: Planning semester projects and thesis timeline
- Priority: Free tools, no registration, easy sharing

### 4. David - Consultant
- Age: 35
- Tech savvy: High
- Use case: Creating professional deliverables for clients
- Priority: Export quality and customization

---

## Epic 1: Chart Creation

### Story 1.1: Quick Start
**As a** new user,
**I want** to immediately see a blank canvas when I visit the app,
**so that** I can start creating without any setup or registration.

**Acceptance Criteria**:
- App loads directly to main interface
- No login/signup screen
- Default empty chart is ready
- Example tasks shown (optional, can be cleared)

**Priority**: MUST HAVE

---

### Story 1.2: Add First Task
**As a** user creating a chart,
**I want** to add a task with a simple click or button press,
**so that** I can quickly build my project timeline.

**Acceptance Criteria**:
- "Add Task" button clearly visible
- Task appears immediately in task list and chart
- Default task has placeholder name
- Default duration is reasonable (e.g., 1 week)
- Today's date used as default start

**Priority**: MUST HAVE

---

### Story 1.3: Edit Task Details
**As a** user,
**I want** to edit task names, dates, and properties inline,
**so that** I don't have to open separate dialogs or forms.

**Acceptance Criteria**:
- Double-click on task name to edit
- Click on dates to change them (date picker)
- Changes reflected immediately on chart
- Enter key saves, Escape cancels
- Tab moves to next field

**Priority**: MUST HAVE

---

### Story 1.4: Visual Date Adjustment
**As a** visual thinker,
**I want** to drag task bars on the timeline to change dates,
**so that** I can adjust timing visually rather than typing dates.

**Acceptance Criteria**:
- Drag entire bar to move task (shift dates)
- Drag left/right edges to resize (change start/end)
- Cursor changes to indicate drag zones
- Snap to day/week boundaries (optional)
- Visual feedback during drag

**Priority**: MUST HAVE

---

### Story 1.5: Task Dependencies
**As a** project planner,
**I want** to create dependencies between tasks with visual arrows,
**so that** I can show which tasks must finish before others can start.

**Acceptance Criteria**:
- Drag from one task to another to create dependency
- Arrow appears connecting dependent tasks
- Dependent task auto-adjusts when parent changes
- Can delete dependencies
- Circular dependencies prevented/warned

**Priority**: MUST HAVE

---

### Story 1.6: Delete Tasks
**As a** user correcting mistakes,
**I want** to easily remove tasks I don't need,
**so that** I can keep my chart clean and accurate.

**Acceptance Criteria**:
- Delete button/option on selected task
- Keyboard shortcut (Delete key)
- Confirmation for destructive action
- Dependencies automatically cleaned up
- Action appears in undo history

**Priority**: MUST HAVE

---

### Story 1.7: Reorder Tasks
**As a** user organizing information,
**I want** to reorder tasks in the list,
**so that** I can group related items or adjust visual hierarchy.

**Acceptance Criteria**:
- Drag and drop tasks in list to reorder
- Chart updates to match new order
- Dependencies maintain connections
- Visual indicator during drag

**Priority**: SHOULD HAVE

---

### Story 1.8: Copy and Paste Tasks
**As a** user building similar task structures,
**I want** to copy and paste tasks (including their dependencies if multiple selected),
**so that** I can quickly duplicate work without manual recreation.

**Acceptance Criteria**:
- Ctrl/Cmd+C copies selected task(s)
- Ctrl/Cmd+V pastes task(s) below current selection
- When pasting multiple tasks, dependencies between them are preserved
- Pasted tasks get new IDs (true copies, not references)
- Copy/paste works across different sections of same chart
- Context menu includes Copy/Paste options

**Priority**: MUST HAVE

---

### Story 1.9: Multi-Select Tasks
**As a** user managing multiple tasks,
**I want** to select multiple tasks at once,
**so that** I can perform bulk operations efficiently.

**Acceptance Criteria**:
- Ctrl/Cmd+Click adds/removes tasks from selection
- Shift+Click selects range of tasks
- Ctrl/Cmd+A selects all tasks
- Visual indication of all selected tasks
- Bulk operations work: delete, copy, color change
- Selection count shown in UI

**Priority**: MUST HAVE

---

### Story 1.10: Task Groups and Phases
**As a** project manager organizing complex projects,
**I want** to group related tasks into collapsible sections with optional summary bars,
**so that** I can organize my chart hierarchically and show high-level overview.

**Acceptance Criteria**:
- Can create task groups/phases
- Groups have names and can be collapsed/expanded
- Collapsed groups show summary bar spanning all child tasks
- Setting to show/hide summary bars globally
- Can drag tasks into/out of groups
- Groups can be nested (sub-groups)
- Groups are independent of dependencies
- Summary bar automatically adjusts when child tasks change

**Priority**: MUST HAVE

---

## Epic 2: File Operations

### Story 2.1: Save Chart
**As a** user who spent time creating a chart,
**I want** to save my work to a file on my computer,
**so that** I can close the browser and continue later.

**Acceptance Criteria**:
- "Save" button in main toolbar
- Downloads file to local system
- Filename includes chart name and date
- File format is JSON-based
- Save preserves all data including history

**Priority**: MUST HAVE

---

### Story 2.2: Open Saved Chart
**As a** returning user,
**I want** to open a previously saved chart file,
**so that** I can continue editing where I left off.

**Acceptance Criteria**:
- "Open" button in toolbar
- File picker opens
- Chart loads with all previous data
- History preserved and accessible
- Wrong file format shows helpful error

**Priority**: MUST HAVE

---

### Story 2.3: Auto-Recovery
**As a** user who might forget to save,
**I want** the app to automatically save my work in the browser,
**so that** I don't lose progress if I accidentally close the tab.

**Acceptance Criteria**:
- Changes auto-saved to browser storage every 30 seconds
- On reload, option to recover unsaved work
- Recovery prompt shows last modified time
- User can choose to start fresh or recover
- Auto-save doesn't interfere with performance

**Priority**: SHOULD HAVE

---

### Story 2.4: File Compatibility
**As a** user working across different computers,
**I want** files to work on any browser/device,
**so that** I'm not locked into one machine or browser.

**Acceptance Criteria**:
- File format is browser-agnostic
- Version information stored in file
- Newer app versions can read old files
- Clear error if file is from incompatible version

**Priority**: MUST HAVE

---

## Epic 3: Version History

### Story 3.1: Automatic History Tracking
**As a** user making many changes,
**I want** every edit to be automatically saved to history,
**so that** I can go back to any previous version without manually saving.

**Acceptance Criteria**:
- Each change creates history entry
- History includes timestamp
- Changes grouped intelligently (not every keystroke)
- History limit prevents infinite growth
- No user action required

**Priority**: MUST HAVE

---

### Story 3.2: Timeline Slider
**As a** user who wants to review changes,
**I want** a timeline slider at the bottom showing my edit history,
**so that** I can visually navigate through past versions.

**Acceptance Criteria**:
- Horizontal slider shows timeline
- Markers indicate change points
- Current position highlighted
- Drag to scrub through history
- Time labels on major points

**Priority**: MUST HAVE

---

### Story 3.3: Live Preview While Scrubbing
**As a** user reviewing history,
**I want** the chart to update in real-time as I move the timeline slider,
**so that** I can see exactly what changed at each point.

**Acceptance Criteria**:
- Chart renders instantly as slider moves
- Smooth transition between states
- Performance remains good (no lag)
- Keyboard arrows work for fine control

**Priority**: MUST HAVE

---

### Story 3.4: Restore to Point
**As a** user who wants to undo multiple changes,
**I want** to click a button to restore the chart to a history point,
**so that** I can go back to an earlier version.

**Acceptance Criteria**:
- "Restore" button when viewing history
- Confirmation dialog before restoring
- Current state not lost (becomes new history entry)
- Can undo the restore operation

**Priority**: SHOULD HAVE

---

### Story 3.5: Named Snapshots
**As a** user reaching important milestones,
**I want** to create named snapshots of my chart,
**so that** I can easily return to key versions.

**Acceptance Criteria**:
- "Create Snapshot" button accessible
- Prompt for snapshot name
- Snapshots appear as labeled markers on timeline
- Can restore directly to any snapshot
- Can delete snapshots

**Priority**: SHOULD HAVE

---

## Epic 4: Export and Sharing

### Story 4.1: Export to PNG
**As a** user sharing on social media or email,
**I want** to export my chart as a PNG image,
**so that** I can easily share it with anyone.

**Acceptance Criteria**:
- "Export > PNG" option in menu
- High-resolution output (configurable DPI)
- Transparent or white background (user choice)
- Current zoom/view exported
- Filename includes chart name

**Priority**: MUST HAVE

---

### Story 4.2: Export to PDF
**As a** professional creating reports,
**I want** to export my chart as a PDF,
**so that** I can include it in formal documents.

**Acceptance Criteria**:
- "Export > PDF" option in menu
- Page size configurable (A4, Letter, etc.)
- Orientation choice (landscape/portrait)
- Vector quality (not rasterized)
- Print-optimized styling

**Priority**: SHOULD HAVE

---

### Story 4.3: Export to SVG
**As a** designer needing editable graphics,
**I want** to export my chart as SVG,
**so that** I can further customize it in design tools.

**Acceptance Criteria**:
- "Export > SVG" option in menu
- Clean, editable SVG code
- Maintains all styling
- Text remains as text (not paths)
- Reasonable file size

**Priority**: SHOULD HAVE

---

### Story 4.4: Export Settings
**As a** user with specific needs,
**I want** to configure export settings,
**so that** the output matches my requirements.

**Acceptance Criteria**:
- Date range selector (full chart or subset)
- Quality/resolution settings
- Include/exclude elements (legend, today marker)
- Preview before export
- Remember last settings

**Priority**: COULD HAVE

---

## Epic 5: Customization

### Story 5.1: Beautiful Defaults
**As a** user who is not a designer,
**I want** my chart to look professional without any styling,
**so that** I can focus on content, not appearance.

**Acceptance Criteria**:
- Default color palette is attractive
- Typography is clean and readable
- Spacing and layout are balanced
- Follows modern design trends
- Accessible color contrast

**Priority**: MUST HAVE

---

### Story 5.2: Color Themes
**As a** user wanting to match my branding,
**I want** to choose from pre-built color themes,
**so that** I can quickly apply a consistent look.

**Acceptance Criteria**:
- At least 5 pre-built themes
- Theme picker shows visual previews
- Instant application (no page reload)
- Themes affect all chart elements
- Custom theme creation (future)

**Priority**: SHOULD HAVE

---

### Story 5.3: Individual Task Colors
**As a** user categorizing tasks,
**I want** to assign colors to individual tasks,
**so that** I can visually group related items.

**Acceptance Criteria**:
- Color picker for each task
- Recent/favorite colors easily accessible
- Color applies to task bar and connections
- Can bulk-change multiple tasks
- Colors preserved in exports

**Priority**: SHOULD HAVE

---

### Story 5.4: Timeline View Options
**As a** user working at different time scales,
**I want** to switch between day, week, and month views,
**so that** I can see the appropriate level of detail.

**Acceptance Criteria**:
- View toggle buttons (Day/Week/Month)
- Timeline scale updates accordingly
- Task bars adjust to new scale
- Current date marker adapts
- Zoom in/out also available

**Priority**: SHOULD HAVE

---

### Story 5.5: Show/Hide Weekends
**As a** user planning work schedules,
**I want** to optionally hide weekends from the timeline,
**so that** I can focus on working days only.

**Acceptance Criteria**:
- Toggle for "Show Weekends"
- Weekend columns removed when hidden
- Task durations calculate correctly
- Visual indication of weekends when shown
- Setting persists with chart

**Priority**: COULD HAVE

---

### Story 5.6: UI Density/Compactness
**As a** user with limited screen space or many tasks,
**I want** to adjust the UI density (compact/normal/comfortable),
**so that** I can see more or less information based on my needs.

**Acceptance Criteria**:
- Three density levels: Compact, Normal, Comfortable
- Affects task row height, font sizes, and spacing
- Timeline zoom controls column width separately
- Instant visual update when changed
- Preference saved to browser (app setting)

**Priority**: SHOULD HAVE

---

### Story 5.7: Date Format Preference
**As a** user in a specific region,
**I want** to set my preferred date format,
**so that** dates display in my familiar format.

**Acceptance Criteria**:
- Options: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD, etc.
- Affects all date displays throughout app
- Preview shown before applying
- Saved to browser (app setting)

**Priority**: SHOULD HAVE

---

### Story 5.8: First Day of Week
**As a** user with regional week preferences,
**I want** to set the first day of week (Sunday/Monday),
**so that** calendar views align with my expectations.

**Acceptance Criteria**:
- Toggle between Sunday and Monday
- Affects timeline week columns
- Affects date pickers
- Saved to browser (app setting)

**Priority**: SHOULD HAVE

---

### Story 5.9: Task Name Display Position
**As a** user customizing the chart appearance,
**I want** to configure where task names appear on the chart,
**so that** the layout matches my preference.

**Acceptance Criteria**:
- Global options: Inside bar (if fits), Above bar, Below bar, Smart (auto-decide)
- Applies to all tasks consistently
- Preview of each option
- Names always visible in task list regardless
- Saved to browser (app setting)

**Priority**: SHOULD HAVE

---

### Story 5.10: Show/Hide History Timeline
**As a** user who finds the history timeline distracting,
**I want** to optionally hide the history timeline slider,
**so that** I have more space for the main chart.

**Acceptance Criteria**:
- Toggle to show/hide history timeline
- When hidden, more vertical space for chart
- Can still access history via menu/shortcut
- Setting saved to browser (app setting)
- Default: visible

**Priority**: SHOULD HAVE

---

### Story 5.11: Duplicate Timeline at Bottom
**As a** user working on long charts,
**I want** the option to show timeline at both top and bottom,
**so that** I can see dates when scrolled down to bottom tasks.

**Acceptance Criteria**:
- Toggle to show timeline at bottom (in addition to top)
- Bottom timeline synchronized with top
- Both timelines scroll together
- Saved to browser (app setting)
- Default: top only

**Priority**: COULD HAVE

---

## Epic 6: Usability Enhancements

### Story 6.1: Keyboard Shortcuts
**As a** power user,
**I want** keyboard shortcuts for common actions,
**so that** I can work efficiently without reaching for the mouse.

**Acceptance Criteria**:
- Ctrl/Cmd+S: Save
- Ctrl/Cmd+O: Open
- Ctrl/Cmd+Z: Undo
- Ctrl/Cmd+Y: Redo
- Del: Delete selected task
- Ctrl/Cmd+N: New task
- Help menu lists all shortcuts

**Priority**: SHOULD HAVE

---

### Story 6.2: Undo/Redo
**As a** user making mistakes,
**I want** to undo and redo my actions,
**so that** I can experiment without fear.

**Acceptance Criteria**:
- Undo button in toolbar
- Redo button (appears after undo)
- Keyboard shortcuts work
- Undo history shows action names
- Unlimited undo within session

**Priority**: SHOULD HAVE

---

### Story 6.3: Contextual Help
**As a** first-time user,
**I want** tooltips and hints throughout the interface,
**so that** I can learn features without reading documentation.

**Acceptance Criteria**:
- Hover tooltips on all buttons
- Inline help text for complex features
- Optional tutorial/walkthrough
- Help icon links to documentation
- "What's New" for updates

**Priority**: SHOULD HAVE

---

### Story 6.4: Zoom and Pan
**As a** user with large charts,
**I want** to zoom in/out and pan across the timeline,
**so that** I can navigate efficiently.

**Acceptance Criteria**:
- Zoom buttons (+/-) in toolbar
- Mouse wheel zoom (with Ctrl/Cmd)
- Pinch-to-zoom on trackpad
- Horizontal scrollbar for panning
- Fit-to-screen button

**Priority**: SHOULD HAVE

---

## Epic 7: Data Integrity

### Story 7.1: Date Validation
**As a** user entering data,
**I want** the system to prevent invalid dates,
**so that** my chart remains logically consistent.

**Acceptance Criteria**:
- End date must be after start date
- Warning for tasks in far past/future
- Auto-correct obviously wrong entries
- Clear error messages
- Suggestion to fix issues

**Priority**: MUST HAVE

---

### Story 7.2: Dependency Validation
**As a** user creating dependencies,
**I want** the system to prevent circular dependencies,
**so that** my task logic remains valid.

**Acceptance Criteria**:
- Circular dependencies blocked
- Clear warning message when attempted
- Highlight the problematic chain
- Suggestion to break the cycle

**Priority**: MUST HAVE

---

### Story 7.3: Data Recovery
**As a** user experiencing browser crashes,
**I want** my work to be protected,
**so that** I don't lose hours of effort.

**Acceptance Criteria**:
- Auto-save to browser storage
- Recovery prompt on app reload
- Last modified timestamp shown
- Option to download backup
- Multiple recovery points available

**Priority**: SHOULD HAVE

---

## Epic 8: Polish and Delight

### Story 8.1: Smooth Animations
**As a** user,
**I want** smooth, pleasant animations for transitions,
**so that** the app feels polished and professional.

**Acceptance Criteria**:
- Task movements animate smoothly
- History scrubbing transitions cleanly
- No jarring jumps or flashes
- Performance not impacted
- Can disable for accessibility

**Priority**: SHOULD HAVE

---

### Story 8.2: Today Indicator
**As a** user tracking progress,
**I want** a clear indicator of today's date on the timeline,
**so that** I can see what's current vs. past vs. future.

**Acceptance Criteria**:
- Vertical line at today's date
- Distinctive color (e.g., red or orange)
- Label showing "Today"
- Updates daily if app left open
- Visible across all zoom levels

**Priority**: SHOULD HAVE

---

### Story 8.3: Milestone Markers
**As a** project planner,
**I want** to add milestone markers for important dates,
**so that** I can highlight key deliverables or events.

**Acceptance Criteria**:
- Add milestone button
- Diamond or flag shape on timeline
- Can add label/description
- Different color from tasks
- Can attach to specific date

**Priority**: SHOULD HAVE

---

### Story 8.4: Collapse Dependent Tasks
**As a** user with many sequential dependencies,
**I want** to optionally collapse dependent tasks into compact visualization,
**so that** I can see the overall flow without vertical clutter.

**Acceptance Criteria**:
- Manual collapse option for dependent task chains
- Collapsed view shows tasks in minimum vertical space
- Respects lag/offset between dependencies
- Can expand/collapse individual chains
- Visual indication of collapsed state
- Works with complex dependency graphs

**Priority**: COULD HAVE

---

## Story Mapping Priority

### MVP (Must Ship First)
- Stories 1.1-1.10 (Basic chart creation including copy/paste, multi-select, groups)
- Stories 2.1-2.2, 2.4 (File operations)
- Stories 3.1-3.3 (History basics)
- Story 4.1 (PNG export)
- Story 5.1 (Beautiful defaults)
- Stories 7.1-7.2 (Validation)
- Story 8.2 (Today indicator)

### V1.0 (First Full Release)
- Add all SHOULD HAVE stories including new customization options (Stories 5.6-5.10)
- Complete Epic 4 (All export formats with customization)
- Complete Epic 3 (Full history features)
- Story 8.3 (Milestones)
- Polish and animations

### V2.0 (Enhanced Features)
- Add all COULD HAVE stories
- Templates
- Advanced customization
- Collaboration features

---

**Document Version**: 1.1
**Last Updated**: 2025-12-11
**Total Stories**: 40+
**Status**: Draft - Updated with copy/paste, grouping, compactness, and new settings
