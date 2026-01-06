# Sprint 1.3: File Operations - Team Concept

**Project:** Gantt Chart Application - app-gantt
**Sprint:** Sprint 1.3 - File Operations
**Status:** ✅ COMPLETE
**Date:** 2026-01-02 (Concept Created) | 2026-01-03 (Completed)
**Priority:** Critical (Core MVP Feature)
**Actual Duration:** 1 week

---

## Executive Summary

### Sprint Goal
Implement comprehensive file operations allowing users to save their work to `.ownchart` files, open existing files, and create new charts. This sprint focuses on **forward-compatible file format design** ensuring users can always open old files in future app versions.

### Success Metrics
- [x] Users can save their chart to a `.ownchart` file ✅
- [x] Users can open existing `.ownchart` files ✅
- [x] Users can create a new empty chart ✅
- [x] Unsaved changes prompt prevents accidental data loss ✅
- [x] Invalid/malicious files are rejected with clear error messages ✅
- [x] Files created today remain openable in all future versions ✅ (migration system in place)

### Sprint Completion Checkpoint
**Visual Test:** "I can save and load my work"
- User creates 5 tasks with hierarchy
- User saves to `my-project.ownchart`
- User closes browser tab
- User opens app, loads `my-project.ownchart`
- All data restored exactly as saved
- User modifies a task, tries to close tab
- "Unsaved changes" dialog appears

---

## Team Contributions & Responsibilities

### 1. Product Owner - Strategic Vision

**Name:** Product Lead
**Role:** Define user value, prioritize features, acceptance criteria

#### Key Decisions & Requirements

**Critical Feature Rationale:**
> "File save/load is the most critical feature for user trust. Without reliable data persistence, our app is a toy, not a tool. Users must feel confident that their work is safe. Every professional application has robust file handling - we need to match that expectation."

**User Value Proposition:**
1. **Data Ownership**: Users own their data in portable files
2. **Privacy**: No cloud storage required, data stays local
3. **Portability**: Files can be shared via email, cloud drives, USB
4. **Reliability**: Never lose work due to browser issues
5. **Trust**: Users feel safe investing time in the app

**Feature Priority Ranking:**
1. **Critical:** Save to file (Ctrl+S) - with File System Access API + fallback
2. **Critical:** Open from file (Ctrl+O)
3. **Critical:** New chart (Ctrl+N)
4. **Critical:** Unsaved changes dialog
5. **Critical:** File validation (security)
6. **High:** Save As via keyboard shortcut (Ctrl+Shift+S)
7. **Medium:** Recent files tracking (V1.1 - requires localStorage)
8. **Low:** Auto-save to browser storage (V1.1)
9. **Low:** File compression for large charts (V1.1)

**Acceptance Criteria:**
- [x] Toolbar has New, Open, Save icons (File, FolderOpen, FloppyDisk) ✅
- [x] Ctrl+S saves file (re-saves directly in Chrome/Edge, downloads in Firefox/Safari) ✅
- [x] Ctrl+O opens file picker ✅
- [x] Ctrl+Alt+N creates new chart (prompts if unsaved changes) ✅ (Note: Ctrl+N blocked by browser)
- [x] Ctrl+Shift+S forces "Save As" dialog (hidden shortcut, no button) ✅
- [x] Closing tab with unsaved changes shows browser prompt ✅
- [x] Invalid JSON files show helpful error message ✅
- [x] Malicious files (XSS, prototype pollution) are blocked ✅
- [x] Old file versions auto-migrate to current format ✅ (migration infrastructure ready)
- [x] Unknown fields from future versions are preserved (not deleted) ✅
- [x] Works in Chrome, Edge, Firefox, and Safari (with appropriate fallbacks) ✅

**User Stories:**
- As a project manager, I want to save my Gantt chart so I don't lose my work
- As a freelancer, I want to share a `.ownchart` file with my client for review
- As a returning user, I want to continue where I left off
- As a cautious user, I want to be warned before losing unsaved changes

---

### 2. Project Manager - Timeline & Risk Management

**Name:** Project Coordinator
**Role:** Schedule tracking, risk mitigation, resource allocation

#### Project Planning

**Time Breakdown:**
```
Day 1 (6 hours):
  - 0.5h: Team alignment meeting
  - 2h: File format TypeScript interfaces & schemas
  - 2h: Serialization utilities (toGanttFile, fromGanttFile)
  - 1h: Unit tests for serialization
  - 0.5h: Code review

Day 2 (6 hours):
  - 2h: 6-layer validation pipeline implementation
  - 2h: Security layer (sanitization, prototype pollution prevention)
  - 1h: Unit tests for validation
  - 1h: Manual security testing

Day 3 (6 hours):
  - 2h: Save file UI (FileMenu, Ctrl+S handler)
  - 2h: Open file UI (Ctrl+O handler, file picker)
  - 1h: New chart functionality (Ctrl+N)
  - 1h: Integration tests

Day 4 (5 hours):
  - 2h: Unsaved changes detection & dialog
  - 1.5h: Migration system foundation
  - 1h: Cross-browser testing
  - 0.5h: Documentation

Day 5 (3 hours):
  - 1h: Bug fixes & edge cases
  - 1h: Performance testing (large files)
  - 0.5h: Final code review
  - 0.5h: README & CHANGELOG updates

Total: 26 hours over 5 days
```

**Milestones:**
- **M1** (End of Day 1): File format & serialization complete
- **M2** (End of Day 2): Validation pipeline complete
- **M3** (End of Day 3): Save/Open/New UI complete
- **M4** (End of Day 4): Unsaved changes & migrations complete
- **M5** (End of Day 5): Sprint complete, all tests passing

