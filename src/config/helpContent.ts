/**
 * Help content data — single source of truth for all in-app documentation.
 *
 * When adding a new user-facing feature, add a HelpTopic here.
 * When changing a shortcut key, update the SHORTCUT_KEYS constant and every topic
 * that references it — both tabs stay consistent automatically.
 * When removing a feature, remove its help topic.
 *
 * All shortcut strings use {mod} as a placeholder for the platform modifier
 * key (Ctrl on Windows/Linux, Cmd on macOS). Use resolveShortcut() or
 * resolveHelpTopic() when rendering to replace {mod} with the actual key.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HelpTabId = "getting-started" | "shortcuts" | "features";

export interface HelpTopic {
  /** Unique identifier, e.g. "file-save" */
  id: string;
  /** Short title, e.g. "Save Project" */
  title: string;
  /** 1-3 sentence description */
  description: string;
  /** Keyboard shortcuts. Use {mod} for Ctrl/Cmd. */
  shortcuts?: string[];
  /** Optional power-user tip */
  tip?: string;
  /** Extra search terms not in title/description */
  keywords?: string[];
}

export interface HelpSection {
  id: string;
  title: string;
  /** Phosphor icon name (rendered by consumer) */
  icon: string;
  topics: HelpTopic[];
}

export interface HelpTab {
  id: HelpTabId;
  label: string;
  sections: HelpSection[];
}

// ---------------------------------------------------------------------------
// Platform helpers
// ---------------------------------------------------------------------------

/**
 * Placeholder token replaced by resolveShortcut() with the platform modifier
 * key. Export this constant when constructing shortcut strings programmatically
 * to avoid typos in the "{mod}" literal.
 */
export const MOD_PLACEHOLDER = "{mod}";

/** Pre-compiled regex for the {mod} placeholder — avoids re-creation per call. */
const MOD_REGEX = /\{mod\}/g;

/**
 * Returns true if the current platform is macOS.
 *
 * Intentionally a function (not a module-level constant) so that tests can
 * stub `navigator` to verify platform-specific behaviour independently.
 */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac/.test(navigator.userAgent);
}

export function getModKey(): string {
  return isMac() ? "Cmd" : "Ctrl";
}

/** Replace {mod} placeholder with the platform modifier key (Ctrl or Cmd). */
export function resolveShortcut(shortcut: string): string {
  return shortcut.replace(MOD_REGEX, getModKey());
}

/**
 * Resolve all {mod} placeholders in a topic's text fields.
 * Use this when rendering a topic to ensure description, tip, and shortcuts
 * all display the correct platform modifier key.
 *
 * Note: keywords are intentionally excluded — they are search terms only and
 * are never displayed directly, so {mod} substitution would break search
 * matching (users type "Ctrl", not "{mod}").
 */
export function resolveHelpTopic(topic: HelpTopic): HelpTopic {
  return {
    ...topic,
    description: resolveShortcut(topic.description),
    ...(topic.tip !== undefined && { tip: resolveShortcut(topic.tip) }),
    ...(topic.shortcuts !== undefined && {
      shortcuts: topic.shortcuts.map(resolveShortcut),
    }),
  };
}

// ---------------------------------------------------------------------------
// Shortcut constants — single source of truth for all shortcut key strings.
//
// Reference these in both SHORTCUT_SECTIONS and FEATURE_SECTIONS so that
// changing a shortcut key here propagates to both help tabs automatically.
// Also use these when embedding shortcut strings in prose (descriptions/tips)
// via template literals, e.g. `Press ${SHORTCUT_KEYS.FILE_SAVE} to save.`
// ---------------------------------------------------------------------------

const SHORTCUT_KEYS = {
  FILE_NEW: "{mod}+Alt+N",
  FILE_OPEN: "{mod}+O",
  FILE_SAVE: "{mod}+S",
  FILE_SAVE_AS: "{mod}+Shift+S",
  FILE_EXPORT: "{mod}+E",

  EDIT_UNDO: "{mod}+Z",
  EDIT_REDO: "{mod}+Shift+Z",
  EDIT_REDO_ALT: "{mod}+Y",
  EDIT_COPY: "{mod}+C",
  EDIT_CUT: "{mod}+X",
  EDIT_PASTE: "{mod}+V",
  EDIT_SELECT_ALL: "{mod}+A",
  EDIT_DELETE: "Delete",
  EDIT_DELETE_ALT: "{mod}+-",
  EDIT_INSERT: "{mod}++",

  HIER_INDENT: "Alt+Shift+Right",
  HIER_OUTDENT: "Alt+Shift+Left",
  HIER_GROUP: "{mod}+G",
  HIER_UNGROUP: "{mod}+Shift+G",

  VIEW_ZOOM_RESET: "{mod}+0",
  VIEW_ZOOM_WHEEL: "{mod}+Wheel",
  VIEW_FIT: "F",
  VIEW_TODAY: "T",
  VIEW_DEPS: "D",
  VIEW_PROGRESS: "P",
  VIEW_HOLIDAYS: "H",
  VIEW_HIDE_ROWS: "{mod}+H",
  VIEW_SHOW_ROWS: "{mod}+Shift+H",
  // UI navigation paths, not keyboard shortcuts:
  VIEW_COLUMNS: "View > Columns",
  VIEW_TABLE: "View > Table",

  NAV_HELP: "?",
  NAV_ESCAPE: "Escape",

  SEL_CLICK: "Click",
  SEL_MOD_CLICK: "{mod}+Click",
  SEL_RANGE: "Shift+Click",
  SEL_DRAG: "Drag (timeline)",
} as const;