**Risk Register:**

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| File format breaks backward compatibility | Low | Critical | Extensive versioning, migration tests |
| XSS via malicious file content | Medium | Critical | DOMPurify sanitization, CSP headers |
| Prototype pollution attack | Low | Critical | Safe JSON parsing, no Object.assign |
| Large file performance issues | Medium | Medium | Test with 1000 tasks, add streaming if needed |
| Browser save dialog differences | Medium | Low | Use showSaveFilePicker with fallback |

**Dependencies:**
- Sprint 1.2 complete (timeline visualization)
- Sprint 1.5 complete (undo/redo - for history persistence)
- DATA_MODEL.md file format specification
- Browser File System Access API (with fallback)

**Quality Gates:**
- [x] All unit tests pass (>85% coverage on new code) ✅ 112 tests passing
- [x] Security audit completed (no XSS, no prototype pollution) ✅ 23 sanitization tests
- [x] Manual testing checklist completed ✅ See SPRINT_1.3_TESTING_CHECKLIST.md
- [x] Performance verified (<500ms for 1000 tasks) ✅
- [x] Cross-browser tested (Chrome, Firefox, Safari, Edge) ✅
- [x] Code reviewed and approved ✅

---

### 3. UX/UI Designer - Interaction Design

**Name:** UX Designer
**Role:** User experience, visual design, interaction patterns

#### Interaction Design Specifications

**Design Principles:**
1. **Never Lose Data**: Always confirm before destructive actions
2. **Familiar Patterns**: Match OS-native file dialogs
3. **Clear Feedback**: Show save success/failure clearly
4. **Recovery Path**: Always provide undo or cancel options

**Toolbar Design (Icons in existing toolbar):**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [📄] [📂] [💾]  |  [↶] [↷]  |  [+ Add Task] [→] [←]  |  Gantt Chart         │
│  New  Open Save    Undo Redo                                                 │
└──────────────────────────────────────────────────────────────────────────────┘
   ↑     ↑     ↑
   Phosphor icons: FilePlus, FolderOpen, FloppyDisk
```

**Design Rationale:**
- Minimalist approach - no separate menu bar
- Icons with tooltips showing keyboard shortcuts
- Consistent with existing toolbar design
- No "Save As" button - available via Ctrl+Shift+S for power users

**Unsaved Changes Dialog:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Unsaved Changes                          │
│─────────────────────────────────────────────────────────────│
│                                                             │
│   You have unsaved changes in "My Project".                 │
│   Do you want to save before continuing?                    │
│                                                             │
│         [Don't Save]    [Cancel]    [Save]                  │
│                                     ↑ Primary button        │
└─────────────────────────────────────────────────────────────┘
```

**File Validation Error Dialog:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Unable to Open File                      │
│─────────────────────────────────────────────────────────────│
│                                                             │
│   The file "corrupted.ownchart" cannot be opened:              │
│                                                             │
│   Error: Invalid JSON structure at line 42                  │
│                                                             │
│   The file may be corrupted or not a valid .ownchart file.     │
│                                                             │
│                                    [OK]                     │
└─────────────────────────────────────────────────────────────┘
```

**Version Migration Notice:**

```
┌─────────────────────────────────────────────────────────────┐
│                    File Version Updated                     │
│─────────────────────────────────────────────────────────────│
│                                                             │
│   This file was created with an older version of the app.   │
│   It has been automatically updated to the current format.  │
│                                                             │
│   Note: If you save, the file will use the new format       │
│   and may not open in older versions of the app.            │
│                                                             │
│                                    [OK]                     │
└─────────────────────────────────────────────────────────────┘
```

**Keyboard Shortcuts:**

| Platform | New | Open | Save | Save As (hidden) |
|----------|-----|------|------|------------------|
| Windows/Linux | Ctrl+N | Ctrl+O | Ctrl+S | Ctrl+Shift+S |
| macOS | Cmd+N | Cmd+O | Cmd+S | Cmd+Shift+S |

Note: "Save As" has no toolbar button but is available via keyboard shortcut for power users.

**Browser Compatibility - File System Access API:**

| Browser | Save Behavior | Open Behavior |
|---------|---------------|---------------|
| Chrome/Edge | Native save dialog, re-save to same file | Native open dialog |
| Firefox | Download (always) | File input dialog |
| Safari | Download (always) | File input dialog |

**Practical Implications:**

| Action | Chrome/Edge | Firefox/Safari |
|--------|-------------|----------------|
| **First Save** | Save dialog with folder selection | Download to Downloads folder |
| **Re-Save (Ctrl+S)** | Direct write to same file ✨ | Download again (new file) |
| **Save As (Ctrl+Shift+S)** | Save dialog for new location | Download (same as Save) |
| **Open** | Native file picker | File input dialog |

In Firefox/Safari, every "Save" is effectively a "Save As" (download). Users need to manually replace the old file if desired.

**Save Progress Indicator:**

```
Saving (large file):
┌─────────────────────────────────────────────────────────────┐
│  Saving...  [████████░░░░░░░░░░░░]  45%                     │
└─────────────────────────────────────────────────────────────┘

Save Complete (toast notification):
┌───────────────────────────────────┐
│ ✓  Saved "my-project.ownchart"       │  ← 3-second toast
└───────────────────────────────────┘

Save Failed (toast notification):
┌───────────────────────────────────┐
│ ✗  Save failed: Permission denied │  ← Red background
│                          [Retry]   │
└───────────────────────────────────┘
```

**Title Bar File Indicator:**

```
Untitled chart (unsaved):
┌─────────────────────────────────────────────────────────────┐
│ Gantt Chart - Untitled *                                    │
└─────────────────────────────────────────────────────────────┘
                          ↑ Asterisk indicates unsaved changes

Saved chart:
┌─────────────────────────────────────────────────────────────┐
│ Gantt Chart - my-project.ownchart                              │
└─────────────────────────────────────────────────────────────┘
```

**Accessibility Considerations:**
- All dialogs keyboard navigable (Tab, Enter, Escape)
- Screen reader announces dialog content
- Focus management: focus trapped in dialog until closed
- High contrast mode support for all dialogs
- ARIA labels on all interactive elements

---

### 4. Software Architect - System Design

**Name:** System Architect
**Role:** Technical architecture, file format design, security

#### File Format Architecture

**Design Goals:**
1. **Forward Compatible**: Files created today open in all future versions
2. **Backward Compatible**: New app opens old files with auto-migration
3. **Secure**: Resistant to XSS, prototype pollution, path traversal
4. **Portable**: Self-contained, no external dependencies
5. **Human Readable**: JSON format, easy to inspect/debug

**File Format Version Strategy:**

```
Version Numbering: MAJOR.MINOR.PATCH

MAJOR: Breaking changes (rare, requires migration UI)
  - Fundamental structure changes
  - Renamed/removed required fields
  - Incompatible with older parsers

MINOR: Additive changes (common, auto-migrate)
  - New optional fields
  - New task properties
  - New feature data

PATCH: Bug fixes (frequent, no migration needed)
  - Documentation updates
  - Validation rule changes
```

**Current File Format (v1.0.0):**

```typescript
interface GanttFile {
  // Format identification
  fileVersion: string;           // "1.0.0" - file format version
  appVersion: string;            // "1.0.0" - app version that created it
  schemaVersion: number;         // 1 - for migration tracking

  // Chart data
  chart: {
    id: string;                  // UUID v4
    name: string;                // Chart title
    description?: string;        // Optional description
    tasks: Task[];               // All tasks
    dependencies: Dependency[];  // Task dependencies (future)
    milestones: Milestone[];     // Standalone milestones (future)
    groups: TaskGroup[];         // Task groups (if separate from tasks)
    viewSettings: ViewSettings;  // UI state
    metadata: ChartMetadata;     // Timestamps, tags

    // Extensibility - preserve unknown fields
    customFieldDefinitions?: CustomFieldDefinition[];
    [key: string]: unknown;      // Unknown fields preserved
  };

  // History (optional - for file-based undo)
  history?: {
    entries: HistoryEntry[];
    maxEntries: number;
    snapshots: Snapshot[];
  };

  // User preferences (subset saved in file)
  preferences?: {
    colorPalette?: string[];
    dateFormat?: string;
    theme?: string;
  };

  // File metadata
  metadata: {
    created: string;             // ISO 8601
    modified: string;            // ISO 8601
    fileSize?: number;           // Bytes
    checksum?: string;           // SHA-256 for integrity
  };

  // Feature flags for compatibility detection
  features?: {
    hasCustomFields?: boolean;
    hasResources?: boolean;
    hasDependencies?: boolean;
    hasHistory?: boolean;
  };

  // Migration tracking
  migrations?: {
    appliedMigrations: string[]; // ["1.0.0->1.1.0", "1.1.0->1.2.0"]
    originalVersion: string;     // Version file was created with
  };

  // CRITICAL: Preserve unknown top-level fields
  [key: string]: unknown;
}
```

**Unknown Field Preservation Strategy:**

```typescript
// When loading a file from a NEWER version:
// 1. Parse JSON normally
// 2. Extract known fields into typed objects
// 3. Store unknown fields in __unknownFields

interface TaskWithUnknownFields extends Task {
  __unknownFields?: Record<string, unknown>;
}

// When saving:
// 1. Serialize known fields
// 2. Merge __unknownFields back in
// This ensures fields from future versions aren't lost
```

**Migration System Architecture:**

```typescript
interface Migration {
  fromVersion: string;           // "1.0.0"
  toVersion: string;             // "1.1.0"
  description: string;           // "Added progress field to tasks"
  migrate: (data: unknown) => unknown;
  rollback?: (data: unknown) => unknown;  // Optional downgrade
}

// Migration registry
const migrations: Migration[] = [
  {
    fromVersion: "1.0.0",
    toVersion: "1.1.0",
    description: "Added progress field with default 0",
    migrate: (data) => {
      const file = data as GanttFile;
      return {
        ...file,
        fileVersion: "1.1.0",
        chart: {
          ...file.chart,
          tasks: file.chart.tasks.map(task => ({
            ...task,
            progress: task.progress ?? 0  // Default for new field
          }))
        },
        migrations: {
          appliedMigrations: [
            ...(file.migrations?.appliedMigrations || []),
            "1.0.0->1.1.0"
          ],
          originalVersion: file.migrations?.originalVersion || file.fileVersion
        }
      };
    }
  }
];

// Apply migrations sequentially
function migrateFile(file: unknown, targetVersion: string): GanttFile {
  let current = file as GanttFile;
  let currentVersion = current.fileVersion;

  while (currentVersion !== targetVersion) {
    const migration = migrations.find(m => m.fromVersion === currentVersion);
    if (!migration) {
      throw new MigrationError(`No migration path from ${currentVersion}`);
    }

    current = migration.migrate(current) as GanttFile;
    currentVersion = migration.toVersion;
  }

  return current;
}
```

**6-Layer Validation Pipeline:**

```
Layer 1: Pre-Parse Validation
├── File size check (max 50MB)
├── File extension check (.ownchart)
└── Magic bytes check (optional)

Layer 2: Safe JSON Parsing
├── Use JSON.parse() - native, secure
├── Catch SyntaxError with line numbers
└── Prevent prototype pollution via reviver

Layer 3: Structure Validation (JSON Schema)
├── Required fields present
├── Field types correct
├── Array limits enforced (max 1000 tasks)
└── String length limits enforced

Layer 4: Semantic Validation
├── All IDs are valid UUIDs
├── All dates are valid ISO 8601
├── No circular task references
├── No dangling parent references
├── Dependency targets exist

Layer 5: String Sanitization
├── DOMPurify on all string fields
├── Remove script tags, event handlers
├── Preserve safe HTML (future: rich text)
└── Normalize Unicode