// ---------------------------------------------------------------------------
// Shortcut sections
// ---------------------------------------------------------------------------

const SHORTCUT_SECTIONS: HelpSection[] = [
  {
    id: "shortcuts-file",
    title: "File Operations",
    icon: "FloppyDisk",
    topics: [
      {
        id: "sc-new",
        title: "New chart",
        description: "Create a new empty project.",
        shortcuts: [SHORTCUT_KEYS.FILE_NEW],
      },
      {
        id: "sc-open",
        title: "Open file",
        description: "Open an existing .ownchart file.",
        shortcuts: [SHORTCUT_KEYS.FILE_OPEN],
      },
      {
        id: "sc-save",
        title: "Save",
        description: "Save the current project to disk.",
        shortcuts: [SHORTCUT_KEYS.FILE_SAVE],
      },
      {
        id: "sc-save-as",
        title: "Save As",
        description: "Save with a new file name.",
        shortcuts: [SHORTCUT_KEYS.FILE_SAVE_AS],
      },
      {
        id: "sc-export",
        title: "Export",
        description: "Open the export dialog for PNG, PDF, or SVG.",
        shortcuts: [SHORTCUT_KEYS.FILE_EXPORT],
      },
    ],
  },
  {
    id: "shortcuts-edit",
    title: "Edit Operations",
    icon: "PencilSimple",
    topics: [
      {
        id: "sc-undo",
        title: "Undo",
        description: "Undo the last action.",
        shortcuts: [SHORTCUT_KEYS.EDIT_UNDO],
      },
      {
        id: "sc-redo",
        title: "Redo",
        description: "Redo the previously undone action.",
        shortcuts: [SHORTCUT_KEYS.EDIT_REDO],
      },
      {
        id: "sc-redo-alt",
        title: "Redo (alternative)",
        description: "Alternative redo shortcut.",
        shortcuts: [SHORTCUT_KEYS.EDIT_REDO_ALT],
      },
      {
        id: "sc-copy",
        title: "Copy selected tasks",
        description: "Copy the selected tasks to the clipboard.",
        shortcuts: [SHORTCUT_KEYS.EDIT_COPY],
      },
      {
        id: "sc-cut",
        title: "Cut selected tasks",
        description: "Cut the selected tasks to the clipboard.",
        shortcuts: [SHORTCUT_KEYS.EDIT_CUT],
      },
      {
        id: "sc-paste",
        title: "Paste tasks",
        description: "Paste tasks from the clipboard.",
        shortcuts: [SHORTCUT_KEYS.EDIT_PASTE],
      },
      {
        id: "sc-select-all",
        title: "Select all tasks",
        description: "Select every task in the project.",
        shortcuts: [SHORTCUT_KEYS.EDIT_SELECT_ALL],
      },
      {
        id: "sc-delete",
        title: "Delete selected tasks",
        description: "Remove the selected tasks.",
        // Combined into one string for the shortcuts reference tab (alternatives on one line)
        shortcuts: [
          `${SHORTCUT_KEYS.EDIT_DELETE} / ${SHORTCUT_KEYS.EDIT_DELETE_ALT}`,
        ],
      },
      {
        id: "sc-insert",
        title: "Insert row(s) above",
        description: "Insert new task rows above the current selection.",
        shortcuts: [SHORTCUT_KEYS.EDIT_INSERT],
      },
    ],
  },
  {
    id: "shortcuts-selection",
    title: "Selection",
    icon: "CursorClick",
    topics: [
      {
        id: "sc-click",
        title: "Select task",
        description: "Click a task to select it.",
        shortcuts: [SHORTCUT_KEYS.SEL_CLICK],
      },
      {
        id: "sc-multi-click",
        title: "Add to selection",
        description: "Add or remove a task from the current selection.",
        shortcuts: [SHORTCUT_KEYS.SEL_MOD_CLICK],
      },
      {
        id: "sc-range",
        title: "Range select",
        description: "Select a contiguous range of tasks.",
        shortcuts: [SHORTCUT_KEYS.SEL_RANGE],
      },
      {
        id: "sc-marquee",
        title: "Marquee select",
        description: "Drag a rectangle in the timeline to select tasks.",
        shortcuts: [SHORTCUT_KEYS.SEL_DRAG],
      },
    ],
  },
  {
    id: "shortcuts-hierarchy",
    title: "Hierarchy",
    icon: "TreeStructure",
    topics: [
      {
        id: "sc-indent",
        title: "Indent task (make child)",
        description: "Make the selected task a child of the task above.",
        shortcuts: [SHORTCUT_KEYS.HIER_INDENT],
      },
      {
        id: "sc-outdent",
        title: "Outdent task (make sibling)",
        description: "Move the selected task one level up in hierarchy.",
        shortcuts: [SHORTCUT_KEYS.HIER_OUTDENT],
      },
      {
        id: "sc-group",
        title: "Group selected tasks",
        description: "Wrap the selected tasks in a new summary task.",
        shortcuts: [SHORTCUT_KEYS.HIER_GROUP],
      },
      {
        id: "sc-ungroup",
        title: "Ungroup (dissolve summary)",
        description: "Remove the summary task and promote its children.",
        shortcuts: [SHORTCUT_KEYS.HIER_UNGROUP],
      },
    ],
  },
  {
    id: "shortcuts-view",
    title: "View",
    icon: "Eye",
    topics: [
      {
        id: "sc-zoom-reset",
        title: "Reset zoom to 100%",
        description: "Reset the timeline zoom level to default.",
        shortcuts: [SHORTCUT_KEYS.VIEW_ZOOM_RESET],
      },
      {
        id: "sc-zoom-wheel",
        title: "Zoom at cursor",
        description: "Zoom in or out centered on the mouse cursor.",
        shortcuts: [SHORTCUT_KEYS.VIEW_ZOOM_WHEEL],
      },
      {
        id: "sc-fit",
        title: "Fit timeline to tasks",
        description: "Adjust zoom so all tasks fit in the viewport.",
        shortcuts: [SHORTCUT_KEYS.VIEW_FIT],
      },
      {
        id: "sc-toggle-today",
        title: "Toggle today marker",
        description: "Show or hide the today marker line.",
        shortcuts: [SHORTCUT_KEYS.VIEW_TODAY],
      },
      {
        id: "sc-toggle-deps",
        title: "Toggle dependencies",
        description: "Show or hide dependency arrows.",
        shortcuts: [SHORTCUT_KEYS.VIEW_DEPS],
      },
      {
        id: "sc-toggle-progress",
        title: "Toggle progress",
        description: "Show or hide the progress column and bars.",
        shortcuts: [SHORTCUT_KEYS.VIEW_PROGRESS],
      },
      {
        id: "sc-toggle-holidays",
        title: "Toggle holidays",
        description: "Show or hide holiday highlighting.",
        shortcuts: [SHORTCUT_KEYS.VIEW_HOLIDAYS],
      },
      {
        id: "sc-hide-rows",
        title: "Hide selected rows",
        description: "Hide selected rows from the table (Excel-style).",
        shortcuts: [SHORTCUT_KEYS.VIEW_HIDE_ROWS],
      },
      {
        id: "sc-show-rows",
        title: "Show all hidden rows",
        description: "Unhide all hidden rows.",
        shortcuts: [SHORTCUT_KEYS.VIEW_SHOW_ROWS],
      },
      {
        id: "sc-columns",
        title: "Show/hide date columns",
        description: "Toggle visibility of date columns.",
        shortcuts: [SHORTCUT_KEYS.VIEW_COLUMNS],
      },
      {
        id: "sc-table",
        title: "Collapse/expand task table",
        description: "Toggle the task table panel.",
        shortcuts: [SHORTCUT_KEYS.VIEW_TABLE],
      },
    ],
  },
  {
    id: "shortcuts-nav",
    title: "Navigation",
    icon: "Compass",
    topics: [
      {
        id: "sc-help",
        title: "Show this help",
        description: "Open the help dialog.",
        shortcuts: [SHORTCUT_KEYS.NAV_HELP],
      },
      {
        id: "sc-escape",
        title: "Close dialog / Clear selection",
        description: "Close the current dialog or clear the selection.",
        shortcuts: [SHORTCUT_KEYS.NAV_ESCAPE],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Getting Started sections
// ---------------------------------------------------------------------------

const GETTING_STARTED_SECTIONS: HelpSection[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: "RocketLaunch",
    topics: [
      {
        id: "gs-create-task",
        title: "Creating Your First Task",
        description:
          "Click the empty placeholder row at the bottom of the task table and start typing a task name. Press Enter to confirm. The task appears on the timeline with default dates you can drag to adjust.",
        tip: `You can also press ${SHORTCUT_KEYS.EDIT_INSERT} to insert a row above the current selection.`,
        keywords: ["new", "add", "create", "first"],
      },
      {
        id: "gs-move-tasks",
        title: "Moving Tasks on the Timeline",
        description:
          "Click and drag a task bar in the timeline to change its dates. Drag the left or right edge to adjust the start or end date independently. The duration updates automatically.",
        tip: "Hold Shift while dragging to snap to whole days.",
        keywords: ["drag", "move", "resize", "dates", "timeline"],
      },
      {
        id: "gs-hierarchy",
        title: "Building Task Hierarchy",
        description: `Select a task and press ${SHORTCUT_KEYS.HIER_INDENT} to indent it under the task above, creating a parent-child relationship. The parent becomes a summary task whose dates span all children.`,
        tip: `Use ${SHORTCUT_KEYS.HIER_GROUP} to group multiple selected tasks under a new summary.`,
        keywords: [
          "indent",
          "outdent",
          "parent",
          "child",
          "group",
          "summary",
        ],
      },
      {
        id: "gs-save-open",
        title: "Saving and Opening Projects",
        description: `Press ${SHORTCUT_KEYS.FILE_SAVE} to save your project as an .ownchart file. Press ${SHORTCUT_KEYS.FILE_OPEN} to open an existing file. All data stays on your device — nothing is uploaded.`,
        tip: "OwnChart remembers your last session across browser tabs.",
        keywords: ["save", "open", "file", "ownchart", "privacy"],
      },
      {
        id: "gs-shortcuts",
        title: "Keyboard Shortcuts Overview",
        description: `Press ${SHORTCUT_KEYS.NAV_HELP} at any time to open this help dialog. The Shortcuts tab lists every keyboard shortcut organized by category. Most shortcuts use ${MOD_PLACEHOLDER} as the modifier key.`,
        keywords: ["keyboard", "shortcut", "help", "hotkey"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Feature sections
// ---------------------------------------------------------------------------

const FEATURE_SECTIONS: HelpSection[] = [
  // 1. File Operations
  {
    id: "feat-file",
    title: "File Operations",
    icon: "FloppyDisk",
    topics: [
      {
        id: "feat-file-new",
        title: "New Project",
        description:
          "Create a blank project with default settings. If you have unsaved changes you'll be prompted to save first.",
        shortcuts: [SHORTCUT_KEYS.FILE_NEW],
        keywords: ["new", "create", "blank"],
      },
      {
        id: "feat-file-open",
        title: "Open Project",
        description:
          "Open an .ownchart file from your device. View settings, column widths, and dependencies are all restored.",
        shortcuts: [SHORTCUT_KEYS.FILE_OPEN],
        keywords: ["open", "load", "import"],
      },
      {
        id: "feat-file-save",
        title: "Save Project",
        description:
          "Save your project to disk. On first save, you'll choose a filename. Subsequent saves write to the same file instantly.",
        shortcuts: [SHORTCUT_KEYS.FILE_SAVE],
        keywords: ["save", "disk", "file"],
      },
      {
        id: "feat-file-save-as",
        title: "Save As",
        description:
          "Save a copy of your project with a new filename, keeping the original intact.",
        shortcuts: [SHORTCUT_KEYS.FILE_SAVE_AS],
        keywords: ["save as", "copy", "duplicate"],
      },
      {
        id: "feat-file-export",
        title: "Export",
        description:
          "Export your chart as PNG, PDF, or SVG. Open the export dialog to configure format-specific options like page size, scale, and content toggles.",
        shortcuts: [SHORTCUT_KEYS.FILE_EXPORT],
        keywords: ["export", "png", "pdf", "svg", "image"],
      },
      {
        id: "feat-file-format",
        title: "File Format (.ownchart)",
        description:
          "Projects are saved as .ownchart files — a JSON format that stores tasks, dependencies, view settings, and export preferences. Files can be shared by copying the file.",
        keywords: ["format", "json", "ownchart", "file type"],
      },
    ],
  },

  // 2. Task Management
  {
    id: "feat-task",
    title: "Task Management",
    icon: "ListChecks",
    topics: [
      {
        id: "feat-task-add",
        title: "Add Task",
        description:
          "Click the placeholder row at the bottom of the table or use the Add Task button in the ribbon. New tasks default to today's date with a 7-day duration.",
        keywords: ["add", "new", "create", "task"],
      },
      {
        id: "feat-task-edit",
        title: "Edit Task Properties",
        description:
          "Double-click or press Enter on a cell to edit it. Editable fields include name, start date, end date, duration, progress, and color.",
        keywords: ["edit", "modify", "change", "cell"],
      },
      {
        id: "feat-task-delete",
        title: "Delete Tasks",
        description:
          "Select one or more tasks and press Delete or click the Delete button. Summary tasks offer the choice to delete children or promote them.",
        // Two separate entries here (vs. combined in shortcuts tab) for clarity
        shortcuts: [SHORTCUT_KEYS.EDIT_DELETE, SHORTCUT_KEYS.EDIT_DELETE_ALT],
        keywords: ["delete", "remove"],
      },
      {
        id: "feat-task-duration",
        title: "Duration",
        description:
          "Duration is calculated from start and end dates. Edit it directly to adjust the end date. In working days mode, weekends and holidays are excluded from the count.",
        keywords: ["duration", "length", "days"],
      },
      {
        id: "feat-task-progress",
        title: "Progress",
        description:
          "Set completion percentage (0-100%) by editing the progress cell or dragging the progress handle on the task bar. Summary tasks auto-calculate progress from children.",
        keywords: ["progress", "completion", "percent"],
      },
      {
        id: "feat-task-insert",
        title: "Insert Tasks",
        description:
          "Insert a new task above or below the current selection using the ribbon buttons or keyboard shortcuts.",
        shortcuts: [SHORTCUT_KEYS.EDIT_INSERT],
        keywords: ["insert", "above", "below"],
      },
    ],
  },

  // 3. Selection
  {
    id: "feat-selection",
    title: "Selection",
    icon: "CursorClick",
    topics: [
      {
        id: "feat-sel-single",
        title: "Single Selection",
        description:
          "Click a row in the table or a task bar in the timeline to select it. The active task is highlighted in both views.",
        keywords: ["click", "select", "single"],
      },
      {
        id: "feat-sel-multi",
        title: "Multi-Selection",
        description:
          "Hold {mod} and click to toggle individual tasks in and out of the selection. Works in both table and timeline.",
        shortcuts: [SHORTCUT_KEYS.SEL_MOD_CLICK],
        keywords: ["multi", "toggle", "ctrl"],
      },
      {
        id: "feat-sel-range",
        title: "Range Selection",
        description:
          "Hold Shift and click to select a contiguous range of tasks from the last selected task to the clicked task.",
        shortcuts: [SHORTCUT_KEYS.SEL_RANGE],
        keywords: ["range", "shift"],
      },
      {
        id: "feat-sel-marquee",
        title: "Marquee Selection",
        description:
          "Click and drag a rectangle in the timeline to select all task bars that overlap the drawn area.",
        keywords: ["marquee", "rectangle", "drag", "lasso"],
      },
      {
        id: "feat-sel-all",
        title: "Select All",
        description: "Select every task in the project.",
        shortcuts: [SHORTCUT_KEYS.EDIT_SELECT_ALL],
        keywords: ["all", "select all"],
      },
    ],
  },

  // 4. Hierarchy & Groups
  {
    id: "feat-hierarchy",
    title: "Hierarchy & Groups",
    icon: "TreeStructure",
    topics: [
      {
        id: "feat-hier-indent",
        title: "Indent / Outdent",
        description:
          "Indent makes a task a child of the task above it. Outdent moves it back to the parent's level. Both operations support undo.",
        shortcuts: [SHORTCUT_KEYS.HIER_INDENT, SHORTCUT_KEYS.HIER_OUTDENT],
        keywords: ["indent", "outdent", "child", "sibling"],
      },
      {
        id: "feat-hier-group",
        title: "Group / Ungroup",
        description:
          "Group wraps selected tasks in a new summary task. Ungroup removes the summary and promotes its children to siblings.",
        shortcuts: [SHORTCUT_KEYS.HIER_GROUP, SHORTCUT_KEYS.HIER_UNGROUP],
        keywords: ["group", "ungroup", "wrap"],
      },
      {
        id: "feat-hier-summary",
        title: "Summary Tasks",
        description:
          "Summary tasks automatically span the date range of their children. Their progress is calculated from child tasks. They render as bracket shapes in the timeline.",
        keywords: ["summary", "parent", "bracket", "auto"],
      },
      {
        id: "feat-hier-collapse",
        title: "Expand / Collapse",
        description:
          "Click the +/- arrow on a summary task to show or hide its children. Collapse state is saved with the project file.",
        keywords: ["expand", "collapse", "fold", "toggle"],
      },
      {
        id: "feat-hier-milestone",
        title: "Milestones",
        description:
          "A milestone is a zero-duration task that represents a key date. It renders as a diamond shape in the timeline. Set duration to 0 or change the task type to Milestone.",
        keywords: ["milestone", "diamond", "zero duration", "key date"],
      },
    ],
  },

  // 5. Timeline & Zoom
  {
    id: "feat-timeline",
    title: "Timeline & Zoom",
    icon: "MagnifyingGlassPlus",
    topics: [
      {
        id: "feat-tl-zoom",
        title: "Zoom In / Out",
        description:
          "Zoom from 5% to 300% using toolbar buttons, the dropdown, or {mod}+Scroll. Zoom is exponential for a consistent feel at all levels.",
        shortcuts: [SHORTCUT_KEYS.VIEW_ZOOM_WHEEL],
        keywords: ["zoom", "scale", "magnify"],
      },
      {
        id: "feat-tl-fit",
        title: "Fit to View",
        description:
          "Automatically adjust zoom and scroll so all tasks fit within the visible timeline area.",
        shortcuts: [SHORTCUT_KEYS.VIEW_FIT],
        keywords: ["fit", "auto zoom", "overview"],
      },
      {
        id: "feat-tl-infinite",
        title: "Infinite Scroll",
        description:
          "The timeline automatically extends when you scroll past its edges, so you never run out of space in either direction.",
        keywords: ["infinite", "scroll", "extend", "auto"],
      },
      {
        id: "feat-tl-anchor",
        title: "Zoom Anchoring",
        description:
          "When zooming with the mouse wheel, zoom centers on the cursor position. Keyboard and toolbar zoom centers on the viewport.",
        keywords: ["anchor", "center", "cursor"],
      },
      {
        id: "feat-tl-header",
        title: "Timeline Header & Date Selection",
        description:
          "The multi-level header shows months, weeks, and days adapting to zoom. Drag in the header to select a date range, then right-click to zoom to that selection.",
        keywords: ["header", "date", "month", "week", "day", "select range"],
      },
    ],
  },

  // 6. Task Bars
  {
    id: "feat-bars",
    title: "Task Bars",
    icon: "ArrowsOutLineHorizontal",
    topics: [
      {
        id: "feat-bar-move",
        title: "Move Task Bar",
        description:
          "Click and drag a task bar to move it to new dates. Both start and end dates shift by the same amount.",
        keywords: ["move", "drag", "reposition"],
      },
      {
        id: "feat-bar-resize",
        title: "Resize Task Bar",
        description:
          "Drag the left edge to change the start date or the right edge to change the end date. The cursor changes to a resize icon near the edges.",
        keywords: ["resize", "edge", "duration"],
      },
      {
        id: "feat-bar-progress",
        title: "Drag Progress Handle",
        description:
          "Drag the progress handle on a task bar to visually set the completion percentage.",
        keywords: ["progress", "handle", "drag"],
      },
      {
        id: "feat-bar-multi",
        title: "Multi-Task Drag",
        description:
          "When multiple tasks are selected, dragging any one of them moves all selected tasks together while preserving their relative positions.",
        keywords: ["multi", "drag", "group move"],
      },
      {
        id: "feat-bar-summary",
        title: "Summary Task Drag",
        description:
          "Dragging a summary task moves all its children automatically, keeping the hierarchy intact.",
        keywords: ["summary", "parent", "children", "move"],
      },
    ],
  },

  // 7. Dependencies
  {
    id: "feat-deps",
    title: "Dependencies",
    icon: "FlowArrow",
    topics: [
      {
        id: "feat-dep-create",
        title: "Create Dependency",
        description:
          "Hover over a task bar to reveal connection handles, then drag from one task's handle to another task. This creates a Finish-to-Start dependency.",
        keywords: ["create", "link", "connect", "arrow"],
      },
      {
        id: "feat-dep-delete",
        title: "Delete Dependency",
        description:
          "Click a dependency arrow to select it (it turns darker), then press Delete to remove it.",
        keywords: ["delete", "remove", "unlink"],
      },
      {
        id: "feat-dep-cycle",
        title: "Cycle Detection",
        description:
          "OwnChart prevents circular dependencies. If linking two tasks would create a cycle, the connection is blocked and a warning appears.",
        keywords: ["cycle", "circular", "loop", "prevent"],
      },
      {
        id: "feat-dep-visual",
        title: "Dependency Arrows",
        description:
          "Dependencies render as curved SVG arrows. Toggle their visibility with D or the Dependencies button in the View tab.",
        shortcuts: [SHORTCUT_KEYS.VIEW_DEPS],
        keywords: ["arrow", "visual", "show", "hide"],
      },
    ],
  },

  // 8. Copy, Cut & Paste
  {
    id: "feat-clipboard",
    title: "Copy, Cut & Paste",
    icon: "Clipboard",
    topics: [
      {
        id: "feat-clip-copy",
        title: "Copy Tasks",
        description:
          "Copy selected tasks to the clipboard. Copied rows show a dashed border. Paste multiple times from the same copy.",
        shortcuts: [SHORTCUT_KEYS.EDIT_COPY],
        keywords: ["copy", "duplicate"],
      },
      {
        id: "feat-clip-cut",
        title: "Cut Tasks",
        description:
          "Cut selected tasks to the clipboard. They appear faded until pasted or the operation is cancelled with Escape.",
        shortcuts: [SHORTCUT_KEYS.EDIT_CUT],
        keywords: ["cut", "move"],
      },
      {
        id: "feat-clip-paste",
        title: "Paste Tasks",
        description:
          "Paste tasks from the clipboard. They are inserted after the current selection or at the end of the list.",
        shortcuts: [SHORTCUT_KEYS.EDIT_PASTE],
        keywords: ["paste", "insert"],
      },
      {
        id: "feat-clip-cross-tab",
        title: "Cross-Tab Clipboard",
        description:
          "Copied tasks are stored in localStorage, allowing paste between different browser tabs running OwnChart.",
        keywords: ["cross-tab", "tab", "browser", "share"],
      },
    ],
  },

  // 9. View Toggles
  {
    id: "feat-view",
    title: "View Toggles",
    icon: "Eye",
    topics: [
      {
        id: "feat-view-today",
        title: "Today Marker",
        description:
          "A blue vertical line marking today's date in the timeline. Toggle with T or the View tab.",
        shortcuts: [SHORTCUT_KEYS.VIEW_TODAY],
        keywords: ["today", "marker", "line", "blue"],
      },
      {
        id: "feat-view-deps",
        title: "Dependencies Toggle",
        description: "Show or hide all dependency arrows in the timeline.",
        shortcuts: [SHORTCUT_KEYS.VIEW_DEPS],
        keywords: ["dependencies", "arrows", "toggle"],
      },
      {
        id: "feat-view-progress",
        title: "Progress Toggle",
        description:
          "Show or hide the progress column in the table and progress bars on task bars.",
        shortcuts: [SHORTCUT_KEYS.VIEW_PROGRESS],
        keywords: ["progress", "column", "bar"],
      },
      {
        id: "feat-view-holidays",
        title: "Holidays Toggle",
        description:
          "Show or hide holiday highlighting in the timeline. Holidays are color-coded with tooltips showing the holiday name.",
        shortcuts: [SHORTCUT_KEYS.VIEW_HOLIDAYS],
        keywords: ["holidays", "highlight", "tooltip"],
      },
      {
        id: "feat-view-weekends",
        title: "Weekends Toggle",
        description:
          "Show or hide the subtle weekend shading in the timeline background.",
        keywords: ["weekends", "shading", "saturday", "sunday"],
      },
    ],
  },

  // 10. Working Days
  {
    id: "feat-workdays",
    title: "Working Days",
    icon: "CalendarBlank",
    topics: [
      {
        id: "feat-wd-modes",
        title: "Working Days Modes",
        description:
          "Choose from Off (all days), Mon-Fri, Mon-Sat, or a custom set of working days. When enabled, durations are counted in working days and dragging skips non-working days.",
        keywords: ["working days", "mode", "business days"],
      },
      {
        id: "feat-wd-holidays",
        title: "Holiday Region",
        description:
          "Select a country from 199 supported regions to highlight public holidays in the timeline. Holidays are excluded from working day counts when working days mode is enabled.",
        keywords: ["holiday", "country", "region", "public"],
      },
      {
        id: "feat-wd-custom",
        title: "Custom Work Schedule",
        description:
          "In Custom mode, select individual days of the week that count as working days. Each project can have its own schedule, saved in the .ownchart file.",
        keywords: ["custom", "schedule", "days of week"],
      },
    ],
  },

  // 11. Color Management
  {
    id: "feat-color",
    title: "Color Management",
    icon: "Palette",
    topics: [
      {
        id: "feat-color-modes",
        title: "Color Modes",
        description:
          "Five smart color modes: Manual (set per task), Theme (curated palettes), Summary Group (children inherit parent color), Task Type (color by type), and Hierarchy (darker-to-lighter by nesting depth).",
        keywords: ["color", "mode", "theme", "palette"],
      },
      {
        id: "feat-color-manual",
        title: "Manual Colors",
        description:
          "In Manual mode, click the color cell to open a picker with project colors, curated swatches, and a native color picker. Colors are saved per task.",
        keywords: ["manual", "picker", "swatch", "custom"],
      },
      {
        id: "feat-color-auto",
        title: "Automatic Colors",
        description:
          "Theme, Summary Group, Task Type, and Hierarchy modes automatically assign colors. You can override individual tasks and later reset them to automatic.",
        keywords: ["auto", "automatic", "reset", "override"],
      },
    ],
  },

  // 12. Export
  {
    id: "feat-export",
    title: "Export",
    icon: "Export",
    topics: [
      {
        id: "feat-exp-png",
        title: "PNG Export",
        description:
          "Export your chart as a high-resolution PNG image. Configure zoom scale (1x-6x), include or exclude grid lines, weekends, and background.",
        keywords: ["png", "image", "raster", "screenshot"],
      },
      {
        id: "feat-exp-pdf",
        title: "PDF Export",
        description:
          "Export as a vector PDF with selectable text. Choose page size (A4, A3, Letter, etc.), orientation, margins, and scale mode.",
        keywords: ["pdf", "print", "vector", "page"],
      },
      {
        id: "feat-exp-svg",
        title: "SVG Export",
        description:
          "Export as an editable SVG file. Options include dimension mode (auto, custom, responsive), text as paths or elements, and inline vs. CSS styling.",
        keywords: ["svg", "vector", "editable", "scalable"],
      },
      {
        id: "feat-exp-settings",
        title: "Export Settings",
        description:
          "All three formats share options for grid lines, weekends, holidays, and UI density. Last-used export settings are remembered in the project file.",
        keywords: ["settings", "options", "remember", "persist"],
      },
    ],
  },

  // 13. Table
  {
    id: "feat-table",
    title: "Table",
    icon: "Table",
    topics: [
      {
        id: "feat-tbl-columns",
        title: "Column Resizing",
        description:
          "Drag the right edge of any column header to resize it. Double-click the edge to auto-fit the column to its content.",
        keywords: ["column", "resize", "width", "drag"],
      },
      {
        id: "feat-tbl-autofit",
        title: "Auto-Fit Columns",
        description:
          "Double-click a column divider to auto-fit, or use the toolbar to auto-fit all columns at once. Widths also auto-adjust when UI density changes.",
        keywords: ["auto-fit", "auto", "width"],
      },
      {
        id: "feat-tbl-visibility",
        title: "Column Visibility",
        description:
          "Toggle which date columns are visible from the View tab's Columns menu. Hidden columns are excluded from exports too.",
        keywords: ["column", "visibility", "show", "hide"],
      },
      {
        id: "feat-tbl-hidden-rows",
        title: "Hidden Rows",
        description:
          "Hide selected rows with {mod}+H. Row number gaps indicate hidden rows with a clickable indicator to unhide them. Use {mod}+Shift+H to show all.",
        shortcuts: [SHORTCUT_KEYS.VIEW_HIDE_ROWS, SHORTCUT_KEYS.VIEW_SHOW_ROWS],
        keywords: ["hidden", "rows", "filter", "unhide"],
      },
      {
        id: "feat-tbl-reorder",
        title: "Row Reordering",
        description:
          "Drag a row by its row number to reorder it in the list. The task and its children (if summary) move together.",
        keywords: ["reorder", "drag", "move", "sort"],
      },
    ],
  },

  // 14. Settings
  {
    id: "feat-settings",
    title: "Settings",
    icon: "GearSix",
    topics: [
      {
        id: "feat-set-density",
        title: "UI Density",
        description:
          "Choose Compact (20px rows), Normal (28px), or Comfortable (36px). Affects row height, font size, and spacing throughout the app and in exports.",
        keywords: ["density", "compact", "normal", "comfortable", "size"],
      },
      {
        id: "feat-set-date",
        title: "Date Format",
        description:
          "Choose between YYYY-MM-DD, DD/MM/YYYY, or MM/DD/YYYY. The format is used in the table, timeline headers, and exports.",
        keywords: ["date", "format", "yyyy", "dd/mm"],
      },
      {
        id: "feat-set-weekstart",
        title: "First Day of Week",
        description:
          "Set the first day of the week to Sunday (US convention) or Monday (ISO/European). Affects timeline header week boundaries.",
        keywords: ["week", "start", "sunday", "monday"],
      },
      {
        id: "feat-set-weeknum",
        title: "Week Numbering",
        description:
          "Choose ISO 8601 (Mon-Sun, week 1 contains Jan 4) or US (Sun-Sat, week 1 contains Jan 1) for calendar week numbers in the timeline.",
        keywords: ["week", "numbering", "iso", "us", "calendar week"],
      },
    ],
  },

  // 15. Undo & Redo
  {
    id: "feat-undo",
    title: "Undo & Redo",
    icon: "ArrowCounterClockwise",
    topics: [
      {
        id: "feat-undo-undo",
        title: "Undo",
        description:
          "Undo the last action. The toolbar button shows a tooltip describing which action will be undone. Supports all task mutations, hierarchy changes, and color changes.",
        shortcuts: [SHORTCUT_KEYS.EDIT_UNDO],
        keywords: ["undo", "revert", "back"],
      },
      {
        id: "feat-undo-redo",
        title: "Redo",
        description:
          "Redo a previously undone action. Available as long as no new action has been performed after the undo.",
        shortcuts: [SHORTCUT_KEYS.EDIT_REDO, SHORTCUT_KEYS.EDIT_REDO_ALT],
        keywords: ["redo", "forward", "repeat"],
      },
    ],
  },

  // 16. Help & Info
  {
    id: "feat-help",
    title: "Help & Info",
    icon: "Question",
    topics: [
      {
        id: "feat-help-welcome",
        title: "Welcome Tour",
        description:
          "A first-time welcome dialog with quick tips for getting started. Shown automatically on first visit; can be permanently dismissed.",
        keywords: ["welcome", "tour", "first time", "onboarding"],
      },
      {
        id: "feat-help-shortcuts",
        title: "Keyboard Shortcuts",
        description:
          "Press ? to open the help dialog. The Shortcuts tab lists every keyboard shortcut organized by category with platform-aware modifier keys.",
        shortcuts: [SHORTCUT_KEYS.NAV_HELP],
        keywords: ["keyboard", "shortcuts", "help", "hotkeys"],
      },
      {
        id: "feat-help-about",
        title: "About Dialog",
        description:
          "Shows the app version, links to the GitHub repository, website, and GitHub Sponsors. Accessible from the Help tab in the ribbon.",
        keywords: ["about", "version", "info", "github"],
      },
    ],
  },

  // 17. Accessibility
  {
    id: "feat-a11y",
    title: "Accessibility",
    icon: "HandPalm",
    topics: [
      {
        id: "feat-a11y-keyboard",
        title: "Full Keyboard Navigation",
        description:
          "Navigate the entire app using the keyboard. Arrow keys move between cells, Tab/Shift+Tab move between columns, and Enter starts editing.",
        keywords: ["keyboard", "navigation", "tab", "arrow"],
      },
      {
        id: "feat-a11y-focus",
        title: "Focus Management",
        description:
          "Dialogs trap focus so Tab stays within the modal. Focus is restored to the previous element when a dialog closes.",
        keywords: ["focus", "trap", "modal", "restore"],
      },
      {
        id: "feat-a11y-aria",
        title: "ARIA Labels",
        description:
          'All interactive elements have proper ARIA labels and roles. Dialogs use role="dialog" and aria-modal for screen reader compatibility.',
        keywords: ["aria", "label", "role", "screen reader"],
      },
      {
        id: "feat-a11y-contrast",
        title: "Color Contrast",
        description:
          "Task bar text color automatically adjusts for readability against the bar color. The UI follows WCAG contrast guidelines.",
        keywords: ["contrast", "wcag", "readable", "color"],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Assembled tabs — exported as a named constant for direct reference.
// Consumers should import HELP_TABS directly rather than calling getHelpTabs().
// ---------------------------------------------------------------------------

export const HELP_TABS: readonly HelpTab[] = [
  {
    id: "getting-started",
    label: "Getting Started",
    sections: GETTING_STARTED_SECTIONS,
  },
  {
    id: "shortcuts",
    label: "Shortcuts",
    sections: SHORTCUT_SECTIONS,
  },
  {
    id: "features",
    label: "Features",
    sections: FEATURE_SECTIONS,
  },
];