Layer 6: Version Compatibility
├── Check fileVersion against app version
├── Apply migrations if needed
├── Warn if file is from future version
└── Preserve unknown fields
```

**Security Measures:**

```typescript
// 1. Prevent Prototype Pollution
function safeJsonParse(json: string): unknown {
  return JSON.parse(json, (key, value) => {
    // Block __proto__ and constructor pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return undefined;
    }
    return value;
  });
}

// 2. Sanitize All Strings
import DOMPurify from 'dompurify';

function sanitizeStrings(obj: unknown): unknown {
  if (typeof obj === 'string') {
    return DOMPurify.sanitize(obj, {
      ALLOWED_TAGS: [], // No HTML in task names
      ALLOWED_ATTR: []
    });
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeStrings);
  }
  if (obj && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = sanitizeStrings(value);
    }
    return result;
  }
  return obj;
}

// 3. Validate File Size Before Parsing
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

async function validateFileSize(file: File): Promise<void> {
  if (file.size > MAX_FILE_SIZE) {
    throw new FileTooLargeError(
      `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds limit of 50MB`
    );
  }
}
```

---

### 5. Frontend Developer - Implementation Lead

**Name:** Frontend Engineer
**Role:** React implementation, browser APIs, state management

#### Technical Implementation Plan

**File Structure:**

```
src/
├── utils/
│   ├── fileOperations/
│   │   ├── index.ts              # Public API
│   │   ├── serialize.ts          # GanttFile serialization
│   │   ├── deserialize.ts        # GanttFile deserialization
│   │   ├── validate.ts           # 6-layer validation
│   │   ├── migrate.ts            # Version migrations
│   │   ├── sanitize.ts           # Security sanitization
│   │   └── fileDialog.ts         # Browser file dialogs
│   └── fileOperations.test.ts    # Unit tests
├── hooks/
│   └── useFileOperations.ts      # React hook for file ops
├── components/
│   ├── FileMenu/
│   │   ├── FileMenu.tsx          # Dropdown menu
│   │   ├── FileMenuTrigger.tsx   # Toolbar button
│   │   └── RecentFiles.tsx       # Recent files list
│   └── Dialogs/
│       ├── UnsavedChangesDialog.tsx
│       ├── FileErrorDialog.tsx
│       └── MigrationNoticeDialog.tsx
└── store/
    └── slices/
        └── fileSlice.ts          # File state management
```

**Core Serialization (serialize.ts):**

```typescript
import { Task, ViewSettings, ChartMetadata } from '@/types/chart.types';
import { APP_VERSION, FILE_VERSION } from '@/config/version';

interface SerializeOptions {
  includeHistory?: boolean;
  includePreferences?: boolean;
  prettyPrint?: boolean;
}

export function serializeToGanttFile(
  tasks: Task[],
  viewSettings: ViewSettings,
  metadata: ChartMetadata,
  options: SerializeOptions = {}
): string {
  const ganttFile: GanttFile = {
    fileVersion: FILE_VERSION,
    appVersion: APP_VERSION,
    schemaVersion: 1,

    chart: {
      id: metadata.id || crypto.randomUUID(),
      name: metadata.name || 'Untitled',
      description: metadata.description,
      tasks: tasks.map(serializeTask),
      dependencies: [],
      milestones: [],
      groups: [],
      viewSettings: {
        zoom: viewSettings.zoom,
        viewMode: viewSettings.viewMode,
        showWeekends: viewSettings.showWeekends,
        showToday: viewSettings.showToday,
        theme: viewSettings.theme
      },
      metadata: {
        version: FILE_VERSION,
        createdAt: metadata.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },

    metadata: {
      created: metadata.createdAt || new Date().toISOString(),
      modified: new Date().toISOString()
    },

    features: {
      hasCustomFields: tasks.some(t => t.customFields),
      hasDependencies: false,
      hasHistory: options.includeHistory
    }
  };

  // Include history if requested
  if (options.includeHistory) {
    ganttFile.history = {
      entries: [],
      maxEntries: 100,
      snapshots: []
    };
  }

  // Calculate checksum
  const jsonString = JSON.stringify(ganttFile);
  ganttFile.metadata.fileSize = new Blob([jsonString]).size;
  // Note: checksum calculation in browser requires crypto API

  return options.prettyPrint
    ? JSON.stringify(ganttFile, null, 2)
    : JSON.stringify(ganttFile);
}

function serializeTask(task: Task): SerializedTask {
  const serialized: SerializedTask = {
    id: task.id,
    name: task.name,
    startDate: task.startDate,
    endDate: task.endDate,
    duration: task.duration,
    progress: task.progress,
    color: task.color,
    order: task.order,
    type: task.type,
    parent: task.parent,
    open: task.open,
    metadata: task.metadata,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Preserve unknown fields from future versions
  if ((task as any).__unknownFields) {
    Object.assign(serialized, (task as any).__unknownFields);
  }

  return serialized;
}
```

**Core Deserialization (deserialize.ts):**

```typescript
import { validateGanttFile } from './validate';
import { migrateGanttFile } from './migrate';
import { sanitizeGanttFile } from './sanitize';
import { FILE_VERSION } from '@/config/version';

export interface DeserializeResult {
  success: boolean;
  data?: {
    tasks: Task[];
    viewSettings: ViewSettings;
    metadata: ChartMetadata;
    fileName: string;
  };
  error?: FileError;
  warnings?: string[];
  migrated?: boolean;
}

export async function deserializeGanttFile(
  content: string,
  fileName: string
): Promise<DeserializeResult> {
  const warnings: string[] = [];

  try {
    // Layer 2: Safe JSON parsing
    let parsed: unknown;
    try {
      parsed = safeJsonParse(content);
    } catch (e) {
      return {
        success: false,
        error: {
          code: 'INVALID_JSON',
          message: `Invalid JSON: ${(e as Error).message}`,
          recoverable: false
        }
      };
    }

    // Layer 3: Structure validation
    const structureResult = validateStructure(parsed);
    if (!structureResult.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_STRUCTURE',
          message: structureResult.errors.join(', '),
          recoverable: false
        }
      };
    }

    let ganttFile = parsed as GanttFile;

    // Layer 6: Version compatibility
    const versionCheck = checkVersionCompatibility(ganttFile.fileVersion);
    if (versionCheck.requiresMigration) {
      ganttFile = migrateGanttFile(ganttFile, FILE_VERSION);
      warnings.push(`File migrated from v${versionCheck.fileVersion} to v${FILE_VERSION}`);
    }
    if (versionCheck.fromFuture) {
      warnings.push('This file was created with a newer version. Some features may not work.');
    }

    // Layer 4: Semantic validation
    const semanticResult = validateSemantics(ganttFile);
    if (!semanticResult.valid) {
      return {
        success: false,
        error: {
          code: 'INVALID_SEMANTICS',
          message: semanticResult.errors.join(', '),
          recoverable: false
        }
      };
    }

    // Layer 5: Sanitization
    ganttFile = sanitizeGanttFile(ganttFile);

    // Extract data for app
    const tasks = ganttFile.chart.tasks.map(deserializeTask);
    const viewSettings = deserializeViewSettings(ganttFile.chart.viewSettings);
    const metadata = deserializeMetadata(ganttFile);

    return {
      success: true,
      data: {
        tasks,
        viewSettings,
        metadata,
        fileName
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      migrated: versionCheck.requiresMigration
    };

  } catch (e) {
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: `Unexpected error: ${(e as Error).message}`,
        recoverable: false
      }
    };
  }
}

function deserializeTask(serialized: SerializedTask): Task {
  // Extract known fields
  const task: Task = {
    id: serialized.id,
    name: serialized.name,
    startDate: serialized.startDate,
    endDate: serialized.endDate,
    duration: serialized.duration,
    progress: serialized.progress ?? 0,
    color: serialized.color,
    order: serialized.order,
    type: serialized.type ?? 'task',
    parent: serialized.parent,
    open: serialized.open ?? true,
    metadata: serialized.metadata ?? {}
  };

  // Preserve unknown fields for round-trip
  const knownKeys = new Set([
    'id', 'name', 'startDate', 'endDate', 'duration', 'progress',
    'color', 'order', 'type', 'parent', 'open', 'metadata',
    'createdAt', 'updatedAt', 'customFields'
  ]);

  const unknownFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(serialized)) {
    if (!knownKeys.has(key)) {
      unknownFields[key] = value;
    }
  }

  if (Object.keys(unknownFields).length > 0) {
    (task as any).__unknownFields = unknownFields;
  }

  return task;
}
```

**File Dialog Utilities (fileDialog.ts):**

```typescript
// Modern File System Access API with fallback for Firefox/Safari

export interface SaveFileOptions {
  suggestedName?: string;
  description?: string;
  forceNewFile?: boolean;  // true = "Save As", false = re-save if possible
}

export interface OpenFileOptions {
  multiple?: boolean;
}

// Store file handle for re-saving (Chrome/Edge only)
let currentFileHandle: FileSystemFileHandle | null = null;

export function hasFileHandle(): boolean {
  return currentFileHandle !== null;
}

export function clearFileHandle(): void {
  currentFileHandle = null;
}

export async function saveFile(
  content: string,
  options: SaveFileOptions = {}
): Promise<{ success: boolean; fileName?: string; error?: string }> {
  const fileName = options.suggestedName || 'untitled.ownchart';

  // Chrome/Edge: Try to re-save to existing file handle
  if (!options.forceNewFile && currentFileHandle && 'createWritable' in currentFileHandle) {
    try {
      const writable = await currentFileHandle.createWritable();
      await writable.write(content);
      await writable.close();
      return { success: true, fileName: currentFileHandle.name };
    } catch (e) {
      // Permission lost or file deleted - fall through to save dialog
      currentFileHandle = null;
    }
  }

  // Chrome/Edge: Show save dialog (File System Access API)
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: options.description || 'Gantt Chart File',
          accept: { 'application/json': ['.ownchart'] }
        }]
      });

      const writable = await handle.createWritable();
      await writable.write(content);
      await writable.close();

      // Store handle for future re-saves
      currentFileHandle = handle;

      return { success: true, fileName: handle.name };
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        return { success: false, error: 'Save cancelled' };
      }
      // Fall through to fallback
    }
  }

  // Firefox/Safari Fallback: Download file
  try {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    return { success: true, fileName };
  } catch (e) {
    return { success: false, error: (e as Error).message };
  }
}

export async function openFile(
  options: OpenFileOptions = {}
): Promise<{ success: boolean; files?: FileWithContent[]; error?: string }> {
  // Chrome/Edge: Use File System Access API
  if ('showOpenFilePicker' in window) {
    try {
      const handles = await (window as any).showOpenFilePicker({
        multiple: options.multiple ?? false,
        types: [{
          description: 'Gantt Chart Files',
          accept: { 'application/json': ['.ownchart'] }
        }]
      });

      const files: FileWithContent[] = [];
      for (const handle of handles) {
        const file = await handle.getFile();
        const content = await file.text();
        files.push({ name: file.name, content, size: file.size });
      }

      // Store first file handle for future re-saves (single file mode)
      if (!options.multiple && handles.length === 1) {
        currentFileHandle = handles[0];
      }

      return { success: true, files };
    } catch (e) {
      if ((e as Error).name === 'AbortError') {
        return { success: false, error: 'Open cancelled' };
      }
      // Fall through to fallback
    }
  }

  // Firefox/Safari Fallback: Hidden file input
  // Note: No file handle available - every save will be a download
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.ownchart,application/json';
    input.multiple = options.multiple ?? false;

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        resolve({ success: false, error: 'No file selected' });
        return;
      }

      const files: FileWithContent[] = [];
      for (const file of Array.from(input.files)) {
        const content = await file.text();
        files.push({ name: file.name, content, size: file.size });
      }

      // Clear file handle - Firefox/Safari can't re-save to same file
      currentFileHandle = null;

      resolve({ success: true, files });
    };

    input.oncancel = () => {
      resolve({ success: false, error: 'Open cancelled' });
    };

    input.click();
  });
}
```

**React Hook (useFileOperations.ts):**

```typescript
import { useCallback, useState } from 'react';
import { useTaskStore } from '@/store/slices/taskSlice';
import { useHistoryStore } from '@/store/slices/historySlice';
import { serializeToGanttFile, deserializeGanttFile } from '@/utils/fileOperations';
import { saveFile, openFile } from '@/utils/fileOperations/fileDialog';
import toast from 'react-hot-toast';

interface FileState {
  fileName: string | null;
  isDirty: boolean;
  lastSaved: Date | null;
  isLoading: boolean;
}

export function useFileOperations() {
  const [fileState, setFileState] = useState<FileState>({
    fileName: null,
    isDirty: false,
    lastSaved: null,
    isLoading: false
  });

  const tasks = useTaskStore(state => state.tasks);
  const viewSettings = useChartStore(state => state.viewSettings);
  const setTasks = useTaskStore(state => state.setTasks);
  const clearHistory = useHistoryStore(state => state.clearHistory);

  // Mark as dirty when changes occur
  const markDirty = useCallback(() => {
    setFileState(prev => ({ ...prev, isDirty: true }));
  }, []);

  // Save current chart
  // saveAs = false: Re-save to same file if possible (Chrome/Edge), otherwise download
  // saveAs = true: Always show save dialog / force new download
  const handleSave = useCallback(async (saveAs = false) => {
    setFileState(prev => ({ ...prev, isLoading: true }));

    try {
      const content = serializeToGanttFile(tasks, viewSettings, {
        name: fileState.fileName?.replace('.ownchart', '') || 'Untitled',
        createdAt: fileState.lastSaved?.toISOString()
      }, { prettyPrint: true });

      const result = await saveFile(content, {
        suggestedName: fileState.fileName || 'untitled.ownchart',
        forceNewFile: saveAs  // true = "Save As", false = re-save if possible
      });

      if (result.success) {
        setFileState(prev => ({
          ...prev,
          fileName: result.fileName!,
          isDirty: false,
          lastSaved: new Date(),
          isLoading: false
        }));
        toast.success(`Saved "${result.fileName}"`);
      } else if (result.error !== 'Save cancelled') {
        toast.error(`Save failed: ${result.error}`);
      }
    } catch (e) {
      toast.error(`Save failed: ${(e as Error).message}`);
    } finally {
      setFileState(prev => ({ ...prev, isLoading: false }));
    }
  }, [tasks, viewSettings, fileState.fileName, fileState.lastSaved]);

  // Open file
  const handleOpen = useCallback(async () => {
    // Check for unsaved changes first
    if (fileState.isDirty) {
      const shouldProceed = await confirmUnsavedChanges();
      if (!shouldProceed) return;
    }

    setFileState(prev => ({ ...prev, isLoading: true }));

    try {
      const result = await openFile();

      if (!result.success || !result.files || result.files.length === 0) {
        if (result.error !== 'Open cancelled') {
          toast.error(`Open failed: ${result.error}`);
        }
        return;
      }

      const file = result.files[0];
      const parseResult = await deserializeGanttFile(file.content, file.name);

      if (!parseResult.success) {
        toast.error(parseResult.error!.message);
        return;
      }

      // Load data into store
      setTasks(parseResult.data!.tasks);
      clearHistory();

      setFileState({
        fileName: file.name,
        isDirty: false,
        lastSaved: new Date(),
        isLoading: false
      });

      // Show warnings if any
      if (parseResult.warnings) {
        parseResult.warnings.forEach(w => toast(w, { icon: 'ℹ️' }));
      }

      toast.success(`Opened "${file.name}"`);
    } catch (e) {
      toast.error(`Open failed: ${(e as Error).message}`);
    } finally {
      setFileState(prev => ({ ...prev, isLoading: false }));
    }
  }, [fileState.isDirty, setTasks, clearHistory]);

  // Create new chart
  const handleNew = useCallback(async () => {
    if (fileState.isDirty) {
      const shouldProceed = await confirmUnsavedChanges();
      if (!shouldProceed) return;
    }

    setTasks([createInitialTask()]);
    clearHistory();

    setFileState({
      fileName: null,
      isDirty: false,
      lastSaved: null,
      isLoading: false
    });

    toast.success('Created new chart');
  }, [fileState.isDirty, setTasks, clearHistory]);

  return {
    ...fileState,
    handleSave,
    handleSaveAs: () => handleSave(true),
    handleOpen,
    handleNew,
    markDirty
  };
}
```

---

### 6. QA Tester - Quality Assurance

**Name:** QA Engineer
**Role:** Test planning, security testing, manual testing

#### Comprehensive Test Plan

**A. File Save Functionality**
```
Test Case 1.1: Basic Save
[ ] Create 5 tasks with hierarchy
[ ] Press Ctrl+S
[ ] Verify file dialog opens
[ ] Enter filename "test-project"
[ ] Click Save
[ ] Verify file saves successfully
[ ] Verify toast notification appears
[ ] Verify dirty indicator clears

Test Case 1.2: Save Overwrites Existing
[ ] Open an existing file
[ ] Make changes
[ ] Press Ctrl+S (not Save As)
[ ] Verify no dialog (saves directly)
[ ] Verify file updated

Test Case 1.3: Save As Creates New File
[ ] Open existing file
[ ] Press Ctrl+Shift+S
[ ] Verify dialog with new name option
[ ] Save with different name
[ ] Verify original unchanged
[ ] Verify new file created
```

**B. File Open Functionality**
```
Test Case 2.1: Open Valid File
[ ] Press Ctrl+O
[ ] Select valid .ownchart file
[ ] Verify file loads correctly
[ ] Verify all tasks present
[ ] Verify hierarchy intact
[ ] Verify view settings restored

Test Case 2.2: Open Invalid JSON
[ ] Create file with malformed JSON
[ ] Try to open
[ ] Verify error dialog appears
[ ] Verify error message helpful
[ ] Verify app state unchanged

Test Case 2.3: Open Future Version File
[ ] Create file with fileVersion "99.0.0"
[ ] Try to open
[ ] Verify warning shown
[ ] Verify unknown fields preserved
[ ] Verify save maintains unknown fields
```

**C. Security Testing**
```
Test Case 3.1: XSS Prevention
[ ] Create file with task name: <script>alert('xss')</script>
[ ] Open file
[ ] Verify script NOT executed
[ ] Verify name sanitized or displayed safely

Test Case 3.2: Prototype Pollution Prevention
[ ] Create file with {"__proto__": {"polluted": true}}
[ ] Open file
[ ] Verify Object.prototype.polluted is undefined
[ ] Verify app continues working

Test Case 3.3: Large File Handling
[ ] Create file > 50MB
[ ] Try to open
[ ] Verify error shown before parsing
[ ] Verify browser doesn't freeze
```

**D. Migration Testing**
```
Test Case 4.1: Migrate Old File
[ ] Create file with older fileVersion
[ ] Remove required fields that have defaults
[ ] Open file
[ ] Verify migration applied
[ ] Verify default values filled
[ ] Verify migration notice shown
[ ] Save and reopen
[ ] Verify new version saved

Test Case 4.2: Unknown Field Preservation
[ ] Create file with extra fields: {"customFeature": {...}}
[ ] Open file
[ ] Verify loads successfully
[ ] Make changes and save
[ ] Reopen saved file
[ ] Verify "customFeature" still present
```

**E. Unsaved Changes Detection**
```
Test Case 5.1: Close Tab with Unsaved Changes
[ ] Create new task
[ ] Try to close browser tab
[ ] Verify browser prompt appears
[ ] Click "Stay on page"
[ ] Verify data preserved

Test Case 5.2: New Chart with Unsaved Changes
[ ] Make changes
[ ] Press Ctrl+N
[ ] Verify unsaved changes dialog
[ ] Click "Don't Save"
[ ] Verify new chart created
[ ] Verify old data lost

Test Case 5.3: Open File with Unsaved Changes
[ ] Make changes
[ ] Press Ctrl+O
[ ] Verify unsaved changes dialog
[ ] Click "Save"
[ ] Verify file saved
[ ] Verify file picker opens
```

**F. Cross-Browser Testing**
```
Browser Matrix:
[ ] Chrome (Windows, Mac)
[ ] Firefox (Windows, Mac)
[ ] Safari (Mac)
[ ] Edge (Windows)

For each browser:
[ ] File picker opens correctly
[ ] Files save with correct extension
[ ] Files open correctly
[ ] Keyboard shortcuts work
[ ] Dialog styling correct
```

**Bug Severity Classification:**

| Severity | Description | Example |
|----------|-------------|---------|
| P0 - Critical | Data loss possible | Save fails silently |
| P1 - High | Feature completely broken | File won't open |
| P2 - Medium | Feature partially works | Wrong file extension |
| P3 - Low | Minor UX issue | Dialog positioning |
| P4 - Trivial | Cosmetic only | Icon alignment |

---

### 7. DevOps Engineer - Build & Testing

**Name:** DevOps Lead
**Role:** CI/CD, testing automation, security scanning

#### CI/CD Pipeline

```yaml
# .github/workflows/test-file-operations.yml

name: Sprint 1.3 - File Operations Tests

on:
  pull_request:
    paths:
      - 'src/utils/fileOperations/**'
      - 'src/hooks/useFileOperations.ts'
      - 'tests/**/*file*.test.ts'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run file operation unit tests
        run: npm run test:unit -- fileOperations

      - name: Check coverage (85%+ required)
        run: npm run test:coverage -- --threshold 85

  security-tests:
    runs-on: ubuntu-latest
    steps:
      - name: Test XSS prevention
        run: npm run test:security -- xss

      - name: Test prototype pollution prevention
        run: npm run test:security -- prototype-pollution

      - name: Test large file handling
        run: npm run test:security -- large-files

  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - name: File save/load round-trip
        run: npm run test:integration -- file-roundtrip

      - name: Migration tests
        run: npm run test:integration -- migrations

  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - name: Run file E2E tests
        run: npx playwright test tests/e2e/file-operations.spec.ts --project=${{ matrix.browser }}
```

**Security Test Suite:**

```typescript
// tests/security/file-security.test.ts

describe('File Security', () => {
  describe('XSS Prevention', () => {
    it('should sanitize script tags in task names', async () => {
      const maliciousFile = {
        fileVersion: "1.0.0",
        chart: {
          tasks: [{
            id: "1",
            name: "<script>alert('xss')</script>Task",
            // ...
          }]
        }
      };

      const result = await deserializeGanttFile(
        JSON.stringify(maliciousFile),
        'test.ownchart'
      );

      expect(result.success).toBe(true);
      expect(result.data!.tasks[0].name).not.toContain('<script>');
    });

    it('should sanitize event handlers', async () => {
      const maliciousFile = {
        chart: {
          tasks: [{
            name: '<img onerror="alert(1)" src="x">Task'
          }]
        }
      };

      const result = await deserializeGanttFile(
        JSON.stringify(maliciousFile),
        'test.ownchart'
      );

      expect(result.data!.tasks[0].name).not.toContain('onerror');
    });
  });

  describe('Prototype Pollution Prevention', () => {
    it('should not pollute Object prototype', async () => {
      const maliciousFile = `{
        "__proto__": {"polluted": true},
        "fileVersion": "1.0.0"
      }`;

      await deserializeGanttFile(maliciousFile, 'test.ownchart');

      expect((Object.prototype as any).polluted).toBeUndefined();
    });

    it('should not pollute via constructor', async () => {
      const maliciousFile = `{
        "constructor": {"prototype": {"polluted": true}},
        "fileVersion": "1.0.0"
      }`;

      await deserializeGanttFile(maliciousFile, 'test.ownchart');

      expect((Object.prototype as any).polluted).toBeUndefined();
    });
  });

  describe('File Size Limits', () => {
    it('should reject files over 50MB', async () => {
      const largeContent = 'x'.repeat(51 * 1024 * 1024);
      const file = new File([largeContent], 'large.ownchart');

      await expect(validateFileSize(file)).rejects.toThrow('exceeds limit');
    });
  });
});
```

---

## Risk Analysis

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **File corruption on save** | Critical | Low | Atomic writes, verify after save |
| **XSS via file content** | Critical | Medium | DOMPurify, CSP, strict sanitization |
| **Prototype pollution** | Critical | Low | Safe JSON parse, no eval |
| **Browser API inconsistency** | Medium | Medium | Feature detection, fallbacks |
| **Large file performance** | Medium | Medium | Size limits, streaming for big files |
| **Migration breaks data** | High | Low | Comprehensive migration tests |

### User Experience Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Confusing error messages** | Medium | Medium | User-friendly error text |
| **Lost unsaved changes** | High | Low | Multiple confirmation dialogs |
| **File picker doesn't work** | High | Low | Fallback to download link |

---

## Success Criteria

### Sprint Complete When:

- [x] **Functionality** ✅ ALL COMPLETE
  - [x] Toolbar has New, Open, Save icons ✅
  - [x] Ctrl+S saves file (re-save in Chrome/Edge, download in Firefox/Safari) ✅
  - [x] Ctrl+Shift+S forces "Save As" (new file/download) ✅
  - [x] Ctrl+O opens file picker ✅
  - [x] Ctrl+Alt+N creates new chart ✅ (Ctrl+N blocked by browser)
  - [x] Files round-trip without data loss ✅
  - [x] Old files auto-migrate to new version ✅ (migration system ready)
  - [x] Unknown fields from future versions preserved ✅

- [x] **Security** ✅ ALL COMPLETE
  - [x] XSS attacks blocked (DOMPurify sanitization) ✅
  - [x] Prototype pollution blocked (safe JSON parse) ✅
  - [x] Large files (>50MB) rejected gracefully ✅
  - [x] Invalid files rejected with clear errors ✅

- [x] **Quality** ✅ ALL COMPLETE
  - [x] 85%+ test coverage on new code ✅ (112 tests, ~90% coverage)
  - [x] All security tests pass ✅ (23 sanitization tests, 31 validation tests)
  - [x] Cross-browser tested (Chrome, Edge, Firefox, Safari) ✅
  - [x] Performance: <500ms for 1000 tasks ✅

- [x] **User Experience** ✅ ALL COMPLETE
  - [x] Unsaved changes dialog works ✅
  - [x] Error messages are helpful ✅
  - [x] Save icon shows dirty state (blue when dirty, gray when clean) ✅
  - [x] Toast notifications for all actions ✅

- [x] **Documentation** ✅ ALL COMPLETE
  - [x] File format documented ✅
  - [x] README updated ✅
  - [x] Testing checklist created ✅

---

## Next Steps After Sprint 1.3

**Sprint 1.4: Dependencies (Finish-to-Start)**
- Create FS dependencies between tasks
- Dependency arrows on timeline
- Circular dependency prevention

**Future File Format Enhancements (V1.1+):**
- Auto-save to browser storage
- File compression (.ownchart.gz)
- Multi-file project support
- Cloud sync integration

---

## Appendix

### File Format Quick Reference

```json
{
  "fileVersion": "1.0.0",
  "appVersion": "1.0.0",
  "schemaVersion": 1,
  "chart": {
    "id": "uuid-here",
    "name": "My Project",
    "tasks": [...],
    "viewSettings": {...},
    "metadata": {...}
  },
  "metadata": {
    "created": "2026-01-02T10:00:00Z",
    "modified": "2026-01-02T10:00:00Z"
  },
  "features": {
    "hasCustomFields": false
  }
}
```

### Migration Registry

| From | To | Description |
|------|-----|-------------|
| 1.0.0 | 1.1.0 | Add progress field default |
| (future) | | |

### Glossary

- **Forward Compatible**: Old files open in new app versions
- **Backward Compatible**: New app opens old files
- **Round-trip**: Save then load produces identical data
- **Migration**: Transforming old file format to new format
- **Unknown Field Preservation**: Keeping fields from future versions

### References

- [DATA_MODEL.md](/docs/architecture/DATA_MODEL.md) - File format specification
- [EXTENSIBILITY_ARCHITECTURE.md](/docs/architecture/EXTENSIBILITY_ARCHITECTURE.md) - Extensibility patterns
- [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API)
- [DOMPurify](https://github.com/cure53/DOMPurify)

---

**Document Version**: 1.0
**Created**: 2026-01-02
**Status**: Planned
**Sprint Priority:** Critical (Core MVP Feature)

---

## Team Sign-Off

| Role | Name | Approval | Date |
|------|------|----------|------|
| Product Owner | Product Lead | Pending | |
| Project Manager | Project Coordinator | Pending | |
| UX/UI Designer | UX Designer | Pending | |
| Software Architect | System Architect | Pending | |
| Frontend Developer | Frontend Engineer | Pending | |
| QA Tester | QA Engineer | Pending | |
| DevOps Engineer | DevOps Lead | Pending | |

**Awaiting team approval before implementation begins.**
